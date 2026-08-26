<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use App\Services\Profile\ProfileService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    Mail::fake();
    $this->service = app(ProfileService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test ProfileService',
        'status' => 'active',
    ]);
});

test('getProfileData formats user details correctly for student', function () {
    $student = Student::create([
        'center_id'    => $this->center->id,
        'first_name'   => 'Nguyen',
        'last_name'    => 'Student',
        'full_name'    => 'Nguyen Van Student',
        'username'     => 'std_user',
        'student_code' => 'HS0000001',
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    $data = $this->service->getProfileData($student, 'student');

    expect($data['id'])->toBe($student->id)
        ->and($data['user_code'])->toBe('HS0000001')
        ->and($data['role_label'])->toBe('Học sinh')
        ->and($data['center_name'])->toBe($this->center->name);
});

test('sendPasswordChangeOtp returns error when user has no email', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_no_email',
        'first_name'   => 'Teacher',
        'last_name'    => 'NoEmail',
        'full_name'    => 'Teacher No Email',
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'email'        => null,
        'status'       => 'active',
    ]);

    $result = $this->service->sendPasswordChangeOtp($teacher, 'teacher');

    expect($result['success'])->toBeFalse()
        ->and($result['message'])->toContain('chưa có email');
});

test('updatePassword fails when current password is incorrect', function () {
    $admin = Admin::create([
        'username'   => 'admin_profile_pw',
        'full_name'  => 'Admin Profile PW',
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
        'email'      => 'admin_prof@example.com',
        'password'   => Hash::make('correct_password'),
        'role'       => 'admin',
    ]);

    $result = $this->service->updatePassword($admin, 'admin', 'wrong_pass', 'new_pass', '123456');

    expect($result['success'])->toBeFalse()
        ->and($result['message'])->toContain('Mật khẩu hiện tại không chính xác');
});

test('updatePassword succeeds with valid OTP and correct password', function () {
    $admin = Admin::create([
        'username'   => 'admin_profile_valid',
        'full_name'  => 'Admin Profile Valid',
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
        'email'      => 'admin_change@example.com',
        'password'   => Hash::make('old_pass_123'),
        'role'       => 'admin',
    ]);

    DB::table('account_verification_otps')->insert([
        'user_type'  => 'admin',
        'user_id'    => $admin->id,
        'email'      => 'admin_change@example.com',
        'action'     => 'change_password',
        'otp_hash'   => Hash::make('123456'),
        'expires_at' => now()->addMinutes(5),
        'created_at' => now(),
    ]);

    $result = $this->service->updatePassword($admin, 'admin', 'old_pass_123', 'new_secure_pass', '123456');

    expect($result['success'])->toBeTrue()
        ->and(Hash::check('new_secure_pass', $admin->fresh()->password))->toBeTrue();
});
