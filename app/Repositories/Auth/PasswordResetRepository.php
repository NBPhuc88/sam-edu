<?php

namespace App\Repositories\Auth;

use App\Enums\Constant;
use App\Models\Admin;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Facades\DB;

class PasswordResetRepository implements PasswordResetRepositoryInterface
{
    public function createOtp(string $email, string $accountType, string $otpHash): void
    {
        $typeInt = $this->normalizeAccountType($accountType);

        DB::table('password_reset_otps')
            ->where('email', $email)
            ->where('account_type', $typeInt)
            ->delete();

        DB::table('password_reset_otps')->insert([
            'email'        => $email,
            'account_type' => $typeInt,
            'otp_hash'     => $otpHash,
            'expires_at'   => now()->addMinutes(Constant::OTP_EXPIRATION_MINUTES),
            'created_at'   => now(),
        ]);
    }

    public function getLatestOtp(string $email, string $accountType): ?object
    {
        $typeInt = $this->normalizeAccountType($accountType);

        return DB::table('password_reset_otps')
            ->where('email', $email)
            ->where('account_type', $typeInt)
            ->orderBy('id', 'desc')
            ->first();
    }

    public function deleteOtp(string $email, string $accountType): void
    {
        $typeInt = $this->normalizeAccountType($accountType);

        DB::table('password_reset_otps')
            ->where('email', $email)
            ->where('account_type', $typeInt)
            ->delete();
    }

    /**
     * Chuẩn hóa account_type thành hằng số integer Constant::ACCOUNT_TYPE_*.
     * @param string|int $accountType
     */
    private function normalizeAccountType(string|int $accountType): int
    {
        if (is_numeric($accountType)) {
            $val = (int) $accountType;

            if (in_array($val, Constant::ACCOUNT_TYPES, true)) {
                return $val;
            }
        }

        return match ($accountType) {
            'admin'   => Constant::ACCOUNT_TYPE_ADMIN,
            'teacher' => Constant::ACCOUNT_TYPE_TEACHER,
            'student' => Constant::ACCOUNT_TYPE_STUDENT,
            'center'  => Constant::ACCOUNT_TYPE_CENTER,
            default   => Constant::ACCOUNT_TYPE_STUDENT,
        };
    }

    public function findAccountByEmail(string $accountType, string $email): ?object
    {
        return match ($accountType) {
            'admin'   => Admin::where('email', $email)->first(),
            'teacher' => Teacher::where('email', $email)->first(),
            'student' => Student::where('email', $email)->first(),
            default   => null,
        };
    }
}
