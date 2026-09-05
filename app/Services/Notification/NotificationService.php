<?php

namespace App\Services\Notification;

use App\Enums\Constant;
use App\Models\Notification;
use App\Models\NotificationRecipient;
use App\Repositories\Notification\NotificationRepositoryInterface;
use Illuminate\Contracts\Auth\Authenticatable;

class NotificationService implements NotificationServiceInterface
{
    public function __construct(
        protected NotificationRepositoryInterface $notificationRepository
    ) {
    }

    /**
     * @param  Authenticatable      $user
     * @param  string               $role
     * @param  array<string, mixed> $filters
     * @param  int                  $perPage
     * @return array<string, mixed>
     */
    public function getPaginatedNotifications(Authenticatable $user, string $role, array $filters = [], int $perPage = 15): array
    {
        $recipientType = $this->resolveRecipientType($role);
        $isSuperAdmin  = ($role === 'admin' && ($user->role === Constant::ROLE_SUPER_ADMIN || $user->role === 'super_admin' || (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin())));

        if ($isSuperAdmin && ! empty($filters['for_dropdown'])) {
            $filters['is_super_admin_dropdown'] = true;
        }

        $paginator   = $this->notificationRepository->getPaginatedForRecipient($recipientType, $user->getAuthIdentifier(), $filters, $perPage);
        $unreadCount = $this->notificationRepository->countUnreadForRecipient($recipientType, $user->getAuthIdentifier(), ! empty($filters['is_super_admin_dropdown']));

        $paginator->through(function (NotificationRecipient $recipient) {
            $notif       = $recipient->notification;
            $rawType     = (int) ($notif?->type ?? Constant::NOTIFICATION_TYPE_GENERAL);
            $displayedAt = $notif?->chat_class_id !== null ? $notif->updated_at : $notif?->created_at;

            if ($notif?->chat_class_id === null && $rawType === Constant::NOTIFICATION_TYPE_GENERAL) {
                $title   = mb_strtolower($notif?->title ?? '');
                $content = mb_strtolower($notif?->content ?? '');

                if (str_contains($title, 'đăng ký') || str_contains($content, 'đăng ký')) {
                    $rawType = Constant::NOTIFICATION_TYPE_CENTER_REGISTRATION;
                } elseif (str_contains($title, 'gia hạn') || str_contains($content, 'gia hạn')) {
                    $rawType = Constant::NOTIFICATION_TYPE_SUBSCRIPTION_RENEWAL;
                }
            }

            return [
                'id'              => $recipient->id,
                'notification_id' => $recipient->notification_id,
                'is_chat'         => $notif?->chat_class_id !== null,
                'title'           => $notif?->title ?? 'Thông báo',
                'content'         => $notif?->content ?? '',
                'type'            => $rawType,
                'center_id'       => $notif?->center_id ?? null,
                'chat_class_id'   => $notif?->chat_class_id,
                'center_name'     => $notif?->center?->name ?? null,
                'is_read'         => $recipient->read_at !== null,
                'read_at'         => $recipient->read_at?->format('d/m/Y H:i'),
                'created_at'      => $displayedAt ? $displayedAt->diffForHumans() : $recipient->created_at->diffForHumans(),
                'full_created_at' => $displayedAt ? $displayedAt->format('d/m/Y H:i') : $recipient->created_at->format('d/m/Y H:i'),
            ];
        });

        return [
            'notifications' => $paginator,
            'unread_count'  => $unreadCount,
        ];
    }

    /**
     * @param  int             $id
     * @param  Authenticatable $user
     * @param  string          $role
     * @return bool
     */
    public function markAsRead(int $id, Authenticatable $user, string $role): bool
    {
        $recipientType = $this->resolveRecipientType($role);

        return $this->notificationRepository->markAsRead($id, $recipientType, $user->getAuthIdentifier());
    }

    /**
     * @param  Authenticatable $user
     * @param  string          $role
     * @return int
     */
    public function markAllAsRead(Authenticatable $user, string $role): int
    {
        $recipientType = $this->resolveRecipientType($role);

        return $this->notificationRepository->markAllAsRead($recipientType, $user->getAuthIdentifier());
    }

    /**
     * @param  array<string, mixed>                  $notificationData
     * @param  array<int, array{type: int, id: int}> $recipients
     * @return Notification
     */
    public function send(array $notificationData, array $recipients): Notification
    {
        return $this->notificationRepository->createAndBroadcast($notificationData, $recipients);
    }

    /**
     * Resolve numeric recipient type from role string.

     * @param string $role
     */
    protected function resolveRecipientType(string $role): int
    {
        return match ($role) {
            'admin'   => Constant::RECIPIENT_TYPE_ADMIN,
            'teacher' => Constant::RECIPIENT_TYPE_TEACHER,
            'student' => Constant::RECIPIENT_TYPE_STUDENT,
            default   => Constant::RECIPIENT_TYPE_ADMIN,
        };
    }
}
