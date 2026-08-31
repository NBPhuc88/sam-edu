<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use App\Services\Auth\AuthServiceInterface;
use App\Services\Auth\PasswordResetServiceInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->activeCenter = Center::create([
        'code'       => 'CTR' . random_int(1000000, 9999999),
        'name'       => 'Trung Tâm Hoạt Động',
        'status'     => Constant::CENTER_STATUS_ACTIVE,
        'expires_at' => now()->addMonths(6),
    ]);

    $this->pausedCenter = Center::create([
        'code'       => 'CTR' . random_int(1000000, 9999999),
        'name'       => 'Trung Tâm Tạm Dừng',
        'status'     => Constant::CENTER_STATUS_PAUSED,
        'expires_at' => now()->addMonths(6),
    ]);

    $this->expiredCenter = Center::create([
        'code'       => 'CTR' . random_int(1000000, 9999999),
        'name'       => 'Trung Tâm Hết Hạn',
        'status'     => Constant::CENTER_STATUS_EXPIRED,
        'expires_at' => now()->subDays(5),
    ]);

    $this->pastExpiresCenter = Center::create([
        'code'       => 'CTR' . random_int(1000000, 9999999),
        'name'       => 'Trung Tâm Quá Hạn Chưa Đổi Status',
        'status'     => Constant::CENTER_STATUS_ACTIVE,
        'expires_at' => now()->subDay(),
    ]);

    $this->authService          = app(AuthServiceInterface::class);
    $this->passwordResetService = app(PasswordResetServiceInterface::class);
});

test('super admin can login and access regardless of center status', function () {
    $superAdmin = Admin::create([
        'username'   => 'superadmin_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin',
        'email'      => 'superadmin_' . random_int(1000, 9999) . '@example.com',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    $result = $this->authService->authenticate('admin', $superAdmin->username, 'password123');
    expect($result['success'])->toBeTrue();

    $response = $this->actingAs($superAdmin, 'admin')->get(route('dashboard'));
    $response->assertStatus(200);
});

test('sub-admin of active center can login and access dashboard', function () {
    $admin = Admin::create([
        'username'   => 'subadmin_active_' . random_int(1000, 9999),
        'full_name'  => 'Sub Admin Active',
        'email'      => 'subadmin_active_' . random_int(1000, 9999) . '@example.com',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $admin->centers()->attach($this->activeCenter->id);

    $result = $this->authService->authenticate('admin', $admin->username, 'password123');
    expect($result['success'])->toBeTrue();

    $response = $this->actingAs($admin, 'admin')->get(route('dashboard'));
    $response->assertStatus(200);
});

test('sub-admin of paused center cannot login and is blocked from accessing system', function () {
    $admin = Admin::create([
        'username'   => 'subadmin_paused_' . random_int(1000, 9999),
        'full_name'  => 'Sub Admin Paused',
        'email'      => 'subadmin_paused_' . random_int(1000, 9999) . '@example.com',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $admin->centers()->attach($this->pausedCenter->id);

    $result = $this->authService->authenticate('admin', $admin->username, 'password123');
    expect($result['success'])->toBeFalse();
    expect($result['error'])->toContain('tạm dừng');

    // Test middleware blocking when session exists
    Auth::guard('admin')->login($admin);
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('sub-admin of expired center cannot login and is blocked from accessing system', function () {
    $admin = Admin::create([
        'username'   => 'subadmin_exp_' . random_int(1000, 9999),
        'full_name'  => 'Sub Admin Expired',
        'email'      => 'subadmin_exp_' . random_int(1000, 9999) . '@example.com',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $admin->centers()->attach($this->expiredCenter->id);

    $result = $this->authService->authenticate('admin', $admin->username, 'password123');
    expect($result['success'])->toBeFalse();
    expect($result['error'])->toContain('hết hạn');

    Auth::guard('admin')->login($admin);
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('sub-admin of center with past expires_at is auto updated to expired and blocked', function () {
    $admin = Admin::create([
        'username'   => 'subadmin_past_' . random_int(1000, 9999),
        'full_name'  => 'Sub Admin Past',
        'email'      => 'subadmin_past_' . random_int(1000, 9999) . '@example.com',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $admin->centers()->attach($this->pastExpiresCenter->id);

    $result = $this->authService->authenticate('admin', $admin->username, 'password123');
    expect($result['success'])->toBeFalse();
    expect($result['error'])->toContain('hết hạn');

    $this->pastExpiresCenter->refresh();
    expect((int) $this->pastExpiresCenter->status)->toBe(Constant::CENTER_STATUS_EXPIRED);
});

test('teacher of paused or expired center cannot login or access system', function () {
    $teacherPaused = Teacher::create([
        'center_id'    => $this->pausedCenter->id,
        'username'     => 'teacher_paused_' . random_int(1000, 9999),
        'first_name'   => 'Teacher',
        'last_name'    => 'Paused',
        'full_name'    => 'Teacher Paused',
        'email'        => 'teacher_paused_' . random_int(1000, 9999) . '@example.com',
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::TEACHER_STATUS_ACTIVE,
    ]);

    $result = $this->authService->authenticate('teacher', $teacherPaused->username, 'password123');
    expect($result['success'])->toBeFalse();
    expect($result['error'])->toContain('tạm dừng');

    Auth::guard('teacher')->login($teacherPaused);
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));

    $teacherExpired = Teacher::create([
        'center_id'    => $this->expiredCenter->id,
        'username'     => 'teacher_exp_' . random_int(1000, 9999),
        'first_name'   => 'Teacher',
        'last_name'    => 'Expired',
        'full_name'    => 'Teacher Expired',
        'email'        => 'teacher_exp_' . random_int(1000, 9999) . '@example.com',
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::TEACHER_STATUS_ACTIVE,
    ]);

    $resultExp = $this->authService->authenticate('teacher', $teacherExpired->username, 'password123');
    expect($resultExp['success'])->toBeFalse();
    expect($resultExp['error'])->toContain('hết hạn');
});

test('student of paused or expired center cannot login or access system', function () {
    $studentPaused = Student::create([
        'center_id'     => $this->pausedCenter->id,
        'username'      => 'student_paused_' . random_int(1000, 9999),
        'first_name'    => 'Student',
        'last_name'     => 'Paused',
        'full_name'     => 'Student Paused',
        'email'         => 'student_paused_' . random_int(1000, 9999) . '@example.com',
        'student_code'  => 'HS' . random_int(1000000, 9999999),
        'password'      => Hash::make('password123'),
        'date_of_birth' => '2010-01-01',
        'status'        => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $result = $this->authService->authenticate('student', $studentPaused->username, 'password123');
    expect($result['success'])->toBeFalse();
    expect($result['error'])->toContain('tạm dừng');

    Auth::guard('student')->login($studentPaused);
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));

    $studentExpired = Student::create([
        'center_id'     => $this->expiredCenter->id,
        'username'      => 'student_exp_' . random_int(1000, 9999),
        'first_name'    => 'Student',
        'last_name'     => 'Expired',
        'full_name'     => 'Student Expired',
        'email'         => 'student_exp_' . random_int(1000, 9999) . '@example.com',
        'student_code'  => 'HS' . random_int(1000000, 9999999),
        'password'      => Hash::make('password123'),
        'date_of_birth' => '2010-01-01',
        'status'        => Constant::STUDENT_STATUS_ACTIVE,
    ]);

    $resultExp = $this->authService->authenticate('student', $studentExpired->username, 'password123');
    expect($resultExp['success'])->toBeFalse();
    expect($resultExp['error'])->toContain('hết hạn');
});

test('password reset OTP is denied for accounts belonging to paused or expired center', function () {
    $teacherPaused = Teacher::create([
        'center_id'    => $this->pausedCenter->id,
        'username'     => 'teacher_otp_' . random_int(1000, 9999),
        'first_name'   => 'Teacher',
        'last_name'    => 'OTP',
        'full_name'    => 'Teacher OTP',
        'email'        => 'teacher_otp_' . random_int(1000, 9999) . '@example.com',
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::TEACHER_STATUS_ACTIVE,
    ]);

    $otpResult = $this->passwordResetService->sendOtp('teacher', $teacherPaused->email);
    expect($otpResult['success'])->toBeFalse();
    expect($otpResult['error'])->toContain('tạm dừng');
});
