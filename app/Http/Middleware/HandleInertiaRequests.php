<?php

namespace App\Http\Middleware;

use App\Enums\Constant;
use App\Models\Center;
use App\Models\NotificationRecipient;
use App\Models\SeoMetadata;
use App\Models\SubscriptionPlan;
use App\Models\SystemSetting;
use App\Services\Permission\PermissionServiceInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     * @param Request $request
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     * @param  Request              $request
     */
    public function share(Request $request): array
    {
        $user = null;
        $role = null;

        if (Auth::guard('admin')->check()) {
            $user = Auth::guard('admin')->user();
            $role = 'admin';
        } elseif (Auth::guard('teacher')->check()) {
            $user = Auth::guard('teacher')->user();
            $role = 'teacher';
        } elseif (Auth::guard('student')->check()) {
            $user = Auth::guard('student')->user();
            $role = 'student';
        }

        $userData     = null;
        $adminRoleStr = null;

        if ($user && $role) {
            $username = match ($role) {
                'admin'   => $user->username,
                'teacher' => $user->username ?? $user->teacher_code,
                'student' => $user->username ?? $user->student_code,
            };

            $fullName = match ($role) {
                'admin'   => $user->full_name,
                'teacher' => $user->full_name,
                'student' => $user->full_name,
            };

            if ($role === 'admin') {
                $adminRoleStr = ($user->role === Constant::ROLE_SUPER_ADMIN || $user->role === 'super_admin' || (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()))
                    ? 'super_admin'
                    : 'admin';
            }

            $userData = [
                'id'         => $user->id,
                'username'   => $username,
                'email'      => $user->email ?? null,
                'full_name'  => $fullName,
                'role'       => $role,
                'admin_role' => $adminRoleStr,
                'center_id'  => ($role === 'admin' && method_exists($user, 'assignedCenterId')) ? $user->assignedCenterId() : null,
            ];
        }

        $permissions = [];
        $centerData  = null;

        if ($user && $role) {
            $permissionService = app(PermissionServiceInterface::class);
            $permissions       = $permissionService->getPermissionsForUser($role, $adminRoleStr);

            $centerModel = null;

            if ($role === 'admin') {
                if ($adminRoleStr !== 'super_admin' && method_exists($user, 'centers')) {
                    $centerModel = $user->centers()->first();
                }
            } elseif ($role === 'teacher' || $role === 'student') {
                if (! empty($user->center_id)) {
                    $centerModel = Center::find($user->center_id);
                }
            }

            if ($centerModel) {
                $expiresAt         = $centerModel->expires_at;
                $isExpired         = $expiresAt ? $expiresAt->isPast() : false;
                $daysRemaining     = $expiresAt ? (int) max(0, ceil(now()->diffInHours($expiresAt, false) / 24)) : 999;
                $expiringSoon      = $expiresAt ? (! $isExpired && $daysRemaining <= 7) : false;
                $expiring1DayAlert = $expiresAt ? (! $isExpired && $daysRemaining <= 1) : false;

                $currentPlan = $centerModel->currentPlan();

                $centerData = [
                    'id'                    => $centerModel->id,
                    'code'                  => $centerModel->code,
                    'name'                  => $centerModel->name,
                    'subscription_plan_id'  => (int) $centerModel->subscription_plan_id,
                    'plan_type'             => (int) $centerModel->plan_type,
                    'allowed_features'      => $currentPlan?->allowed_features ?? [],
                    'max_classes'           => $centerModel->max_classes,
                    'max_students'          => $centerModel->max_students,
                    'active_classes_count'  => $centerModel->classes()->whereIn('status', [Constant::CLASS_STATUS_INACTIVE, Constant::CLASS_STATUS_ACTIVE])->count(),
                    'active_students_count' => $centerModel->students()->where('status', Constant::STUDENT_STATUS_ACTIVE)->count(),
                    'active_rooms_count'    => $centerModel->rooms()->whereIn('status', [Constant::ROOM_STATUS_PAUSED, Constant::ROOM_STATUS_ACTIVE])->count(),
                    'expires_at'            => $expiresAt ? $expiresAt->toIso8601String() : null,
                    'is_expired'            => $isExpired,
                    'expiring_soon'         => $expiringSoon,
                    'expiring_1day'         => $expiring1DayAlert,
                    'days_remaining'        => $daysRemaining,
                ];
            }
        }

        $userNotifications        = [];
        $unreadNotificationsCount = 0;

        if ($user && $role) {
            $numericRecipientType = match ($role) {
                'admin'   => Constant::RECIPIENT_TYPE_ADMIN,
                'teacher' => Constant::RECIPIENT_TYPE_TEACHER,
                'student' => Constant::RECIPIENT_TYPE_STUDENT,
                default   => 1,
            };

            $recipients = NotificationRecipient::where('recipient_type', $numericRecipientType)
                ->where('recipient_id', $user->id)
                ->with(['notification.center'])
                ->latest('id')
                ->limit(10)
                ->get();

            $unreadNotificationsCount = NotificationRecipient::where('recipient_type', $numericRecipientType)
                ->where('recipient_id', $user->id)
                ->whereNull('read_at')
                ->count();

            $userNotifications = $recipients->map(function (NotificationRecipient $recipient) {
                $notif = $recipient->notification;

                return [
                    'id'              => $recipient->id,
                    'notification_id' => $recipient->notification_id,
                    'title'           => $notif?->title ?? 'Thông báo',
                    'content'         => $notif?->content ?? '',
                    'type'            => $notif?->type ?? 'general',
                    'center_id'       => $notif?->center_id ?? null,
                    'center_name'     => $notif?->center?->name ?? null,
                    'is_read'         => $recipient->read_at !== null,
                    'read_at'         => $recipient->read_at?->format('d/m/Y H:i'),
                    'created_at'      => $notif?->created_at ? $notif->created_at->diffForHumans() : $recipient->created_at->diffForHumans(),
                ];
            })->toArray();
        }

        $routeName = $request->route()?->getName();

        if (! $routeName || ! in_array($routeName, ['home', 'services', 'about', 'contact'], true)) {
            $path      = trim($request->getPathInfo(), '/');
            $routeName = match ($path) {
                '', 'home' => 'home',
                'services' => 'services',
                'about'    => 'about',
                'contact'  => 'contact',
                default    => null,
            };
        }

        $seoMetadata = SeoMetadata::getByRouteName($routeName);

        return [
            ...parent::share($request),
            'name'               => config('app.name'),
            'subscription_plans' => SubscriptionPlan::orderBy('price', 'asc')->get(),
            'center'             => $centerData,
            'auth'               => [
                'user'                       => $userData,
                'role'                       => $role,
                'permissions'                => $permissions,
                'notifications'              => $userNotifications,
                'unread_notifications_count' => $unreadNotificationsCount,
            ],
            'contactInfo' => [
                'company_name' => SystemSetting::getByKey('company_name', 'Công ty Cổ phần SAM Digital'),
                'address'      => SystemSetting::getByKey('contact_address', 'Tòa nhà Sam Tower, Số 100 Phố Giáo Dục, Hà Nội'),
                'phone'        => SystemSetting::getByKey('contact_phone', '0988.123.456'),
                'email'        => SystemSetting::getByKey('contact_email', 'phucstt01@gmail.com'),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info'    => fn () => $request->session()->get('info'),
            ],
            'seo' => $seoMetadata ? [
                'title'         => $seoMetadata->title,
                'description'   => $seoMetadata->description,
                'keywords'      => $seoMetadata->keywords,
                'og_image'      => $seoMetadata->og_image,
                'canonical_url' => $seoMetadata->canonical_url,
            ] : null,
        ];
    }
}
