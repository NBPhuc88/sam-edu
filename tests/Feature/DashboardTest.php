<?php

use App\Models\Admin;
use App\Models\Center;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    Artisan::call('db:seed', ['--class' => 'SubscriptionPlanSeeder']);
    Artisan::call('db:seed', ['--class' => 'PermissionSeeder']);
});

test('super admin can access dashboard without errors', function () {
    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-01',
        'username'   => 'super_admin_test',
        'email'      => 'superadmin@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Test',
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    Center::create([
        'code'              => 'CTR-TEST-01',
        'name'              => 'Trung tâm Alpha',
        'status'            => 'active',
        'subscription_plan' => 'trial',
        'plan_type'         => 'trial',
        'expires_at'        => Carbon::now()->addDays(14),
    ]);

    $response = $this->actingAs($superAdmin, 'admin')->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
        ->component('Dashboard')
        ->has('registration_pie_chart')
        ->has('monthly_registrations_bar_chart')
        ->has('non_renewed_pie_chart')
        ->has('stats')
    );
});

test('student can access dashboard with monthly schedule', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-02',
        'name'              => 'Trung tâm Beta',
        'status'            => 'active',
        'subscription_plan' => 'trial',
        'plan_type'         => 'trial',
        'expires_at'        => Carbon::now()->addDays(14),
    ]);

    $student = \App\Models\Student::create([
        'center_id'    => $center->id,
        'student_code' => 'STD-TEST-01',
        'username'     => 'student_test',
        'first_name'   => 'Test',
        'last_name'    => 'Student',
        'full_name'    => 'Student Test',
        'email'        => 'student@test.com',
        'password'     => Hash::make('password'),
        'status'       => 1,
    ]);

    $response = $this->actingAs($student, 'student')->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
        ->component('Dashboard')
        ->where('role', 'student')
        ->has('monthly_schedule')
        ->has('monthly_schedule.days')
        ->has('stats')
        ->has('exam_results')
    );
});
