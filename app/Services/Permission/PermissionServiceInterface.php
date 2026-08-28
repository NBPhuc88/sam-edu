<?php

namespace App\Services\Permission;

interface PermissionServiceInterface
{
    /**
     * Lấy dữ liệu ma trận phân quyền theo từng module cho giao diện quản trị.
     *
     * @return array<string, mixed>
     */
    public function getMatrixData(): array;

    /**
     * Cập nhật danh sách quyền cho một vai trò.
     *
     * @param array<int, string> $permissionCodes
     * @param string             $role
     */
    public function updateRolePermissions(string $role, array $permissionCodes): void;

    /**
     * Khôi phục phân quyền về giá trị mặc định chuẩn.
     * @param ?string $role
     */
    public function resetToDefault(?string $role = null): void;

    /**
     * Đồng bộ danh mục permissions từ file cấu hình và làm mới cache.
     */
    public function syncPermissions(): void;

    /**
     * Xóa toàn bộ cache phân quyền hệ thống.
     */
    public function clearAllCache(): void;

    /**
     * Lấy danh sách mã quyền được cấp cho một người dùng dựa trên role và admin_role.
     *
     * @return array<int, string>
     * @param  string             $role
     * @param  ?string            $adminRole
     */
    public function getPermissionsForUser(string $role, int|string|null $adminRole = null): array;

    /**
     * Kiểm tra một effective role có quyền cụ thể hay không.
     * @param string $effectiveRole
     * @param string $permissionCode
     */
    public function roleHasPermission(string $effectiveRole, string $permissionCode): bool;

    /**
     * Kiểm tra một mã quyền có tồn tại trong hệ thống hay không.
     * @param string $permissionCode
     */
    public function permissionExists(string $permissionCode): bool;
}
