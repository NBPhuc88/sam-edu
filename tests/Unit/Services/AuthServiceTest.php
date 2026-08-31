<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use App\Services\Auth\AuthService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $session = app('session')->driver('array');
    request()->setLaravelSession($session);

    $this->center = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Trung Tâm Test Auth',
        'status' => Constant::STATUS_ACTIVE,
    ]);
    $this->authService = app(AuthService::class);
});

test('authenticate authenticates admin successfully with correct credentials', function () {
    $admin = Admin::create([
        'username'   => 'admin_auth_test',
        'full_name'  => 'Admin Test',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    $result = $this->authService->authenticate('admin', 'admin_auth_test', 'password123');

    expect($result['success'])->toBeTrue()
        ->and($result['account']->id)->toBe($admin->id)
        ->and($result['error'])->toBeNull();

    expect(Auth::guard('admin')->check())->toBeTrue();
    expect($admin->fresh()->current_session_id)->not()->toBeNull();
});

test('authenticate authenticates teacher successfully', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_auth_test',
        'first_name'   => 'Teacher',
        'last_name'    => 'Test',
        'full_name'    => 'Teacher Test',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    $result = $this->authService->authenticate('teacher', 'teacher_auth_test', 'password123');

    expect($result['success'])->toBeTrue()
        ->and($result['account']->id)->toBe($teacher->id);

    expect(Auth::guard('teacher')->check())->toBeTrue();
});

test('authenticate authenticates student successfully', function () {
    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_auth_test',
        'first_name'   => 'Student',
        'last_name'    => 'Test',
        'full_name'    => 'Student Test',
        'password'     => Hash::make('password123'),
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'status'       => 1,
    ]);

    $result = $this->authService->authenticate('student', 'student_auth_test', 'password123');

    expect($result['success'])->toBeTrue()
        ->and($result['account']->id)->toBe($student->id);

    expect(Auth::guard('student')->check())->toBeTrue();
});

test('authenticate fails when user provides incorrect password', function () {
    Admin::create([
        'username'   => 'admin_pass_fail',
        'full_name'  => 'Admin Test Fail',
        'password'   => Hash::make('correct_password'),
        'role'       => Constant::ROLE_ADMIN,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    $result = $this->authService->authenticate('admin', 'admin_pass_fail', 'wrong_password');

    expect($result['success'])->toBeFalse()
        ->and($result['account'])->toBeNull()
        ->and($result['error'])->toBe('Tên đăng nhập hoặc mật khẩu không chính xác.');

    expect(Auth::guard('admin')->check())->toBeFalse();
});

test('authenticate fails when account status is locked or inactive for admin/student', function () {
    $lockedTeacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'locked_teacher',
        'first_name'   => 'Locked',
        'last_name'    => 'Teacher',
        'full_name'    => 'Locked Teacher',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'status'       => Constant::TEACHER_STATUS_LOCKED,
    ]);

    $result = $this->authService->authenticate('teacher', 'locked_teacher', 'password123');

    expect($result['success'])->toBeFalse()
        ->and($result['account'])->toBeNull()
        ->and($result['error'])->toBe('Tài khoản Giáo viên của bạn đã bị khóa. Vui lòng liên hệ Admin hệ thống.');

    $inactiveTeacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'inactive_teacher',
        'first_name'   => 'Inactive',
        'last_name'    => 'Teacher',
        'full_name'    => 'Inactive Teacher',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'status'       => Constant::TEACHER_STATUS_INACTIVE,
    ]);

    $resultInactive = $this->authService->authenticate('teacher', 'inactive_teacher', 'password123');
    expect($resultInactive['success'])->toBeTrue();
});

test('logout clears device session token and logs out all guards', function () {
    $admin = Admin::create([
        'username'           => 'admin_logout_test',
        'full_name'          => 'Admin Logout Test',
        'password'           => Hash::make('password'),
        'role'               => Constant::ROLE_ADMIN,
        'admin_code'         => 'ADM' . random_int(1000000, 9999999),
        'current_session_id' => 'existing_token_123',
    ]);

    Auth::guard('admin')->login($admin);
    expect(Auth::guard('admin')->check())->toBeTrue();

    $this->authService->logout();

    expect(Auth::guard('admin')->check())->toBeFalse();
    expect($admin->fresh()->current_session_id)->toBeNull();
});
