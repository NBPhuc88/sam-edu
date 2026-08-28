<?php

use App\Mail\CenterSubscriptionRenewalRequestedMail;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    Artisan::call('db:seed', ['--class' => 'SubscriptionPlanSeeder']);
    Mail::fake();
});

test('admin can request subscription renewal and queue email to super admin', function () {
    $center = Center::create([
        'code'              => 'CTR-REQ-001',
        'name'              => 'Trung Tâm Test Yêu Cầu Gia Hạn',
        'email'             => 'center.req@test.com',
        'phone'             => '0901234567',
        'status'            => 'active',
        'subscription_plan' => 'basic_5',
        'plan_type'         => 'basic',
        'expires_at'        => now()->addDays(5),
    ]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUP-99',
        'username'   => 'super_admin_test_req',
        'email'      => 'superadmin.target@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Target',
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    $centerAdmin = Admin::create([
        'admin_code' => 'ADM-CTR-01',
        'username'   => 'center_admin_req',
        'email'      => 'center.admin.req@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Center Admin Req',
        'role'       => 'admin',
        'status'     => 'active',
    ]);

    $response = $this->actingAs($centerAdmin, 'admin')
        ->postJson('/api/payments/request-renewal', [
            'center_id' => $center->id,
            'plan_code' => 'basic_5',
            'note'      => 'Vui lòng hỗ trợ gia hạn sớm',
        ]);

    $response->assertStatus(200);
    $response->assertJson(['success' => true]);

    Mail::assertQueued(CenterSubscriptionRenewalRequestedMail::class, function ($mail) use ($center) {
        return $mail->center->id === $center->id && $mail->hasTo('superadmin.target@test.com');
    });

    $this->assertDatabaseHas('payment_transactions', [
        'center_id'      => $center->id,
        'payment_method' => 'other',
        'status'         => 'pending',
    ]);
});

test('teacher cannot request subscription renewal', function () {
    $center = Center::create([
        'code'              => 'CTR-REQ-002',
        'name'              => 'Trung Tâm Test Teacher',
        'status'            => 'active',
        'subscription_plan' => 'basic_5',
        'expires_at'        => now()->addDays(5),
    ]);

    $teacher = Teacher::create([
        'teacher_code' => 'GV0000099',
        'first_name'   => 'Test',
        'last_name'    => 'Teacher',
        'username'     => 'teacher_test_req',
        'full_name'    => 'Teacher Test',
        'email'        => 'teacher@test.com',
        'password'     => Hash::make('password'),
        'center_id'    => $center->id,
        'status'       => 'active',
    ]);

    $response = $this->actingAs($teacher, 'teacher')
        ->postJson('/api/payments/request-renewal', [
            'center_id' => $center->id,
            'plan_code' => 'basic_5',
        ]);

    $response->assertStatus(403);
});

test('student cannot request subscription renewal', function () {
    $center = Center::create([
        'code'              => 'CTR-REQ-003',
        'name'              => 'Trung Tâm Test Student',
        'status'            => 'active',
        'subscription_plan' => 'basic_5',
        'expires_at'        => now()->addDays(5),
    ]);

    $student = Student::create([
        'student_code' => 'HS0000099',
        'first_name'   => 'Test',
        'last_name'    => 'Student',
        'username'     => 'student_test_req',
        'full_name'    => 'Student Test',
        'email'        => 'student@test.com',
        'password'     => Hash::make('password'),
        'center_id'    => $center->id,
        'status'       => 1,
    ]);

    $response = $this->actingAs($student, 'student')
        ->postJson('/api/payments/request-renewal', [
            'center_id' => $center->id,
            'plan_code' => 'basic_5',
        ]);

    $response->assertStatus(403);
});
