<?php

namespace App\Services\Auth;

interface PasswordResetServiceInterface
{
    /**
     * Send OTP for password reset.
     * @return array{success: bool, error: string|null}
     * @param  string                                   $accountType
     * @param  string                                   $email
     */
    public function sendOtp(string $accountType, string $email): array;

    /**
     * Verify OTP and authenticate user.
     * @return array{success: bool, error: string|null}
     * @param  string                                   $accountType
     * @param  string                                   $email
     * @param  string                                   $otp
     */
    public function verifyOtpAndLogin(string $accountType, string $email, string $otp): array;

    /**
     * Update password for forced reset.
     * @return array{success: bool, error: string|null}
     * @param  string                                   $newPassword
     */
    public function updateForcedPassword(string $newPassword): array;
}
