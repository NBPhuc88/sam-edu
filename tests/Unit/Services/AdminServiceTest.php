<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Services\Admin\AdminService;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    Mail::fake();
    $this->service = app(AdminService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test AdminService',
        'status' => Constant::STATUS_ACTIVE,
    ]);
});

test('createAdmin creates admin and syncs center when role is admin', function () {
    $data = [
        'username'  => 'admin_center1',
        'full_name' => 'Nguyen Van Admin',
        'email'     => 'admin_c1@example.com',
        'password'  => 'password123',
        'role'      => Constant::ROLE_ADMIN,
        'center_id' => $this->center->id,
    ];

    $admin = $this->service->createAdmin($data);

    expect($admin)->toBeInstanceOf(Admin::class)
        ->and($admin->username)->toBe('admin_center1')
        ->and($admin->role)->toBe(Constant::ROLE_ADMIN);

    $this->assertDatabaseHas('admin_centers', [
        'admin_id'  => $admin->id,
        'center_id' => $this->center->id,
    ]);
});

test('createAdmin throws exception when trying to create a second super_admin', function () {
    Admin::create([
        'username'   => 'existing_super_admin',
        'full_name'  => 'Super Admin 1',
        'password'   => 'password123',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    $data = [
        'username'  => 'super_2',
        'full_name' => 'Super Admin 2',
        'password'  => 'password123',
        'role'      => Constant::ROLE_SUPER_ADMIN,
    ];

    expect(fn () => $this->service->createAdmin($data))
        ->toThrow(\InvalidArgumentException::class, 'Hệ thống chỉ cho phép duy nhất 1 tài khoản Quản trị viên tối cao');
});

test('updateAdmin throws exception when trying to demote super_admin', function () {
    $superAdmin = Admin::create([
        'username'   => 'super_demote_test',
        'full_name'  => 'Super Demote',
        'password'   => 'password123',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    $data = [
        'full_name' => 'Super Admin Updated',
        'role'      => Constant::ROLE_ADMIN,
    ];

    expect(fn () => $this->service->updateAdmin($superAdmin->id, $data))
        ->toThrow(\InvalidArgumentException::class, 'Không thể hạ cấp tài khoản Quản trị viên tối cao');
});

test('deleteAdmin throws exception when trying to delete super_admin', function () {
    $superAdmin = Admin::create([
        'username'   => 'super_del_test',
        'full_name'  => 'Super Del',
        'password'   => 'password123',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    $otherAdmin = Admin::create([
        'username'   => 'other_admin_test',
        'full_name'  => 'Other Admin',
        'password'   => 'password123',
        'role'       => Constant::ROLE_ADMIN,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    expect(fn () => $this->service->deleteAdmin($superAdmin->id, $otherAdmin->id))
        ->toThrow(\InvalidArgumentException::class, 'Tài khoản Quản trị viên tối cao (Super Admin) không thể bị xóa.');
});

test('deleteAdmin throws exception when admin tries to delete themselves', function () {
    $admin = Admin::create([
        'username'   => 'self_del_admin',
        'full_name'  => 'Self Del Admin',
        'password'   => 'password123',
        'role'       => Constant::ROLE_ADMIN,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    expect(fn () => $this->service->deleteAdmin($admin->id, $admin->id))
        ->toThrow(\InvalidArgumentException::class, 'Bạn không thể tự xóa tài khoản Quản trị viên của chính mình.');
});

test('deleteAdmin deletes regular admin successfully', function () {
    $adminToDelete = Admin::create([
        'username'   => 'admin_to_del',
        'full_name'  => 'Admin To Del',
        'password'   => 'password123',
        'role'       => Constant::ROLE_ADMIN,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $currentAdmin = Admin::create([
        'username'   => 'curr_admin',
        'full_name'  => 'Curr Admin',
        'password'   => 'password123',
        'role'       => Constant::ROLE_ADMIN,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    $result = $this->service->deleteAdmin($adminToDelete->id, $currentAdmin->id);

    expect($result)->toBeTrue();
    $this->assertSoftDeleted('admins', ['id' => $adminToDelete->id]);
});
