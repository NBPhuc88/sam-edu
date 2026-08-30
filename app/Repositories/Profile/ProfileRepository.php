<?php

namespace App\Repositories\Profile;

use App\Enums\Constant;
use Illuminate\Support\Facades\DB;

class ProfileRepository implements ProfileRepositoryInterface
{
    private function normalizeAction(int|string $action): int
    {
        return match ($action) {
            'change_password', Constant::OTP_ACTION_CHANGE_PASSWORD, 1, '1'   => Constant::OTP_ACTION_CHANGE_PASSWORD,
            'change_email_old', Constant::OTP_ACTION_CHANGE_EMAIL_OLD, 2, '2' => Constant::OTP_ACTION_CHANGE_EMAIL_OLD,
            'change_email_new', Constant::OTP_ACTION_CHANGE_EMAIL_NEW, 3, '3' => Constant::OTP_ACTION_CHANGE_EMAIL_NEW,
            'password_reset', Constant::OTP_ACTION_PASSWORD_RESET, 4, '4'     => Constant::OTP_ACTION_PASSWORD_RESET,
            default                                                           => is_numeric($action) ? (int) $action : Constant::OTP_ACTION_CHANGE_PASSWORD,
        };
    }

    /**
     * @param string                $userType
     * @param int                   $userId
     * @param string                $email
     * @param int|string            $action
     * @param string                $otpHash
     * @param ?array<string, mixed> $payload
     */
    public function createVerificationOtp(
        string $userType,
        int $userId,
        string $email,
        int|string $action,
        string $otpHash,
        ?array $payload = null
    ): void {
        $actionInt = $this->normalizeAction($action);

        DB::table('account_verification_otps')
            ->where('user_type', $userType)
            ->where('user_id', $userId)
            ->where('action', $actionInt)
            ->delete();

        DB::table('account_verification_otps')->insert([
            'user_type'  => $userType,
            'user_id'    => $userId,
            'email'      => $email,
            'action'     => $actionInt,
            'otp_hash'   => $otpHash,
            'payload'    => $payload ? json_encode($payload) : null,
            'expires_at' => now()->addMinutes(5),
            'created_at' => now(),
        ]);
    }

    /**
     * @param  string      $userType
     * @param  int         $userId
     * @param  string      $email
     * @param  int|string  $action
     * @return object|null
     */
    public function getLatestVerificationOtp(
        string $userType,
        int $userId,
        string $email,
        int|string $action
    ): ?object {
        $actionInt = $this->normalizeAction($action);

        return DB::table('account_verification_otps')
            ->where('user_type', $userType)
            ->where('user_id', $userId)
            ->where('email', $email)
            ->where('action', $actionInt)
            ->orderBy('id', 'desc')
            ->first();
    }

    /**
     * @param string     $userType
     * @param int        $userId
     * @param int|string $action
     */
    public function deleteVerificationOtp(
        string $userType,
        int $userId,
        int|string $action
    ): void {
        $actionInt = $this->normalizeAction($action);

        DB::table('account_verification_otps')
            ->where('user_type', $userType)
            ->where('user_id', $userId)
            ->where('action', $actionInt)
            ->delete();
    }
}
