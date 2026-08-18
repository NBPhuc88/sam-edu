<?php

namespace App\Services\Subscription;

use App\Models\SubscriptionPlan;
use App\Repositories\Subscription\SubscriptionPlanRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class SubscriptionPlanService implements SubscriptionPlanServiceInterface
{
    public function __construct(
        protected SubscriptionPlanRepositoryInterface $planRepository
    ) {
    }

    /**
     * @return Collection<int, SubscriptionPlan>
     */
    public function getAllPlans(): Collection
    {
        return $this->planRepository->getAllOrderedByPrice();
    }

    public function getPaginatedPlans(?string $search = null, ?string $type = null, int $perPage = 20, int $page = 1): LengthAwarePaginator
    {
        return $this->planRepository->getPaginatedPlans($search, $type, $perPage, $page);
    }

    public function getPlanById(int $id): SubscriptionPlan
    {
        $plan = $this->planRepository->findById($id);

        if (! $plan) {
            throw new \RuntimeException("Không tìm thấy gói cước với ID #{$id}");
        }

        return $plan;
    }

    /**
     * @param array<string, mixed> $data
     */
    public function createPlan(array $data): SubscriptionPlan
    {
        if (empty($data['code'])) {
            $data['code'] = $this->planRepository->getNextPlanCode();
        }

        $data['price']         = isset($data['price']) ? (float) $data['price'] : 0.0;
        $data['yearly_price']  = isset($data['yearly_price']) ? (float) $data['yearly_price'] : 0.0;
        $data['duration_days'] = isset($data['duration_days']) ? (int) $data['duration_days'] : 30;
        $data['max_students']  = isset($data['max_students']) && $data['max_students'] !== '' ? (int) $data['max_students'] : null;
        $data['max_classes']   = isset($data['max_classes']) && $data['max_classes'] !== '' ? (int) $data['max_classes'] : null;
        $data['is_featured']   = ! empty($data['is_featured']);

        if (isset($data['features']) && is_array($data['features'])) {
            $data['features'] = array_values(array_filter(array_map('trim', $data['features'])));
        }

        return $this->planRepository->create($data);
    }

    /**
     * @param array<string, mixed> $data
     * @param int                  $id
     */
    public function updatePlan(int $id, array $data): SubscriptionPlan
    {
        $plan = $this->getPlanById($id);

        if (empty($data['code'])) {
            $data['code'] = $plan->code;
        }

        $data['price']         = isset($data['price']) ? (float) $data['price'] : 0.0;
        $data['yearly_price']  = isset($data['yearly_price']) ? (float) $data['yearly_price'] : 0.0;
        $data['duration_days'] = isset($data['duration_days']) ? (int) $data['duration_days'] : 30;
        $data['max_students']  = isset($data['max_students']) && $data['max_students'] !== '' ? (int) $data['max_students'] : null;
        $data['max_classes']   = isset($data['max_classes']) && $data['max_classes'] !== '' ? (int) $data['max_classes'] : null;
        $data['is_featured']   = ! empty($data['is_featured']);

        if (isset($data['features']) && is_array($data['features'])) {
            $data['features'] = array_values(array_filter(array_map('trim', $data['features'])));
        }

        return $this->planRepository->update($id, $data);
    }

    public function deletePlan(int $id): bool
    {
        return $this->planRepository->delete($id);
    }

    /**
     * @return array<string, int>
     */
    public function getStats(): array
    {
        return $this->planRepository->getStats();
    }
}
