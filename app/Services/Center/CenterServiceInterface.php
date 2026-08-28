<?php

namespace App\Services\Center;

use App\Enums\Constant;
use App\Models\Center;
use App\Models\CenterSubscription;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface CenterServiceInterface
{
    /**
     * Get paginated centers list with optional search query.
     * @param int     $perPage
     * @param ?string $search
     */
    public function getPaginatedCenters(int $perPage = Constant::DEFAULT_PER_PAGE, ?string $search = null): LengthAwarePaginator;

    /**
     * Get center details by ID.
     * @param int $id
     */
    public function getCenterById(int $id): Center;

    /**
     * Create a new center.
     *
     * @param array<string, mixed> $data
     */
    public function createCenter(array $data): Center;

    /**
     * Update an existing center with only modified/changed fields.
     *
     * @param array<string, mixed> $data
     * @param int                  $id
     */
    public function updateCenter(int $id, array $data): Center;

    /**
     * Delete a center by ID.
     * @param int $id
     */
    public function deleteCenter(int $id): bool;

    /**
     * @return Collection
     */
    public function getSubscriptionPlans(): Collection;

    /**
     * Renew or change subscription for a center.
     *
     * @param  int                  $centerId
     * @param  array<string, mixed> $data
     * @return CenterSubscription
     */
    public function renewOrChangeSubscription(int $centerId, array $data): CenterSubscription;

    /**
     * Get subscription history for a center.
     *
     * @param  int        $centerId
     * @return Collection
     */
    public function getCenterSubscriptions(int $centerId): Collection;
}
