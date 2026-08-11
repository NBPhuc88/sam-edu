<?php

namespace App\Http\Middleware;

use App\Models\SubscriptionPlan;
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
        } elseif (Auth::guard('center')->check()) {
            $user = Auth::guard('center')->user();
            $role = 'center';
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
                'center'  => $user->username ?? $user->code,
                'teacher' => $user->username ?? $user->teacher_code,
                'student' => $user->username ?? $user->student_code,
            };

            $fullName = match ($role) {
                'admin'   => $user->full_name,
                'center'  => $user->name,
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
            ];
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

        $seoMetadata = \App\Models\SeoMetadata::getByRouteName($routeName);

        return [
            ...parent::share($request),
            'name'               => config('app.name'),
            'subscription_plans' => SubscriptionPlan::orderBy('price', 'asc')->get(),
            'auth'               => [
                'user' => $userData,
                'role' => $role,
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
