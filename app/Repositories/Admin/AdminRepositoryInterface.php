<?php

namespace App\Repositories\Admin;

use App\Enums\Constant;
use App\Models\Admin;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AdminRepositoryInterface
{
    public function findByUsernameOrEmail(string $username): ?Admin;

    public function find(int $id): Admin;

    public function paginate(int $perPage = Constant::DEFAULT_PER_PAGE, ?string $search = null, ?string $role = null): LengthAwarePaginator;

    /**
     * @param array<string, mixed> $data
     */
    public function create(array $data): Admin;

    /**
     * @param int                  $id
     * @param array<string, mixed> $data
     */
    public function update(int $id, array $data): Admin;

    public function delete(int $id): bool;

    /**
     * @param Admin           $admin
     * @param array<int, int> $centerIds
     */
    public function syncCenters(Admin $admin, array $centerIds): void;

    public function hasSuperAdmin(): bool;

    public function hasOtherSuperAdmin(int $id): bool;

    public function getNextAdminCode(): string;
}
