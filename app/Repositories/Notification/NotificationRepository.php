<?php

namespace App\Repositories\Notification;

use App\Enums\Constant;
use App\Events\NotificationSentEvent;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;
use Throwable;

class NotificationRepository implements NotificationRepositoryInterface
{
    /**
     * @param  int                  $recipientType
     * @param  int                  $recipientId
     * @param  array<string, mixed> $filters
     * @param  int                  $perPage
     * @return LengthAwarePaginator
     */
    public function getPaginatedForRecipient(int $recipientType, int $recipientId, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = NotificationRecipient::query()
            ->where('recipient_type', $recipientType)
            ->where('recipient_id', $recipientId)
            ->with(['notification.center']);

        // Filter: Trạng thái đọc (1: Đã đọc, 2: Chưa đọc)
        if (isset($filters['is_read']) && $filters['is_read'] !== '' && $filters['is_read'] !== null) {
            $isRead = (int) $filters['is_read'];

            if ($isRead === 1) {
                $query->whereNotNull('read_at');
            } elseif ($isRead === 2) {
                $query->whereNull('read_at');
            }
        }

        // Filter: Loại thông báo
        if (! empty($filters['type'])) {
            $type = (int) $filters['type'];

            if ($type === \App\Enums\Constant::NOTIFICATION_TYPE_CENTER_REGISTRATION) {
                $query->whereHas('notification', function ($q) {
                    $q->where('type', \App\Enums\Constant::NOTIFICATION_TYPE_CENTER_REGISTRATION)
                        ->orWhere('title', 'like', '%đăng ký%')
                        ->orWhere('content', 'like', '%đăng ký%');
                });
            } elseif ($type === \App\Enums\Constant::NOTIFICATION_TYPE_SUBSCRIPTION_RENEWAL) {
                $query->whereHas('notification', function ($q) {
                    $q->where('type', \App\Enums\Constant::NOTIFICATION_TYPE_SUBSCRIPTION_RENEWAL)
                        ->orWhere('title', 'like', '%gia hạn%')
                        ->orWhere('content', 'like', '%gia hạn%');
                });
            } elseif ($type > 0) {
                $query->whereHas('notification', function ($q) use ($type) {
                    $q->where('type', $type);
                });
            }
        }

        // Filter: Từ khóa tìm kiếm
        if (! empty($filters['keyword'])) {
            $keyword = trim((string) $filters['keyword']);
            $query->whereHas('notification', function ($q) use ($keyword) {
                $q->where('title', 'like', "%{$keyword}%")
                    ->orWhere('content', 'like', "%{$keyword}%")
                    ->orWhereHas('center', function ($cq) use ($keyword) {
                        $cq->where('name', 'like', "%{$keyword}%");
                    });
            });
        }

        if (! empty($filters['is_super_admin'])) {
            $query->whereHas('notification', function ($q) {
                $q->whereNull('chat_class_id');
            });
        }

        $notificationsTable = (new Notification())->getTable();
        $recipientsTable    = (new NotificationRecipient())->getTable();

        return $query
            ->orderByDesc(Notification::select('updated_at')
                ->whereColumn("{$notificationsTable}.id", "{$recipientsTable}.notification_id"))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * @param  int  $recipientType
     * @param  int  $recipientId
     * @param  bool $isSuperAdmin
     * @return int
     */
    public function countUnreadForRecipient(int $recipientType, int $recipientId, bool $isSuperAdmin = false): int
    {
        $query = NotificationRecipient::query()
            ->where('recipient_type', $recipientType)
            ->where('recipient_id', $recipientId)
            ->whereNull('read_at');

        if ($isSuperAdmin) {
            $query->whereHas('notification', function ($q) {
                $q->whereNull('chat_class_id');
            });
        }

        return $query->count();
    }

    /**
     * @param  int  $id
     * @param  int  $recipientType
     * @param  int  $recipientId
     * @return bool
     */
    public function markAsRead(int $id, int $recipientType, int $recipientId): bool
    {
        $recipient = NotificationRecipient::query()
            ->where('id', $id)
            ->where('recipient_type', $recipientType)
            ->where('recipient_id', $recipientId)
            ->first();

        if (! $recipient) {
            return false;
        }

        if ($recipient->read_at === null) {
            $recipient->update(['read_at' => now()]);
        }

        return true;
    }

    /**
     * @param  int $recipientType
     * @param  int $recipientId
     * @return int
     */
    public function markAllAsRead(int $recipientType, int $recipientId): int
    {
        return NotificationRecipient::query()
            ->where('recipient_type', $recipientType)
            ->where('recipient_id', $recipientId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * @param  array<string, mixed>                  $notificationData
     * @param  array<int, array{type: int, id: int}> $recipients
     * @return Notification
     */
    public function createAndBroadcast(array $notificationData, array $recipients): Notification
    {
        $notification = Notification::create([
            'center_id'           => $notificationData['center_id'] ?? null,
            'title'               => $notificationData['title'],
            'content'             => $notificationData['content'] ?? '',
            'type'                => $notificationData['type'] ?? Constant::NOTIFICATION_TYPE_GENERAL,
            'created_by_admin_id' => $notificationData['created_by_admin_id'] ?? null,
            'chat_class_id'       => $notificationData['chat_class_id'] ?? null,
        ]);

        $now                = now();
        $recipientsToInsert = [];

        foreach ($recipients as $recipient) {
            $recipientsToInsert[] = [
                'notification_id' => $notification->id,
                'recipient_type'  => (int) $recipient['type'],
                'recipient_id'    => (int) $recipient['id'],
                'read_at'         => null,
                'created_at'      => $now,
                'updated_at'      => $now,
            ];
        }

        foreach (array_chunk($recipientsToInsert, 1000) as $chunk) {
            NotificationRecipient::insert($chunk);
        }

        $createdRecipients = NotificationRecipient::where('notification_id', $notification->id)->get();
        $centerName        = $notification->center?->name;

        foreach ($createdRecipients as $item) {
            $roleName = match ((int) $item->recipient_type) {
                Constant::RECIPIENT_TYPE_ADMIN   => 'admin',
                Constant::RECIPIENT_TYPE_TEACHER => 'teacher',
                Constant::RECIPIENT_TYPE_STUDENT => 'student',
                default                          => 'admin',
            };

            try {
                event(new NotificationSentEvent($roleName, (int) $item->recipient_id, [
                    'id'              => $item->id,
                    'notification_id' => $notification->id,
                    'is_chat'         => $notification->chat_class_id !== null,
                    'title'           => $notification->title,
                    'content'         => $notification->content,
                    'type'            => $notification->type,
                    'center_id'       => $notification->center_id,
                    'chat_class_id'   => $notification->chat_class_id,
                    'center_name'     => $centerName,
                    'is_read'         => false,
                    'read_at'         => null,
                    'created_at'      => 'Vừa xong',
                ]));
            } catch (Throwable $e) {
                Log::error("Lỗi khi broadcast WebSocket NotificationSentEvent cho {$roleName} #{$item->recipient_id}: " . $e->getMessage());
            }
        }

        return $notification;
    }
}
