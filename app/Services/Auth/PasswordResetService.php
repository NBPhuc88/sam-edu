<?php

namespace App\Services\Auth;

use App\Mail\PasswordResetOtpMail;
use App\Repositories\Auth\PasswordResetRepositoryInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PasswordResetService implements PasswordResetServiceInterface
{
    public function __construct(
        protected PasswordResetRepositoryInterface $repository
    ) {
    }

    public function sendOtp(string $accountType, string $email): array
    {
        $email   = strtolower(trim($email));
        $account = $this->repository->findAccountByEmail($accountType, $email);

        if (! $account) {
            return [
                'success' => false,
                'error'   => 'Không tìm thấy tài khoản với email này trong hệ thống.',
            ];
        }

        // Generate 6-digit OTP
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->repository->createOtp($email, $accountType, Hash::make($otp));

        // Queue OTP Mail
        try {
            $name = $account->full_name ?? $account->name ?? 'Người dùng';
            Mail::to($email)->queue(new PasswordResetOtpMail($name, $otp, $accountType));
        } catch (\Throwable $e) {
            Log::error('Lỗi gửi mail OTP đặt lại mật khẩu: ' . $e->getMessage());
        }

        return [
            'success' => true,
            'error'   => null,
        ];
    }

    public function verifyOtpAndLogin(string $accountType, string $email, string $otp): array
    {
        $email  = strtolower(trim($email));
        $record = $this->repository->getLatestOtp($email, $accountType);

        if (! $record || ! Hash::check($otp, $record->otp_hash)) {
            return [
                'success' => false,
                'error'   => 'Mã OTP không chính xác. Vui lòng kiểm tra lại!',
            ];
        }

        if (now()->isAfter($record->expires_at)) {
            return [
                'success' => false,
                'error'   => 'Mã OTP đã hết hạn (chỉ có hiệu lực trong 15 phút). Vui lòng yêu cầu mã mới!',
            ];
        }

        $account = $this->repository->findAccountByEmail($accountType, $email);

        if (! $account) {
            return [
                'success' => false,
                'error'   => 'Tài khoản không còn tồn tại trên hệ thống.',
            ];
        }

        $this->repository->deleteOtp($email, $accountType);

        // Login user
        Auth::guard($accountType)->login($account);
        request()->session()->regenerate();
        session(['must_change_password' => true]);

        return [
            'success' => true,
            'error'   => null,
        ];
    }

    public function updateForcedPassword(string $newPassword): array
    {
        $user = Auth::guard('admin')->user()
            ?? Auth::guard('teacher')->user()
            ?? Auth::guard('student')->user();

        if (! $user) {
            return [
                'success' => false,
                'error'   => 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
            ];
        }

        $user->update([
            'password' => Hash::make($newPassword),
        ]);

        session()->forget('must_change_password');

        return [
            'success' => true,
            'error'   => null,
        ];
    }
}
