<?php

use App\Enums\Constant;
use App\Models\Center;
use App\Models\ClassChatMessage;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\SubscriptionPlan;
use App\Models\Teacher;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(PermissionSeeder::class);

    $this->plan = SubscriptionPlan::create([
        'code'             => 'advanced_monthly',
        'name'             => 'Gói Nâng Cao Test',
        'plan_type'        => Constant::PLAN_TYPE_PREMIUM,
        'allowed_features' => ['chat', 'grading'],
        'status'           => Constant::STATUS_ACTIVE,
    ]);

    $this->center = Center::create([
        'code'              => 'CTR000000099',
        'name'              => 'Trung Tâm Chat Test',
        'email'             => 'chatcenter@test.com',
        'phone'             => '0901234567',
        'subscription_plan' => 'advanced_monthly',
        'plan_type'         => Constant::PLAN_TYPE_PREMIUM,
        'expires_at'        => now()->addYear(),
        'status'            => Constant::STATUS_ACTIVE,
    ]);

    $this->teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'teacher_code' => 'GV000000099',
        'username'     => 'teacher_chat_test',
        'first_name'   => 'T',
        'last_name'    => 'Nguyễn',
        'full_name'    => 'Thầy Nguyễn Chat',
        'email'        => 'teacherchat@test.com',
        'password'     => 'password123',
        'status'       => Constant::STATUS_ACTIVE,
    ]);

    $this->student = Student::create([
        'center_id'    => $this->center->id,
        'student_code' => 'HS000000099',
        'username'     => 'student_chat_test',
        'first_name'   => 'H',
        'last_name'    => 'Lê',
        'full_name'    => 'Lê Học Sinh',
        'email'        => 'studentchat@test.com',
        'password'     => 'password123',
        'status'       => 1,
    ]);

    $this->schoolClass = SchoolClass::create([
        'center_id'    => $this->center->id,
        'code'         => 'C000000099',
        'name'         => 'Lớp Chat Test',
        'max_students' => 30,
        'status'       => 1,
    ]);

    $this->schoolClass->students()->attach($this->student->id, ['enrolled_at' => now(), 'status' => Constant::CLASS_STUDENT_STATUS_ACTIVE]);
});

test('học sinh và giáo viên có thể gửi tin nhắn trả lời (reply) tin nhắn khác', function () {
    // Tạo tin nhắn gốc từ giáo viên
    $originalMessage = ClassChatMessage::create([
        'class_id'    => $this->schoolClass->id,
        'sender_type' => Constant::ACCOUNT_TYPE_TEACHER,
        'sender_id'   => $this->teacher->id,
        'sender_name' => $this->teacher->full_name,
        'message'     => 'Chào các em, hôm nay chúng ta học bài 1.',
    ]);

    // Học sinh reply tin nhắn của giáo viên
    $response = $this->actingAs($this->student, 'student')
        ->postJson("/classes/{$this->schoolClass->id}/chat/messages", [
            'message'     => 'Em đã chuẩn bị sách vở rồi ạ!',
            'reply_to_id' => $originalMessage->id,
        ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => [
                'reply_to_id' => $originalMessage->id,
                'reply_to'    => [
                    'id'          => $originalMessage->id,
                    'sender_name' => $this->teacher->full_name,
                    'message'     => 'Chào các em, hôm nay chúng ta học bài 1.',
                ],
            ],
        ]);

    $this->assertDatabaseHas('class_chat_messages', [
        'class_id'    => $this->schoolClass->id,
        'sender_id'   => $this->student->id,
        'reply_to_id' => $originalMessage->id,
        'message'     => 'Em đã chuẩn bị sách vở rồi ạ!',
    ]);
});

test('thả và hủy biểu tượng cảm xúc (reaction) trên tin nhắn chat', function () {
    $message = ClassChatMessage::create([
        'class_id'    => $this->schoolClass->id,
        'sender_type' => Constant::ACCOUNT_TYPE_TEACHER,
        'sender_id'   => $this->teacher->id,
        'sender_name' => $this->teacher->full_name,
        'message'     => 'Lớp chúng ta đạt điểm kiểm tra rất cao!',
    ]);

    // 1. Học sinh thả cảm xúc ❤️
    $response = $this->actingAs($this->student, 'student')
        ->postJson("/classes/{$this->schoolClass->id}/chat/messages/{$message->id}/reactions", [
            'emoji' => '❤️',
        ]);

    $response->assertOk()
        ->assertJson([
            'success'   => true,
            'reactions' => [
                [
                    'emoji' => '❤️',
                    'count' => 1,
                ],
            ],
        ]);

    $this->assertDatabaseHas('class_chat_message_reactions', [
        'message_id'  => $message->id,
        'sender_id'   => $this->student->id,
        'sender_type' => Constant::ACCOUNT_TYPE_STUDENT,
        'emoji'       => '❤️',
    ]);

    // 2. Học sinh nhấp lại ❤️ -> Hủy cảm xúc
    $response2 = $this->actingAs($this->student, 'student')
        ->postJson("/classes/{$this->schoolClass->id}/chat/messages/{$message->id}/reactions", [
            'emoji' => '❤️',
        ]);

    $response2->assertOk()
        ->assertJson([
            'success'   => true,
            'reactions' => [],
        ]);

    $this->assertDatabaseMissing('class_chat_message_reactions', [
        'message_id' => $message->id,
        'sender_id'  => $this->student->id,
    ]);
});

test('đổi biểu tượng cảm xúc sang emoji khác', function () {
    $message = ClassChatMessage::create([
        'class_id'    => $this->schoolClass->id,
        'sender_type' => Constant::ACCOUNT_TYPE_TEACHER,
        'sender_id'   => $this->teacher->id,
        'sender_name' => $this->teacher->full_name,
        'message'     => 'Thầy vừa giao bài tập về nhà nhé!',
    ]);

    // Thả emoji 😮
    $this->actingAs($this->student, 'student')
        ->postJson("/classes/{$this->schoolClass->id}/chat/messages/{$message->id}/reactions", [
            'emoji' => '😮',
        ]);

    // Đổi sang emoji 👍
    $response = $this->actingAs($this->student, 'student')
        ->postJson("/classes/{$this->schoolClass->id}/chat/messages/{$message->id}/reactions", [
            'emoji' => '👍',
        ]);

    $response->assertOk()
        ->assertJson([
            'success'   => true,
            'reactions' => [
                [
                    'emoji' => '👍',
                    'count' => 1,
                ],
            ],
        ]);

    $this->assertDatabaseHas('class_chat_message_reactions', [
        'message_id'  => $message->id,
        'sender_id'   => $this->student->id,
        'sender_type' => Constant::ACCOUNT_TYPE_STUDENT,
        'emoji'       => '👍',
    ]);

    $this->assertDatabaseMissing('class_chat_message_reactions', [
        'message_id' => $message->id,
        'sender_id'  => $this->student->id,
        'emoji'      => '😮',
    ]);
});
