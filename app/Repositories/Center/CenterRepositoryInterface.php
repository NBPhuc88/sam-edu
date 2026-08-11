<?php

namespace App\Repositories\Center;

use App\Models\Center;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CenterRepositoryInterface
{
    /**
     * Get paginated centers list with optional search query.
     * @param int     $perPage
     * @param ?string $search
     */
    public function paginate(int $perPage = 15, ?string $search = null): LengthAwarePaginator;

    /**
     * Find a center by username, center code or email.
     * @param string $username
     */
    public function findByUsernameOrEmail(string $username): ?Center;

    /**
     * Find a center by ID.
     * @param int $id
     */
    public function find(int $id): Center;

    /**
     * Create a new center.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Center;

    /**
     * Update an existing center by ID with provided data array.
     *
     * @param array<string, mixed> $data
     * @param int                  $id
     */
    public function update(int $id, array $data): Center;

    /**
     * Soft delete a center by ID.
     * @param int $id
     */
    public function delete(int $id): bool;
}
