<?php

use App\Services\Chat\ChatServiceInterface;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('class-chat.{classId}', function (mixed $user, int $classId): bool {
    app(ChatServiceInterface::class)->authorizeAccess($classId, $user);

    return true;
}, ['guards' => ['admin', 'teacher', 'student']]);

Broadcast::channel('game-room.{roomId}', function (mixed $user, int $roomId): bool {
    if (! $user instanceof \App\Models\Admin && ! $user instanceof \App\Models\Teacher && ! $user instanceof \App\Models\Student) {
        return false;
    }
    app(\App\Services\GameRoom\GameRoomServiceInterface::class)->authorizeAccess(\App\Models\GameRoom::findOrFail($roomId), $user);

    return true;
}, ['guards' => ['admin', 'teacher', 'student']]);
