<?php

use App\Mail\PasswordResetOtpMail;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use App\Services\Auth\PasswordResetService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    Mail::fake();
    $session = app('session')->driver('array');
    request()->setLaravelSession($session);

    $this->center = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test PwdReset',
        'status' => 'active',
    ]);
    $this->service = app(PasswordResetService::class);
});

test('sendOtp successfully generates OTP and queues mail for valid email', function () {
    $admin = Admin::create([
        'username'   => 'admin_pwd_reset',
        'full_name'  => 'Admin Pwd Reset',
        'password'   => Hash::make('password'),
        'role'       => 'admin',
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
        'email'      => 'admin_reset@example.com',
    ]);

    $result = $this->service->sendOtp('admin', 'admin_reset@example.com');

    expect($result['success'])->toBeTrue()
        ->and($result['error'])->toBeNull();

    Mail::assertQueued(PasswordResetOtpMail::class);

    $this->assertDatabaseHas('password_reset_otps', [
        'email'        => 'admin_reset@example.com',
        'account_type' => 'admin',
    ]);
});

test('sendOtp returns error when email is not found', function () {
    $result = $this->service->sendOtp('admin', 'notfound@example.com');

    expect($result['success'])->toBeFalse()
        ->and($result['error'])->toBe('Không tìm thấy tài khoản với email này trong hệ thống.');

    Mail::assertNothingQueued();
});

test('verifyOtpAndLogin succeeds with valid and non-expired OTP', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_otp_verify',
        'first_name'   => 'Teacher',
        'last_name'    => 'Verify',
        'full_name'    => 'Teacher Verify',
        'password'     => Hash::make('password'),
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'email'        => 'teacher_verify@example.com',
        'status'       => 'active',
    ]);

    DB::table('password_reset_otps')->insert([
        'email'        => 'teacher_verify@example.com',
        'account_type' => 'teacher',
        'otp_hash'     => Hash::make('123456'),
        'expires_at'   => now()->addMinutes(15),
        'created_at'   => now(),
    ]);

    $result = $this->service->verifyOtpAndLogin('teacher', 'teacher_verify@example.com', '123456');

    expect($result['success'])->toBeTrue()
        ->and(Auth::guard('teacher')->check())->toBeTrue();

    $this->assertDatabaseMissing('password_reset_otps', [
        'email' => 'teacher_verify@example.com',
    ]);
});

test('verifyOtpAndLogin fails with wrong OTP', function () {
    Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_wrong_otp',
        'first_name'   => 'Teacher',
        'last_name'    => 'WrongOTP',
        'full_name'    => 'Teacher Wrong OTP',
        'password'     => Hash::make('password'),
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'email'        => 'teacher_wrong_otp@example.com',
        'status'       => 'active',
    ]);

    DB::table('password_reset_otps')->insert([
        'email'        => 'teacher_wrong_otp@example.com',
        'account_type' => 'teacher',
        'otp_hash'     => Hash::make('123456'),
        'expires_at'   => now()->addMinutes(15),
        'created_at'   => now(),
    ]);

    $result = $this->service->verifyOtpAndLogin('teacher', 'teacher_wrong_otp@example.com', '654321');

    expect($result['success'])->toBeFalse()
        ->and($result['error'])->toContain('Mã OTP không chính xác');
});

test('verifyOtpAndLogin fails when OTP is expired', function () {
    Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_expired_otp',
        'first_name'   => 'Student',
        'last_name'    => 'ExpiredOTP',
        'full_name'    => 'Student Expired OTP',
        'password'     => Hash::make('password'),
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'email'        => 'student_expired@example.com',
        'status'       => 1,
    ]);

    DB::table('password_reset_otps')->insert([
        'email'        => 'student_expired@example.com',
        'account_type' => 'student',
        'otp_hash'     => Hash::make('123456'),
        'expires_at'   => now()->subMinutes(1),
        'created_at'   => now()->subMinutes(20),
    ]);

    $result = $this->service->verifyOtpAndLogin('student', 'student_expired@example.com', '123456');

    expect($result['success'])->toBeFalse()
        ->and($result['error'])->toContain('Mã OTP đã hết hạn');
});

test('updateForcedPassword updates password and clears must_change_password flag', function () {
    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_forced_pw',
        'first_name'   => 'Student',
        'last_name'    => 'ForcedPW',
        'full_name'    => 'Student Forced PW',
        'email'        => 'student_forced@example.com',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('old_password'),
        'status'       => 1,
    ]);

    Auth::guard('student')->login($student);
    session(['must_change_password' => true]);

    $result = $this->service->updateForcedPassword('new_secure_password');

    expect($result['success'])->toBeTrue();
    expect(Hash::check('new_secure_password', $student->fresh()->password))->toBeTrue();
    expect(session()->has('must_change_password'))->toBeFalse();
});
