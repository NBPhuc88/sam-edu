<?php

namespace App\Http\Controllers;

use App\Mail\NewCenterRegisteredMail;
use App\Models\Center;
use App\Models\PaymentTransaction;
use App\Models\SubscriptionPlan;
use App\Models\SystemSetting;
use App\Services\Payment\PaymentGatewayFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

use Inertia\Inertia;
use Inertia\Response;

class CenterRegisterController extends Controller
{
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
     * Khởi tạo thông tin Trung tâm mới (Xử lý linh hoạt theo cờ ENABLE_ONLINE_PAYMENT trong config).
     * @param Request $request
     */
    public function registerStep1(Request $request): JsonResponse
    {
        $paymentMethod = $request->input('payment_method', 'zalopay');

        $validated = $request->validate([
            'name'              => ['required', 'string', 'max:255'],
            'phone'             => ['required', 'string', 'max:30'],
            'email'             => ['required', 'email', 'max:255'],
            'address'           => ['nullable', 'string', 'max:500'],
            'subscription_plan' => ['required', 'string', 'in:trial_14d,monthly,yearly'],
            'payment_method'    => ['nullable', 'string', 'in:zalopay,bank_transfer,momo,vnpay'],
        ]);

        $planCode = $validated['subscription_plan'];
        $plan     = SubscriptionPlan::where('code', $planCode)->first();

        // Tự động sinh mã Trung tâm duy nhất
        $code = 'CENTER-' . strtoupper(Str::random(5));
        while (Center::where('code', $code)->exists()) {
            $code = 'CENTER-' . strtoupper(Str::random(5));
        }

        // Tên đăng nhập tạm thời (dùng khi mở luồng tạo tài khoản ngay)
        $tempUsername = strtolower(Str::slug($validated['name'])) . '_' . Str::random(4);

        // KIỂM TRA CỜ BẬT/TẮT LUỒNG THANH TOÁN TRỰC TUYẾN
        $isOnlinePaymentEnabled = (bool) config('payment.enable_online_payment', false);

        // LUỒNG 1: TẮT THANH TOÁN ONLINE -> Tạo trước Center chưa có account & Queue Mail cho Admin
        if (! $isOnlinePaymentEnabled) {
            $center = Center::create([
                'code'              => $code,
                'name'              => $validated['name'],
                'username'          => null,
                'password'          => null,
                'phone'             => $validated['phone'],
                'email'             => $validated['email'],
                'address'           => $validated['address'] ?? null,
                'status'            => $planCode === 'trial_14d' ? 'active' : 'pending_payment',
                'subscription_plan' => $planCode,
                'expires_at'        => $planCode === 'trial_14d' ? now()->addDays(14) : null,
                'trial_ends_at'     => $planCode === 'trial_14d' ? now()->addDays(14) : null,
                'max_students'      => $plan->max_students ?? 30,
                'max_classes'       => $plan->max_classes ?? 3,
            ]);

            $this->sendAdminNotificationMail($center);

            return response()->json([
                'success'   => true,
                'step'      => 'contact_notification',
                'center_id' => $center->id,
                'code'      => $center->code,
                'name'      => $center->name,
                'message'   => 'Đăng ký thông tin Trung tâm thành công! Ban quản trị Sam Edu sẽ liên hệ hỗ trợ kích hoạt tài khoản trong thời gian sớm nhất.',
            ]);
        }

        // LUỒNG 2: BẬT THANH TOÁN ONLINE
        if ($planCode === 'trial_14d') {
            // Gói 0đ dùng thử 14 ngày -> Sang luôn Bước 3 tạo username & password
            $center = Center::create([
                'code'              => $code,
                'name'              => $validated['name'],
                'username'          => $tempUsername,
                'phone'             => $validated['phone'],
                'email'             => $validated['email'],
                'address'           => $validated['address'] ?? null,
                'status'            => 'active',
                'subscription_plan' => 'trial_14d',
                'expires_at'        => now()->addDays(14),
                'trial_ends_at'     => now()->addDays(14),
                'max_students'      => $plan->max_students ?? 30,
                'max_classes'       => $plan->max_classes ?? 3,
            ]);

            $this->sendAdminNotificationMail($center);

            return response()->json([
                'success'   => true,
                'step'      => 'complete_account',
                'center_id' => $center->id,
                'plan'      => 'trial_14d',
                'message'   => 'Đăng ký dùng thử 14 ngày thành công! Vui lòng tạo tài khoản và mật khẩu.',
            ]);
        }

        // Gói trả phí -> Tạo đơn thanh toán trực tuyến
        $amount       = $plan ? $plan->price : ($planCode === 'yearly' ? 4800000 : 500000);
        $durationDays = $plan ? $plan->duration_days : ($planCode === 'yearly' ? 365 : 30);

        $center = Center::create([
            'code'              => $code,
            'name'              => $validated['name'],
            'username'          => $tempUsername,
            'phone'             => $validated['phone'],
            'email'             => $validated['email'],
            'address'           => $validated['address'] ?? null,
            'status'            => 'pending_payment',
            'subscription_plan' => $planCode,
            'expires_at'        => null,
            'max_students'      => $plan->max_students ?? null,
            'max_classes'       => $plan->max_classes ?? null,
        ]);

        $this->sendAdminNotificationMail($center);

        $appTransId = date('ymd') . '_' . time() . '_' . $center->id;

        $gateway       = PaymentGatewayFactory::make($paymentMethod);
        $gatewayResult = $gateway->createOrder([
            'amount'       => $amount,
            'app_trans_id' => $appTransId,
            'center_id'    => $center->id,
            'plan_code'    => $planCode,
            'center_name'  => $center->name,
            'plan_name'    => $plan ? $plan->name : 'Gói dịch vụ',
        ]);

        PaymentTransaction::create([
            'transaction_code' => $appTransId,
            'center_id'        => $center->id,
            'amount'           => $amount,
            'payment_method'   => $paymentMethod,
            'status'           => 'pending',
            'note'             => "Đăng ký mới gói {$planCode} qua " . strtoupper($paymentMethod),
            'metadata'         => array_merge([
                'plan_code'     => $planCode,
                'duration_days' => $durationDays,
                'app_trans_id'  => $appTransId,
            ], $gatewayResult),
        ]);

        return response()->json([
            'success'        => true,
            'step'           => 'payment_gateway',
            'payment_method' => $paymentMethod,
            'center_id'      => $center->id,
            'app_trans_id'   => $appTransId,
            'order_url'      => $gatewayResult['order_url'] ?? null,
            'qr_code'        => $gatewayResult['qr_code'] ?? null,
            'bank_name'      => $gatewayResult['bank_name'] ?? null,
            'account_no'     => $gatewayResult['account_no'] ?? null,
            'account_name'   => $gatewayResult['account_name'] ?? null,
            'transfer_memo'  => $gatewayResult['transfer_memo'] ?? null,
            'amount'         => $amount,
            'plan_name'      => $plan ? $plan->name : 'Gói dịch vụ',
            'message'        => 'Khởi tạo thông tin thanh toán thành công!',
        ]);
    }

    /**
     * Gửi email thông báo cho Ban quản trị khi có Trung tâm đăng ký mới.
     * @param Center $center
     */
    private function sendAdminNotificationMail(Center $center): void
    {
        $adminEmail = SystemSetting::where('key', 'contact_email')->value('value')
            ?? config('mail.from.address', 'phucstt01@gmail.com');

        try {
            Mail::to($adminEmail)->queue(new NewCenterRegisteredMail($center));
        } catch (\Throwable $e) {
            // Ignore mail queue error if mailer is not configured locally
        }
    }

    /**
     * Kiểm tra trạng thái thanh toán real-time từ Client.
     * @param string $appTransId
     */
    public function checkPaymentStatus(string $appTransId): JsonResponse
    {
        $transaction = PaymentTransaction::where('transaction_code', $appTransId)->first();

        if (! $transaction) {
            return response()->json(['success' => false, 'status' => 'not_found'], 444);
        }

        if ($transaction->status === 'success') {
            return response()->json([
                'success'   => true,
                'status'    => 'paid',
                'center_id' => $transaction->center_id,
            ]);
        }

        $paymentMethod = $transaction->payment_method ?? 'zalopay';
        $gateway       = PaymentGatewayFactory::make($paymentMethod);
        $statusCheck   = $gateway->checkStatus($appTransId);

        if (! empty($statusCheck['success']) && $statusCheck['status'] === 'paid') {
            $transaction->update(['status' => 'success']);

            /** @var Center|null $center */
            $center = Center::find($transaction->center_id);

            if ($center) {
                $metadata     = $transaction->metadata ?? [];
                $durationDays = (int) ($metadata['duration_days'] ?? 365);

                $center->update([
                    'status'            => 'active',
                    'subscription_plan' => $metadata['plan_code'] ?? 'yearly',
                    'expires_at'        => now()->addDays($durationDays),
                ]);
            }

            return response()->json([
                'success'   => true,
                'status'    => 'paid',
                'center_id' => $transaction->center_id,
            ]);
        }

        return response()->json([
            'success'   => false,
            'status'    => 'pending',
            'center_id' => $transaction->center_id,
        ]);
    }

    /**
     * Bước 3: Khởi tạo Tên đăng nhập & Mật khẩu cho Trung tâm -> Tự động Đăng nhập vào Dashboard.
     * @param Request $request
     */
    public function completeAccount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'center_id' => ['required', 'integer', 'exists:centers,id'],
            'username'  => ['required', 'string', 'max:50', 'unique:centers,username'],
            'password'  => ['required', 'string', 'min:6'],
        ]);

        /** @var Center $center */
        $center = Center::query()->findOrFail((int) $validated['center_id']);

        $center->update([
            'username' => $validated['username'],
            'password' => Hash::make($validated['password']),
            'status'   => $center->status === 'pending_payment' ? 'active' : $center->status,
        ]);

        Auth::guard('center')->login($center);
        $request->session()->regenerate();

        return response()->json([
            'success'      => true,
            'redirect_url' => route('dashboard'),
            'message'      => 'Tạo tài khoản thành công! Đang chuyển hướng vào bảng điều khiển...',
        ]);
    }
}
