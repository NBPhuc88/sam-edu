<?php

namespace App\Http\Middleware;

use App\Services\Permission\PermissionServiceInterface;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class AutoCheckPermission
{
    /**
     * Ánh xạ Laravel standard action suffix → Permission action.
     *
     * @var array<string, string>
     */
    private const ACTION_MAP = [
        'store'   => 'create',
        'update'  => 'edit',
        'destroy' => 'delete',
        'import'  => 'create',
        'export'  => 'index',
    ];

    public function __construct(
        protected PermissionServiceInterface $permissionService
    ) {
    }

    /**
     * Handle an incoming request.
     * @param Request $request
     * @param Closure $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $routeName = $request->route()?->getName();

        // Nếu route không có tên hoặc không theo dạng module.action → cho qua
        if (! $routeName || ! str_contains($routeName, '.')) {
            return $next($request);
        }

        $permissionCode = $this->resolvePermissionCode($routeName);

        // Nếu không map được permission code nào trong danh mục hệ thống → cho qua
        if (! $permissionCode || ! $this->permissionService->permissionExists($permissionCode)) {
            return $next($request);
        }

        $effectiveRole = $this->resolveEffectiveRole();

        if (! $effectiveRole) {
            return redirect()->route('login');
        }

        // Super Admin có toàn quyền
        if ($effectiveRole === 'super_admin') {
            return $next($request);
        }

        // Kiểm tra quyền của role
        if ($this->permissionService->roleHasPermission($effectiveRole, $permissionCode)) {
            return $next($request);
        }

        // Không có quyền → Trả về trang 404 (Không để lộ thông tin trang)
        return Inertia::render('Error', [
            'status'  => 404,
            'message' => 'Trang bạn đang tìm kiếm không tồn tại hoặc đường dẫn không đúng.',
        ])->toResponse($request)->setStatusCode(404);
    }

    /**
     * Resolve permission code from route name.
     * @param string $routeName
     */
    private function resolvePermissionCode(string $routeName): ?string
    {
        // 1. Direct match with route name
        if ($this->permissionService->permissionExists($routeName)) {
            return $routeName;
        }

        $parts = explode('.', $routeName);

        if (count($parts) < 2) {
            return null;
        }

        // 2. Multi-part without last action (e.g. 'classes.exam-results.index' -> 'classes.exam-results')
        $withoutLastAction = implode('.', array_slice($parts, 0, -1));

        if ($this->permissionService->permissionExists($withoutLastAction)) {
            return $withoutLastAction;
        }

        // 3. Multi-part with first module and last action (e.g. 'attendance.session.save' -> 'attendance.save')
        $module      = $parts[0];
        $action      = end($parts);
        $directCross = "{$module}.{$action}";

        if ($this->permissionService->permissionExists($directCross)) {
            return $directCross;
        }

        // 4. Standard action mapping (e.g. 'store' -> 'create', 'update' -> 'edit', 'destroy' -> 'delete')
        $mappedAction = self::ACTION_MAP[$action] ?? $action;
        $standardCode = "{$module}.{$mappedAction}";

        if ($this->permissionService->permissionExists($standardCode)) {
            return $standardCode;
        }

        // 5. Check if without last action + mapped action exists
        $mappedMultiCode = "{$withoutLastAction}.{$mappedAction}";

        if ($this->permissionService->permissionExists($mappedMultiCode)) {
            return $mappedMultiCode;
        }

        return null;
    }

    /**
     * Xác định effective role của user đang đăng nhập.
     */
    private function resolveEffectiveRole(): ?string
    {
        if (Auth::guard('admin')->check()) {
            $admin = Auth::guard('admin')->user();

            return ($admin && $admin->role === 'super_admin') ? 'super_admin' : 'admin';
        }

        if (Auth::guard('teacher')->check()) {
            return 'teacher';
        }

        if (Auth::guard('student')->check()) {
            return 'student';
        }

        return null;
    }
}
