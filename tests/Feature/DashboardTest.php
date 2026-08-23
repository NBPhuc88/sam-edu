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
