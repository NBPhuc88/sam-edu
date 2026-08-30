<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(SubscriptionPlanSeeder::class);
    $this->seed(PermissionSeeder::class);
});

test('super admin can access dashboard without errors', function () {
    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-01',
        'username'   => 'super_admin_test',
        'email'      => 'superadmin@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Test',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    Center::create([
        'code'              => 'CTR-TEST-01',
        'name'              => 'Trung tâm Alpha',
        'status'            => Constant::STATUS_ACTIVE,
        'subscription_plan' => 'trial',
        'plan_type'         => Constant::PLAN_TYPE_FREE,
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
        'status'            => Constant::STATUS_ACTIVE,
        'subscription_plan' => 'trial',
        'plan_type'         => Constant::PLAN_TYPE_FREE,
        'expires_at'        => Carbon::now()->addDays(14),
    ]);

    $student = Student::create([
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

test('center admin can access dashboard with today sessions, alert stats, tuition bar chart, and class status pie chart', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-03',
        'name'              => 'Trung tâm Gamma',
        'status'            => Constant::STATUS_ACTIVE,
        'subscription_plan' => 'trial',
        'plan_type'         => Constant::PLAN_TYPE_FREE,
        'expires_at'        => Carbon::now()->addDays(14),
    ]);

    $centerAdmin = Admin::create([
        'admin_code' => 'ADM-CTR-03',
        'username'   => 'center_admin_test',
        'email'      => 'centeradmin@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Center Admin Test',
        'role'       => Constant::ROLE_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);
    $centerAdmin->centers()->attach($center->id);

    $response = $this->actingAs($centerAdmin, 'admin')->get(route('dashboard'));

    $response->assertOk();
    $response->assertInertia(
        fn ($page) => $page
        ->component('Dashboard')
        ->where('role', 'admin')
        ->has('today_sessions')
        ->has('alert_stats')
        ->has('tuition_bar_chart')
        ->has('class_status_pie')
        ->has('teachers_bar_chart')
        ->has('students_bar_chart')
        ->has('classes_bar_chart')
        ->has('stats')
        ->where('stats.active_classes', 0)
    );
});
