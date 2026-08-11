<?php

namespace App\Services\Center;

use App\Models\Center;
use App\Repositories\Center\CenterRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CenterService implements CenterServiceInterface
{
    public function __construct(
        protected CenterRepositoryInterface $centerRepository
    ) {
    }

    /**
     * Get paginated centers list with optional search query.
     * @param int     $perPage
     * @param ?string $search
     */
    public function getPaginatedCenters(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        return $this->centerRepository->paginate($perPage, $search);
    }

    /**
     * Get center details by ID.
     * @param int $id
     */
    public function getCenterById(int $id): Center
    {
        return $this->centerRepository->find($id);
    }

    /**
     * Create a new center.
     *
     * @param array<string, mixed> $data
     */
    public function createCenter(array $data): Center
    {
        // Auto generate center code if not provided
        if (empty($data['code'])) {
            $data['code'] = 'CENTER-' . sprintf('%02d', Center::withTrashed()->count() + 1);
        }

        // Set default trial expiration if creating new trial plan
        if (($data['subscription_plan'] ?? '') === 'trial_14d' && empty($data['expires_at'])) {
            $data['expires_at']    = now()->addDays(14);
            $data['trial_ends_at'] = now()->addDays(14);
        }

        return $this->centerRepository->create($data);
    }

    /**
     * Update an existing center with only modified/changed fields.
     *
     * @param array<string, mixed> $data
     * @param int                  $id
     */
    public function updateCenter(int $id, array $data): Center
    {
        return $this->centerRepository->update($id, $data);
    }

    /**
     * Delete a center by ID.
     * @param int $id
     */
    public function deleteCenter(int $id): bool
    {
        return $this->centerRepository->delete($id);
    }
}
