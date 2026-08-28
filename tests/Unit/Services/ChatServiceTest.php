<?php

use App\Models\Admin;
use App\Models\Center;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\Chat\ChatService;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\HttpException;

beforeEach(function () {
    $this->service = app(ChatService::class);
    $this->center  = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test ChatService',
        'status' => 'active',
    ]);
    $this->superAdmin = Admin::create([
        'username'   => 'super_admin_chat_' . random_int(1000, 9999),
        'full_name'  => 'Super Admin Chat',
        'password'   => Hash::make('password123'),
        'role'       => \App\Enums\Constant::ROLE_SUPER_ADMIN,
        'status'     => \App\Enums\Constant::STATUS_ACTIVE,
        'admin_code' => 'ADM' . random_int(1000000, 9999999),
    ]);
    $this->schoolClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Chat Test',
        'status'    => 1,
    ]);
});

test('authorizeAccess allows super admin access to any class chat', function () {
    $class = $this->service->authorizeAccess($this->schoolClass->id, $this->superAdmin);

    expect($class->id)->toBe($this->schoolClass->id);
});

test('authorizeAccess allows active student enrolled in class access to chat', function () {
    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_chat_auth',
        'first_name'   => 'Student',
        'last_name'    => 'Chat',
        'full_name'    => 'Student Chat Auth',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);

    $this->schoolClass->students()->attach($student->id, ['enrolled_at' => now()]);

    $class = $this->service->authorizeAccess($this->schoolClass->id, $student);

    expect($class->id)->toBe($this->schoolClass->id);
});

test('sendMessage creates message and returns formatted array', function () {
    $student = Student::create([
        'center_id'    => $this->center->id,
        'username'     => 'student_chat_msg',
        'first_name'   => 'Student',
        'last_name'    => 'Msg',
        'full_name'    => 'Student Chat Msg',
        'student_code' => 'HS' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => 1,
    ]);
    $this->schoolClass->students()->attach($student->id, ['enrolled_at' => now()]);

    \Illuminate\Support\Facades\Auth::guard('student')->login($student);

    $senderInfo = [
        'sender_type' => 'student',
        'sender_id'   => $student->id,
        'sender_name' => $student->full_name,
    ];

    $formatted = $this->service->sendMessage($this->schoolClass->id, $senderInfo, 'Xin chao ca lop!');

    expect($formatted['message'])->toBe('Xin chao ca lop!');
    $this->assertDatabaseHas('class_chat_messages', [
        'class_id' => $this->schoolClass->id,
        'message'  => 'Xin chao ca lop!',
    ]);
});

test('sendMessage throws 403 exception when class status is inactive', function () {
    $inactiveClass = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Chat Inactive',
        'status'    => 0,
    ]);

    \Illuminate\Support\Facades\Auth::guard('admin')->login($this->superAdmin);

    $senderInfo = [
        'sender_type' => 'admin',
        'sender_id'   => $this->superAdmin->id,
        'sender_name' => $this->superAdmin->full_name,
    ];

    expect(fn () => $this->service->sendMessage($inactiveClass->id, $senderInfo, 'Test inactive msg'))
        ->toThrow(HttpException::class);
});
