<?php

namespace App\Services\Admin;

use App\Enums\Constant;
use App\Models\Admin;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AdminServiceInterface
{
    public function getPaginatedAdmins(int $perPage = Constant::DEFAULT_PER_PAGE, ?string $search = null, ?string $role = null): LengthAwarePaginator;

    /**
     * @param array<string, mixed> $data
     */
    public function createAdmin(array $data): Admin;

    /**
     * @param int                  $id
     * @param array<string, mixed> $data
     */
    public function updateAdmin(int $id, array $data): Admin;

    public function deleteAdmin(int $id, int $currentAdminId): bool;

    /**
     * @return array<string, mixed>
     */
    public function getFormData(): array;
}
