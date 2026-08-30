<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class CheckPlanFeature
{
    /**
     * Handle an incoming request.
     *
     * @param Closure(Request): (Response) $next
     * @param Request                      $request
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // Super Admin có toàn quyền truy cập tất cả tính năng
        if ($user instanceof Admin && $user->isSuperAdmin()) {
            return $next($request);
        }

        $center = $this->resolveCenter($user);

        if (! $center) {
            return $next($request);
        }

        // 1. Kiểm tra hết hạn gói dịch vụ (chặn hoàn toàn khi hết hạn)
        if ($center->expires_at && $center->expires_at->isPast()) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success'    => false,
                    'message'    => 'Gói dịch vụ của trung tâm đã hết hạn. Vui lòng liên hệ Quản trị viên để gia hạn.',
                    'code'       => 'CENTER_SUBSCRIPTION_EXPIRED',
                    'expires_at' => $center->expires_at->toIso8601String(),
                ], Response::HTTP_FORBIDDEN);
            }

            return Inertia::render('UpgradePlan', [
                'status'       => 403,
                'reason'       => 'expired',
                'title'        => 'Gói Dịch Vụ Đã Hết Hạn',
                'message'      => 'Gói dịch vụ của trung tâm đã hết hạn sử dụng. Vui lòng liên hệ Quản trị viên hệ thống để gia hạn và tiếp tục sử dụng.',
                'currentPlan'  => $center->subscription_plan_id,
                'planType'     => $center->plan_type,
                'requiredPlan' => 'basic',
            ])->toResponse($request)->setStatusCode(Response::HTTP_FORBIDDEN);
        }

        // 2. Kiểm tra tính năng theo gói (Feature Gating)
        $routeName = $request->route()?->getName();

        if (! $routeName) {
            return $next($request);
        }

        $blockedFeature = $this->findBlockedFeatureForRoute($routeName, $center);

        if ($blockedFeature) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success'       => false,
                    'message'       => "Tính năng '{$blockedFeature['name']}' yêu cầu nâng cấp lên gói Nâng Cao.",
                    'code'          => 'PLAN_FEATURE_LOCKED',
                    'feature'       => $blockedFeature['key'],
                    'required_plan' => 'advanced',
                ], Response::HTTP_FORBIDDEN);
            }

            return Inertia::render('UpgradePlan', [
                'status'       => 403,
                'reason'       => 'feature_locked',
                'title'        => 'Tính Năng Yêu Cầu Nâng Cấp Gói',
                'feature'      => $blockedFeature['key'],
                'featureName'  => $blockedFeature['name'],
                'message'      => "Tính năng '{$blockedFeature['name']}' ({$blockedFeature['description']}) chỉ có trong Gói Nâng Cao. Vui lòng liên hệ Quản trị viên hệ thống để nâng cấp gói cho trung tâm của bạn.",
                'currentPlan'  => $center->subscription_plan_id,
                'planType'     => $center->plan_type,
                'requiredPlan' => 'advanced',
            ])->toResponse($request)->setStatusCode(Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }

    /**
     * Lấy Center gắn liền với tài khoản người dùng đang đăng nhập.
     * @param mixed $user
     */
    private function resolveCenter(mixed $user): ?Center
    {
        if ($user instanceof Teacher || $user instanceof Student) {
            return $user->center ?? ($user->center_id ? Center::find($user->center_id) : null);
        }

        if ($user instanceof Admin) {
            return $user->centers()->first();
        }

        return null;
    }

    /**
     * Kiểm tra xem route hiện tại có thuộc tính năng bị khóa của gói hay không.
     *
     * @return array<string, string>|null
     * @param  string                     $routeName
     * @param  Center                     $center
     */
    private function findBlockedFeatureForRoute(string $routeName, Center $center): ?array
    {
        $featuresConfig = config('plan_features.features', []);

        foreach ($featuresConfig as $featureKey => $featureDef) {
            $isMatch = false;

            // Check exact route names
            if (! empty($featureDef['route_names']) && in_array($routeName, $featureDef['route_names'], true)) {
                $isMatch = true;
            }

            // Check route prefixes
            if (! $isMatch && ! empty($featureDef['route_prefixes'])) {
                foreach ($featureDef['route_prefixes'] as $prefix) {
                    if (str_starts_with($routeName, $prefix)) {
                        $isMatch = true;

                        break;
                    }
                }
            }

            // Check route suffixes
            if (! $isMatch && ! empty($featureDef['route_suffixes'])) {
                foreach ($featureDef['route_suffixes'] as $suffix) {
                    if (str_ends_with($routeName, $suffix)) {
                        $isMatch = true;

                        break;
                    }
                }
            }

            if ($isMatch) {
                // Nếu route khớp với feature này, kiểm tra xem center có quyền dùng không
                if (! $center->hasFeature($featureKey)) {
                    return [
                        'key'         => $featureKey,
                        'name'        => $featureDef['name'] ?? $featureKey,
                        'description' => $featureDef['description'] ?? '',
                    ];
                }
            }
        }

        return null;
    }
}
