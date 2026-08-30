<?php

namespace App\Repositories\Permission;

use App\Enums\Constant;
use App\Models\Permission;
use App\Models\RolePermission;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PermissionRepository implements PermissionRepositoryInterface
{
    /**
     * @return Collection<int, Permission>
     */
    public function getAllOrdered(): Collection
    {
        return Permission::orderBy('module_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();
    }

    protected function normalizeRole(int|string $role): int
    {
        if (is_numeric($role)) {
            return (int) $role;
        }

        return match ($role) {
            'super_admin' => Constant::ROLE_SUPER_ADMIN,
            'teacher'     => Constant::ROLE_TEACHER,
            'student'     => Constant::ROLE_STUDENT,
            default       => Constant::ROLE_ADMIN,
        };
    }

    /**
     * @return array<int, string>
     * @param  int|string         $role
     */
    public function getGrantedPermissionCodesByRole(int|string $role): array
    {
        $numericRole = $this->normalizeRole($role);

        return DB::table('role_permissions')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where('role_permissions.role', $numericRole)
            ->pluck('permissions.code')
            ->toArray();
    }

    /**
     * @return array<int, int>
     * @param  int|string      $role
     */
    public function getGrantedPermissionIdsByRole(int|string $role): array
    {
        $numericRole = $this->normalizeRole($role);

        return RolePermission::where('role', $numericRole)
            ->pluck('permission_id')
            ->toArray();
    }

    /**
     * @param int|string      $role
     * @param array<int, int> $permissionIds
     */
    public function syncRolePermissions(int|string $role, array $permissionIds): void
    {
        $numericRole = $this->normalizeRole($role);

        DB::transaction(function () use ($numericRole, $permissionIds) {
            RolePermission::where('role', $numericRole)->delete();

            $records = [];
            $now     = now();

            foreach ($permissionIds as $permId) {
                $records[] = [
                    'role'          => $numericRole,
                    'permission_id' => $permId,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ];
            }

            if (! empty($records)) {
                RolePermission::insert($records);
            }
        });
    }

    public function permissionExists(string $code): bool
    {
        return Permission::where('code', $code)->exists();
    }
}
