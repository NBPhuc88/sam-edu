<?php

namespace App\Http\Middleware;

use App\Enums\Constant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * RequireAuth Middleware
 *
 * Kiểm tra đăng nhập cho bất kỳ guard nào trong hệ thống:
 * admin, teacher, student.
 * Đồng thời bảo vệ tính duy nhất của phiên đăng nhập (single device login).
 *
 * Nếu không có guard nào authenticated → redirect về /login.
 *
 * Xem: .agents/AGENTS.md - Mục 4: Authentication
 */
class RequireAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $guards = ['admin', 'teacher', 'student'];

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                $user = Auth::guard($guard)->user();

                // Kiểm tra trạng thái tài khoản có bị khóa hoặc dừng truy cập hay không
                $isStatusInvalid = false;
                $statusMessage   = '';

                if ($guard === 'admin') {
                    $isAdminActive = method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()
                        ? true
                        : (! isset($user->status) || $user->status === null || (int) $user->status === Constant::STATUS_ACTIVE);

                    if (! $isAdminActive) {
                        $isStatusInvalid = true;
                        $statusMessage   = 'Tài khoản Quản trị viên của bạn đã bị khóa hoặc chưa kích hoạt. Phiên làm việc đã kết thúc.';
                    }
                } elseif ($guard === 'teacher' && isset($user->status) && (int) $user->status === Constant::TEACHER_STATUS_LOCKED) {
                    $isStatusInvalid = true;
                    $statusMessage   = 'Tài khoản Giáo viên của bạn đã bị khóa. Phiên làm việc đã kết thúc.';
                } elseif ($guard === 'student' && isset($user->status) && (int) $user->status !== Constant::STUDENT_STATUS_ACTIVE) {
                    $isStatusInvalid = true;
                    $statusMessage   = 'Tài khoản Học sinh đã nghỉ học hoặc đã tốt nghiệp. Phiên làm việc đã kết thúc.';
                }

                if ($isStatusInvalid) {
                    Auth::guard($guard)->logout();

                    if ($request->hasSession()) {
                        $request->session()->invalidate();
                        $request->session()->regenerateToken();
                    }

                    if ($request->expectsJson()) {
                        return response()->json(['message' => $statusMessage], 401);
                    }

                    return redirect()->route('login')->withErrors(['username' => $statusMessage]);
                }

                $sessionToken = $request->session()->get('auth_device_token_' . $guard);
                $dbToken      = $user?->current_session_id;

                if ($user && $dbToken && $sessionToken && $dbToken !== $sessionToken) {
                    Auth::guard($guard)->logout();
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();

                    if ($request->expectsJson()) {
                        return response()->json([
                            'message' => 'Tài khoản của bạn đã được đăng nhập từ một thiết bị khác. Phiên làm việc này đã kết thúc.',
                        ], 401);
                    }

                    return redirect()->route('login')->withErrors([
                        'username' => 'Tài khoản của bạn đã được đăng nhập từ một thiết bị khác. Phiên làm việc này đã kết thúc.',
                    ]);
                }

                if ($user) {
                    if (! $dbToken) {
                        $newToken = Str::random(40);
                        $user->update(['current_session_id' => $newToken]);
                        $request->session()->put('auth_device_token_' . $guard, $newToken);
                    } elseif (! $sessionToken) {
                        $request->session()->put('auth_device_token_' . $guard, $dbToken);
                    }
                }

                return $next($request);
            }
        }

        // Not authenticated via any guard → redirect to login
        return redirect()->route('login');
    }
}
