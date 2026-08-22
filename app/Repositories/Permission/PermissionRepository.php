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

    /**
     * @return array<int, string>
     * @param  string             $role
     */
    public function getGrantedPermissionCodesByRole(string $role): array
    {
        return DB::table('role_permissions')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where('role_permissions.role', $role)
            ->pluck('permissions.code')
            ->toArray();
    }

    /**
     * @return array<int, int>
     * @param  string          $role
     */
    public function getGrantedPermissionIdsByRole(string $role): array
    {
        return RolePermission::where('role', $role)
            ->pluck('permission_id')
            ->toArray();
    }

    /**
     * @param array<int, int> $permissionIds
     * @param string          $role
     */
    public function syncRolePermissions(string $role, array $permissionIds): void
    {
        DB::transaction(function () use ($role, $permissionIds) {
            RolePermission::where('role', $role)->delete();

            $records = [];
            $now     = now();

            foreach ($permissionIds as $permId) {
                $records[] = [
                    'role'          => $role,
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
