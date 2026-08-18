<?php

namespace App\Services\Subscription;

use App\Models\SubscriptionPlan;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface SubscriptionPlanServiceInterface
{
    /**
     * @return Collection<int, SubscriptionPlan>
     */
    public function getAllPlans(): Collection;

    public function getPaginatedPlans(?string $search = null, ?string $type = null, int $perPage = 20, int $page = 1): LengthAwarePaginator;

    public function getPlanById(int $id): SubscriptionPlan;

    /**
     * @param array<string, mixed> $data
     */
    public function createPlan(array $data): SubscriptionPlan;

    /**
     * @param array<string, mixed> $data
     * @param int                  $id
     */
    public function updatePlan(int $id, array $data): SubscriptionPlan;

    public function deletePlan(int $id): bool;

    /**
     * @return array<string, int>
     */
    public function getStats(): array;
}
