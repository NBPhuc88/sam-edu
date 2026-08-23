<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class EnforceSingleSession
{
    /**
     * Handle an incoming request.
     *
     * Giới hạn đăng nhập trên duy nhất 1 thiết bị:
     * Nếu tài khoản đã có device session token trong DB và khác với token được lưu trong session hiện tại,
     * tự động hủy phiên hiện tại và đăng xuất.
     *
     * @param \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response) $next
     * @param Request                                                                          $request
     */
    public function handle(Request $request, Closure $next): Response
    {
        $guards = ['admin', 'teacher', 'student'];

        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                $user         = Auth::guard($guard)->user();
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

                // Tự động đồng bộ device token nếu chưa có trong session hoặc DB
                if ($user) {
                    if (! $dbToken) {
                        $newToken = Str::random(40);
                        $user->update(['current_session_id' => $newToken]);
                        $request->session()->put('auth_device_token_' . $guard, $newToken);
                    } elseif (! $sessionToken) {
                        $request->session()->put('auth_device_token_' . $guard, $dbToken);
                    }
                }
            }
        }

        return $next($request);
    }
}
