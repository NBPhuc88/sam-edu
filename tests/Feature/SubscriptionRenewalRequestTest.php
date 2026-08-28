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
    $centerAdmin->centers()->attach($center->id);

    $response = $this->actingAs($centerAdmin, 'admin')
        ->postJson('/api/payments/request-renewal', [
            'center_id'     => $center->id,
            'plan_code'     => 'basic_5',
            'duration_type' => 'yearly',
            'note'          => 'Vui lòng hỗ trợ gia hạn sớm',
        ]);

    $response->assertStatus(200);
    $response->assertJson(['success' => true]);

    Mail::assertQueued(CenterSubscriptionRenewalRequestedMail::class, function ($mail) use ($center) {
        return $mail->center->id === $center->id && $mail->hasTo('superadmin.target@test.com');
    });

    $this->assertDatabaseHas('payment_transactions', [
        'center_id'      => $center->id,
        'amount'         => 2400000,
        'payment_method' => 'other',
        'status'         => 'pending',
    ]);
});

test('super_admin cannot request subscription renewal', function () {
    $center = Center::create([
        'code'              => 'CTR-REQ-004',
        'name'              => 'Trung Tâm Test Super Admin Reject',
        'status'            => 'active',
        'subscription_plan' => 'basic_5',
        'expires_at'        => now()->addDays(5),
    ]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUP-98',
        'username'   => 'super_admin_test_reject',
        'email'      => 'superadmin.reject@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Reject',
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    $response = $this->actingAs($superAdmin, 'admin')
        ->postJson('/api/payments/request-renewal', [
            'center_id' => $center->id,
            'plan_code' => 'basic_5',
        ]);

    $response->assertStatus(403);
});

test('center admin cannot request renewal for unassigned center', function () {
    $center1 = Center::create([
        'code'   => 'CTR-REQ-005',
        'name'   => 'Trung Tâm 1',
        'status' => 'active',
    ]);
    $center2 = Center::create([
        'code'   => 'CTR-REQ-006',
        'name'   => 'Trung Tâm 2',
        'status' => 'active',
    ]);

    $centerAdmin = Admin::create([
        'admin_code' => 'ADM-CTR-02',
        'username'   => 'center_admin_unassigned',
        'email'      => 'center.admin.unassigned@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Center Admin Unassigned',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $centerAdmin->centers()->attach($center1->id);

    $response = $this->actingAs($centerAdmin, 'admin')
        ->postJson('/api/payments/request-renewal', [
            'center_id' => $center2->id,
            'plan_code' => 'basic_5',
        ]);

    $response->assertStatus(403);
});

test('center admin can request renewal with monthly duration and calculate monthly price', function () {
    $center = Center::create([
        'code'              => 'CTR-REQ-007',
        'name'              => 'Trung Tâm Monthly Renewal',
        'status'            => 'active',
        'subscription_plan' => 'basic_5',
        'expires_at'        => now()->addDays(5),
    ]);

    $centerAdmin = Admin::create([
        'admin_code' => 'ADM-CTR-03',
        'username'   => 'center_admin_monthly',
        'email'      => 'center.admin.monthly@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Center Admin Monthly',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $centerAdmin->centers()->attach($center->id);

    $response = $this->actingAs($centerAdmin, 'admin')
        ->postJson('/api/payments/request-renewal', [
            'center_id'     => $center->id,
            'plan_code'     => 'basic_5',
            'duration_type' => 'monthly',
            'note'          => 'Gia hạn 1 tháng',
        ]);

    $response->assertStatus(200);
    $response->assertJson(['success' => true]);

    $this->assertDatabaseHas('payment_transactions', [
        'center_id'      => $center->id,
        'amount'         => 250000,
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
