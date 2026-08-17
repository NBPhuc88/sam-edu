<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * RequireAuth Middleware
 *
 * Kiểm tra đăng nhập cho bất kỳ guard nào trong hệ thống:
 * admin, teacher, student.
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
                return $next($request);
            }
        }

        // Not authenticated via any guard → redirect to login
        return redirect()->route('login');
    }
}
