<?php

use App\Mail\EmailChangedMail;
use App\Mail\UsernameChangedMail;
use App\Models\Admin;
use App\Models\Center;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    Mail::fake();
});

test('updating admin email or username or password triggers correct queued mail', function () {
    $center = Center::create([
        'name'        => 'Trung tâm Test',
        'code'        => 'CTR000000001',
        'status'      => 'active',
        'email'       => 'center@sam-edu.vn',
        'phone'       => '0901234567',
        'address'     => '123 Test St',
        'max_classes' => 10,
    ]);

    $superAdmin = Admin::create([
        'username'   => 'super_admin_test',
        'full_name'  => 'Super Admin Test',
        'email'      => 'super_admin@sam-edu.vn',
        'password'   => 'password123',
        'role'       => 'super_admin',
        'admin_code' => 'ADM000000001',
    ]);

    $subAdmin = Admin::create([
        'username'   => 'sub_admin_old',
        'full_name'  => 'Sub Admin Old',
        'email'      => 'sub_admin_old@sam-edu.vn',
        'password'   => 'password123',
        'role'       => 'admin',
        'admin_code' => 'ADM000000002',
    ]);

    // 1. Update Username
    $response = $this->actingAs($superAdmin, 'admin')->patch("/admins/{$subAdmin->id}", [
        'full_name' => 'Sub Admin Old',
        'username'  => 'sub_admin_new',
        'email'     => 'sub_admin_old@sam-edu.vn',
        'role'      => 'admin',
        'center_id' => $center->id,
    ]);

    $response->assertSessionHas('success');
    Mail::assertQueued(UsernameChangedMail::class, function ($mail) {
        return $mail->hasTo('sub_admin_old@sam-edu.vn')
            && $mail->oldUsername === 'sub_admin_old'
            && $mail->newUsername === 'sub_admin_new';
    });

    // 2. Update Email
    $response2 = $this->actingAs($superAdmin, 'admin')->patch("/admins/{$subAdmin->id}", [
        'full_name' => 'Sub Admin Old',
        'username'  => 'sub_admin_new',
        'email'     => 'sub_admin_new@sam-edu.vn',
        'role'      => 'admin',
        'center_id' => $center->id,
    ]);

    $response2->assertSessionHas('success');
    Mail::assertQueued(EmailChangedMail::class, function ($mail) {
        return $mail->hasTo('sub_admin_new@sam-edu.vn')
            && $mail->oldEmail === 'sub_admin_old@sam-edu.vn'
            && $mail->newEmail === 'sub_admin_new@sam-edu.vn';
    });
});
