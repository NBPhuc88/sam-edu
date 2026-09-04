<?php

namespace App\Http\Controllers;

use App\Services\Notification\NotificationServiceInterface;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        [$user, $role] = $this->resolveUserAndRole($request);
        $filters       = $request->only(['keyword', 'is_read', 'type']);

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
        [$user, $role] = $this->resolveUserAndRole($request);
        $success       = $this->notificationService->markAsRead($id, $user, $role);

        return response()->json(['success' => $success]);
    }

    /**
     * Mark all notification recipients for current user as read.
     * @param Request $request
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        [$user, $role] = $this->resolveUserAndRole($request);
        $count         = $this->notificationService->markAllAsRead($user, $role);

        return response()->json(['success' => true, 'count' => $count]);
    }

    /**
     * Resolve the current authenticated user and role across multi-guards.
     *
     * @return array{0: Authenticatable|null, 1: string}
     * @param  Request                                   $request
     */
    protected function resolveUserAndRole(Request $request): array
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

        $user = $request->user();

        return [$user, $user?->role ?? 'admin'];
    }
}
