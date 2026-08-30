<?php

namespace App\Repositories\Subscription;

use App\Models\CenterSubscription;

use Illuminate\Database\Eloquent\Collection;

interface CenterSubscriptionRepositoryInterface
{
    /**
     * @param  array<string, mixed> $data
     * @return CenterSubscription
     */
    public function create(array $data): CenterSubscription;

    public function find(int $id): ?CenterSubscription;

    /**
     * @param  int                                 $centerId
     * @return Collection<int, CenterSubscription>
     */
    public function getByCenterId(int $centerId): Collection;
}
