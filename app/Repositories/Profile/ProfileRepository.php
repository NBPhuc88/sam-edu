<?php

namespace App\Repositories\Profile;

use Illuminate\Support\Facades\DB;

class ProfileRepository implements ProfileRepositoryInterface
{
    /**
     * @param string                $userType
     * @param int                   $userId
     * @param string                $email
     * @param string                $action
     * @param string                $otpHash
     * @param ?array<string, mixed> $payload
     */
    public function createVerificationOtp(
        string $userType,
        int $userId,
        string $email,
        string $action,
        string $otpHash,
        ?array $payload = null
    ): void {
        DB::table('account_verification_otps')
            ->where('user_type', $userType)
            ->where('user_id', $userId)
            ->where('action', $action)
            ->delete();

        DB::table('account_verification_otps')->insert([
            'user_type'  => $userType,
            'user_id'    => $userId,
            'email'      => $email,
            'action'     => $action,
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
     * @param  string      $action
     * @return object|null
     */
    public function getLatestVerificationOtp(
        string $userType,
        int $userId,
        string $email,
        string $action
    ): ?object {
        return DB::table('account_verification_otps')
            ->where('user_type', $userType)
            ->where('user_id', $userId)
            ->where('email', $email)
            ->where('action', $action)
            ->orderBy('id', 'desc')
            ->first();
    }

    /**
     * @param string $userType
     * @param int    $userId
     * @param string $action
     */
    public function deleteVerificationOtp(
        string $userType,
        int $userId,
        string $action
    ): void {
        DB::table('account_verification_otps')
            ->where('user_type', $userType)
            ->where('user_id', $userId)
            ->where('action', $action)
            ->delete();
    }
}
