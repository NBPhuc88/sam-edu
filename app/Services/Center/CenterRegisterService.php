<?php

namespace App\Services\Center;

use App\Mail\NewCenterRegisteredMail;
use App\Models\Center;
use App\Models\SubscriptionPlan;
use App\Models\SystemSetting;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Payment\PaymentTransactionRepositoryInterface;
use App\Services\Payment\PaymentGatewayFactory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CenterRegisterService implements CenterRegisterServiceInterface
{
    public function __construct(
        protected CenterRepositoryInterface $centerRepository,
        protected PaymentTransactionRepositoryInterface $paymentTransactionRepository
    ) {
    }

    /**
     * @param  array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function registerStep1(array $data): array
    {
        $planCode      = (string) ($data['subscription_plan'] ?? 'trial_14d');
        $paymentMethod = (string) ($data['payment_method'] ?? 'zalopay');
        $plan          = SubscriptionPlan::where('code', $planCode)->first();

        $code = 'CENTER-' . strtoupper(Str::random(5));
        while (Center::where('code', $code)->exists()) {
            $code = 'CENTER-' . strtoupper(Str::random(5));
        }

        $tempUsername           = strtolower(Str::slug((string) ($data['name'] ?? 'center'))) . '_' . Str::random(4);
        $isOnlinePaymentEnabled = (bool) config('payment.enable_online_payment', false);

        if (! $isOnlinePaymentEnabled) {
            $center = $this->centerRepository->create([
                'code'              => $code,
                'name'              => $data['name'],
                'username'          => null,
                'password'          => null,
                'phone'             => $data['phone'],
                'email'             => $data['email'],
                'address'           => $data['address'] ?? null,
                'status'            => $planCode === 'trial_14d' ? 'active' : 'pending_payment',
                'subscription_plan' => $planCode,
                'expires_at'        => $planCode === 'trial_14d' ? now()->addDays(14) : null,
                'trial_ends_at'     => $planCode === 'trial_14d' ? now()->addDays(14) : null,
                'max_students'      => $plan->max_students ?? 30,
                'max_classes'       => $plan->max_classes ?? 3,
            ]);

            $this->sendAdminNotificationMail($center);

            return [
                'success'   => true,
                'step'      => 'contact_notification',
                'center_id' => $center->id,
                'code'      => $center->code,
                'name'      => $center->name,
                'message'   => 'Đăng ký thông tin Trung tâm thành công! Ban quản trị Sam Edu sẽ liên hệ hỗ trợ kích hoạt tài khoản trong thời gian sớm nhất.',
            ];
        }

        if ($planCode === 'trial_14d') {
            $center = $this->centerRepository->create([
                'code'              => $code,
                'name'              => $data['name'],
                'username'          => $tempUsername,
                'phone'             => $data['phone'],
                'email'             => $data['email'],
                'address'           => $data['address'] ?? null,
                'status'            => 'active',
                'subscription_plan' => 'trial_14d',
                'expires_at'        => now()->addDays(14),
                'trial_ends_at'     => now()->addDays(14),
                'max_students'      => $plan->max_students ?? 30,
                'max_classes'       => $plan->max_classes ?? 3,
            ]);

            $this->sendAdminNotificationMail($center);

            return [
                'success'   => true,
                'step'      => 'complete_account',
                'center_id' => $center->id,
                'plan'      => 'trial_14d',
                'message'   => 'Đăng ký dùng thử 14 ngày thành công! Vui lòng tạo tài khoản và mật khẩu.',
            ];
        }

        $amount       = $plan ? $plan->price : ($planCode === 'yearly' ? 4800000 : 500000);
        $durationDays = $plan ? $plan->duration_days : ($planCode === 'yearly' ? 365 : 30);

        $center = $this->centerRepository->create([
            'code'              => $code,
            'name'              => $data['name'],
            'username'          => $tempUsername,
            'phone'             => $data['phone'],
            'email'             => $data['email'],
            'address'           => $data['address'] ?? null,
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

        $this->paymentTransactionRepository->create([
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

        return [
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
        ];
    }

    /**
     * @param  string               $appTransId
     * @return array<string, mixed>
     */
    public function checkPaymentStatus(string $appTransId): array
    {
        $transaction = $this->paymentTransactionRepository->findByTransactionCode($appTransId);

        if (! $transaction) {
            return ['success' => false, 'status' => 'not_found'];
        }

        if ($transaction->status === 'success') {
            return [
                'success'   => true,
                'status'    => 'paid',
                'center_id' => $transaction->center_id,
            ];
        }

        $paymentMethod = $transaction->payment_method ?? 'zalopay';
        $gateway       = PaymentGatewayFactory::make($paymentMethod);
        $statusCheck   = $gateway->checkStatus($appTransId);

        if (! empty($statusCheck['success']) && $statusCheck['status'] === 'paid') {
            $this->paymentTransactionRepository->update($transaction->id, ['status' => 'success']);

            $center = $this->centerRepository->find($transaction->center_id);

            if ($center) {
                $metadata     = $transaction->metadata ?? [];
                $durationDays = (int) ($metadata['duration_days'] ?? 365);

                $this->centerRepository->update($center->id, [
                    'status'            => 'active',
                    'subscription_plan' => $metadata['plan_code'] ?? 'yearly',
                    'expires_at'        => now()->addDays($durationDays),
                ]);
            }

            return [
                'success'   => true,
                'status'    => 'paid',
                'center_id' => $transaction->center_id,
            ];
        }

        return [
            'success'   => false,
            'status'    => 'pending',
            'center_id' => $transaction->center_id,
        ];
    }

    public function completeAccount(int $centerId, string $username, string $password): Center
    {
        $center = $this->centerRepository->find($centerId);

        return $this->centerRepository->update($center->id, [
            'username' => $username,
            'password' => Hash::make($password),
            'status'   => $center->status === 'pending_payment' ? 'active' : $center->status,
        ]);
    }

    protected function sendAdminNotificationMail(Center $center): void
    {
        $adminEmail = SystemSetting::getByKey('contact_email', config('mail.from.address', 'phucstt01@gmail.com'));

        try {
            Mail::to($adminEmail)->queue(new NewCenterRegisteredMail($center));
        } catch (\Throwable $e) {
            // Ignore mail queue error if mailer is not configured locally
        }
    }
}
