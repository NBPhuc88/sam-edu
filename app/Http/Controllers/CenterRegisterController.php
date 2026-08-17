<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use App\Services\Center\CenterRegisterServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CenterRegisterController extends Controller
{
    public function __construct(
        protected CenterRegisterServiceInterface $centerRegisterService
    ) {
    }

    /**
     * Hiển thị trang Đăng ký Trung tâm & Gói dịch vụ.
     */
    public function showRegisterForm(): Response
    {
        $companyName = SystemSetting::getByKey('company_name', 'Công ty Cổ phần Giáo dục Sam');
        $address     = SystemSetting::getByKey('contact_address', 'Tòa nhà Sam Tower, Hà Nội');
        $phone       = SystemSetting::getByKey('contact_phone', '0988.123.456');
        $email       = SystemSetting::getByKey('contact_email', 'phucstt01@gmail.com');

        return Inertia::render('Home/RegisterCenter', [
            'contactInfo' => [
                'company_name' => $companyName,
                'address'      => $address,
                'phone'        => $phone,
                'email'        => $email,
            ],
            'enableOnlinePayment' => (bool) config('payment.enable_online_payment', false),
            'paymentGateways'     => config('payment.gateways', []),
        ]);
    }

    /**
     * Khởi tạo thông tin Trung tâm mới.
     * @param Request $request
     */
    public function registerStep1(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'              => ['required', 'string', 'max:255'],
            'phone'             => ['required', 'string', 'max:30'],
            'email'             => ['required', 'email', 'max:255'],
            'address'           => ['nullable', 'string', 'max:500'],
            'subscription_plan' => ['required', 'string', 'in:trial_14d,monthly,yearly'],
            'payment_method'    => ['nullable', 'string', 'in:zalopay,bank_transfer,momo,vnpay'],
        ]);

        $result = $this->centerRegisterService->registerStep1($validated);

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
