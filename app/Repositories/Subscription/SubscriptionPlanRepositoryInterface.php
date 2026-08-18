<?php

namespace App\Repositories\Subscription;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Eloquent\Collection;

interface SubscriptionPlanRepositoryInterface
{
    /**
     * @return Collection<int, SubscriptionPlan>
     */
    public function getAllOrderedByPrice(): Collection;

    public function getPaginatedPlans(?string $search = null, ?string $type = null, int $perPage = 20, int $page = 1): \Illuminate\Contracts\Pagination\LengthAwarePaginator;

    public function findByCode(string $code): ?SubscriptionPlan;

    public function findById(int $id): ?SubscriptionPlan;

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): SubscriptionPlan;

    /**
     * @param array<string, mixed> $data
     * @param int                  $id
     */
    public function update(int $id, array $data): SubscriptionPlan;

    public function delete(int $id): bool;

    /**
     * @return array<string, int>
     */
    public function getStats(): array;

    public function getNextPlanCode(): string;
}
