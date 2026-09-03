<?php

namespace App\Http\Middleware;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckCenterSubscription
{
    /**
     * Handle an incoming request.
     *
     * @param Closure(Request): (Response) $next
     * @param Request                      $request
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('admin')->user()
            ?? Auth::guard('teacher')->user()
            ?? Auth::guard('student')->user()
            ?? $request->user();

        if (! $user) {
            return $next($request);
        }

        // Super Admin có toàn quyền truy cập hệ thống
        if ($user instanceof Admin && (int) $user->role === Constant::ROLE_SUPER_ADMIN) {
            return $next($request);
        }

        $center = null;

        if ($user instanceof Teacher || $user instanceof Student) {
            /** @var Center|null $center */
            $center = $user->center;
        } elseif ($user instanceof Admin) {
            /** @var Center|null $center */
            $center = $user->centers()->first();
        }

        if (! $center) {
            return $this->handleForbidden($request, 'Tài khoản chưa được liên kết hoặc phân công quản lý trung tâm nào.');
        }

        // Tự động đồng bộ trạng thái: chỉ tính hết hạn sau 23h của ngày hết hạn
        if ($center->expires_at) {
            if ($center->isExpired()) {
                if ((int) $center->status === Constant::CENTER_STATUS_ACTIVE) {
                    $center->update(['status' => Constant::CENTER_STATUS_EXPIRED]);
                }
            } else {
                // Trong ngày hết hạn (trước 23h) hoặc còn hạn, tự động khôi phục active nếu trước đó bị đánh dấu expired
                if ((int) $center->status === Constant::CENTER_STATUS_EXPIRED) {
                    $center->update(['status' => Constant::CENTER_STATUS_ACTIVE]);
                }
            }
        }

        // Nếu Trung tâm không ở trạng thái Đang hoạt động -> Chặn truy cập
        if ((int) $center->status !== Constant::CENTER_STATUS_ACTIVE) {
            $errorMessage = (int) $center->status === Constant::CENTER_STATUS_PAUSED
                ? 'Trung tâm của bạn hiện đang tạm dừng hoạt động. Vui lòng liên hệ Quản trị viên hệ thống.'
                : 'Gói dịch vụ của Trung tâm đã hết hạn. Vui lòng liên hệ Quản trị viên để gia hạn.';

            return $this->handleForbidden($request, $errorMessage);
        }

        return $next($request);
    }

    /**
     * Xử lý đăng xuất phiên làm việc và phản hồi lỗi khi Trung tâm không hoạt động.
     * @param Request $request
     * @param string  $message
     */
    private function handleForbidden(Request $request, string $message): Response
    {
        Auth::guard('admin')->logout();
        Auth::guard('teacher')->logout();
        Auth::guard('student')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'success' => false,
                'message' => $message,
            ], Response::HTTP_FORBIDDEN);
        }

        return redirect()->route('login')->withErrors([
            'username' => $message,
        ]);
    }
}
