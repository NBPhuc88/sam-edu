<?php

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\ClassChatMessage;
use App\Models\ClassChatReadStatus;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\SubscriptionPlan;
use App\Models\Teacher;
use App\Repositories\Chat\ChatRepositoryInterface;
use Database\Seeders\PermissionSeeder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redis;

beforeEach(function () {
    $this->seed(PermissionSeeder::class);
    Redis::shouldReceive('lrange')->andReturn([]);
    Redis::shouldReceive('get')->andReturn(null);
    Redis::shouldReceive('del', 'rpush', 'ltrim', 'expire', 'setex')->andReturn(1);
    $plan              = SubscriptionPlan::create(['code' => 'chat-test', 'name' => 'Chat', 'plan_type' => Constant::PLAN_TYPE_PREMIUM, 'allowed_features' => ['chat'], 'status' => 1]);
    $this->center      = Center::create(['code' => 'CTR-CHAT', 'name' => 'Chat center', 'status' => 1, 'subscription_plan_id' => $plan->id, 'plan_type' => Constant::PLAN_TYPE_PREMIUM, 'expires_at' => now()->addYear()]);
    $this->schoolClass = SchoolClass::create(['center_id' => $this->center->id, 'code' => 'CLS-CHAT', 'name' => 'Chat class', 'status' => 1]);
    $this->otherClass  = SchoolClass::create(['center_id' => $this->center->id, 'code' => 'CLS-OTHER', 'name' => 'Other class', 'status' => 1]);
    $this->teacher     = Teacher::create(['center_id' => $this->center->id, 'teacher_code' => 'GV-CHAT', 'username' => 'teacher-chat', 'first_name' => 'Teacher', 'last_name' => 'Chat', 'full_name' => 'Teacher Chat', 'password' => 'password', 'status' => 1]);
    $this->student     = Student::create(['center_id' => $this->center->id, 'student_code' => 'HS-CHAT', 'username' => 'student-chat', 'first_name' => 'Student', 'last_name' => 'Chat', 'full_name' => 'Student Chat', 'password' => 'password', 'status' => 1]);
    $this->admin       = Admin::create(['admin_code' => 'ADM-CHAT', 'username' => 'admin-chat', 'full_name' => 'Admin Chat', 'password' => 'password', 'role' => Constant::ROLE_ADMIN, 'status' => 1]);
    $this->admin->centers()->attach($this->center);
    $this->superAdmin = Admin::create(['admin_code' => 'ADM-SUPER', 'username' => 'super-chat', 'full_name' => 'Super Chat', 'password' => 'password', 'role' => Constant::ROLE_SUPER_ADMIN, 'status' => 1]);
    $this->superAdmin->centers()->attach($this->center);
    $subject = Subject::create(['code' => 'SUB-CHAT', 'name' => 'Chat subject', 'center_id' => $this->center->id]);
    $this->schoolClass->classSubjects()->create(['subject_id' => $subject->id, 'teacher_id' => $this->teacher->id, 'status' => 1]);
    $this->schoolClass->students()->attach($this->student, ['enrolled_at' => now(), 'status' => Constant::CLASS_STUDENT_STATUS_ACTIVE]);
});

test('teachers can access only classes with their subject assignments on every chat endpoint', function () {
    $this->actingAs($this->teacher, 'teacher');
    $this->get(route('classes.chat.index', $this->schoolClass->id))->assertOk();
    $this->get(route('classes.chat.index', $this->otherClass->id))->assertForbidden();
    $this->getJson(route('classes.chat.messages', $this->otherClass->id))->assertForbidden();
    $this->postJson(route('classes.chat.send', $this->otherClass->id), ['message' => 'Blocked'])->assertForbidden();
    $this->get(route('chats.index'))->assertInertia(fn ($page) => $page->has('chatGroups.data', 1)->has('classes', 1)->where('classes.0.id', $this->schoolClass->id));
    $this->get(route('chats.index', ['class_id' => $this->otherClass->id]))->assertInertia(fn ($page) => $page->has('chatGroups.data', 0));
});

test('students need active enrollment for rooms lists and filters', function (int $status) {
    $this->schoolClass->students()->updateExistingPivot($this->student->id, ['status' => $status]);
    $this->actingAs($this->student, 'student');
    $this->get(route('classes.chat.index', $this->schoolClass->id))->assertForbidden();
    $this->get(route('classes.chat.index', $this->otherClass->id))->assertForbidden();
    $this->getJson(route('classes.chat.messages', $this->schoolClass->id))->assertForbidden();
    $this->postJson(route('classes.chat.send', $this->schoolClass->id), ['message' => 'Blocked'])->assertForbidden();
    $this->get(route('chats.index'))->assertInertia(fn ($page) => $page->has('chatGroups.data', 0)->has('classes', 0));
})->with([Constant::CLASS_STUDENT_STATUS_LEFT, Constant::CLASS_STUDENT_STATUS_COMPLETED, Constant::CLASS_STUDENT_STATUS_TRANSFERRED]);

test('chat notifications exclude sender and super admin and reading clears only that account', function () {
    $otherTeacher = $this->teacher->replicate()->fill(['teacher_code' => 'GV-OTHER', 'username' => 'other-teacher']);
    $otherTeacher->save();
    $leftStudent = $this->student->replicate()->fill(['student_code' => 'HS-LEFT', 'username' => 'left-student']);
    $leftStudent->save();
    $this->schoolClass->students()->attach($leftStudent, ['enrolled_at' => now(), 'status' => Constant::CLASS_STUDENT_STATUS_LEFT]);
    $activeStudent = $this->student->replicate()->fill(['student_code' => 'HS-ACTIVE', 'username' => 'active-student']);
    $activeStudent->save();
    $this->schoolClass->students()->attach($activeStudent, ['enrolled_at' => now(), 'status' => Constant::CLASS_STUDENT_STATUS_ACTIVE]);
    $this->actingAs($this->student, 'student')->postJson(route('classes.chat.send', $this->schoolClass->id), ['message' => 'đăng ký gia hạn'])->assertOk();
    $chatNotifications = Notification::where('chat_class_id', $this->schoolClass->id)->get();
    expect($chatNotifications)->toHaveCount(3)
        ->and($chatNotifications->every(fn (Notification $notification): bool => $notification->recipients()->count() === 1))->toBeTrue();
    expect(NotificationRecipient::where('recipient_type', Constant::RECIPIENT_TYPE_STUDENT)->sole()->recipient_id)->toBe($activeStudent->id);
    $this->get(route('chats.index'))->assertInertia(fn ($page) => $page->where('chatGroups.data.0.unread_messages_count', 0));
    Auth::guard('student')->logout();
    $this->actingAs($this->teacher, 'teacher');
    $this->get(route('chats.index'))->assertInertia(fn ($page) => $page->where('chatGroups.data.0.unread_messages_count', 1)->where('auth.notifications.0.is_chat', true));
    $this->get(route('notifications.index'))->assertInertia(fn ($page) => $page->where('notifications.data.0.is_chat', true)->where('notifications.data.0.type', Constant::NOTIFICATION_TYPE_GENERAL));
    $this->get(route('classes.chat.index', $this->schoolClass->id))->assertInertia(fn ($page) => $page->where('lastReadMessageId', null));
    $recipient = NotificationRecipient::where('recipient_type', Constant::RECIPIENT_TYPE_TEACHER)
        ->where('recipient_id', $this->teacher->id)
        ->sole();
    expect($recipient->fresh()->read_at)->not->toBeNull();
    $this->getJson('/api/notifications')->assertJsonPath('notifications.0.is_chat', true);
    $this->patchJson('/api/notifications/' . $recipient->id . '/read')->assertJsonPath('success', true);
    expect($recipient->fresh()->read_at)->not->toBeNull();
    $messageId = ClassChatMessage::sole()->id;
    expect(ClassChatReadStatus::sole()->last_read_message_id)->toBe($messageId);
    $this->get(route('chats.index'))->assertInertia(fn ($page) => $page->where('chatGroups.data.0.unread_messages_count', 0));
    $this->get(route('classes.chat.index', $this->schoolClass->id))->assertInertia(fn ($page) => $page->where('lastReadMessageId', $messageId));
    Auth::guard('teacher')->logout();
    $this->actingAs($this->admin, 'admin')->get(route('chats.index', ['class_id' => $this->schoolClass->id]))->assertInertia(fn ($page) => $page->where('chatGroups.data.0.unread_messages_count', 1));
});

test('multiple messages reuse one notification per recipient and expose the latest message', function () {
    $this->actingAs($this->student, 'student');

    $this->postJson(route('classes.chat.send', $this->schoolClass->id), ['message' => 'Tin thứ nhất'])->assertOk();
    $this->postJson(route('classes.chat.send', $this->schoolClass->id), ['message' => 'Tin mới nhất'])->assertOk();

    $notifications = Notification::where('chat_class_id', $this->schoolClass->id)->get();
    expect($notifications)->toHaveCount(2)
        ->and($notifications->every(fn (Notification $notification): bool => $notification->content === 'Student Chat: Tin mới nhất'))->toBeTrue()
        ->and(NotificationRecipient::where('recipient_type', Constant::RECIPIENT_TYPE_TEACHER)->count())->toBe(1)
        ->and(NotificationRecipient::where('recipient_type', Constant::RECIPIENT_TYPE_ADMIN)->count())->toBe(1);
});

test('a new message consolidates legacy duplicate class notifications', function () {
    $first = Notification::create([
        'center_id'     => $this->center->id,
        'chat_class_id' => $this->schoolClass->id,
        'title'         => 'Tin cũ 1',
        'content'       => 'Cũ 1',
        'type'          => Constant::NOTIFICATION_TYPE_GENERAL,
    ]);
    $first->recipients()->create([
        'recipient_type' => Constant::RECIPIENT_TYPE_ADMIN,
        'recipient_id'   => $this->admin->id,
    ]);
    $second = Notification::create([
        'center_id'     => $this->center->id,
        'chat_class_id' => $this->schoolClass->id,
        'title'         => 'Tin cũ 2',
        'content'       => 'Cũ 2',
        'type'          => Constant::NOTIFICATION_TYPE_GENERAL,
    ]);
    $second->recipients()->create([
        'recipient_type' => Constant::RECIPIENT_TYPE_TEACHER,
        'recipient_id'   => $this->teacher->id,
    ]);

    $this->actingAs($this->student, 'student')
        ->postJson(route('classes.chat.send', $this->schoolClass->id), ['message' => 'Tin hợp nhất'])
        ->assertOk();

    expect(Notification::where('chat_class_id', $this->schoolClass->id)->count())->toBe(2)
        ->and(NotificationRecipient::where('recipient_type', Constant::RECIPIENT_TYPE_ADMIN)->count())->toBe(1)
        ->and(NotificationRecipient::where('recipient_type', Constant::RECIPIENT_TYPE_TEACHER)->count())->toBe(1)
        ->and(Notification::where('chat_class_id', $this->schoolClass->id)->where('content', 'Student Chat: Tin hợp nhất')->count())->toBe(2);
});

test('opening chat includes unread messages beyond the recent cache and read markers never regress', function () {
    for ($index = 0; $index < 55; $index++) {
        $this->schoolClass->chatMessages()->create(['sender_type' => Constant::SENDER_TYPE_STUDENT, 'sender_id' => $this->student->id, 'sender_name' => 'Student', 'message' => 'Message ' . $index]);
    }
    $this->actingAs($this->teacher, 'teacher')->get(route('classes.chat.index', $this->schoolClass->id))->assertInertia(fn ($page) => $page->has('initialMessages', 55));
    $latestId = ClassChatMessage::max('id');
    app(ChatRepositoryInterface::class)->markMessagesRead($this->schoolClass->id, Constant::SENDER_TYPE_TEACHER, $this->teacher->id, $latestId - 1);
    expect(ClassChatReadStatus::sole()->last_read_message_id)->toBe($latestId);
});

test('cross class replies and reactions cannot expose or mutate another room', function () {
    $message = $this->otherClass->chatMessages()->create(['sender_type' => 1, 'sender_id' => $this->admin->id, 'sender_name' => 'Admin', 'message' => 'Private']);
    $this->actingAs($this->teacher, 'teacher')->postJson(route('classes.chat.send', $this->schoolClass->id), ['message' => 'Reply', 'reply_to_id' => $message->id])->assertUnprocessable();
    $this->postJson("/classes/{$this->schoolClass->id}/chat/messages/{$message->id}/reactions", ['emoji' => '👍'])->assertNotFound();
    expect(Notification::count())->toBe(0);
});

test('opening a room clears its unread chat notifications even when it has no messages', function () {
    $notification = Notification::create([
        'center_id'     => $this->center->id,
        'chat_class_id' => $this->schoolClass->id,
        'title'         => 'Tin nhắn mới',
        'content'       => 'Nội dung',
        'type'          => Constant::NOTIFICATION_TYPE_GENERAL,
    ]);
    $recipient = $notification->recipients()->create([
        'recipient_type' => Constant::RECIPIENT_TYPE_TEACHER,
        'recipient_id'   => $this->teacher->id,
    ]);

    $this->actingAs($this->teacher, 'teacher')->get(route('classes.chat.index', $this->schoolClass->id))->assertOk();

    expect($recipient->fresh()->read_at)->not->toBeNull();
});

test('private broadcast authorization uses the same subject assignment and enrollment rules', function () {
    config(['broadcasting.default' => 'pusher']);
    require base_path('routes/channels.php');
    $this->actingAs($this->teacher, 'teacher');
    $this->postJson('/broadcasting/auth', ['socket_id' => '123.456', 'channel_name' => 'private-class-chat.' . $this->schoolClass->id])->assertOk();
    $this->postJson('/broadcasting/auth', ['socket_id' => '123.456', 'channel_name' => 'private-class-chat.' . $this->otherClass->id])->assertForbidden();
    expect((new App\Events\ClassChatMessageSent($this->schoolClass->id, []))->broadcastOn())->toBeInstanceOf(Illuminate\Broadcasting\PrivateChannel::class);
});
