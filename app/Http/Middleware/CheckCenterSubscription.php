<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use Closure;
use Illuminate\Http\Request;
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
        $user = $request->user();

        if (! $user) {
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

        if ($center && $center->expires_at && $center->expires_at->isPast()) {
            return response()->json([
                'success'    => false,
                'message'    => 'Center subscription has expired. Please renew to continue.',
                'code'       => 'CENTER_SUBSCRIPTION_EXPIRED',
                'expires_at' => $center->expires_at->toIso8601String(),
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
