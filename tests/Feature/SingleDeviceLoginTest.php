<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    Artisan::call('db:seed', ['--class' => SubscriptionPlanSeeder::class]);
    Artisan::call('db:seed', ['--class' => PermissionSeeder::class]);
    Mail::fake();
});

test('admin login records current session device token', function () {
    $admin = Admin::create([
        'username'   => 'admin_test_session',
        'full_name'  => 'Admin Session Test',
        'email'      => 'admin_session@sam-edu.vn',
        'password'   => Hash::make('password123'),
        'role'       => 'super_admin',
        'status'     => 'active',
        'admin_code' => 'ADM000000001',
    ]);

    $response = $this->post('/login', [
        'role'     => 'admin',
        'username' => 'admin_test_session',
        'password' => 'password123',
    ]);

    $response->assertRedirect('/dashboard');

    $admin->refresh();
    expect($admin->current_session_id)->not->toBeNull();
    expect(session('auth_device_token_admin'))->toEqual($admin->current_session_id);
});

test('teacher login records current session device token', function () {
    $center = Center::create([
        'name'              => 'Sam Edu Center',
        'code'              => 'CTR000000001',
        'status'            => 'active',
        'subscription_plan' => 'trial',
        'plan_type'         => 'trial',
        'expires_at'        => Carbon::now()->addDays(14),
    ]);

    $teacher = Teacher::create([
        'username'     => 'teacher_test_session',
        'first_name'   => 'Test',
        'last_name'    => 'Teacher',
        'full_name'    => 'Teacher Session Test',
        'email'        => 'teacher_session@sam-edu.vn',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'GV000000001',
        'center_id'    => $center->id,
        'status'       => 'active',
    ]);

    $response = $this->post('/login', [
        'role'     => 'teacher',
        'username' => 'teacher_test_session',
        'password' => 'password123',
    ]);

    $response->assertRedirect('/dashboard');

    $teacher->refresh();
    expect($teacher->current_session_id)->not->toBeNull();
    expect(session('auth_device_token_teacher'))->toEqual($teacher->current_session_id);
});

test('student login records current session device token', function () {
    $center = Center::create([
        'name'              => 'Sam Edu Center',
        'code'              => 'CTR000000001',
        'status'            => 'active',
        'subscription_plan' => 'trial',
        'plan_type'         => 'trial',
        'expires_at'        => Carbon::now()->addDays(14),
    ]);

    $student = Student::create([
        'username'     => 'student_test_session',
        'first_name'   => 'Test',
        'last_name'    => 'Student',
        'full_name'    => 'Student Session Test',
        'email'        => 'student_session@sam-edu.vn',
        'password'     => Hash::make('password123'),
        'student_code' => 'HS000000001',
        'center_id'    => $center->id,
        'status'       => 1,
    ]);

    $response = $this->post('/login', [
        'role'     => 'student',
        'username' => 'student_test_session',
        'password' => 'password123',
    ]);

    $response->assertRedirect('/dashboard');

    $student->refresh();
    expect($student->current_session_id)->not->toBeNull();
    expect(session('auth_device_token_student'))->toEqual($student->current_session_id);
});

test('user with matching device token can access protected route', function () {
    $admin = Admin::create([
        'username'           => 'admin_active_session',
        'full_name'          => 'Admin Active Session',
        'email'              => 'admin_active@sam-edu.vn',
        'password'           => Hash::make('password123'),
        'role'               => 'super_admin',
        'status'             => 'active',
        'admin_code'         => 'ADM000000004',
        'current_session_id' => 'valid_device_token_123',
    ]);

    $response = $this->withSession(['auth_device_token_admin' => 'valid_device_token_123'])
        ->actingAs($admin, 'admin')
        ->get('/dashboard');

    $response->assertOk();
});

test('device with outdated token is kicked out to login with error message', function () {
    $admin = Admin::create([
        'username'           => 'admin_outdated_device',
        'full_name'          => 'Admin Outdated Device',
        'email'              => 'admin_outdated@sam-edu.vn',
        'password'           => Hash::make('password123'),
        'role'               => 'super_admin',
        'status'             => 'active',
        'admin_code'         => 'ADM000000002',
        'current_session_id' => 'new_device_token_999',
    ]);

    // Request from old device carrying old token
    $response = $this->withSession(['auth_device_token_admin' => 'old_device_token_111'])
        ->actingAs($admin, 'admin')
        ->get('/dashboard');

    $response->assertRedirect(route('login'));
    $response->assertSessionHasErrors(['username']);
});

test('logout clears current session id and device token', function () {
    $admin = Admin::create([
        'username'           => 'admin_logout_test',
        'full_name'          => 'Admin Logout Test',
        'email'              => 'admin_logout@sam-edu.vn',
        'password'           => Hash::make('password123'),
        'role'               => 'super_admin',
        'status'             => 'active',
        'admin_code'         => 'ADM000000003',
        'current_session_id' => 'device_token_to_logout',
    ]);

    $response = $this->withSession(['auth_device_token_admin' => 'device_token_to_logout'])
        ->actingAs($admin, 'admin')
        ->post('/logout');

    $response->assertRedirect(route('login'));

    $admin->refresh();
    expect($admin->current_session_id)->toBeNull();
});
