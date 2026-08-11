<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\Auth\AuthServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    protected AuthServiceInterface $authService;

    public function __construct(AuthServiceInterface $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Display the login view.
     */
    public function showLoginForm(): Response
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Handle an incoming authentication request.
     * @param LoginRequest $request
     */
    public function login(LoginRequest $request): RedirectResponse
    {
        $credentials = $request->validated();

        $result = $this->authService->authenticate(
            (string) $credentials['role'],
            (string) $credentials['username'],
            (string) $credentials['password']
        );

        if (! $result['success']) {
            return back()->withErrors([
                'username' => $result['error'] ?? 'Đăng nhập thất bại.',
            ]);
        }

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Destroy an authenticated session.
     * @param Request $request
     */
    public function logout(Request $request): RedirectResponse
    {
        $this->authService->logout();

        return redirect()->route('login');
    }
}
