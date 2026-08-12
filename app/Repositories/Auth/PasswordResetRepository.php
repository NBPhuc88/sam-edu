<?php

namespace App\Repositories\Auth;

use App\Models\Admin;
use App\Models\Center;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Facades\DB;

class PasswordResetRepository implements PasswordResetRepositoryInterface
{
    public function createOtp(string $email, string $accountType, string $otpHash): void
    {
        DB::table('password_reset_otps')
            ->where('email', $email)
            ->where('account_type', $accountType)
            ->delete();

        DB::table('password_reset_otps')->insert([
            'email'        => $email,
            'account_type' => $accountType,
            'otp_hash'     => $otpHash,
            'expires_at'   => now()->addMinutes(15),
            'created_at'   => now(),
        ]);
    }

    public function getLatestOtp(string $email, string $accountType): ?object
    {
        return DB::table('password_reset_otps')
            ->where('email', $email)
            ->where('account_type', $accountType)
            ->orderBy('id', 'desc')
            ->first();
    }

    public function deleteOtp(string $email, string $accountType): void
    {
        DB::table('password_reset_otps')
            ->where('email', $email)
            ->where('account_type', $accountType)
            ->delete();
    }

    public function findAccountByEmail(string $accountType, string $email): ?object
    {
        return match ($accountType) {
            'admin'   => Admin::where('email', $email)->first(),
            'center'  => Center::where('email', $email)->first(),
            'teacher' => Teacher::where('email', $email)->first(),
            'student' => Student::where('email', $email)->first(),
            default   => null,
        };
    }
}
