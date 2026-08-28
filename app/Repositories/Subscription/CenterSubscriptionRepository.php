<?php

namespace App\Repositories\Subscription;

use App\Models\CenterSubscription;
use Illuminate\Database\Eloquent\Collection;

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

    /**
     * @param  int                                 $centerId
     * @return Collection<int, CenterSubscription>
     */
    public function getByCenterId(int $centerId): Collection
    {
        return CenterSubscription::where('center_id', $centerId)
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
