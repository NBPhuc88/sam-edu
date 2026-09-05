<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\SchoolClass;
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

test('authenticated user can view notifications page with pagination and filters', function () {
    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUP-95',
        'username'   => 'super_admin_page_test',
        'email'      => 'superadmin.page@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Page Test',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    for ($i = 1; $i <= 20; $i++) {
        $notif = Notification::create([
            'title'   => "Thông báo số {$i}",
            'content' => "Nội dung thông báo số {$i}",
            'type'    => Constant::NOTIFICATION_TYPE_GENERAL,
        ]);

        NotificationRecipient::create([
            'notification_id' => $notif->id,
            'recipient_type'  => Constant::RECIPIENT_TYPE_ADMIN,
            'recipient_id'    => $superAdmin->id,
            'read_at'         => $i <= 5 ? now() : null,
        ]);
    }

    $response = $this->actingAs($superAdmin, 'admin')
        ->get('/notifications');

    $response->assertStatus(200);
    $response->assertInertia(
        fn ($page) => $page
        ->component('Admin/Notifications/Index')
        ->has('notifications.data', 15)
        ->where('notifications.total', 20)
        ->where('unread_count', 15)
    );

    // Test filter: unread only (is_read = 2)
    $unreadResponse = $this->actingAs($superAdmin, 'admin')
        ->get('/notifications?is_read=2');

    $unreadResponse->assertStatus(200);
    $unreadResponse->assertInertia(
        fn ($page) => $page
        ->component('Admin/Notifications/Index')
        ->where('notifications.total', 15)
    );
});

test('user can mark all notifications as read via web endpoint', function () {
    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUP-94',
        'username'   => 'super_admin_mark_all_test',
        'email'      => 'superadmin.markall@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Mark All Test',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    for ($i = 1; $i <= 3; $i++) {
        $notif = Notification::create([
            'title'   => "Thông báo chưa đọc {$i}",
            'content' => "Nội dung {$i}",
            'type'    => Constant::NOTIFICATION_TYPE_GENERAL,
        ]);

        NotificationRecipient::create([
            'notification_id' => $notif->id,
            'recipient_type'  => Constant::RECIPIENT_TYPE_ADMIN,
            'recipient_id'    => $superAdmin->id,
            'read_at'         => null,
        ]);
    }

    $response = $this->actingAs($superAdmin, 'admin')
        ->postJson('/notifications/mark-all-read');

    $response->assertStatus(200);
    $response->assertJson(['success' => true]);

    $unreadCount = NotificationRecipient::where('recipient_id', $superAdmin->id)
        ->whereNull('read_at')
        ->count();

    expect($unreadCount)->toBe(0);
});

test('super admin does not receive chat notifications via api', function () {
    $superAdmin = Admin::create([
        'admin_code' => 'ADM-SUP-93',
        'username'   => 'super_admin_chat_filter_test',
        'email'      => 'superadmin.filter@test.com',
        'password'   => Hash::make('password'),
        'full_name'  => 'Super Admin Chat Filter Test',
        'role'       => Constant::ROLE_SUPER_ADMIN,
        'status'     => Constant::STATUS_ACTIVE,
    ]);

    $center = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Test Center Filter',
        'status' => Constant::STATUS_ACTIVE,
    ]);

    $schoolClass = SchoolClass::create([
        'center_id' => $center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lớp 10A1',
        'status'    => Constant::CLASS_STATUS_ACTIVE,
    ]);

    // 1. Chat notification (should be excluded)
    $chatNotif = Notification::create([
        'title'         => 'Tin nhắn mới từ Lớp 10A1',
        'content'       => 'Chào các bạn học sinh',
        'type'          => Constant::NOTIFICATION_TYPE_GENERAL,
        'chat_class_id' => $schoolClass->id,
    ]);
    NotificationRecipient::create([
        'notification_id' => $chatNotif->id,
        'recipient_type'  => Constant::RECIPIENT_TYPE_ADMIN,
        'recipient_id'    => $superAdmin->id,
        'read_at'         => null,
    ]);

    // 2. Registration notification (should be included)
    $regNotif = Notification::create([
        'title'   => 'Trung tâm mới đăng ký: Math Center',
        'content' => 'Trung tâm Math Center vừa đăng ký gói',
        'type'    => Constant::NOTIFICATION_TYPE_CENTER_REGISTRATION,
    ]);
    NotificationRecipient::create([
        'notification_id' => $regNotif->id,
        'recipient_type'  => Constant::RECIPIENT_TYPE_ADMIN,
        'recipient_id'    => $superAdmin->id,
        'read_at'         => null,
    ]);

    $response = $this->actingAs($superAdmin, 'admin')
        ->getJson('/api/notifications');

    $response->assertStatus(200);
    $data = $response->json();

    expect($data['success'])->toBeTrue();
    expect($data['unread_count'])->toBe(1);
    expect($data['notifications'])->toHaveCount(1);
    expect($data['notifications'][0]['title'])->toBe('Trung tâm mới đăng ký: Math Center');
});

test('createAndBroadcast dispatches NotificationSentEvent to user private channel', function () {
    Event::fake();

    $repository = app(\App\Repositories\Notification\NotificationRepositoryInterface::class);

    $notif = $repository->createAndBroadcast([
        'title'   => 'Thông báo lịch thi mới',
        'content' => 'Lớp có lịch thi cuối kỳ vào ngày mai',
        'type'    => Constant::NOTIFICATION_TYPE_EXAM,
    ], [
        ['type' => Constant::RECIPIENT_TYPE_TEACHER, 'id' => 10],
        ['type' => Constant::RECIPIENT_TYPE_STUDENT, 'id' => 20],
    ]);

    expect($notif)->not->toBeNull();
    expect($notif->title)->toBe('Thông báo lịch thi mới');

    $this->assertDatabaseHas('notification_recipients', [
        'notification_id' => $notif->id,
        'recipient_type'  => Constant::RECIPIENT_TYPE_TEACHER,
        'recipient_id'    => 10,
    ]);

    $this->assertDatabaseHas('notification_recipients', [
        'notification_id' => $notif->id,
        'recipient_type'  => Constant::RECIPIENT_TYPE_STUDENT,
        'recipient_id'    => 20,
    ]);

    Event::assertDispatched(\App\Events\NotificationSentEvent::class, 2);
});
