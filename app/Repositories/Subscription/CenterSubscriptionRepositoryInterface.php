<?php

namespace App\Repositories\Subscription;

use App\Models\CenterSubscription;

interface CenterSubscriptionRepositoryInterface
{
    /**
     * @param  array<string, mixed> $data
     * @return CenterSubscription
     */
    public function create(array $data): CenterSubscription;

    public function find(int $id): ?CenterSubscription;
}
