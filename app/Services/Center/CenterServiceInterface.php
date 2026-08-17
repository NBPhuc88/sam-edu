<?php

namespace App\Services\Center;

use App\Models\Center;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CenterServiceInterface
{
    /**
     * Get paginated centers list with optional search query.
     * @param int     $perPage
     * @param ?string $search
     */
    public function getPaginatedCenters(int $perPage = 15, ?string $search = null): LengthAwarePaginator;

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
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getSubscriptionPlans(): \Illuminate\Database\Eloquent\Collection;
}
