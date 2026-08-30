<?php

namespace App\Services\Payment;

use App\Enums\Constant;
use App\Events\CenterSubscriptionRenewalRequestedEvent;
use App\Mail\CenterSubscriptionRenewalRequestedMail;
use App\Models\Admin;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Payment\PaymentTransactionRepositoryInterface;
use App\Repositories\Setting\SystemSettingRepositoryInterface;
use App\Repositories\Subscription\CenterSubscriptionRepositoryInterface;
use App\Repositories\Subscription\SubscriptionPlanRepositoryInterface;
use App\Services\Zalo\ZaloServiceInterface;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PaymentService implements PaymentServiceInterface
{
    public function __construct(
        protected ZaloServiceInterface $zaloPayService,
        protected SubscriptionPlanRepositoryInterface $subscriptionPlanRepository,
        protected CenterRepositoryInterface $centerRepository,
        protected PaymentTransactionRepositoryInterface $paymentTransactionRepository,
        protected CenterSubscriptionRepositoryInterface $centerSubscriptionRepository,
        protected SystemSettingRepositoryInterface $systemSettingRepository
    ) {
    }

    public function getSubscriptionPlans(): Collection
    {
        return $this->subscriptionPlanRepository->getAllOrderedByPrice();
    }

    /**
     * @param  array<string, mixed> $data
     * @param  Admin|null           $requestingUser
     * @return array<string, mixed>
     */
    public function requestRenewal(array $data, ?Admin $requestingUser = null): array
    {
        $center = $this->centerRepository->find((int) $data['center_id']);

        if (! $center) {
            return [
                'success' => false,
                'message' => 'Không tìm thấy thông tin trung tâm.',
            ];
        }

        $plan = $this->subscriptionPlanRepository->findById((int) $data['plan_id']);

        if (! $plan) {
            return [
                'success' => false,
                'message' => 'Gói dịch vụ không hợp lệ.',
            ];
        }

        $durationType = (string) ($data['duration_type'] ?? 'yearly');

        if (! in_array($durationType, ['monthly', 'yearly'], true)) {
            $durationType = 'yearly';
        }

        if ($durationType === 'monthly') {
            $amount       = (int) $plan->price;
            $durationDays = 30;
        } else {
            $amount       = (int) ($plan->yearly_price ?? ($plan->price * 12));
            $durationDays = 365;
        }

        $note = isset($data['note']) ? (string) $data['note'] : null;

        $contactEmail = $this->systemSettingRepository->getByKey(
            'contact_email',
            (string) config('mail.from.address', 'phucstt01@gmail.com')
        );

        $superAdminEmails = Admin::where('role', Constant::ROLE_SUPER_ADMIN)->orWhere('role', 'super_admin')->pluck('email')->filter()->toArray();
        $recipientEmails  = array_unique(array_filter(array_merge([$contactEmail], $superAdminEmails)));

        foreach ($recipientEmails as $email) {
            try {
                Mail::to($email)->queue(
                    new CenterSubscriptionRenewalRequestedMail($center, $plan, $note, $requestingUser, $durationType, $amount)
                );
            } catch (\Throwable $e) {
                Log::error("Lỗi khi gửi email yêu cầu gia hạn trung tâm {$center->id} tới {$email}: " . $e->getMessage());
            }
        }

        $appTransId = date('ymd') . '_REQ_' . time() . rand(100, 999);
        $this->paymentTransactionRepository->create([
            'center_id'      => $center->id,
            'app_trans_id'   => $appTransId,
            'payment_method' => Constant::PAYMENT_METHOD_OTHER,
            'amount'         => $amount,
            'status'         => Constant::PAYMENT_STATUS_PENDING,
            'metadata'       => [
                'app_trans_id'    => $appTransId,
                'plan_id'         => $plan->id,
                'plan_name'       => $plan->name,
                'duration_type'   => $durationType,
                'duration_days'   => $durationDays,
                'note'            => $note,
                'requested_by_id' => $requestingUser?->id,
            ],
        ]);

        // Create in-app Notification record & dispatch real-time WebSocket event
        $notifTitle    = "Yêu cầu gia hạn gói dịch vụ từ Trung tâm '{$center->name}'";
        $durationLabel = $durationType === 'yearly' ? '1 Năm' : '1 Tháng';
        $formattedAmt  = number_format($amount, 0, ',', '.') . 'đ';
        $notifContent  = "Trung tâm {$center->name} ({$center->code}) vừa gửi yêu cầu gia hạn gói {$plan->name} ({$durationLabel} - {$formattedAmt}).";

        $notification = Notification::create([
            'center_id'           => $center->id,
            'title'               => $notifTitle,
            'content'             => $notifContent,
            'type'                => Constant::NOTIFICATION_TYPE_SUBSCRIPTION_RENEWAL,
            'created_by_admin_id' => $requestingUser?->id,
        ]);

        $superAdminIds = Admin::where('role', Constant::ROLE_SUPER_ADMIN)->orWhere('role', 'super_admin')->pluck('id')->toArray();

        foreach ($superAdminIds as $sAdminId) {
            NotificationRecipient::create([
                'notification_id' => $notification->id,
                'recipient_type'  => Constant::RECIPIENT_TYPE_ADMIN,
                'recipient_id'    => $sAdminId,
                'read_at'         => null,
            ]);
        }

        try {
            event(new CenterSubscriptionRenewalRequestedEvent([
                'id'              => $notification->id,
                'notification_id' => $notification->id,
                'center_id'       => $center->id,
                'center_name'     => $center->name,
                'title'           => $notifTitle,
                'content'         => $notifContent,
                'type'            => Constant::NOTIFICATION_TYPE_SUBSCRIPTION_RENEWAL,
                'duration_type'   => $durationType,
                'amount'          => $amount,
                'created_at'      => now()->diffForHumans(),
            ]));
        } catch (\Throwable $e) {
            Log::error("Lỗi khi broadcast WebSocket sự kiện gia hạn trung tâm {$center->id}: " . $e->getMessage());
        }

        return [
            'success' => true,
            'message' => 'Yêu cầu gia hạn gói dịch vụ đã được gửi thành công đến Quản trị viên hệ thống. Bộ phận hỗ trợ sẽ liên hệ xử lý cho bạn trong thời gian sớm nhất!',
        ];
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
            'payment_method' => Constant::PAYMENT_METHOD_ZALOPAY,
            'amount'         => $amount,
            'status'         => Constant::PAYMENT_STATUS_PENDING,
            'metadata'       => [
                'app_trans_id' => $appTransId,
                'plan_id'      => (int) $validated['plan_id'],
            ],
        ]);

        $embedData = [
            'redirecturl'   => $validated['redirect_url'] ?? config('app.url'),
            'center_id'     => $center->id,
            'plan_id'       => (int) $validated['plan_id'],
            'duration_days' => $durationDays,
        ];

        $items = [
            [
                'itemid'       => (string) $validated['plan_id'],
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
            'status'   => Constant::PAYMENT_STATUS_FAILED,
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

        if ((int) $transaction->status === Constant::PAYMENT_STATUS_SUCCESS) {
            return [
                'return_code'    => 1,
                'return_message' => 'success (already processed)',
            ];
        }

        /** @var array<string, mixed> $embedData */
        $embedData    = json_decode((string) ($dataJson['embed_data'] ?? '{}'), true) ?: [];
        $durationDays = (int) ($embedData['duration_days'] ?? (($embedData['duration_months'] ?? 1) * 30));
        $planId       = (int) ($embedData['plan_id'] ?? 1);

        DB::transaction(function () use ($transaction, $zpTransId, $dataJson, $durationDays, $planId) {
            $this->paymentTransactionRepository->update($transaction->id, [
                'status'   => Constant::PAYMENT_STATUS_SUCCESS,
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

            $planObj = $this->subscriptionPlanRepository->findById($planId);

            $subscription = $this->centerSubscriptionRepository->create([
                'center_id'     => $center->id,
                'plan_id'       => $planObj ? $planObj->id : 1,
                'plan_name'     => $planObj ? $planObj->name : "Gói dịch vụ #{$planId}",
                'price'         => $transaction->amount,
                'duration_days' => $durationDays,
                'starts_at'     => $startsAt,
                'ends_at'       => $endsAt,
                'status'        => Constant::SUBSCRIPTION_STATUS_ACTIVE,
            ]);

            $this->paymentTransactionRepository->update($transaction->id, [
                'metadata' => array_merge($transaction->metadata ?? [], [
                    'center_subscription_id' => $subscription->id,
                ]),
            ]);

            // Extend center expiration
            $this->centerRepository->update($center->id, [
                'status'               => Constant::CENTER_STATUS_ACTIVE,
                'subscription_plan_id' => $planObj ? $planObj->id : 1,
                'plan_type'            => $planObj?->plan_type ?? Constant::PLAN_TYPE_STANDARD,
                'expires_at'           => $endsAt,
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

        if ((int) $transaction->status === Constant::PAYMENT_STATUS_SUCCESS) {
            return [
                'success'     => true,
                'status'      => Constant::PAYMENT_STATUS_SUCCESS,
                'transaction' => $transaction,
            ];
        }

        $result = $this->zaloPayService->queryStatus($appTransId);

        if (isset($result['return_code']) && (int) $result['return_code'] === 1) {
            $this->paymentTransactionRepository->update($transaction->id, [
                'status'   => Constant::PAYMENT_STATUS_SUCCESS,
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
