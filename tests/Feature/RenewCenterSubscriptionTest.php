<?php

use App\Enums\Constant;
use App\Mail\CenterSubscriptionRenewedMail;
use App\Models\Admin;
use App\Models\Center;
use App\Models\SubscriptionPlan;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(SubscriptionPlanSeeder::class);
    $this->seed(PermissionSeeder::class);
    Mail::fake();
});

test('super admin can renew current subscription plan for a center', function () {
    $oldExpiresAt = Carbon::now()->addDays(10)->startOfDay();
    $basicPlan    = SubscriptionPlan::where('code', 'basic_5')->first();

    $center = Center::create([
        'code'                 => 'CTR-TEST-RENEW-1',
        'name'                 => 'Trung tâm Test Gia Hạn 1',
        'email'                => 'center1@test.com',
        'status'               => Constant::CENTER_STATUS_ACTIVE,
        'subscription_plan_id' => $basicPlan->id,
        'plan_type'            => Constant::PLAN_TYPE_STANDARD,
        'expires_at'           => $oldExpiresAt,
        'max_students'         => 50,
        'max_classes'          => 5,
    ]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-R01',
        'username'   => 'super_admin_renew_1',
        'email'      => 'super.renew1@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Renew 1',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    $startsAt = $oldExpiresAt->toDateString();
    $endsAt   = $oldExpiresAt->copy()->addDays(30)->toDateString();

    $response = $this->actingAs($superAdmin, 'admin')->post(route('centers.renew-subscription', ['id' => $center->id]), [
        'plan_id'       => $basicPlan->id,
        'duration_days' => 30,
        'starts_at'     => $startsAt,
        'ends_at'       => $endsAt,
        'price'         => 3000000,
        'note'          => 'Gia hạn 1 tháng gói basic',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('center_subscriptions', [
        'center_id'     => $center->id,
        'plan_id'       => $basicPlan->id,
        'price'         => 3000000,
        'duration_days' => 30,
        'status'        => Constant::SUBSCRIPTION_STATUS_ACTIVE,
    ]);

    $center->refresh();
    expect($center->subscription_plan_id)->toBe($basicPlan->id);
    expect($center->expires_at->format('Y-m-d'))->toBe($endsAt);

    Mail::assertQueued(CenterSubscriptionRenewedMail::class, function ($mail) {
        return $mail->hasTo('center1@test.com') && $mail->actionType === 'renew';
    });
});

test('super admin can change subscription plan to a new plan', function () {
    $basicPlan    = SubscriptionPlan::where('code', 'basic_5')->first();
    $advancedPlan = SubscriptionPlan::where('code', 'advanced_20')->first();

    $center = Center::create([
        'code'                 => 'CTR-TEST-RENEW-2',
        'name'                 => 'Trung tâm Test Đổi Gói',
        'email'                => 'center2@test.com',
        'status'               => Constant::CENTER_STATUS_ACTIVE,
        'subscription_plan_id' => $basicPlan->id,
        'plan_type'            => Constant::PLAN_TYPE_STANDARD,
        'expires_at'           => Carbon::now()->addDays(20),
        'max_students'         => 50,
        'max_classes'          => 5,
    ]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-R02',
        'username'   => 'super_admin_renew_2',
        'email'      => 'super.renew2@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Renew 2',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    // Khi đổi sang gói mới (advanced_20), tính từ Hôm nay
    $today  = Carbon::now()->startOfDay()->toDateString();
    $endsAt = Carbon::now()->startOfDay()->addDays(90)->toDateString();

    $response = $this->actingAs($superAdmin, 'admin')->post(route('centers.renew-subscription', ['id' => $center->id]), [
        'plan_id'       => $advancedPlan->id,
        'duration_days' => 90,
        'starts_at'     => $today,
        'ends_at'       => $endsAt,
        'price'         => 12000000,
        'note'          => 'Đổi sang gói nâng cao 20 lớp',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('center_subscriptions', [
        'center_id'     => $center->id,
        'plan_id'       => $advancedPlan->id,
        'price'         => 12000000,
        'duration_days' => 90,
        'status'        => Constant::SUBSCRIPTION_STATUS_ACTIVE,
    ]);

    $center->refresh();
    expect($center->subscription_plan_id)->toBe($advancedPlan->id);
    expect($center->max_classes)->toBe(20);

    Mail::assertQueued(CenterSubscriptionRenewedMail::class, function ($mail) {
        return $mail->actionType === 'change';
    });
});

test('renewing subscription auto reactivates expired center', function () {
    $basicPlan = SubscriptionPlan::where('code', 'basic_5')->first();

    $center = Center::create([
        'code'                 => 'CTR-TEST-RENEW-3',
        'name'                 => 'Trung tâm Hết Hạn',
        'email'                => 'center3@test.com',
        'status'               => Constant::CENTER_STATUS_EXPIRED,
        'subscription_plan_id' => $basicPlan->id,
        'plan_type'            => Constant::PLAN_TYPE_STANDARD,
        'expires_at'           => Carbon::now()->subDays(5),
    ]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-R03',
        'username'   => 'super_admin_renew_3',
        'email'      => 'super.renew3@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Renew 3',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    $today  = Carbon::now()->startOfDay()->toDateString();
    $endsAt = Carbon::now()->startOfDay()->addDays(30)->toDateString();

    $response = $this->actingAs($superAdmin, 'admin')->post(route('centers.renew-subscription', ['id' => $center->id]), [
        'plan_id'       => $basicPlan->id,
        'duration_days' => 30,
        'starts_at'     => $today,
        'ends_at'       => $endsAt,
        'price'         => 3000000,
    ]);

    $response->assertRedirect();
    $center->refresh();

    $cStatus = is_object($center->status) ? $center->status->value : (int) $center->status;
    expect($cStatus)->toBe(Constant::CENTER_STATUS_ACTIVE);
});

test('super admin can renew or change plan for 1 year (365 days)', function () {
    $basicPlan = SubscriptionPlan::where('code', 'basic_5')->first();

    $center = Center::create([
        'code'                 => 'CTR-TEST-1YEAR',
        'name'                 => 'Trung tâm Test 1 Năm',
        'email'                => 'center1year@test.com',
        'status'               => Constant::CENTER_STATUS_ACTIVE,
        'subscription_plan_id' => $basicPlan->id,
        'plan_type'            => Constant::PLAN_TYPE_STANDARD,
        'expires_at'           => Carbon::now()->addDays(5),
    ]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-Y01',
        'username'   => 'super_admin_year',
        'email'      => 'super.year@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Year',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    // Gia hạn 1 năm (365 ngày) gói cũ
    $startsAt = Carbon::now()->addDays(5)->startOfDay()->toDateString();
    $endsAt   = Carbon::now()->addDays(5)->startOfDay()->addDays(365)->toDateString();

    $response = $this->actingAs($superAdmin, 'admin')->post(route('centers.renew-subscription', ['id' => $center->id]), [
        'plan_id'       => $basicPlan->id,
        'duration_days' => 365,
        'starts_at'     => $startsAt,
        'ends_at'       => $endsAt,
        'price'         => 30000000,
        'note'          => 'Gia hạn 1 năm gói cơ bản',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('center_subscriptions', [
        'center_id'     => $center->id,
        'plan_id'       => $basicPlan->id,
        'duration_days' => 365,
        'price'         => 30000000,
    ]);

    $center->refresh();
    expect($center->expires_at->format('Y-m-d'))->toBe($endsAt);
});

test('non super admin is forbidden from renewing center subscription', function () {
    $basicPlan = SubscriptionPlan::where('code', 'basic_5')->first();

    $center = Center::create([
        'code'                 => 'CTR-TEST-RENEW-4',
        'name'                 => 'Trung tâm Test Phân Quyền',
        'email'                => 'center4@test.com',
        'status'               => Constant::CENTER_STATUS_ACTIVE,
        'subscription_plan_id' => $basicPlan->id,
        'plan_type'            => Constant::PLAN_TYPE_STANDARD,
        'expires_at'           => Carbon::now()->addMonth(),
    ]);

    $subAdmin = Admin::create([
        'admin_code' => 'ADM-SUB-R04',
        'username'   => 'sub_admin_renew',
        'email'      => 'sub.renew@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Phụ',
        'role'       => Constant::ROLE_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);
    $subAdmin->centers()->sync([$center->id]);

    $today  = Carbon::now()->startOfDay()->toDateString();
    $endsAt = Carbon::now()->startOfDay()->addDays(30)->toDateString();

    $response = $this->actingAs($subAdmin, 'admin')->post(route('centers.renew-subscription', ['id' => $center->id]), [
        'plan_id'       => $basicPlan->id,
        'duration_days' => 30,
        'starts_at'     => $today,
        'ends_at'       => $endsAt,
        'price'         => 3000000,
    ]);

    $response->assertStatus(403);
});
