<?php

namespace App\Services\Center;

use App\Enums\Constant;
use App\Mail\CenterUpdatedMail;
use App\Models\Center;
use App\Repositories\Center\CenterRepositoryInterface;
use App\Repositories\Subscription\SubscriptionPlanRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CenterService implements CenterServiceInterface
{
    public function __construct(
        protected CenterRepositoryInterface $centerRepository,
        protected SubscriptionPlanRepositoryInterface $subscriptionPlanRepository
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
        if (! empty($data['subscription_plan'])) {
            $plan = $this->subscriptionPlanRepository->findByCode($data['subscription_plan']);

            if ($plan) {
                $data['plan_type']    = $plan->plan_type;
                $data['max_classes']  = $data['max_classes'] ?? $plan->max_classes;
                $data['max_students'] = $data['max_students'] ?? $plan->max_students;
            }
        }

        // Set default trial expiration if creating new trial plan
        if (($data['subscription_plan'] ?? '') === Constant::CENTER_STATUS_TRIAL && empty($data['expires_at'])) {
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
        if (! empty($data['subscription_plan'])) {
            $plan = $this->subscriptionPlanRepository->findByCode($data['subscription_plan']);

            if ($plan) {
                $data['plan_type']    = $plan->plan_type;
                $data['max_classes']  = $plan->max_classes;
                $data['max_students'] = $plan->max_students;
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

    public function deactivateExpiredCenters(): int
    {
        $count = $this->centerRepository->markExpiredCenters();

        if ($count > 0) {
            Log::info("Đã chuyển {$count} trung tâm hết hạn sang trạng thái expired.");
        }

        return $count;
    }
}
