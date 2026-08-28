<?php

namespace App\Services\Permission;

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

        $roles      = ['super_admin', 'admin', 'teacher', 'student'];
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
                ['key' => 'super_admin', 'name' => 'Super Admin', 'description' => 'Quản trị viên toàn hệ thống (Toàn quyền)'],
                ['key' => 'admin', 'name' => 'Admin Phụ', 'description' => 'Quản trị viên quản lý Trung tâm được gán'],
                ['key' => 'teacher', 'name' => 'Giáo Viên', 'description' => 'Giáo viên phụ trách giảng dạy và chấm bài'],
                ['key' => 'student', 'name' => 'Học Sinh', 'description' => 'Học sinh tham gia lớp học và phòng thi'],
            ],
        ];
    }

    /**
     * @param array<int, string> $permissionCodes
     * @param string             $role
     */
    public function updateRolePermissions(string $role, array $permissionCodes): void
    {
        $permissionIds = Permission::whereIn('code', $permissionCodes)->pluck('id')->toArray();

        $this->permissionRepository->syncRolePermissions($role, $permissionIds);

        // Xóa cache của role
        $this->clearRoleCache($role);
    }

    public function resetToDefault(?string $role = null): void
    {
        $seeder = new PermissionSeeder();
        $seeder->run($role);

        // Xóa cache
        if ($role) {
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
        $roles = ['super_admin', 'admin', 'teacher', 'student'];

        foreach ($roles as $r) {
            $this->clearRoleCache($r);
        }
    }

    /**
     * @return array<int, string>
     * @param  string             $role
     * @param  ?string            $adminRole
     */
    public function getPermissionsForUser(string $role, int|string|null $adminRole = null): array
    {
        $isSuperAdmin  = ($role === 'admin' && ($adminRole === 'super_admin' || (int) $adminRole === \App\Enums\Constant::ROLE_SUPER_ADMIN));
        $effectiveRole = $isSuperAdmin ? 'super_admin' : $role;

        // Super Admin có tất cả quyền
        if ($effectiveRole === 'super_admin') {
            return Cache::remember(
                self::CACHE_PREFIX . 'super_admin',
                self::CACHE_TTL_SECONDS,
                fn () => Permission::pluck('code')->toArray()
            );
        }

        return Cache::remember(
            self::CACHE_PREFIX . $effectiveRole,
            self::CACHE_TTL_SECONDS,
            fn () => $this->permissionRepository->getGrantedPermissionCodesByRole($effectiveRole)
        );
    }

    public function roleHasPermission(string $effectiveRole, string $permissionCode): bool
    {
        if ($effectiveRole === 'super_admin') {
            return true;
        }

        $granted = $this->getPermissionsForUser($effectiveRole);

        return in_array($permissionCode, $granted, true);
    }

    public function permissionExists(string $permissionCode): bool
    {
        return $this->permissionRepository->permissionExists($permissionCode);
    }

    private function clearRoleCache(string $role): void
    {
        Cache::forget(self::CACHE_PREFIX . $role);
    }
}
