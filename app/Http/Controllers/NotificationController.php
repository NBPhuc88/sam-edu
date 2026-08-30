<?php

namespace App\Http\Controllers;

use App\Services\Notification\NotificationServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificationServiceInterface $notificationService
    ) {
    }

    /**
     * Display paginated notifications list page.
     * @param Request $request
     */
    public function index(Request $request): Response
    {
        $user    = $request->user();
        $role    = $user?->role ?? 'admin';
        $filters = $request->only(['keyword', 'is_read', 'type']);

        $data = $this->notificationService->getPaginatedNotifications($user, $role, $filters, 15);

        return Inertia::render('Admin/Notifications/Index', [
            'notifications' => $data['notifications'],
            'unread_count'  => $data['unread_count'],
            'filters'       => $filters,
        ]);
    }

    /**
     * Mark single notification recipient record as read.
     * @param Request $request
     * @param int     $id
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $user    = $request->user();
        $role    = $user?->role ?? 'admin';
        $success = $this->notificationService->markAsRead($id, $user, $role);

        return response()->json(['success' => $success]);
    }

    /**
     * Mark all notification recipients for current user as read.
     * @param Request $request
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user  = $request->user();
        $role  = $user?->role ?? 'admin';
        $count = $this->notificationService->markAllAsRead($user, $role);

        return response()->json(['success' => true, 'count' => $count]);
    }
}
