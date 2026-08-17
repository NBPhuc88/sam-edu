<?php

namespace App\Http\Controllers;

use App\Http\Requests\Center\RegisterCenterStep1Request;
use App\Services\Center\CenterRegisterServiceInterface;
use App\Services\Home\HomeServiceInterface;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class CenterRegisterController extends Controller
{
    public function __construct(
        protected CenterRegisterServiceInterface $centerRegisterService,
        protected HomeServiceInterface $homeService
    ) {
    }

    /**
     * Hiển thị trang Đăng ký Trung tâm & Gói dịch vụ.
     */
    public function showRegisterForm(): Response
    {
        $contactData = $this->homeService->getContactPageData();

        return Inertia::render('Home/RegisterCenter', [
            'contactInfo'         => $contactData['contactInfo'],
            'enableOnlinePayment' => $contactData['enableOnlinePayment'],
            'paymentGateways'     => $contactData['paymentGateways'],
        ]);
    }

    /**
     * Khởi tạo thông tin Trung tâm mới.
     * @param RegisterCenterStep1Request $request
     */
    public function registerStep1(RegisterCenterStep1Request $request): JsonResponse
    {
        $result = $this->centerRegisterService->registerStep1($request->validated());

        return response()->json($result);
    }

    /**
     * Kiểm tra trạng thái thanh toán real-time từ Client.
     * @param string $appTransId
     */
    public function checkPaymentStatus(string $appTransId): JsonResponse
    {
        $result = $this->centerRegisterService->checkPaymentStatus($appTransId);

        if (isset($result['status']) && $result['status'] === 'not_found') {
            return response()->json($result, 444);
        }

        return response()->json($result);
    }
}
