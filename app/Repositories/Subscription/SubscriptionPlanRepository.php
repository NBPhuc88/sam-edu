<?php

namespace App\Repositories\Subscription;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Eloquent\Collection;

class SubscriptionPlanRepository implements SubscriptionPlanRepositoryInterface
{
    /**
     * @return Collection<int, SubscriptionPlan>
     */
    public function getAllOrderedByPrice(): Collection
    {
        return SubscriptionPlan::orderBy('price', 'asc')->get();
    }

    public function findByCode(string $code): ?SubscriptionPlan
    {
        return SubscriptionPlan::where('code', $code)->first();
    }

    public function findById(int $id): ?SubscriptionPlan
    {
        return SubscriptionPlan::find($id);
    }
}
