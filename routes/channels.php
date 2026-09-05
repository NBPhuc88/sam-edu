<?php

use App\Services\Chat\ChatServiceInterface;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('class-chat.{classId}', function (mixed $user, int $classId): bool {
    app(ChatServiceInterface::class)->authorizeAccess($classId, $user);

    return true;
}, ['guards' => ['admin', 'teacher', 'student']]);

Broadcast::channel('notifications.admin.{adminId}', function (mixed $user, int $adminId): bool {
    return (int) $user?->id === $adminId;
}, ['guards' => ['admin']]);

Broadcast::channel('notifications.teacher.{teacherId}', function (mixed $user, int $teacherId): bool {
    return (int) $user?->id === $teacherId;
}, ['guards' => ['teacher']]);

Broadcast::channel('notifications.student.{studentId}', function (mixed $user, int $studentId): bool {
    return (int) $user?->id === $studentId;
}, ['guards' => ['student']]);
