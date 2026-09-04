<?php

use App\Services\Chat\ChatServiceInterface;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('class-chat.{classId}', function (mixed $user, int $classId): bool {
    app(ChatServiceInterface::class)->authorizeAccess($classId, $user);

    return true;
}, ['guards' => ['admin', 'teacher', 'student']]);
