<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\SubscriptionPlan;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(SubscriptionPlanSeeder::class);
    $this->seed(PermissionSeeder::class);
});

test('requesting renewal creates notification for super admins', function () {
    Event::fake();

    $basicPlan = SubscriptionPlan::where('code', 'basic_5')->first();

    $center = Center::create([
        'code'                 => 'CTR-NOTIF-01',
        'name'                 => 'Trung Tâm Test Notification',
        'status'               => Constant::CENTER_STATUS_ACTIVE,
        'subscription_plan_id' => $basicPlan->id,
        'expires_at'           => now()->addDays(3),
    ]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUP-88',
        'username'   => 'super_admin_notif_test',
        'email'      => 'superadmin.notif@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Notif Test',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    $centerAdmin = Admin::create([
        'admin_code' => 'ADM-CTR-88',
        'username'   => 'center_admin_notif_test',
        'email'      => 'centeradmin.notif@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Center Admin Notif Test',
        'role'       => Constant::ROLE_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);
    $centerAdmin->centers()->attach($center->id);

    $response = $this->actingAs($centerAdmin, 'admin')
        ->postJson('/api/payments/request-renewal', [
            'center_id'     => $center->id,
            'plan_id'       => $basicPlan->id,
            'duration_type' => 'yearly',
        ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('notifications', [
        'center_id' => $center->id,
    ]);

    $notification = Notification::where('center_id', $center->id)->first();
    expect($notification)->not->toBeNull();

    $this->assertDatabaseHas('notification_recipients', [
        'notification_id' => $notification->id,
        'recipient_id'    => $superAdmin->id,
        'read_at'         => null,
    ]);
});

test('super admin can fetch notifications and mark them as read', function () {
    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUP-87',
        'username'   => 'super_admin_fetch_test',
        'email'      => 'superadmin.fetch@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Fetch Test',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    $notification = Notification::create([
        'title'   => 'Thông báo test',
        'content' => 'Nội dung thông báo test',
        'type'    => 'subscription_renewal',
    ]);

    $recipient = NotificationRecipient::create([
        'notification_id' => $notification->id,
        'recipient_type'  => Constant::ACCOUNT_TYPE_ADMIN,
        'recipient_id'    => $superAdmin->id,
        'read_at'         => null,
    ]);

    $response = $this->actingAs($superAdmin, 'admin')
        ->getJson('/api/notifications');

    $response->assertStatus(200);
    $response->assertJson(['success' => true, 'unread_count' => 1]);

    $readResponse = $this->actingAs($superAdmin, 'admin')
        ->patchJson("/api/notifications/{$recipient->id}/read");

    $readResponse->assertStatus(200);
    $readResponse->assertJson(['success' => true, 'unread_count' => 0]);

    $this->assertDatabaseHas('notification_recipients', [
        'id'      => $recipient->id,
        'read_at' => now(),
    ]);
});

test('registering a new center creates notification and broadcasts event for super admins', function () {
    Event::fake();

    $trialPlan = SubscriptionPlan::where('plan_type', Constant::PLAN_TYPE_FREE)->first() ?? SubscriptionPlan::first();

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUP-99',
        'username'   => 'super_admin_reg_notif_test',
        'email'      => 'superadmin.reg@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Reg Test',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    $response = $this->postJson('/register-center/step1', [
        'name'                 => 'Trung Tâm Tin Học New Test',
        'phone'                => '0987654321',
        'email'                => 'newcenter@test.com',
        'address'              => '123 Đường Test, Hà Nội',
        'subscription_plan_id' => $trialPlan->id,
        'payment_method'       => Constant::PAYMENT_METHOD_ZALOPAY,
    ]);

    $response->assertStatus(200);

    $notification = Notification::latest('id')->first();
    expect($notification)->not->toBeNull();

    $this->assertDatabaseHas('notification_recipients', [
        'notification_id' => $notification->id,
        'recipient_id'    => $superAdmin->id,
        'read_at'         => null,
    ]);

    Event::assertDispatched(\App\Events\CenterRegisteredEvent::class);
});
