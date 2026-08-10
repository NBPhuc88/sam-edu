<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\CreateZaloOrderRequest;
use App\Models\Center;
use App\Models\CenterSubscription;
use App\Models\PaymentTransaction;
use App\Services\Zalo\ZaloServiceInterface;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    protected ZaloServiceInterface $zaloPayService;

    public function __construct(ZaloServiceInterface $zaloPayService)
    {
        $this->zaloPayService = $zaloPayService;
    }

    /**
     * Create a ZaloPay payment order for center subscription renewal.
     */
    public function createZaloPayOrder(CreateZaloOrderRequest $request): JsonResponse
    {
        $validated = $request->validated();

        /** @var Center $center */
        $center = Center::findOrFail($validated['center_id']);
        $amount = (int) $validated['amount'];
        $durationMonths = (int) $validated['duration_months'];

        // Generate app_trans_id format: YYMMDD_random6
        $appTransId = date('ymd').'_'.time().rand(100, 999);

        // Create pending payment transaction
        $transaction = PaymentTransaction::create([
            'center_id' => $center->id,
            'app_trans_id' => $appTransId,
            'payment_method' => 'zalopay',
            'amount' => $amount,
            'status' => 'pending',
        ]);

        $embedData = [
            'redirecturl' => $validated['redirect_url'] ?? config('app.url'),
            'center_id' => $center->id,
            'plan_code' => $validated['plan_code'],
            'duration_months' => $durationMonths,
        ];

        $items = [
            [
                'itemid' => $validated['plan_code'],
                'itemname' => $validated['plan_name'],
                'itemprice' => $amount,
                'itemquantity' => 1,
            ],
        ];

        $description = "Thanh toan gia han center {$center->code} - {$validated['plan_name']}";

        $result = $this->zaloPayService->createOrder(
            $appTransId,
            $center->code,
            $amount,
            $description,
            $embedData,
            $items
        );

        if (isset($result['return_code']) && (int) $result['return_code'] === 1) {
            $transaction->update([
                'payload' => $result,
            ]);

            return response()->json([
                'success' => true,
                'app_trans_id' => $appTransId,
                'order_url' => $result['order_url'] ?? null,
                'qr_code' => $result['qr_code'] ?? null,
                'zp_trans_token' => $result['zp_trans_token'] ?? null,
            ]);
        }

        $transaction->update([
            'status' => 'failed',
            'payload' => $result,
        ]);

        return response()->json([
            'success' => false,
            'message' => $result['return_message'] ?? 'Unable to create ZaloPay order',
            'details' => $result,
        ], 400);
    }

    /**
     * Callback Webhook handler for ZaloPay IPN.
     */
    public function handleZaloPayCallback(Request $request): JsonResponse
    {
        /** @var string $data */
        $data = $request->input('data', '');
        /** @var string $mac */
        $mac = $request->input('mac', '');

        if (! $this->zaloPayService->verifyCallback($data, $mac)) {
            return response()->json([
                'return_code' => -1,
                'return_message' => 'mac not equal',
            ]);
        }

        /** @var array<string, mixed> $dataJson */
        $dataJson = json_decode($data, true) ?: [];

        /** @var string $appTransId */
        $appTransId = $dataJson['app_trans_id'] ?? '';
        /** @var string $zpTransId */
        $zpTransId = (string) ($dataJson['zp_trans_id'] ?? '');

        /** @var PaymentTransaction|null $transaction */
        $transaction = PaymentTransaction::where('app_trans_id', $appTransId)->first();

        if (! $transaction) {
            return response()->json([
                'return_code' => -1,
                'return_message' => 'transaction not found',
            ]);
        }

        if ($transaction->status === 'success') {
            return response()->json([
                'return_code' => 1,
                'return_message' => 'success (already processed)',
            ]);
        }

        /** @var array<string, mixed> $embedData */
        $embedData = json_decode((string) ($dataJson['embed_data'] ?? '{}'), true) ?: [];
        $durationMonths = (int) ($embedData['duration_months'] ?? 1);
        $planCode = (string) ($embedData['plan_code'] ?? 'standard');

        DB::transaction(function () use ($transaction, $zpTransId, $dataJson, $durationMonths, $planCode) {
            $transaction->update([
                'status' => 'success',
                'zp_trans_id' => $zpTransId,
                'payload' => $dataJson,
                'paid_at' => now(),
            ]);

            /** @var Center $center */
            $center = $transaction->center;

            $currentExpires = $center->expires_at;

            $startsAt = ($currentExpires && $currentExpires->isFuture())
                ? $currentExpires->copy()
                : Carbon::now();

            $endsAt = $startsAt->copy()->addMonths($durationMonths);

            $subscription = CenterSubscription::create([
                'center_id' => $center->id,
                'plan_code' => $planCode,
                'plan_name' => "Goi subscription {$planCode}",
                'price' => $transaction->amount,
                'duration_months' => $durationMonths,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'status' => 'active',
            ]);

            $transaction->update([
                'center_subscription_id' => $subscription->id,
            ]);

            // Extend center expiration
            $center->update([
                'status' => 'active',
                'subscription_plan' => $planCode,
                'expires_at' => $endsAt,
            ]);
        });

        return response()->json([
            'return_code' => 1,
            'return_message' => 'success',
        ]);
    }

    /**
     * Query order status from ZaloPay.
     */
    public function checkOrderStatus(string $appTransId): JsonResponse
    {
        /** @var PaymentTransaction|null $transaction */
        $transaction = PaymentTransaction::where('app_trans_id', $appTransId)->first();

        if (! $transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found',
            ], 404);
        }

        if ($transaction->status === 'success') {
            return response()->json([
                'success' => true,
                'status' => 'success',
                'transaction' => $transaction,
            ]);
        }

        $result = $this->zaloPayService->queryStatus($appTransId);

        if (isset($result['return_code']) && (int) $result['return_code'] === 1) {
            $transaction->update([
                'status' => 'success',
                'zp_trans_id' => (string) ($result['zp_trans_id'] ?? ''),
                'payload' => $result,
                'paid_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'status' => $transaction->fresh()->status,
            'details' => $result,
        ]);
    }
}
