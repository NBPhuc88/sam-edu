<?php

namespace App\Services\Notification;

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
}
