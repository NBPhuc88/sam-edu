<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    Artisan::call('db:seed', ['--class' => 'SubscriptionPlanSeeder']);
});

test('requesting renewal creates notification for super admins', function () {
    Event::fake();

    $center = Center::create([
        'code'              => 'CTR-NOTIF-01',
        'name'              => 'Trung Tâm Test Notification',
        'status'            => 'active',
        'subscription_plan' => 'basic_5',
        'expires_at'        => now()->addDays(3),
    ]);

    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUP-88',
        'username'   => 'super_admin_notif_test',
        'email'      => 'superadmin.notif@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Notif Test',
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    $centerAdmin = Admin::create([
        'admin_code' => 'ADM-CTR-88',
        'username'   => 'center_admin_notif_test',
        'email'      => 'centeradmin.notif@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Center Admin Notif Test',
        'role'       => 'admin',
        'status'     => 'active',
    ]);
    $centerAdmin->centers()->attach($center->id);

    $response = $this->actingAs($centerAdmin, 'admin')
        ->postJson('/api/payments/request-renewal', [
            'center_id'     => $center->id,
            'plan_code'     => 'basic_5',
            'duration_type' => 'yearly',
        ]);

    $response->assertStatus(200);

    $this->assertDatabaseHas('notifications', [
        'center_id' => $center->id,
        'type'      => 'subscription_renewal',
    ]);

    $notification = Notification::where('center_id', $center->id)->first();
    expect($notification)->not->toBeNull();

    $this->assertDatabaseHas('notification_recipients', [
        'notification_id' => $notification->id,
        'recipient_type'  => 'admin',
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
        'role'       => 'super_admin',
        'status'     => 'active',
    ]);

    $notification = Notification::create([
        'title'   => 'Thông báo test',
        'content' => 'Nội dung thông báo test',
        'type'    => 'subscription_renewal',
    ]);

    $recipient = NotificationRecipient::create([
        'notification_id' => $notification->id,
        'recipient_type'  => 'admin',
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
