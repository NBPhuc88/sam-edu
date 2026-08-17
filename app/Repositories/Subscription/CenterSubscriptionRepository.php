<?php

namespace App\Repositories\Subscription;

use App\Models\CenterSubscription;

class CenterSubscriptionRepository implements CenterSubscriptionRepositoryInterface
{
    /**
     * @param  array<string, mixed> $data
     * @return CenterSubscription
     */
    public function create(array $data): CenterSubscription
    {
        return CenterSubscription::create($data);
    }

    public function find(int $id): ?CenterSubscription
    {
        return CenterSubscription::find($id);
    }
}
