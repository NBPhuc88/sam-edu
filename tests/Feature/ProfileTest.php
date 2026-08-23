<?php

use App\Models\Admin;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    Mail::fake();
});

test('user can view profile page', function () {
    $admin = Admin::create([
        'username'   => 'test_admin_profile',
        'full_name'  => 'Test Admin Profile',
        'email'      => 'admin_profile@sam-edu.vn',
        'password'   => 'password123',
        'role'       => 'admin',
        'admin_code' => 'ADM000000099',
    ]);

    $response = $this->actingAs($admin, 'admin')->get('/profile');

    $response->assertStatus(200);
    $response->assertInertia(
        fn ($page) => $page
        ->component('Profile/Index')
        ->has('profile.username')
        ->where('profile.username', 'test_admin_profile')
    );
});

test('user can send password change otp with 5 minutes expiry', function () {
    $admin = Admin::create([
        'username'   => 'test_admin_otp',
        'full_name'  => 'Test Admin Otp',
        'email'      => 'admin_otp@sam-edu.vn',
        'password'   => 'password123',
        'role'       => 'admin',
        'admin_code' => 'ADM000000098',
    ]);

    $response = $this->actingAs($admin, 'admin')->post('/profile/password/send-otp');

    $response->assertSessionHas('success');

    $otpRecord = DB::table('account_verification_otps')
        ->where('email', 'admin_otp@sam-edu.vn')
        ->where('action', 'change_password')
        ->first();

    expect($otpRecord)->not->toBeNull();
    expect(strtotime($otpRecord->expires_at))->toBeGreaterThan(time() + 280); // ~5 minutes
});

test('user can update password with valid otp and is rejected with expired otp', function () {
    $admin = Admin::create([
        'username'   => 'test_admin_pass',
        'full_name'  => 'Test Admin Pass',
        'email'      => 'admin_pass@sam-edu.vn',
        'password'   => 'old_password123',
        'role'       => 'admin',
        'admin_code' => 'ADM000000097',
    ]);

    // Create an expired OTP (expired 1 minute ago)
    DB::table('account_verification_otps')->insert([
        'user_type'  => 'admin',
        'user_id'    => $admin->id,
        'email'      => 'admin_pass@sam-edu.vn',
        'action'     => 'change_password',
        'otp_hash'   => Hash::make('123456'),
        'expires_at' => now()->subMinute(),
        'created_at' => now()->subMinutes(6),
    ]);

    $expiredResponse = $this->actingAs($admin, 'admin')->post('/profile/password/update', [
        'current_password'      => 'old_password123',
        'password'              => 'new_password123',
        'password_confirmation' => 'new_password123',
        'otp'                   => '123456',
    ]);

    $expiredResponse->assertSessionHas('error');

    // Create a valid OTP
    DB::table('account_verification_otps')
        ->where('email', 'admin_pass@sam-edu.vn')
        ->delete();

    DB::table('account_verification_otps')->insert([
        'user_type'  => 'admin',
        'user_id'    => $admin->id,
        'email'      => 'admin_pass@sam-edu.vn',
        'action'     => 'change_password',
        'otp_hash'   => Hash::make('654321'),
        'expires_at' => now()->addMinutes(5),
        'created_at' => now(),
    ]);

    $validResponse = $this->actingAs($admin, 'admin')->post('/profile/password/update', [
        'current_password'      => 'old_password123',
        'password'              => 'new_password123',
        'password_confirmation' => 'new_password123',
        'otp'                   => '654321',
    ]);

    $validResponse->assertSessionHas('success');

    $admin->refresh();
    expect(Hash::check('new_password123', $admin->password))->toBeTrue();
});

test('user can complete 2-step email change verification', function () {
    $admin = Admin::create([
        'username'   => 'test_admin_email',
        'full_name'  => 'Test Admin Email',
        'email'      => 'old_email@sam-edu.vn',
        'password'   => 'password123',
        'role'       => 'admin',
        'admin_code' => 'ADM000000096',
    ]);

    // Step 1: Send OTP to old email
    $this->actingAs($admin, 'admin')->post('/profile/email/send-old-otp', [
        'current_password' => 'password123',
    ])->assertSessionHas('success');

    // Seed Step 1 OTP
    DB::table('account_verification_otps')
        ->where('email', 'old_email@sam-edu.vn')
        ->update(['otp_hash' => Hash::make('111222')]);

    // Verify Step 1
    $this->actingAs($admin, 'admin')->post('/profile/email/verify-old-otp', [
        'otp' => '111222',
    ])->assertSessionHas('success');

    // Step 2: Send OTP to new email
    $this->actingAs($admin, 'admin')->post('/profile/email/send-new-otp', [
        'new_email' => 'new_valid_email@sam-edu.vn',
    ])->assertSessionHas('success');

    // Seed Step 2 OTP
    DB::table('account_verification_otps')
        ->where('email', 'new_valid_email@sam-edu.vn')
        ->update(['otp_hash' => Hash::make('333444')]);

    // Finalize email change
    $this->actingAs($admin, 'admin')->post('/profile/email/update', [
        'new_email' => 'new_valid_email@sam-edu.vn',
        'otp'       => '333444',
    ])->assertSessionHas('success');

    $admin->refresh();
    expect($admin->email)->toBe('new_valid_email@sam-edu.vn');
});
