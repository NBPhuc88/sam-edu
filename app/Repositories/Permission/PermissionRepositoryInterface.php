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
     * @param  string             $role
     */
    public function getGrantedPermissionCodesByRole(string $role): array;

    /**
     * Lấy danh sách permission_id đã được cấp cho một role.
     *
     * @return array<int, int>
     * @param  string          $role
     */
    public function getGrantedPermissionIdsByRole(string $role): array;

    /**
     * Đồng bộ danh sách quyền được cấp cho một vai trò.
     *
     * @param array<int, int> $permissionIds
     * @param string          $role
     */
    public function syncRolePermissions(string $role, array $permissionIds): void;

    /**
     * Kiểm tra một mã quyền có tồn tại trong hệ thống hay không.
     * @param string $code
     */
    public function permissionExists(string $code): bool;
}
