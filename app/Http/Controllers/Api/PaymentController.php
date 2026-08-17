<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\CreateZaloOrderRequest;
use App\Http\Requests\Payment\ZaloCallbackRequest;
use App\Services\Payment\PaymentServiceInterface;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentServiceInterface $paymentService
    ) {
    }

    /**
     * Get all active subscription plans from database.
     */
    public function getSubscriptionPlans(): JsonResponse
    {
        $plans = $this->paymentService->getSubscriptionPlans();

        return response()->json([
            'success' => true,
            'data'    => $plans,
        ]);
    }

    /**
     * Create a ZaloPay payment order for center subscription renewal.
     * @param CreateZaloOrderRequest $request
     */
    public function createZaloPayOrder(CreateZaloOrderRequest $request): JsonResponse
    {
        $result = $this->paymentService->createZaloPayOrder($request->validated());

        if (! empty($result['success'])) {
            return response()->json($result);
        }

        return response()->json($result, 400);
    }

    /**
     * Callback Webhook handler for ZaloPay IPN.
     * @param ZaloCallbackRequest $request
     */
    public function handleZaloPayCallback(ZaloCallbackRequest $request): JsonResponse
    {
        $data   = (string) $request->input('data', '');
        $mac    = (string) $request->input('mac', '');
        $result = $this->paymentService->handleZaloPayCallback($data, $mac);

        return response()->json($result);
    }

    /**
     * Query order status from ZaloPay.
     * @param string $appTransId
     */
    public function checkOrderStatus(string $appTransId): JsonResponse
    {
        $result = $this->paymentService->checkOrderStatus($appTransId);

        if (! empty($result['success'])) {
            return response()->json($result);
        }

        return response()->json($result, 404);
    }
}
