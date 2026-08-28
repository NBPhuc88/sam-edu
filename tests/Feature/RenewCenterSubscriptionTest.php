<?php

use App\Mail\CenterSubscriptionRenewedMail;
use App\Models\Admin;
use App\Models\Center;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

beforeEach(function () {
    Artisan::call('db:seed', ['--class' => 'SubscriptionPlanSeeder']);
    Artisan::call('db:seed', ['--class' => 'PermissionSeeder']);
    Mail::fake();
});

test('super admin can renew current subscription plan for a center', function () {
    $oldExpiresAt = Carbon::now()->addDays(10)->startOfDay();

    $center = Center::create([
        'code'              => 'CTR-TEST-RENEW-1',
        'name'              => 'Trung tâm Test Gia Hạn 1',
        'email'             => 'center1@test.com',
        'status'            => 'active',
        'subscription_plan' => 'basic_5',
        'plan_type'         => 'basic',
        'expires_at'        => $oldExpiresAt,
        'max_students'      => 50,
        'max_classes'       => 5,
    ]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-R01',
        'username'   => 'super_admin_renew_1',
        'email'      => 'super.renew1@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Renew 1',
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    $startsAt = $oldExpiresAt->toDateString();
    $endsAt   = $oldExpiresAt->copy()->addDays(30)->toDateString();

    $response = $this->actingAs($superAdmin, 'admin')->post(route('centers.renew-subscription', ['id' => $center->id]), [
        'plan_code'     => 'basic_5',
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
        'plan_code'     => 'basic_5',
        'price'         => 3000000,
        'duration_days' => 30,
        'status'        => 'active',
    ]);

    $center->refresh();
    expect($center->subscription_plan)->toBe('basic_5');
    expect($center->expires_at->format('Y-m-d'))->toBe($endsAt);

    Mail::assertQueued(CenterSubscriptionRenewedMail::class, function ($mail) use ($center) {
        return $mail->hasTo('center1@test.com') && $mail->actionType === 'renew';
    });
});

test('super admin can change subscription plan to a new plan', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-RENEW-2',
        'name'              => 'Trung tâm Test Đổi Gói',
        'email'             => 'center2@test.com',
        'status'            => 'active',
        'subscription_plan' => 'basic_5',
        'plan_type'         => 'basic',
        'expires_at'        => Carbon::now()->addDays(20),
        'max_students'      => 50,
        'max_classes'       => 5,
    ]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-R02',
        'username'   => 'super_admin_renew_2',
        'email'      => 'super.renew2@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Renew 2',
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    // Khi đổi sang gói mới (advanced_20), tính từ Hôm nay
    $today  = Carbon::now()->startOfDay()->toDateString();
    $endsAt = Carbon::now()->startOfDay()->addDays(90)->toDateString();

    $response = $this->actingAs($superAdmin, 'admin')->post(route('centers.renew-subscription', ['id' => $center->id]), [
        'plan_code'     => 'advanced_20',
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
        'plan_code'     => 'advanced_20',
        'price'         => 12000000,
        'duration_days' => 90,
        'status'        => 'active',
    ]);

    $center->refresh();
    expect($center->subscription_plan)->toBe('advanced_20');
    expect($center->plan_type)->toBe('advanced');
    expect($center->max_classes)->toBe(20);

    Mail::assertQueued(CenterSubscriptionRenewedMail::class, function ($mail) {
        return $mail->actionType === 'change';
    });
});

test('renewing subscription auto reactivates expired center', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-RENEW-3',
        'name'              => 'Trung tâm Hết Hạn',
        'email'             => 'center3@test.com',
        'status'            => 'expired',
        'subscription_plan' => 'basic_5',
        'plan_type'         => 'basic',
        'expires_at'        => Carbon::now()->subDays(5),
    ]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-R03',
        'username'   => 'super_admin_renew_3',
        'email'      => 'super.renew3@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Renew 3',
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    $today  = Carbon::now()->startOfDay()->toDateString();
    $endsAt = Carbon::now()->startOfDay()->addDays(30)->toDateString();

    $response = $this->actingAs($superAdmin, 'admin')->post(route('centers.renew-subscription', ['id' => $center->id]), [
        'plan_code'     => 'basic_5',
        'duration_days' => 30,
        'starts_at'     => $today,
        'ends_at'       => $endsAt,
        'price'         => 3000000,
    ]);

    $response->assertRedirect();
    $center->refresh();

    expect($center->status)->toBe('active');
});

test('super admin can renew or change plan for 1 year (365 days)', function () {
    $center = Center::create([
        'code'              => 'CTR-TEST-1YEAR',
        'name'              => 'Trung tâm Test 1 Năm',
        'email'             => 'center1year@test.com',
        'status'            => 'active',
        'subscription_plan' => 'basic_5',
        'plan_type'         => 'basic',
        'expires_at'        => Carbon::now()->addDays(5),
    ]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUPER-Y01',
        'username'   => 'super_admin_year',
        'email'      => 'super.year@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Year',
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    // Gia hạn 1 năm (365 ngày) gói cũ
    $startsAt = Carbon::now()->addDays(5)->startOfDay()->toDateString();
    $endsAt   = Carbon::now()->addDays(5)->startOfDay()->addDays(365)->toDateString();

    $response = $this->actingAs($superAdmin, 'admin')->post(route('centers.renew-subscription', ['id' => $center->id]), [
        'plan_code'     => 'basic_5',
        'duration_days' => 365,
        'starts_at'     => $startsAt,
        'ends_at'       => $endsAt,
        'price'         => 30000000,
        'note'          => 'Gia hạn 1 năm gói cơ bản',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('center_subscriptions', [
        'center_id'     => $center->id,
        'plan_code'     => 'basic_5',
        'duration_days' => 365,
        'price'         => 30000000,
    ]);

    $center->refresh();
    expect($center->expires_at->format('Y-m-d'))->toBe($endsAt);
});

test('non super admin is forbidden from renewing center subscription', function () {

    $center = Center::create([
        'code'              => 'CTR-TEST-RENEW-4',
        'name'              => 'Trung tâm Test Phân Quyền',
        'email'             => 'center4@test.com',
        'status'            => 'active',
        'subscription_plan' => 'basic_5',
        'plan_type'         => 'basic',
        'expires_at'        => Carbon::now()->addMonth(),
    ]);

    $subAdmin = Admin::create([
        'admin_code' => 'ADM-SUB-R04',
        'username'   => 'sub_admin_renew',
        'email'      => 'sub.renew@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Admin Phụ',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $subAdmin->centers()->sync([$center->id]);

    $today  = Carbon::now()->startOfDay()->toDateString();
    $endsAt = Carbon::now()->startOfDay()->addDays(30)->toDateString();

    $response = $this->actingAs($subAdmin, 'admin')->post(route('centers.renew-subscription', ['id' => $center->id]), [
        'plan_code'     => 'basic_5',
        'duration_days' => 30,
        'starts_at'     => $today,
        'ends_at'       => $endsAt,
        'price'         => 3000000,
    ]);

    $response->assertStatus(403);
});
