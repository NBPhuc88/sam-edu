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

test('basic plan center is blocked from exams and csv export', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-BASIC',
        'name'              => 'Trung tâm Test Basic',
        'status'            => 'active',
        'subscription_plan' => 'basic_5',
        'plan_type'         => 'basic',
        'expires_at'        => Carbon::now()->addMonths(6),
    ]);

    $admin = Admin::create([
        'admin_code' => 'ADM-TEST-01',
        'username'   => 'admin_test_basic',
        'email'      => 'admin.basic@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Test Basic',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $admin->centers()->sync([$center->id]);

    // Truy cập kho đề thi (bị chặn bởi middleware CheckPlanFeature)
    $response = $this->actingAs($admin, 'admin')->get(route('exams.index'));
    $response->assertStatus(403);

    // Xuất CSV giáo viên (bị chặn bởi middleware CheckPlanFeature)
    $csvResponse = $this->actingAs($admin, 'admin')->get(route('teachers.export'));
    $csvResponse->assertStatus(403);
});

test('advanced plan center can access exams', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-ADV',
        'name'              => 'Trung tâm Test Advanced',
        'status'            => 'active',
        'subscription_plan' => 'advanced_20',
        'plan_type'         => 'advanced',
        'expires_at'        => Carbon::now()->addMonths(6),
    ]);

    $admin = Admin::create([
        'admin_code' => 'ADM-TEST-02',
        'username'   => 'admin_test_adv',
        'email'      => 'admin.adv@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Test Adv',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $admin->centers()->sync([$center->id]);

    $response = $this->actingAs($admin, 'admin')->get(route('exams.index'));
    $response->assertOk();
});

test('trial center has access to full features', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-TRIAL',
        'name'              => 'Trung tâm Test Trial',
        'status'            => 'active',
        'subscription_plan' => 'trial',
        'plan_type'         => 'trial',
        'expires_at'        => Carbon::now()->addDays(20),
    ]);

    $admin = Admin::create([
        'admin_code' => 'ADM-TEST-03',
        'username'   => 'admin_test_trial',
        'email'      => 'admin.trial@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Test Trial',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $admin->centers()->sync([$center->id]);

    $response = $this->actingAs($admin, 'admin')->get(route('exams.index'));
    $response->assertOk();
});

test('expired center is completely blocked', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-EXP',
        'name'              => 'Trung tâm Test Expired',
        'status'            => 'active',
        'subscription_plan' => 'advanced_20',
        'plan_type'         => 'advanced',
        'expires_at'        => Carbon::now()->subDay(),
    ]);

    $admin = Admin::create([
        'admin_code' => 'ADM-TEST-04',
        'username'   => 'admin_test_exp',
        'email'      => 'admin.exp@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Test Exp',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $admin->centers()->sync([$center->id]);

    $response = $this->actingAs($admin, 'admin')->get(route('teachers.index'));
    $response->assertStatus(403);
});

test('holiday management is restricted to super admin only', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-HOLIDAY',
        'name'              => 'Trung tâm Test Holiday',
        'status'            => 'active',
        'subscription_plan' => 'advanced_20',
        'plan_type'         => 'advanced',
        'expires_at'        => Carbon::now()->addMonths(6),
    ]);

    $subAdmin = Admin::create([
        'admin_code' => 'ADM-TEST-SUB',
        'username'   => 'admin_test_sub',
        'email'      => 'admin.sub@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Phụ',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $subAdmin->centers()->sync([$center->id]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-HOLIDAY',
        'username'   => 'super_admin_holiday',
        'email'      => 'super.holiday@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Holiday',
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    // Admin phụ không có quyền truy cập Ngày lễ (bị chặn bởi AutoCheckPermission ẩn trang với mã 404)
    $responseSub = $this->actingAs($subAdmin, 'admin')->get(route('holidays.index'));
    $responseSub->assertStatus(404);

    // Super Admin truy cập Ngày lễ bình thường
    $responseSuper = $this->actingAs($superAdmin, 'admin')->get(route('holidays.index'));
    $responseSuper->assertOk();
});
