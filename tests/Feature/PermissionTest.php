<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Permission;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Teacher;
use App\Services\Permission\PermissionServiceInterface;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
});

test('permissions are seeded successfully with granular crud codes', function () {
    expect(Permission::count())->toBeGreaterThan(50);
    expect(Permission::where('code', 'students.index')->exists())->toBeTrue();
    expect(Permission::where('code', 'students.create')->exists())->toBeTrue();
    expect(Permission::where('code', 'students.edit')->exists())->toBeTrue();
    expect(Permission::where('code', 'students.delete')->exists())->toBeTrue();
});

test('super admin can access permissions management page', function () {
    $superAdmin = Admin::create([
        'username'   => 'super_admin_perm_test',
        'full_name'  => 'Super Admin Perm Test',
        'email'      => 'superadmin_perm@test.com',
        'password'   => 'password123',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'admin_code' => 'ADM000000088',
    ]);

    $response = $this->actingAs($superAdmin, 'admin')->get(route('permissions.index'));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->component('Admin/Permissions/Index')
            ->has('modules')
            ->has('roleGrants')
            ->has('roles')
    );
});

test('super admin can update role permissions', function () {
    $superAdmin = Admin::create([
        'username'   => 'super_admin_update_perm',
        'full_name'  => 'Super Admin Update',
        'email'      => 'superadmin_upd@test.com',
        'password'   => 'password123',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'admin_code' => 'ADM000000087',
    ]);

    $response = $this->actingAs($superAdmin, 'admin')->post(route('permissions.edit'), [
        'role'        => Constant::ROLE_TEACHER,
        'permissions' => ['dashboard.index', 'students.index'],
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $permissionService = app(PermissionServiceInterface::class);
    expect($permissionService->roleHasPermission(Constant::ROLE_TEACHER, 'students.index'))->toBeTrue();
    expect($permissionService->roleHasPermission(Constant::ROLE_TEACHER, 'exams.create'))->toBeFalse();
});

test('student accessing unauthorized route receives 404', function () {
    $center = Center::create([
        'code'   => 'CTR000000086',
        'name'   => 'Trung Tâm Student Test',
        'email'  => 'center86@test.com',
        'phone'  => '0901234586',
        'status' => Constant::STATUS_ACTIVE,
    ]);

    $student = Student::create([
        'student_code' => 'HS000000086',
        'first_name'   => 'Học Sinh',
        'last_name'    => 'Test',
        'full_name'    => 'Học Sinh Test Quyền',
        'username'     => 'student_perm_test',
        'password'     => 'password123',
        'center_id'    => $center->id,
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    // Học sinh không có quyền xem trang giáo viên teachers.index → nhận 404
    $response = $this->actingAs($student, 'student')->get(route('teachers.index'));

    $response->assertStatus(404);
});

test('teacher can access allowed route but receives 404 on disallowed create route', function () {
    $center = Center::create([
        'code'   => 'CTR000000085',
        'name'   => 'Trung Tâm Teacher Test',
        'email'  => 'center85@test.com',
        'phone'  => '0901234585',
        'status' => Constant::STATUS_ACTIVE,
    ]);

    $teacher = Teacher::create([
        'teacher_code' => 'GV000000085',
        'first_name'   => 'Giáo Viên',
        'last_name'    => 'Test',
        'full_name'    => 'Giáo Viên Test Quyền',
        'username'     => 'teacher_perm_test',
        'password'     => 'password123',
        'center_id'    => $center->id,
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    // Giáo viên có quyền xem students.index
    $allowedResponse = $this->actingAs($teacher, 'teacher')->get(route('students.index'));
    $allowedResponse->assertOk();

    // Giáo viên mặc định không có quyền tạo mới học sinh students.create → nhận 404
    $disallowedResponse = $this->actingAs($teacher, 'teacher')->get(route('students.create'));
    $disallowedResponse->assertStatus(404);
});

test('super admin can reset role permissions to default', function () {
    $superAdmin = Admin::create([
        'username'   => 'super_admin_reset_perm',
        'full_name'  => 'Super Admin Reset',
        'email'      => 'superadmin_reset@test.com',
        'password'   => 'password123',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'admin_code' => 'ADM000000084',
    ]);

    $permissionService = app(PermissionServiceInterface::class);

    // 1. Thay đổi quyền của giáo viên thành rỗng
    $permissionService->updateRolePermissions(Constant::ROLE_TEACHER, []);
    expect($permissionService->roleHasPermission(Constant::ROLE_TEACHER, 'students.index'))->toBeFalse();

    // 2. Gọi API khôi phục mặc định cho vai trò teacher
    $response = $this->actingAs($superAdmin, 'admin')->post(route('permissions.reset'), [
        'role' => Constant::ROLE_TEACHER,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // 3. Kiểm tra lại quyền mặc định đã được khôi phục
    expect($permissionService->roleHasPermission(Constant::ROLE_TEACHER, 'students.index'))->toBeTrue();
    expect($permissionService->roleHasPermission(Constant::ROLE_TEACHER, 'classes.index'))->toBeTrue();
});

test('super admin can sync permissions from config', function () {
    $superAdmin = Admin::create([
        'username'   => 'super_admin_sync_perm',
        'full_name'  => 'Super Admin Sync',
        'email'      => 'superadmin_sync@test.com',
        'password'   => 'password123',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'admin_code' => 'ADM000000083',
    ]);

    $response = $this->actingAs($superAdmin, 'admin')->post(route('permissions.sync'));

    $response->assertRedirect();
    $response->assertSessionHas('success');
});

test('role without classes.exam-results permission cannot access class exam results page', function () {
    $center = Center::create([
        'code'   => 'CTR000000082',
        'name'   => 'Trung Tâm Class Exam Test',
        'email'  => 'center82@test.com',
        'phone'  => '0901234582',
        'status' => Constant::STATUS_ACTIVE,
    ]);

    $student = Student::create([
        'student_code' => 'HS000000082',
        'first_name'   => 'Học Sinh',
        'last_name'    => 'Exam Test',
        'full_name'    => 'Học Sinh Test Exam Perm',
        'username'     => 'student_exam_perm',
        'password'     => 'password123',
        'center_id'    => $center->id,
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    $class = SchoolClass::create([
        'center_id' => $center->id,
        'name'      => 'Lớp Toán 12',
        'code'      => 'CLS000000082',
        'status'    => Constant::CLASS_STATUS_ACTIVE,
    ]);

    // Thu hồi quyền classes.exam-results của role student
    $permissionService = app(PermissionServiceInterface::class);
    $permissionService->updateRolePermissions(Constant::ROLE_STUDENT, ['dashboard.index', 'classes.index']);

    $response = $this->actingAs($student, 'student')->get(route('classes.exam-results.index', ['classId' => $class->id]));

    $response->assertStatus(404);
});

test('super admin receives full permissions and admin_role string super_admin in inertia props', function () {
    $superAdmin = Admin::create([
        'username'   => 'super_admin_inertia_check',
        'full_name'  => 'Super Admin Inertia Check',
        'email'      => 'superadmin_inertia@test.com',
        'password'   => 'password123',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'admin_code' => 'ADM000000081',
    ]);

    $allPermissionsCount = Permission::count();

    $response = $this->actingAs($superAdmin, 'admin')->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
            ->where('auth.user.admin_role', 'super_admin')
            ->where('auth.role', 'admin')
            ->has('auth.permissions', $allPermissionsCount)
    );
});
