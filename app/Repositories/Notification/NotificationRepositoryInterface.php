<?php

namespace App\Repositories\Notification;

use App\Models\Notification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface NotificationRepositoryInterface
{
    /**
     * @param  int                  $recipientType
     * @param  int                  $recipientId
     * @param  array<string, mixed> $filters
     * @param  int                  $perPage
     * @return LengthAwarePaginator
     */
    public function getPaginatedForRecipient(int $recipientType, int $recipientId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * @param  int  $recipientType
     * @param  int  $recipientId
     * @param  bool $isSuperAdmin
     * @return int
     */
    public function countUnreadForRecipient(int $recipientType, int $recipientId, bool $isSuperAdmin = false): int;

    /**
     * @param  int  $id
     * @param  int  $recipientType
     * @param  int  $recipientId
     * @return bool
     */
    public function markAsRead(int $id, int $recipientType, int $recipientId): bool;

    /**
     * @param  int $recipientType
     * @param  int $recipientId
     * @return int
     */
    public function markAllAsRead(int $recipientType, int $recipientId): int;

    /**
     * @param  array<string, mixed>                  $notificationData
     * @param  array<int, array{type: int, id: int}> $recipients
     * @return Notification
     */
    public function createAndBroadcast(array $notificationData, array $recipients): Notification;
}
