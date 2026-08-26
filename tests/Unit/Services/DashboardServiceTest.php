<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\Teacher;
use App\Services\Dashboard\DashboardService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(DashboardService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test DashboardService',
        'status' => 'active',
    ]);
});

test('getDashboardData returns super_admin stats and pie charts when logged in as super admin', function () {
    $superAdmin = Admin::create([
        'username'   => 'super_admin_dash',
        'full_name'  => 'Super Admin Dash',
        'password'   => Hash::make('password123'),
        'role'       => 'super_admin',
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    Auth::guard('admin')->login($superAdmin);

    $data = $this->service->getDashboardData();

    expect($data['role'])->toBe('super_admin');
    expect($data)->toHaveKeys(['registration_pie_chart', 'monthly_registrations_bar_chart', 'recent_centers', 'stats']);
    expect($data['stats'])->toHaveKeys(['centers', 'students', 'teachers', 'classes']);
});

test('getDashboardData returns teacher weekly schedule when logged in as teacher', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_dash',
        'first_name'   => 'Teacher',
        'last_name'    => 'Dash',
        'full_name'    => 'Teacher Dash',
        'password'     => Hash::make('password123'),
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'status'       => 'active',
    ]);

    Auth::guard('teacher')->login($teacher);

    $data = $this->service->getDashboardData();

    expect($data['role'])->toBe('teacher');
    expect($data)->toHaveKeys(['weekly_schedule', 'monthly_schedule', 'stats']);
});
