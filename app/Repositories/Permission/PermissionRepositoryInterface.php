<?php

namespace App\Repositories\Permission;

use App\Models\Permission;
use Illuminate\Support\Collection;

interface PermissionRepositoryInterface
{
    /**
     * Lấy toàn bộ danh sách permissions sắp xếp theo module_order và id.
     *
     * @return Collection<int, Permission>
     */
    public function getAllOrdered(): Collection;

    /**
     * Lấy danh sách các mã quyền (code) đã được cấp cho một role.
     *
     * @return array<int, string>
     * @param  int|string         $role
     */
    public function getGrantedPermissionCodesByRole(int|string $role): array;

    /**
     * Lấy danh sách permission_id đã được cấp cho một role.
     *
     * @return array<int, int>
     * @param  int|string      $role
     */
    public function getGrantedPermissionIdsByRole(int|string $role): array;

    /**
     * Đồng bộ danh sách quyền được cấp cho một vai trò.
     *
     * @param int|string      $role
     * @param array<int, int> $permissionIds
     */
    public function syncRolePermissions(int|string $role, array $permissionIds): void;

    /**
     * Kiểm tra một mã quyền có tồn tại trong hệ thống hay không.
     * @param string $code
     */
    public function permissionExists(string $code): bool;
}
