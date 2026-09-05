<?php

namespace App\Services\Notification;

use App\Models\Notification;
use Illuminate\Contracts\Auth\Authenticatable;

interface NotificationServiceInterface
{
    /**
     * @param  Authenticatable      $user
     * @param  string               $role
     * @param  array<string, mixed> $filters
     * @param  int                  $perPage
     * @return array<string, mixed>
     */
    public function getPaginatedNotifications(Authenticatable $user, string $role, array $filters = [], int $perPage = 15): array;

    /**
     * @param  int             $id
     * @param  Authenticatable $user
     * @param  string          $role
     * @return bool
     */
    public function markAsRead(int $id, Authenticatable $user, string $role): bool;

    /**
     * @param  Authenticatable $user
     * @param  string          $role
     * @return int
     */
    public function markAllAsRead(Authenticatable $user, string $role): int;

    /**
     * Send in-app notification and broadcast via real-time WebSocket.
     *
     * @param  array<string, mixed>                  $notificationData
     * @param  array<int, array{type: int, id: int}> $recipients
     * @return Notification
     */
    public function send(array $notificationData, array $recipients): Notification;
}
