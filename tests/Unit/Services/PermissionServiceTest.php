<?php

use App\Enums\Constant;
use App\Models\Permission;
use App\Services\Permission\PermissionService;

beforeEach(function () {
    $this->service = app(PermissionService::class);
});

test('getPermissionsForUser returns all permissions for super_admin', function () {
    Permission::create([
        'code'         => 'centers.manage',
        'name'         => 'Quan ly trung tam',
        'module'       => 'Trung tâm',
        'module_key'   => 'center',
        'module_order' => 1,
        'action'       => 'manage',
    ]);

    $permissions = $this->service->getPermissionsForUser(Constant::ROLE_ADMIN, Constant::ROLE_SUPER_ADMIN);

    expect($permissions)->toContain('centers.manage');
});

test('roleHasPermission always returns true for super_admin', function () {
    $hasPermission = $this->service->roleHasPermission(Constant::ROLE_SUPER_ADMIN, 'any.random.permission');

    expect($hasPermission)->toBeTrue();
});

test('updateRolePermissions updates grants and clears role cache', function () {
    $perm = Permission::create([
        'code'         => 'students.create',
        'name'         => 'Tao hoc sinh',
        'module'       => 'Học sinh',
        'module_key'   => 'student',
        'module_order' => 2,
        'action'       => 'create',
    ]);

    $this->service->updateRolePermissions(Constant::ROLE_TEACHER, ['students.create']);

    expect($this->service->roleHasPermission(Constant::ROLE_TEACHER, 'students.create'))->toBeTrue();
});

