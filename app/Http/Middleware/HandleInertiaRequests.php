<?php

namespace App\Http\Middleware;

use App\Models\SeoMetadata;
use App\Models\SubscriptionPlan;
use App\Models\SystemSetting;
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

        $userData = null;

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

            $userData = [
                'id'        => $user->id,
                'username'  => $username,
                'email'     => $user->email ?? null,
                'full_name' => $fullName,
                'role'      => $role,
                // admin_role chỉ tồn tại khi role = 'admin': 'super_admin' | 'admin'
                'admin_role' => $role === 'admin' ? ($user->role ?? 'admin') : null,
                'center_id'  => ($role === 'admin' && method_exists($user, 'assignedCenterId')) ? $user->assignedCenterId() : null,
            ];
        }

        $permissions = [];
        $centerData  = null;

        if ($user && $role) {
            $permissionService = app(\App\Services\Permission\PermissionServiceInterface::class);
            $adminRole         = $role === 'admin' ? ($user->role ?? 'admin') : null;
            $permissions       = $permissionService->getPermissionsForUser($role, $adminRole);

            $centerModel = null;

            if ($role === 'admin') {
                if ($adminRole !== 'super_admin' && method_exists($user, 'centers')) {
                    $centerModel = $user->centers()->first();
                }
            } elseif ($role === 'teacher' || $role === 'student') {
                if (! empty($user->center_id)) {
                    $centerModel = \App\Models\Center::find($user->center_id);
                }
            }

            if ($centerModel) {
                $expiresAt         = $centerModel->expires_at;
                $isExpired         = $expiresAt ? $expiresAt->isPast() : false;
                $daysRemaining     = $expiresAt ? (int) max(0, ceil(now()->diffInHours($expiresAt, false) / 24)) : 999;
                $expiringSoon      = $expiresAt ? (! $isExpired && $daysRemaining <= 7) : false;
                $expiring1DayAlert = $expiresAt ? (! $isExpired && $daysRemaining <= 1) : false;

                $centerData = [
                    'id'                => $centerModel->id,
                    'code'              => $centerModel->code,
                    'name'              => $centerModel->name,
                    'subscription_plan' => $centerModel->subscription_plan,
                    'expires_at'        => $expiresAt ? $expiresAt->toIso8601String() : null,
                    'is_expired'        => $isExpired,
                    'expiring_soon'     => $expiringSoon,
                    'expiring_1day'     => $expiring1DayAlert,
                    'days_remaining'    => $daysRemaining,
                ];
            }
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
                'user'        => $userData,
                'role'        => $role,
                'permissions' => $permissions,
            ],
            'contactInfo' => [
                'company_name' => SystemSetting::getByKey('company_name', 'Công ty Cổ phần Giáo dục Sam'),
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
