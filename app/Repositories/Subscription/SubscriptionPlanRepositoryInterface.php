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

    public function findByCode(string $code): ?SubscriptionPlan;

    public function findById(int $id): ?SubscriptionPlan;
}
