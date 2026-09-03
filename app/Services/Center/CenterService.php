<?php

namespace App\Services\Center;

use App\Enums\Constant;
use App\Mail\CenterSubscriptionRenewedMail;
use App\Mail\CenterUpdatedMail;
use App\Models\Center;
use App\Models\CenterSubscription;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Subscription\CenterSubscriptionRepositoryInterface;
use App\Repositories\Subscription\SubscriptionPlanRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class CenterService implements CenterServiceInterface
{
    public function __construct(
        protected CenterRepositoryInterface $centerRepository,
        protected SubscriptionPlanRepositoryInterface $subscriptionPlanRepository,
        protected CenterSubscriptionRepositoryInterface $centerSubscriptionRepository
    ) {
    }

    /**
     * Get paginated centers list with optional search query.
     * @param int     $perPage
     * @param ?string $search
     */
    public function getPaginatedCenters(int $perPage = Constant::DEFAULT_PER_PAGE, ?string $search = null): LengthAwarePaginator
    {
        return $this->centerRepository->paginate($perPage, $search);
    }

    /**
     * Get center details by ID.
     * @param int $id
     */
    public function getCenterById(int $id): Center
    {
        return $this->centerRepository->find($id);
    }

    /**
     * Create a new center.
     *
     * @param array<string, mixed> $data
     */
    public function createCenter(array $data): Center
    {
        // Auto generate center code if not provided
        if (empty($data['code'])) {
            $data['code'] = Constant::PREFIX_CENTER . sprintf('%0' . Constant::CODE_PAD_LENGTH . 'd', $this->centerRepository->count() + 1);
        }

        // Tự động đồng bộ plan_type, max_classes, max_students từ gói được chọn
        if (! empty($data['subscription_plan_id'])) {
            $plan = $this->subscriptionPlanRepository->findById((int) $data['subscription_plan_id']);

            if ($plan) {
                $data['subscription_plan_id'] = (int) $plan->id;
                $data['plan_type']            = $plan->plan_type;
                $data['max_classes']          = $data['max_classes'] ?? $plan->max_classes;
                $data['max_students']         = $data['max_students'] ?? $plan->max_students;
            }
        }

        // Set default trial expiration if creating new trial plan
        if (isset($plan) && $plan->plan_type === Constant::PLAN_TYPE_FREE && empty($data['expires_at'])) {
            $data['expires_at']    = now()->addDays(Constant::DEFAULT_TRIAL_DAYS);
            $data['trial_ends_at'] = now()->addDays(Constant::DEFAULT_TRIAL_DAYS);
        }

        return $this->centerRepository->create($data);
    }

    /**
     * Update an existing center with only modified/changed fields and send notification email.
     *
     * @param array<string, mixed> $data
     * @param int                  $id
     */
    public function updateCenter(int $id, array $data): Center
    {
        // Khi Super Admin cập nhật/nâng cấp gói dịch vụ của Trung tâm
        if (! empty($data['subscription_plan_id'])) {
            $plan = $this->subscriptionPlanRepository->findById((int) $data['subscription_plan_id']);

            if ($plan) {
                $data['subscription_plan_id'] = (int) $plan->id;
                $data['plan_type']            = $plan->plan_type;
                $data['max_classes']          = $data['max_classes'] ?? $plan->max_classes;
                $data['max_students']         = $data['max_students'] ?? $plan->max_students;
            }
        }

        // Tự động đồng bộ trạng thái khi Super Admin sửa trực tiếp ngày hết hạn
        if (array_key_exists('expires_at', $data)) {
            if (! empty($data['expires_at'])) {
                $exp                = Carbon::parse($data['expires_at']);
                $data['expires_at'] = $exp;

                if (! isset($data['status'])) {
                    $data['status'] = $exp->isPast() ? Constant::CENTER_STATUS_EXPIRED : Constant::CENTER_STATUS_ACTIVE;
                }
            } else {
                $data['expires_at'] = null;
            }
        }

        $center = $this->centerRepository->update($id, $data);

        // Gửi mail thông báo qua Queue về email của trung tâm
        if (! empty($center->email)) {
            try {
                Mail::to($center->email)->queue(new CenterUpdatedMail($center));
            } catch (\Throwable $e) {
                Log::error('Lỗi khi đưa mail thông báo vào Queue cho Trung tâm (ID: ' . $center->id . '): ' . $e->getMessage());
            }
        }

        return $center;
    }

    /**
     * Delete a center by ID.
     * @param int $id
     */
    public function deleteCenter(int $id): bool
    {
        return $this->centerRepository->delete($id);
    }

    /**
     * @return Collection
     */
    public function getSubscriptionPlans(): Collection
    {
        return $this->subscriptionPlanRepository->getAllOrderedByPrice();
    }

    /**
     * Super Admin thực hiện gia hạn hoặc thay đổi gói cước dịch vụ SaaS cho Trung tâm.
     *
     * @param  array<string, mixed> $data
     * @param  int                  $centerId
     * @return CenterSubscription
     */
    public function renewOrChangeSubscription(int $centerId, array $data): CenterSubscription
    {
        return DB::transaction(function () use ($centerId, $data) {
            $center = $this->centerRepository->find($centerId);
            $plan   = $this->subscriptionPlanRepository->findById((int) $data['plan_id']);

            if (! $plan) {
                throw ValidationException::withMessages([
                    'plan_id' => "Gói cước không tồn tại: {$data['plan_id']}",
                ]);
            }

            $isSamePlan = ((int) $center->subscription_plan_id === (int) $plan->id);
            $actionType = $isSamePlan ? 'renew' : 'change';

            $startsAt     = Carbon::parse($data['starts_at']);
            $endsAt       = Carbon::parse($data['ends_at']);
            $durationDays = (int) $data['duration_days'];
            $price        = (float) $data['price'];

            // 1. Tạo bản ghi lịch sử gói cước center_subscriptions
            $subscription = $this->centerSubscriptionRepository->create([
                'center_id'     => $center->id,
                'plan_id'       => $plan->id,
                'plan_name'     => $plan->name,
                'price'         => $price,
                'duration_days' => $durationDays,
                'starts_at'     => $startsAt,
                'ends_at'       => $endsAt,
                'status'        => Constant::SUBSCRIPTION_STATUS_ACTIVE,
            ]);

            // 2. Cập nhật Trung tâm (Gói cước, hạn mức, ngày hết hạn và kích hoạt lại nếu hết hạn)
            $updateCenterData = [
                'subscription_plan_id' => $plan->id,
                'plan_type'            => $plan->plan_type,
                'max_students'         => $plan->max_students,
                'max_classes'          => $plan->max_classes,
                'expires_at'           => $endsAt,
                'status'               => Constant::CENTER_STATUS_ACTIVE,
            ];

            $updatedCenter = $this->centerRepository->update($center->id, $updateCenterData);

            // 3. Gửi email thông báo qua Queue
            if (! empty($updatedCenter->email)) {
                try {
                    Mail::to($updatedCenter->email)->queue(
                        new CenterSubscriptionRenewedMail($updatedCenter, $subscription, $actionType)
                    );
                } catch (\Throwable $e) {
                    Log::error("Lỗi khi đưa mail thông báo gia hạn/đổi gói vào Queue cho Trung tâm (ID: {$center->id}): " . $e->getMessage());
                }
            }

            return $subscription;
        });
    }

    /**
     * Get subscription history for a center.
     *
     * @param  int        $centerId
     * @return Collection
     */
    public function getCenterSubscriptions(int $centerId): Collection
    {
        return $this->centerSubscriptionRepository->getByCenterId($centerId);
    }

    /**
     * Update an existing subscription record and recalculate center capacity and expiration.
     *
     * @param  int                  $centerId
     * @param  int                  $subscriptionId
     * @param  array<string, mixed> $data
     * @return CenterSubscription
     */
    public function updateCenterSubscription(int $centerId, int $subscriptionId, array $data): CenterSubscription
    {
        return DB::transaction(function () use ($centerId, $subscriptionId, $data) {
            $subscription = $this->centerSubscriptionRepository->find($subscriptionId);

            if (! $subscription || (int) $subscription->center_id !== $centerId) {
                throw ValidationException::withMessages([
                    'subscription' => 'Bản ghi gói cước không tồn tại hoặc không thuộc trung tâm này.',
                ]);
            }

            if (! empty($data['plan_id'])) {
                $plan = $this->subscriptionPlanRepository->findById((int) $data['plan_id']);

                if ($plan) {
                    $data['plan_name'] = $plan->name;
                }
            }

            if (! empty($data['starts_at'])) {
                $data['starts_at'] = Carbon::parse($data['starts_at']);
            }

            if (! empty($data['ends_at'])) {
                $data['ends_at'] = Carbon::parse($data['ends_at']);
            }

            $updatedSubscription = $this->centerSubscriptionRepository->update($subscriptionId, $data);

            $this->recalculateCenterSubscription($centerId);

            return $updatedSubscription;
        });
    }

    /**
     * Delete a subscription record and recalculate center capacity and expiration.
     *
     * @param  int  $centerId
     * @param  int  $subscriptionId
     * @return bool
     */
    public function deleteCenterSubscription(int $centerId, int $subscriptionId): bool
    {
        return DB::transaction(function () use ($centerId, $subscriptionId) {
            $subscription = $this->centerSubscriptionRepository->find($subscriptionId);

            if (! $subscription || (int) $subscription->center_id !== $centerId) {
                throw ValidationException::withMessages([
                    'subscription' => 'Bản ghi gói cước không tồn tại hoặc không thuộc trung tâm này.',
                ]);
            }

            $deleted = $this->centerSubscriptionRepository->delete($subscriptionId);

            $this->recalculateCenterSubscription($centerId);

            return $deleted;
        });
    }

    /**
     * Recalculate center's expires_at, subscription_plan_id, max_students, max_classes based on remaining subscriptions.
     *
     * @param  int    $centerId
     * @return Center
     */
    public function recalculateCenterSubscription(int $centerId): Center
    {
        $center        = $this->centerRepository->find($centerId);
        $subscriptions = $this->centerSubscriptionRepository->getByCenterId($centerId);

        if ($subscriptions->isNotEmpty()) {
            // Ưu tiên bản ghi active có ends_at xa nhất, nếu không có thì lấy bản ghi có ends_at xa nhất
            $activeSubs = $subscriptions->filter(fn ($sub) => (int) $sub->status === Constant::SUBSCRIPTION_STATUS_ACTIVE);
            /** @var CenterSubscription $targetSub */
            $targetSub = $activeSubs->sortByDesc('ends_at')->first() ?? $subscriptions->sortByDesc('ends_at')->first();

            $maxEndsAt = $subscriptions->filter(fn ($sub) => (int) $sub->status !== Constant::SUBSCRIPTION_STATUS_CANCELLED)->max('ends_at');
            $endsAt    = $maxEndsAt ? Carbon::parse($maxEndsAt) : null;

            $plan = $this->subscriptionPlanRepository->findById((int) $targetSub->plan_id);

            $isExpired = $endsAt && $endsAt->isPast();

            $updateData = [
                'subscription_plan_id' => (int) $targetSub->plan_id,
                'plan_type'            => $plan?->plan_type ?? Constant::PLAN_TYPE_FREE,
                'max_students'         => $plan?->max_students ?? $center->max_students,
                'max_classes'          => $plan?->max_classes ?? $center->max_classes,
                'expires_at'           => $endsAt,
                'status'               => $isExpired ? Constant::CENTER_STATUS_EXPIRED : Constant::CENTER_STATUS_ACTIVE,
            ];

            return $this->centerRepository->update($centerId, $updateData);
        }

        return $center;
    }

    public function deactivateExpiredCenters(): int
    {
        $count = $this->centerRepository->markExpiredCenters();

        if ($count > 0) {
            Log::info("Đã chuyển {$count} trung tâm hết hạn sang trạng thái expired.");
        }

        return $count;
    }
}
