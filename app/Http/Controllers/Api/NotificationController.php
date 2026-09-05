<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Notification\NotificationServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificationServiceInterface $notificationService
    ) {
    }

    private function resolveAuth(): ?array
    {
        if (Auth::guard('admin')->check()) {
            return [Auth::guard('admin')->user(), 'admin'];
        }

        if (Auth::guard('teacher')->check()) {
            return [Auth::guard('teacher')->user(), 'teacher'];
        }

        if (Auth::guard('student')->check()) {
            return [Auth::guard('student')->user(), 'student'];
        }

        return null;
    }

    /**
     * Get recent notifications and unread count for current user.
     * @param Request $request
     */
    public function index(Request $request): JsonResponse
    {
        $auth = $this->resolveAuth();

        if (! $auth) {
            return response()->json([
                'success'       => false,
                'notifications' => [],
                'unread_count'  => 0,
            ], 401);
        }

        [$user, $role] = $auth;

        $filters   = array_merge($request->all(), ['for_dropdown' => true]);
        $result    = $this->notificationService->getPaginatedNotifications($user, $role, $filters, 20);
        $paginator = $result['notifications'];
        $items     = $paginator instanceof \Illuminate\Contracts\Pagination\LengthAwarePaginator ? $paginator->items() : $paginator;

        return response()->json([
            'success'       => true,
            'notifications' => $items,
            'unread_count'  => $result['unread_count'],
        ]);
    }

    /**
     * Mark a single notification as read.
     * @param int $id
     */
    public function markAsRead(int $id): JsonResponse
    {
        $auth = $this->resolveAuth();

        if (! $auth) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        [$user, $role] = $auth;

        $this->notificationService->markAsRead($id, $user, $role);
        $result = $this->notificationService->getPaginatedNotifications($user, $role, ['for_dropdown' => true], 1);

        return response()->json([
            'success'      => true,
            'unread_count' => $result['unread_count'],
        ]);
    }

    /**
     * Mark all notifications as read for current user.
     */
    public function markAllAsRead(): JsonResponse
    {
        $auth = $this->resolveAuth();

        if (! $auth) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        [$user, $role] = $auth;

        $this->notificationService->markAllAsRead($user, $role);

        return response()->json([
            'success'      => true,
            'unread_count' => 0,
        ]);
    }
}
