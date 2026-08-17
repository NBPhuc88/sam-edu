<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\SendPasswordResetOtpRequest;
use App\Http\Requests\Auth\UpdateForcedPasswordRequest;
use App\Http\Requests\Auth\VerifyPasswordResetOtpRequest;
use App\Services\Auth\PasswordResetServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetController extends Controller
{
    public function __construct(
        protected PasswordResetServiceInterface $passwordResetService
    ) {
    }

    /**
     * Display forgot password form.
     */
    public function showForgotPasswordForm(): Response
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    /**
     * Generate and send 6-digit OTP to user's email.
     * @param SendPasswordResetOtpRequest $request
     */
    public function sendOtp(SendPasswordResetOtpRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $result = $this->passwordResetService->sendOtp(
            $validated['account_type'],
            $validated['email']
        );

        if (! $result['success']) {
            return redirect()->back()->withErrors([
                'email' => $result['error'],
            ])->withInput();
        }

        return redirect()->route('password.verify_otp.show', [
            'email'        => $validated['email'],
            'account_type' => $validated['account_type'],
        ])->with('success', 'Mã OTP 6 chữ số đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!');
    }

    /**
     * Display OTP verification form.
     * @param Request $request
     */
    public function showVerifyOtpForm(Request $request): Response
    {
        return Inertia::render('Auth/VerifyOtp', [
            'email'        => (string) $request->query('email', ''),
            'account_type' => (string) $request->query('account_type', 'admin'),
        ]);
    }

    /**
     * Verify OTP, authenticate user, and mark forced password change flag.
     * @param VerifyPasswordResetOtpRequest $request
     */
    public function verifyOtp(VerifyPasswordResetOtpRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $result = $this->passwordResetService->verifyOtpAndLogin(
            $validated['account_type'],
            $validated['email'],
            $validated['otp']
        );

        if (! $result['success']) {
            return redirect()->back()->withErrors([
                'otp' => $result['error'],
            ])->withInput();
        }

        return redirect()->route('password.force_change.show')
            ->with('info', 'Xác thực OTP thành công! Vui lòng cập nhật mật khẩu mới ngay để bảo mật tài khoản.');
    }

    /**
     * Display mandatory password change form.
     */
    public function showForceChangePasswordForm(): Response|RedirectResponse
    {
        if (! session('must_change_password')) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/ForceChangePassword');
    }

    /**
     * Update forced password and clear session restriction flag.
     * @param UpdateForcedPasswordRequest $request
     */
    public function updateForcedPassword(UpdateForcedPasswordRequest $request): RedirectResponse
    {
        $result = $this->passwordResetService->updateForcedPassword(
            (string) $request->input('password')
        );

        if (! $result['success']) {
            return redirect()->route('login')->with('error', $result['error']);
        }

        return redirect()->route('dashboard')->with('success', 'Cập nhật mật khẩu mới thành công! Bạn có thể sử dụng toàn bộ tính năng.');
    }
}
