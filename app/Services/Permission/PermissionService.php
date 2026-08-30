<?php

namespace App\Services\Permission;

use App\Enums\Constant;
use App\Models\Permission;
use App\Repositories\Permission\PermissionRepositoryInterface;
use Database\Seeders\PermissionSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

class PermissionService implements PermissionServiceInterface
{
    private const CACHE_TTL_SECONDS = 3600; // 1 giờ
    private const CACHE_PREFIX      = 'sam_role_permissions_';

    public function __construct(
        protected PermissionRepositoryInterface $permissionRepository
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function getMatrixData(): array
    {
        $permissions = $this->permissionRepository->getAllOrdered();

        $roles      = Constant::ROLE_PERMISSION_ROLES;
        $roleGrants = [];

        foreach ($roles as $role) {
            $roleGrants[$role] = $this->permissionRepository->getGrantedPermissionCodesByRole($role);
        }

        // Nhóm permissions theo module
        $modules = [];

        foreach ($permissions as $permission) {
            $moduleKey = $permission->module_key ?? 'general';

            if (! isset($modules[$moduleKey])) {
                $modules[$moduleKey] = [
                    'key'          => $moduleKey,
                    'name'         => $permission->module,
                    'module_order' => $permission->module_order,
                    'permissions'  => [],
                ];
            }

            $modules[$moduleKey]['permissions'][] = [
                'id'          => $permission->id,
                'code'        => $permission->code,
                'name'        => $permission->name,
                'action'      => $permission->action,
                'description' => $permission->description,
            ];
        }

        return [
            'modules'    => array_values($modules),
            'roleGrants' => $roleGrants,
            'roles'      => [
                ['key' => Constant::ROLE_SUPER_ADMIN, 'name' => 'Super Admin', 'description' => 'Quản trị viên toàn hệ thống (Toàn quyền)'],
                ['key' => Constant::ROLE_ADMIN, 'name' => 'Admin Phụ', 'description' => 'Quản trị viên quản lý Trung tâm được gán'],
                ['key' => Constant::ROLE_TEACHER, 'name' => 'Giáo Viên', 'description' => 'Giáo viên phụ trách giảng dạy và chấm bài'],
                ['key' => Constant::ROLE_STUDENT, 'name' => 'Học Sinh', 'description' => 'Học sinh tham gia lớp học và phòng thi'],
            ],
        ];
    }

    /**
     * @param int|string         $role
     * @param array<int, string> $permissionCodes
     */
    public function updateRolePermissions(int|string $role, array $permissionCodes): void
    {
        $numericRole   = $this->normalizeRole($role);
        $permissionIds = Permission::whereIn('code', $permissionCodes)->pluck('id')->toArray();

        $this->permissionRepository->syncRolePermissions($numericRole, $permissionIds);

        // Xóa cache của role
        $this->clearRoleCache($numericRole);
    }

    public function resetToDefault(int|string|null $role = null): void
    {
        $seeder = new PermissionSeeder();
        $seeder->run($role);

        // Xóa cache
        if ($role !== null) {
            $this->clearRoleCache($role);
        } else {
            $this->clearAllCache();
        }
    }

    public function syncPermissions(): void
    {
        Artisan::call('permission:sync');
        $this->clearAllCache();
    }

    public function clearAllCache(): void
    {
        $roles = Constant::ROLE_PERMISSION_ROLES;

        foreach ($roles as $r) {
            $this->clearRoleCache($r);
        }
    }

    /**
     * @return array<int, string>
     * @param  int|string         $role
     * @param  int|string|null    $adminRole
     */
    public function getPermissionsForUser(int|string $role, int|string|null $adminRole = null): array
    {
        $numericRole = $this->normalizeRole($role, $adminRole);

        // Super Admin có tất cả quyền
        if ($numericRole === Constant::ROLE_SUPER_ADMIN) {
            return Cache::remember(
                self::CACHE_PREFIX . Constant::ROLE_SUPER_ADMIN,
                self::CACHE_TTL_SECONDS,
                fn () => Permission::pluck('code')->toArray()
            );
        }

        return Cache::remember(
            self::CACHE_PREFIX . $numericRole,
            self::CACHE_TTL_SECONDS,
            fn () => $this->permissionRepository->getGrantedPermissionCodesByRole($numericRole)
        );
    }

    public function roleHasPermission(int|string $effectiveRole, string $permissionCode): bool
    {
        $numericRole = $this->normalizeRole($effectiveRole);

        if ($numericRole === Constant::ROLE_SUPER_ADMIN) {
            return true;
        }

        $granted = $this->getPermissionsForUser($numericRole);

        return in_array($permissionCode, $granted, true);
    }

    public function permissionExists(string $permissionCode): bool
    {
        return $this->permissionRepository->permissionExists($permissionCode);
    }

    private function normalizeRole(int|string $role, int|string|null $adminRole = null): int
    {
        if (is_numeric($role)) {
            $numericRole = (int) $role;

            if ($numericRole === Constant::ROLE_ADMIN && ($adminRole === 'super_admin' || (int) $adminRole === Constant::ROLE_SUPER_ADMIN)) {
                return Constant::ROLE_SUPER_ADMIN;
            }

            return $numericRole;
        }

        return match ($role) {
            'super_admin' => Constant::ROLE_SUPER_ADMIN,
            'teacher'     => Constant::ROLE_TEACHER,
            'student'     => Constant::ROLE_STUDENT,
            default       => ($adminRole === 'super_admin' || (int) $adminRole === Constant::ROLE_SUPER_ADMIN)
                ? Constant::ROLE_SUPER_ADMIN
                : Constant::ROLE_ADMIN,
        };
    }

    private function clearRoleCache(int|string $role): void
    {
        $numericRole = $this->normalizeRole($role);
        Cache::forget(self::CACHE_PREFIX . $numericRole);
        Cache::forget(self::CACHE_PREFIX . $role);
    }
}
