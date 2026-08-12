<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChange
{
    /**
     * Handle an incoming request.
     *
     * @param \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response) $next
     * @param Request                                                                          $request
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (session('must_change_password')) {
            if (! $request->is('force-change-password') && ! $request->is('logout')) {
                return redirect()->route('password.force_change.show')
                    ->with('warning', 'Bạn vừa đăng nhập bằng OTP. Vui lòng cập nhật mật khẩu mới để tiếp tục sử dụng hệ thống.');
            }
        }

        return $next($request);
    }
}
