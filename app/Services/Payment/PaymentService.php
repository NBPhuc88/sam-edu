<?php

namespace App\Services\Payment;

use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Payment\PaymentTransactionRepositoryInterface;
use App\Repositories\Subscription\CenterSubscriptionRepositoryInterface;
use App\Repositories\Subscription\SubscriptionPlanRepositoryInterface;
use App\Services\Zalo\ZaloServiceInterface;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PaymentService implements PaymentServiceInterface
{
    public function __construct(
        protected ZaloServiceInterface $zaloPayService,
        protected SubscriptionPlanRepositoryInterface $subscriptionPlanRepository,
        protected CenterRepositoryInterface $centerRepository,
        protected PaymentTransactionRepositoryInterface $paymentTransactionRepository,
        protected CenterSubscriptionRepositoryInterface $centerSubscriptionRepository
    ) {
    }

    public function getSubscriptionPlans(): Collection
    {
        return $this->subscriptionPlanRepository->getAllOrderedByPrice();
    }

    /**
     * @param  array<string, mixed> $validated
     * @return array<string, mixed>
     */
    public function createZaloPayOrder(array $validated): array
    {
        $center       = $this->centerRepository->find((int) $validated['center_id']);
        $amount       = (int) $validated['amount'];
        $durationDays = (int) ($validated['duration_days'] ?? (($validated['duration_months'] ?? 1) * 30));

        // Generate app_trans_id format: YYMMDD_random6
        $appTransId = date('ymd') . '_' . time() . rand(100, 999);

        // Create pending payment transaction
        $transaction = $this->paymentTransactionRepository->create([
            'center_id'      => $center->id,
            'app_trans_id'   => $appTransId,
            'payment_method' => 'zalopay',
            'amount'         => $amount,
            'status'         => 'pending',
            'metadata'       => [
                'app_trans_id' => $appTransId,
                'plan_code'    => $validated['plan_code'],
            ],
        ]);

        $embedData = [
            'redirecturl'   => $validated['redirect_url'] ?? config('app.url'),
            'center_id'     => $center->id,
            'plan_code'     => $validated['plan_code'],
            'duration_days' => $durationDays,
        ];

        $items = [
            [
                'itemid'       => $validated['plan_code'],
                'itemname'     => $validated['plan_name'],
                'itemprice'    => $amount,
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
            $this->paymentTransactionRepository->update($transaction->id, [
                'metadata' => array_merge($transaction->metadata ?? [], ['payload' => $result]),
            ]);

            return [
                'success'        => true,
                'app_trans_id'   => $appTransId,
                'order_url'      => $result['order_url'] ?? null,
                'qr_code'        => $result['qr_code'] ?? null,
                'zp_trans_token' => $result['zp_trans_token'] ?? null,
            ];
        }

        $this->paymentTransactionRepository->update($transaction->id, [
            'status'   => 'failed',
            'metadata' => array_merge($transaction->metadata ?? [], ['payload' => $result]),
        ]);

        return [
            'success' => false,
            'message' => $result['return_message'] ?? 'Unable to create ZaloPay order',
            'details' => $result,
        ];
    }

    /**
     * @param  string               $data
     * @param  string               $mac
     * @return array<string, mixed>
     */
    public function handleZaloPayCallback(string $data, string $mac): array
    {
        if (! $this->zaloPayService->verifyCallback($data, $mac)) {
            return [
                'return_code'    => -1,
                'return_message' => 'mac not equal',
            ];
        }

        /** @var array<string, mixed> $dataJson */
        $dataJson = json_decode($data, true) ?: [];

        /** @var string $appTransId */
        $appTransId = $dataJson['app_trans_id'] ?? '';
        /** @var string $zpTransId */
        $zpTransId = (string) ($dataJson['zp_trans_id'] ?? '');

        $transaction = $this->paymentTransactionRepository->findByTransactionCode($appTransId);

        if (! $transaction) {
            return [
                'return_code'    => -1,
                'return_message' => 'transaction not found',
            ];
        }

        if ($transaction->status === 'success') {
            return [
                'return_code'    => 1,
                'return_message' => 'success (already processed)',
            ];
        }

        /** @var array<string, mixed> $embedData */
        $embedData    = json_decode((string) ($dataJson['embed_data'] ?? '{}'), true) ?: [];
        $durationDays = (int) ($embedData['duration_days'] ?? (($embedData['duration_months'] ?? 1) * 30));
        $planCode     = (string) ($embedData['plan_code'] ?? 'standard');

        DB::transaction(function () use ($transaction, $zpTransId, $dataJson, $durationDays, $planCode) {
            $this->paymentTransactionRepository->update($transaction->id, [
                'status'   => 'success',
                'paid_at'  => now(),
                'metadata' => array_merge($transaction->metadata ?? [], [
                    'zp_trans_id' => $zpTransId,
                    'payload'     => $dataJson,
                ]),
            ]);

            $center = $this->centerRepository->find($transaction->center_id);

            $currentExpires = $center->expires_at;

            $startsAt = ($currentExpires && $currentExpires->isFuture())
                ? $currentExpires->copy()
                : Carbon::now();

            $endsAt = $startsAt->copy()->addDays($durationDays);

            $subscription = $this->centerSubscriptionRepository->create([
                'center_id'     => $center->id,
                'plan_code'     => $planCode,
                'plan_name'     => "Goi subscription {$planCode}",
                'price'         => $transaction->amount,
                'duration_days' => $durationDays,
                'starts_at'     => $startsAt,
                'ends_at'       => $endsAt,
                'status'        => 'active',
            ]);

            $this->paymentTransactionRepository->update($transaction->id, [
                'metadata' => array_merge($transaction->metadata ?? [], [
                    'center_subscription_id' => $subscription->id,
                ]),
            ]);

            // Extend center expiration
            $this->centerRepository->update($center->id, [
                'status'            => 'active',
                'subscription_plan' => $planCode,
                'expires_at'        => $endsAt,
            ]);
        });

        return [
            'return_code'    => 1,
            'return_message' => 'success',
        ];
    }

    /**
     * @param  string               $appTransId
     * @return array<string, mixed>
     */
    public function checkOrderStatus(string $appTransId): array
    {
        $transaction = $this->paymentTransactionRepository->findByTransactionCode($appTransId);

        if (! $transaction) {
            return [
                'success' => false,
                'message' => 'Transaction not found',
            ];
        }

        if ($transaction->status === 'success') {
            return [
                'success'     => true,
                'status'      => 'success',
                'transaction' => $transaction,
            ];
        }

        $result = $this->zaloPayService->queryStatus($appTransId);

        if (isset($result['return_code']) && (int) $result['return_code'] === 1) {
            $this->paymentTransactionRepository->update($transaction->id, [
                'status'   => 'success',
                'paid_at'  => now(),
                'metadata' => array_merge($transaction->metadata ?? [], [
                    'zp_trans_id' => (string) ($result['zp_trans_id'] ?? ''),
                    'payload'     => $result,
                ]),
            ]);
        }

        return [
            'success' => true,
            'status'  => $this->paymentTransactionRepository->findByTransactionCode($appTransId)?->status,
            'details' => $result,
        ];
    }
}
