<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Services\Statistic\StatisticService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->service = app(StatisticService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test StatisticService',
        'status' => Constant::STATUS_ACTIVE,
    ]);
});

test('getStatisticData returns forbidden true when student accesses statistics', function () {
    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_stat_test',
        'first_name'   => 'Student',
        'last_name'    => 'Stat',
        'full_name'    => 'Student Stat Test',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    Auth::guard('student')->login($student);

    $data = $this->service->getStatisticData();

    expect($data['forbidden'])->toBeTrue();
});

test('getStatisticData returns center and class stats for super admin', function () {
    $superAdmin = Admin::create([
        'username'   => 'super_admin_stat',
        'full_name'  => 'Super Admin Stat',
        'password'   => Hash::make('password123'),
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);

    Auth::guard('admin')->login($superAdmin);

    $data = $this->service->getStatisticData();

    expect($data['forbidden'])->toBeFalse()
        ->and($data['isSuperAdmin'])->toBeTrue()
        ->and($data)->toHaveKeys(['centerStats', 'classStats', 'classChartStats']);
});
