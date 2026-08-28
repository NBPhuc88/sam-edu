<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationRecipient;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get recent notifications and unread count for current user.
     */
    public function index(): JsonResponse
    {
        $recipientType = null;
        $recipientId   = null;

        if (Auth::guard('admin')->check()) {
            $recipientType = 'admin';
            $recipientId   = Auth::guard('admin')->id();
        } elseif (Auth::guard('teacher')->check()) {
            $recipientType = 'teacher';
            $recipientId   = Auth::guard('teacher')->id();
        } elseif (Auth::guard('student')->check()) {
            $recipientType = 'student';
            $recipientId   = Auth::guard('student')->id();
        }

        if (! $recipientType || ! $recipientId) {
            return response()->json([
                'success'       => false,
                'notifications' => [],
                'unread_count'  => 0,
            ], 401);
        }

        $recipients = NotificationRecipient::where('recipient_type', $recipientType)
            ->where('recipient_id', $recipientId)
            ->with(['notification.center'])
            ->latest('id')
            ->limit(20)
            ->get();

        $unreadCount = NotificationRecipient::where('recipient_type', $recipientType)
            ->where('recipient_id', $recipientId)
            ->whereNull('read_at')
            ->count();

        $items = $recipients->map(function (NotificationRecipient $recipient) {
            $notif = $recipient->notification;

            return [
                'id'              => $recipient->id,
                'notification_id' => $recipient->notification_id,
                'title'           => $notif?->title ?? 'Thông báo',
                'content'         => $notif?->content ?? '',
                'type'            => $notif?->type ?? 'general',
                'center_name'     => $notif?->center?->name ?? null,
                'is_read'         => $recipient->read_at !== null,
                'read_at'         => $recipient->read_at?->format('d/m/Y H:i'),
                'created_at'      => $notif?->created_at ? $notif->created_at->diffForHumans() : $recipient->created_at->diffForHumans(),
            ];
        });

        return response()->json([
            'success'       => true,
            'notifications' => $items,
            'unread_count'  => $unreadCount,
        ]);
    }

    /**
     * Mark a single notification as read.
     * @param int $id
     */
    public function markAsRead(int $id): JsonResponse
    {
        $recipientType = null;
        $recipientId   = null;

        if (Auth::guard('admin')->check()) {
            $recipientType = 'admin';
            $recipientId   = Auth::guard('admin')->id();
        } elseif (Auth::guard('teacher')->check()) {
            $recipientType = 'teacher';
            $recipientId   = Auth::guard('teacher')->id();
        } elseif (Auth::guard('student')->check()) {
            $recipientType = 'student';
            $recipientId   = Auth::guard('student')->id();
        }

        if (! $recipientType || ! $recipientId) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $recipient = NotificationRecipient::where('id', $id)
            ->where('recipient_type', $recipientType)
            ->where('recipient_id', $recipientId)
            ->first();

        if ($recipient) {
            $recipient->update(['read_at' => now()]);
        }

        $unreadCount = NotificationRecipient::where('recipient_type', $recipientType)
            ->where('recipient_id', $recipientId)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'success'      => true,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Mark all notifications as read for current user.
     */
    public function markAllAsRead(): JsonResponse
    {
        $recipientType = null;
        $recipientId   = null;

        if (Auth::guard('admin')->check()) {
            $recipientType = 'admin';
            $recipientId   = Auth::guard('admin')->id();
        } elseif (Auth::guard('teacher')->check()) {
            $recipientType = 'teacher';
            $recipientId   = Auth::guard('teacher')->id();
        } elseif (Auth::guard('student')->check()) {
            $recipientType = 'student';
            $recipientId   = Auth::guard('student')->id();
        }

        if (! $recipientType || ! $recipientId) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        NotificationRecipient::where('recipient_type', $recipientType)
            ->where('recipient_id', $recipientId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'success'      => true,
            'unread_count' => 0,
        ]);
    }
}
