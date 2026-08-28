<?php

namespace App\Repositories\Permission;

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

    protected function normalizeRole(string|int $role): int
    {
        if (is_numeric($role)) {
            return (int) $role;
        }

        return match ($role) {
            'super_admin' => \App\Enums\Constant::ROLE_SUPER_ADMIN,
            'teacher'     => \App\Enums\Constant::ROLE_TEACHER,
            'student'     => \App\Enums\Constant::ROLE_STUDENT,
            default       => \App\Enums\Constant::ROLE_ADMIN,
        };
    }

    /**
     * @return array<int, string>
     * @param  string             $role
     */
    public function getGrantedPermissionCodesByRole(string $role): array
    {
        $numericRole = $this->normalizeRole($role);

        return DB::table('role_permissions')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where(function ($q) use ($numericRole, $role) {
                $q->where('role_permissions.role', $numericRole)
                    ->orWhere('role_permissions.role', $role);
            })
            ->pluck('permissions.code')
            ->toArray();
    }

    /**
     * @return array<int, int>
     * @param  string          $role
     */
    public function getGrantedPermissionIdsByRole(string $role): array
    {
        $numericRole = $this->normalizeRole($role);

        return RolePermission::where('role', $numericRole)
            ->orWhere('role', $role)
            ->pluck('permission_id')
            ->toArray();
    }

    /**
     * @param array<int, int> $permissionIds
     * @param string          $role
     */
    public function syncRolePermissions(string $role, array $permissionIds): void
    {
        $numericRole = $this->normalizeRole($role);

        DB::transaction(function () use ($numericRole, $role, $permissionIds) {
            RolePermission::where('role', $numericRole)->orWhere('role', $role)->delete();

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
