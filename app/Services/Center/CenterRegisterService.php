<?php

namespace App\Services\Center;

use App\Enums\Constant;
use App\Events\CenterRegisteredEvent;
use App\Mail\NewCenterRegisteredMail;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Payment\PaymentTransactionRepositoryInterface;
use App\Repositories\Setting\SystemSettingRepositoryInterface;
use App\Repositories\Subscription\SubscriptionPlanRepositoryInterface;
use App\Services\Payment\PaymentGatewayFactory;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CenterRegisterService implements CenterRegisterServiceInterface
{
    public function __construct(
        protected CenterRepositoryInterface $centerRepository,
        protected PaymentTransactionRepositoryInterface $paymentTransactionRepository,
        protected SubscriptionPlanRepositoryInterface $subscriptionPlanRepository,
        protected SystemSettingRepositoryInterface $systemSettingRepository
    ) {
    }

    /**
     * @param  array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function registerStep1(array $data): array
    {
        $planId        = (int) ($data['subscription_plan_id'] ?? 1);
        $paymentMethod = isset($data['payment_method']) ? (int) $data['payment_method'] : Constant::PAYMENT_METHOD_ZALOPAY;
        $plan          = $this->subscriptionPlanRepository->findById($planId);
        $planCode      = $plan?->code ?? 'trial';

        $code = 'CENTER-' . strtoupper(Str::random(5));
        while ($this->centerRepository->codeExists($code)) {
            $code = 'CENTER-' . strtoupper(Str::random(5));
        }

        $isOnlinePaymentEnabled = (bool) config('payment.enable_online_payment', false);

        if (! $isOnlinePaymentEnabled) {
            $center = $this->centerRepository->create([
                'code'                 => $code,
                'name'                 => $data['name'],
                'phone'                => $data['phone'],
                'email'                => $data['email'],
                'address'              => $data['address'] ?? null,
                'status'               => $planCode === 'trial' ? Constant::CENTER_STATUS_ACTIVE : Constant::CENTER_STATUS_PAUSED,
                'subscription_plan_id' => $plan ? $plan->id : 1,
                'plan_type'            => $plan->plan_type ?? ($planCode === 'trial' ? Constant::PLAN_TYPE_FREE : Constant::PLAN_TYPE_STANDARD),
                'expires_at'           => $planCode === 'trial' ? now()->addDays(30) : null,
                'trial_ends_at'        => $planCode === 'trial' ? now()->addDays(30) : null,
                'max_students'         => $plan->max_students ?? 600,
                'max_classes'          => $plan->max_classes ?? 20,
            ]);

            $this->sendAdminNotificationMail($center);
            $this->createAdminNotification($center, $planCode);

            return [
                'success' => true,
                'step'    => 'contact_notification',
                'code'    => $center->code,
                'name'    => $center->name,
                'plan'    => $planCode,
                'message' => 'Đăng ký trung tâm thành công! Hệ thống sẽ liên hệ kích hoạt dịch vụ cho bạn.',
            ];
        }

        $amount       = (float) ($plan ? $plan->price : 0);
        $durationDays = (int) ($plan && $plan->duration_months ? $plan->duration_months * 30 : 30);

        if ($planCode === 'trial' || $amount <= 0) {
            $center = $this->centerRepository->create([
                'code'                 => $code,
                'name'                 => $data['name'],
                'phone'                => $data['phone'],
                'email'                => $data['email'],
                'address'              => $data['address'] ?? null,
                'status'               => Constant::CENTER_STATUS_ACTIVE,
                'subscription_plan_id' => $plan ? $plan->id : 1,
                'plan_type'            => Constant::PLAN_TYPE_FREE,
                'expires_at'           => now()->addDays(30),
                'trial_ends_at'        => now()->addDays(30),
                'max_students'         => $plan->max_students ?? 600,
                'max_classes'          => $plan->max_classes ?? 20,
            ]);

            $this->sendAdminNotificationMail($center);
            $this->createAdminNotification($center, 'trial');

            return [
                'success' => true,
                'step'    => 'contact_notification',
                'code'    => $center->code,
                'name'    => $center->name,
                'plan'    => 'trial',
                'message' => 'Đăng ký dùng thử 30 ngày thành công!',
            ];
        }

        $center = $this->centerRepository->create([
            'code'                 => $code,
            'name'                 => $data['name'],
            'phone'                => $data['phone'],
            'email'                => $data['email'],
            'address'              => $data['address'] ?? null,
            'status'               => Constant::CENTER_STATUS_PAUSED,
            'subscription_plan_id' => $plan ? $plan->id : 1,
            'plan_type'            => $plan->plan_type ?? Constant::PLAN_TYPE_STANDARD,
            'expires_at'           => null,
            'max_students'         => $plan->max_students ?? null,
            'max_classes'          => $plan->max_classes ?? null,
        ]);

        $this->sendAdminNotificationMail($center);
        $this->createAdminNotification($center, $planCode);

        $appTransId    = date('ymd') . '_' . $center->id . '_' . Str::random(6);
        $gateway       = PaymentGatewayFactory::make($paymentMethod);
        $gatewayResult = $gateway->createOrder([
            'amount'       => $amount,
            'app_trans_id' => $appTransId,
            'center_id'    => $center->id,
            'plan_code'    => $planCode,
            'center_name'  => $center->name,
            'plan_name'    => $plan ? $plan->name : 'Gói dịch vụ',
        ]);

        $paymentMethodLabel = Constant::PAYMENT_METHOD_LABELS[$paymentMethod] ?? 'Thanh toán';

        $this->paymentTransactionRepository->create([
            'transaction_code' => $appTransId,
            'center_id'        => $center->id,
            'amount'           => $amount,
            'payment_method'   => $paymentMethod,
            'status'           => Constant::PAYMENT_STATUS_PENDING,
            'note'             => "Đăng ký mới gói {$planCode} qua {$paymentMethodLabel}",
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
            'code'           => $center->code,
            'name'           => $center->name,
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
            $center = $this->centerRepository->find($transaction->center_id);

            return [
                'success'   => true,
                'status'    => 'paid',
                'center_id' => $transaction->center_id,
                'code'      => $center?->code,
                'name'      => $center?->name,
                'plan'      => $center?->subscription_plan_id,
            ];
        }

        $paymentMethod = $transaction->payment_method ?? 'zalopay';
        $gateway       = PaymentGatewayFactory::make($paymentMethod);
        $statusCheck   = $gateway->checkStatus($appTransId);

        if (! empty($statusCheck['success']) && $statusCheck['status'] === 'paid') {
            $this->paymentTransactionRepository->update($transaction->id, ['status' => Constant::PAYMENT_STATUS_SUCCESS]);

            $center = $this->centerRepository->find($transaction->center_id);

            if ($center) {
                $metadata     = $transaction->metadata ?? [];
                $durationDays = (int) ($metadata['duration_days'] ?? 30);
                $paidPlanCode = $metadata['plan_code'] ?? 'basic_5';
                $planObj      = $this->subscriptionPlanRepository->findByCode($paidPlanCode);

                $this->centerRepository->update($center->id, [
                    'status'               => Constant::CENTER_STATUS_ACTIVE,
                    'subscription_plan_id' => $planObj ? $planObj->id : 1,
                    'plan_type'            => $planObj->plan_type ?? Constant::PLAN_TYPE_STANDARD,
                    'max_students'         => $planObj->max_students ?? $center->max_students,
                    'max_classes'          => $planObj->max_classes ?? $center->max_classes,
                    'expires_at'           => now()->addDays($durationDays),
                ]);
            }

            return [
                'success'   => true,
                'status'    => 'paid',
                'center_id' => $transaction->center_id,
                'code'      => $center?->code,
                'name'      => $center?->name,
                'plan'      => $center?->subscription_plan_id,
            ];
        }

        return [
            'success'   => false,
            'status'    => 'pending',
            'center_id' => $transaction->center_id,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function getRegisterPageData(): array
    {
        return [
            'plans'               => $this->subscriptionPlanRepository->getAllOrderedByPrice(),
            'enableOnlinePayment' => (bool) config('payment.enable_online_payment', false),
            'paymentGateways'     => config('payment.gateways', []),
        ];
    }

    protected function sendAdminNotificationMail(Center $center): void
    {
        $adminEmail = $this->systemSettingRepository->getByKey('contact_email', config('mail.from.address', 'phucstt01@gmail.com'));

        try {
            Mail::to($adminEmail)->queue(new NewCenterRegisteredMail($center));
        } catch (\Throwable $e) {
            // Ignore mail queue error if mailer is not configured locally
        }
    }

    protected function createAdminNotification(Center $center, string $planCode): void
    {
        $notifTitle   = "Trung tâm mới đăng ký: '{$center->name}'";
        $planLabel    = $planCode === 'trial' ? 'Gói dùng thử' : "Gói {$planCode}";
        $notifContent = "Trung tâm {$center->name} ({$center->code}) vừa đăng ký {$planLabel}. Email: {$center->email}, SĐT: {$center->phone}.";

        $notification = Notification::create([
            'center_id'           => $center->id,
            'title'               => $notifTitle,
            'content'             => $notifContent,
            'type'                => Constant::NOTIFICATION_TYPE_GENERAL,
            'created_by_admin_id' => null,
        ]);

        $superAdminIds = Admin::where('role', Constant::ADMIN_ROLE_SUPER_ADMIN)->pluck('id')->toArray();

        foreach ($superAdminIds as $sAdminId) {
            NotificationRecipient::create([
                'notification_id' => $notification->id,
                'recipient_type'  => Constant::RECIPIENT_TYPE_ADMIN,
                'recipient_id'    => $sAdminId,
                'read_at'         => null,
            ]);
        }

        try {
            event(new CenterRegisteredEvent([
                'id'              => $notification->id,
                'notification_id' => $notification->id,
                'center_id'       => $center->id,
                'center_name'     => $center->name,
                'title'           => $notifTitle,
                'content'         => $notifContent,
                'type'            => Constant::NOTIFICATION_TYPE_GENERAL,
                'created_at'      => now()->diffForHumans(),
            ]));
        } catch (\Throwable $e) {
            Log::error("Lỗi khi broadcast WebSocket sự kiện đăng ký trung tâm {$center->id}: " . $e->getMessage());
        }
    }
}
