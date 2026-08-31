<?php

use App\Enums\Constant;
use App\Models\Center;
use App\Models\SchoolClass;
use App\Models\Teacher;
use App\Services\Auth\AuthServiceInterface;
use App\Services\Chat\ChatServiceInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\HttpException;

beforeEach(function () {
    $this->center = Center::create([
        'code'   => 'CTR' . random_int(1000000, 9999999),
        'name'   => 'Center Test Teacher Status',
        'status' => Constant::CENTER_STATUS_ACTIVE,
    ]);

    $this->authService = app(AuthServiceInterface::class);
    $this->chatService = app(ChatServiceInterface::class);
});

test('active teacher can login successfully', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_active_' . random_int(1000, 9999),
        'first_name'   => 'Active',
        'last_name'    => 'Teacher',
        'full_name'    => 'Active Teacher',
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::TEACHER_STATUS_ACTIVE,
    ]);

    $result = $this->authService->authenticate('teacher', $teacher->username, 'password123');

    expect($result['success'])->toBeTrue();
    expect($result['account']->id)->toBe($teacher->id);
});

test('inactive teacher (tam nghi) can login but is in view-only mode', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_inactive_' . random_int(1000, 9999),
        'first_name'   => 'Inactive',
        'last_name'    => 'Teacher',
        'full_name'    => 'Inactive Teacher',
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::TEACHER_STATUS_INACTIVE,
    ]);

    $result = $this->authService->authenticate('teacher', $teacher->username, 'password123');

    expect($result['success'])->toBeTrue();
    expect($result['account']->id)->toBe($teacher->id);
});

test('locked teacher (da khoa) cannot login to the system', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_locked_' . random_int(1000, 9999),
        'first_name'   => 'Locked',
        'last_name'    => 'Teacher',
        'full_name'    => 'Locked Teacher',
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::TEACHER_STATUS_LOCKED,
    ]);

    $result = $this->authService->authenticate('teacher', $teacher->username, 'password123');

    expect($result['success'])->toBeFalse();
    expect($result['error'])->toContain('khóa');
});

test('inactive teacher cannot send chat message', function () {
    $teacher = Teacher::create([
        'center_id'    => $this->center->id,
        'username'     => 'teacher_chat_inact_' . random_int(1000, 9999),
        'first_name'   => 'Chat',
        'last_name'    => 'Teacher',
        'full_name'    => 'Chat Teacher',
        'teacher_code' => 'GV' . random_int(1000000, 9999999),
        'password'     => Hash::make('password123'),
        'status'       => Constant::TEACHER_STATUS_INACTIVE,
    ]);

    $class = SchoolClass::create([
        'center_id' => $this->center->id,
        'code'      => 'CLS' . random_int(1000000, 9999999),
        'name'      => 'Lop Chat Inactive Teacher',
        'status'    => Constant::CLASS_STATUS_ACTIVE,
    ]);

    Auth::guard('teacher')->login($teacher);

    $senderInfo = [
        'sender_type' => Constant::SENDER_TYPE_TEACHER,
        'sender_id'   => $teacher->id,
        'sender_name' => $teacher->full_name,
    ];

    expect(fn () => $this->chatService->sendMessage($class->id, $senderInfo, 'Xin chao'))
        ->toThrow(HttpException::class);
});
