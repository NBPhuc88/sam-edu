<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\EnsurePasswordChange::class,
        ]);

        // Alias cho middleware kiểm tra đăng nhập bất kỳ guard (admin|center|teacher|student)
        $middleware->alias([
            'auth.any'           => \App\Http\Middleware\RequireAuth::class,
            'auto.permission'    => \App\Http\Middleware\AutoCheckPermission::class,
            'check.plan.feature' => \App\Http\Middleware\CheckPlanFeature::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\HttpExceptionInterface $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return null;
            }

            $statusCode = $e->getStatusCode();

            if (in_array($statusCode, [403, 404, 500, 503], true)) {
                $message = $e->getMessage();

                return \Inertia\Inertia::render('Error', [
                    'status'  => $statusCode,
                    'message' => $message ?: null,
                ])->toResponse($request)->setStatusCode($statusCode);
            }

            return null;
        });
    })->create();
