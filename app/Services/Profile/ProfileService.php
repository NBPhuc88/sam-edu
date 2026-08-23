<?php

namespace App\Services\Profile;

use App\Mail\AccountVerificationOtpMail;
use App\Mail\EmailChangedMail;
use App\Mail\PasswordChangedMail;
use App\Models\Admin;
use App\Models\Student;
use App\Models\Teacher;
use App\Repositories\Profile\ProfileRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ProfileService implements ProfileServiceInterface
{
    public function __construct(
        protected ProfileRepositoryInterface $profileRepository
    ) {
    }

    /**
     * @param  object               $user
     * @param  string               $role
     * @return array<string, mixed>
     */
    public function getProfileData(object $user, string $role): array
    {
        $userCode  = $user->student_code ?? $user->teacher_code ?? $user->admin_code ?? 'ADM' . str_pad((string) $user->id, 9, '0', STR_PAD_LEFT);
        $roleLabel = match ($role) {
            'admin'   => ($user->role ?? 'admin') === 'super_admin' ? 'Quản trị viên tối cao (Super Admin)' : 'Quản trị viên',
            'teacher' => 'Giáo viên',
            'student' => 'Học sinh',
            default   => 'Thành viên',
        };

        $centerName = null;

        if ($user instanceof Admin) {
            $centerName = $user->centers->first()?->name;
        } elseif ($user instanceof Teacher || $user instanceof Student) {
            $centerName = $user->center?->name;
        }

        return [
            'id'                  => $user->id,
            'user_code'           => $userCode,
            'full_name'           => $user->full_name ?? $user->name ?? $user->username,
            'username'            => $user->username,
            'email'               => $user->email,
            'phone'               => $user->phone ?? null,
            'role'                => $role,
            'admin_role'          => $user->role ?? null,
            'role_label'          => $roleLabel,
            'center_name'         => $centerName,
            'gender'              => $user->gender ?? null,
            'date_of_birth'       => $user->date_of_birth ?? null,
            'address'             => $user->address ?? null,
            'admission_date'      => $user->admission_date ?? null,
            'hire_date'           => $user->hire_date ?? null,
            'specialization'      => $user->specialization ?? null,
            'parent_name'         => $user->parent_name ?? null,
            'parent_phone'        => $user->parent_phone ?? null,
            'parent_relationship' => $user->parent_relationship ?? null,
            'created_at'          => $user->created_at ? $user->created_at->format('d/m/Y H:i') : null,
        ];
    }

    /**
     * @param  object               $user
     * @param  string               $role
     * @return array<string, mixed>
     */
    public function sendPasswordChangeOtp(object $user, string $role): array
    {
        if (empty($user->email)) {
            return [
                'success' => false,
                'message' => 'Tài khoản của bạn chưa có email. Vui lòng liên hệ Quản trị viên để cập nhật email trước.',
            ];
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->profileRepository->createVerificationOtp(
            $role,
            (int) $user->id,
            $user->email,
            'change_password',
            Hash::make($otp)
        );

        try {
            Mail::to($user->email)->queue(
                new AccountVerificationOtpMail(
                    name: $user->full_name ?? $user->username,
                    otp: $otp,
                    actionLabel: 'Đổi mật khẩu tài khoản',
                    expiresInMinutes: 5
                )
            );
        } catch (\Throwable $e) {
            Log::channel('queue')->error('[Profile OTP] Lỗi gửi mail OTP đổi mật khẩu: ' . $e->getMessage());
        }

        return [
            'success' => true,
            'message' => 'Mã xác thực OTP 6 số đã được gửi đến email ' . $this->maskEmail($user->email) . ' (hiệu lực 5 phút).',
        ];
    }

    /**
     * @param  object               $user
     * @param  string               $role
     * @param  string               $currentPassword
     * @param  string               $newPassword
     * @param  string               $otp
     * @return array<string, mixed>
     */
    public function updatePassword(
        object $user,
        string $role,
        string $currentPassword,
        string $newPassword,
        string $otp
    ): array {
        if (! Hash::check($currentPassword, $user->password)) {
            return [
                'success' => false,
                'message' => 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại!',
            ];
        }

        if (empty($user->email)) {
            return [
                'success' => false,
                'message' => 'Tài khoản của bạn chưa có địa chỉ email.',
            ];
        }

        $record = $this->profileRepository->getLatestVerificationOtp(
            $role,
            (int) $user->id,
            $user->email,
            'change_password'
        );

        if (! $record || ! Hash::check($otp, $record->otp_hash)) {
            return [
                'success' => false,
                'message' => 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại hộp thư!',
            ];
        }

        if (now()->isAfter($record->expires_at)) {
            return [
                'success' => false,
                'message' => 'Mã xác thực OTP đã hết hạn (chỉ có hiệu lực trong 5 phút). Vui lòng nhấn gửi lại mã mới!',
            ];
        }

        $user->update([
            'password' => Hash::make($newPassword),
        ]);

        $this->profileRepository->deleteVerificationOtp($role, (int) $user->id, 'change_password');

        $roleLabel = match ($role) {
            'admin'   => ($user->role ?? 'admin') === 'super_admin' ? 'Quản trị viên tối cao' : 'Quản trị viên',
            'teacher' => 'Giáo viên',
            'student' => 'Học sinh',
            default   => 'Tài khoản',
        };

        $loginUrl = match ($role) {
            'admin'   => url('/admins'),
            'teacher' => url('/teachers'),
            default   => url('/login'),
        };

        try {
            Mail::to($user->email)->queue(
                new PasswordChangedMail(
                    fullName: $user->full_name ?? $user->username,
                    username: $user->username,
                    roleLabel: $roleLabel,
                    centerName: null,
                    changedAt: date('d/m/Y H:i:s'),
                    loginUrl: $loginUrl
                )
            );
        } catch (\Throwable $e) {
            Log::channel('queue')->error('[Profile Password Change] Lỗi gửi mail thông báo: ' . $e->getMessage());
        }

        return [
            'success' => true,
            'message' => 'Đổi mật khẩu thành công! Mật khẩu mới đã có hiệu lực.',
        ];
    }

    /**
     * @param  object               $user
     * @param  string               $role
     * @param  string               $currentPassword
     * @return array<string, mixed>
     */
    public function sendChangeEmailOldOtp(object $user, string $role, string $currentPassword): array
    {
        if (! Hash::check($currentPassword, $user->password)) {
            return [
                'success' => false,
                'message' => 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại!',
            ];
        }

        if (empty($user->email)) {
            return [
                'success' => false,
                'message' => 'Tài khoản của bạn chưa có email cũ. Vui lòng liên hệ Quản trị viên để thiết lập email.',
            ];
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->profileRepository->createVerificationOtp(
            $role,
            (int) $user->id,
            $user->email,
            'change_email_old',
            Hash::make($otp),
            ['step_1_verified' => false]
        );

        try {
            Mail::to($user->email)->queue(
                new AccountVerificationOtpMail(
                    name: $user->full_name ?? $user->username,
                    otp: $otp,
                    actionLabel: 'Xác thực Email cũ (Bước 1 đổi Email)',
                    expiresInMinutes: 5
                )
            );
        } catch (\Throwable $e) {
            Log::channel('queue')->error('[Profile Change Email] Lỗi gửi OTP email cũ: ' . $e->getMessage());
        }

        return [
            'success' => true,
            'message' => 'Mã xác thực đã được gửi về Email hiện tại ' . $this->maskEmail($user->email) . ' (hiệu lực 5 phút).',
        ];
    }

    /**
     * @param  object               $user
     * @param  string               $role
     * @param  string               $otp
     * @return array<string, mixed>
     */
    public function verifyChangeEmailOldOtp(object $user, string $role, string $otp): array
    {
        $record = $this->profileRepository->getLatestVerificationOtp(
            $role,
            (int) $user->id,
            $user->email,
            'change_email_old'
        );

        if (! $record || ! Hash::check($otp, $record->otp_hash)) {
            return [
                'success' => false,
                'message' => 'Mã xác thực OTP Email cũ không chính xác!',
            ];
        }

        if (now()->isAfter($record->expires_at)) {
            return [
                'success' => false,
                'message' => 'Mã xác thực OTP đã hết hạn (chỉ có hiệu lực trong 5 phút). Vui lòng gửi lại mã mới!',
            ];
        }

        // Cập nhật trạng thái Bước 1 đã hoàn thành
        $this->profileRepository->createVerificationOtp(
            $role,
            (int) $user->id,
            $user->email,
            'change_email_old',
            $record->otp_hash,
            ['step_1_verified' => true, 'verified_at' => now()->timestamp]
        );

        return [
            'success' => true,
            'message' => 'Xác thực Email cũ thành công! Bạn có thể tiếp tục nhập Email mới ở Bước 2.',
        ];
    }

    /**
     * @param  object               $user
     * @param  string               $role
     * @param  string               $newEmail
     * @return array<string, mixed>
     */
    public function sendChangeEmailNewOtp(object $user, string $role, string $newEmail): array
    {
        $newEmail = strtolower(trim($newEmail));

        if ($newEmail === strtolower((string) $user->email)) {
            return [
                'success' => false,
                'message' => 'Địa chỉ Email mới phải khác với Email hiện tại của bạn!',
            ];
        }

        // Kiểm tra trùng email trên các bảng tài khoản
        $isTaken = match ($role) {
            'admin'   => Admin::where('email', $newEmail)->where('id', '!=', $user->id)->exists(),
            'teacher' => Teacher::where('email', $newEmail)->where('id', '!=', $user->id)->exists(),
            'student' => Student::where('email', $newEmail)->where('id', '!=', $user->id)->exists(),
            default   => false,
        };

        if ($isTaken) {
            return [
                'success' => false,
                'message' => 'Địa chỉ email này đã được sử dụng bởi một tài khoản khác trên hệ thống.',
            ];
        }

        // Kiểm tra bước 1 đã xác thực chưa
        $oldRecord = $this->profileRepository->getLatestVerificationOtp(
            $role,
            (int) $user->id,
            $user->email,
            'change_email_old'
        );

        $payload = $oldRecord && $oldRecord->payload ? json_decode($oldRecord->payload, true) : [];

        if (empty($payload['step_1_verified'])) {
            return [
                'success' => false,
                'message' => 'Vui lòng hoàn thành xác thực Email cũ ở Bước 1 trước khi thực hiện Bước 2!',
            ];
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $this->profileRepository->createVerificationOtp(
            $role,
            (int) $user->id,
            $newEmail,
            'change_email_new',
            Hash::make($otp),
            ['new_email' => $newEmail]
        );

        try {
            Mail::to($newEmail)->queue(
                new AccountVerificationOtpMail(
                    name: $user->full_name ?? $user->username,
                    otp: $otp,
                    actionLabel: 'Xác thực Email mới (Bước 2 đổi Email)',
                    expiresInMinutes: 5
                )
            );
        } catch (\Throwable $e) {
            Log::channel('queue')->error('[Profile Change Email] Lỗi gửi OTP email mới: ' . $e->getMessage());
        }

        return [
            'success' => true,
            'message' => 'Mã xác thực đã được gửi đến Email mới ' . $newEmail . ' (hiệu lực 5 phút).',
        ];
    }

    /**
     * @param  object               $user
     * @param  string               $role
     * @param  string               $newEmail
     * @param  string               $otp
     * @return array<string, mixed>
     */
    public function updateEmail(
        object $user,
        string $role,
        string $newEmail,
        string $otp
    ): array {
        $newEmail = strtolower(trim($newEmail));
        $oldEmail = $user->email;

        // Kiểm tra bước 1
        $oldRecord = $this->profileRepository->getLatestVerificationOtp(
            $role,
            (int) $user->id,
            $user->email,
            'change_email_old'
        );

        $oldPayload = $oldRecord && $oldRecord->payload ? json_decode($oldRecord->payload, true) : [];

        if (empty($oldPayload['step_1_verified'])) {
            return [
                'success' => false,
                'message' => 'Phiên xác thực Email cũ không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại từ Bước 1!',
            ];
        }

        // Kiểm tra bước 2 OTP
        $newRecord = $this->profileRepository->getLatestVerificationOtp(
            $role,
            (int) $user->id,
            $newEmail,
            'change_email_new'
        );

        if (! $newRecord || ! Hash::check($otp, $newRecord->otp_hash)) {
            return [
                'success' => false,
                'message' => 'Mã xác thực OTP Email mới không chính xác!',
            ];
        }

        if (now()->isAfter($newRecord->expires_at)) {
            return [
                'success' => false,
                'message' => 'Mã xác thực Email mới đã hết hạn (chỉ có hiệu lực trong 5 phút). Vui lòng gửi lại mã mới!',
            ];
        }

        $user->update([
            'email' => $newEmail,
        ]);

        // Xóa sạch OTP sau khi hoàn tất
        $this->profileRepository->deleteVerificationOtp($role, (int) $user->id, 'change_email_old');
        $this->profileRepository->deleteVerificationOtp($role, (int) $user->id, 'change_email_new');

        $roleLabel = match ($role) {
            'admin'   => ($user->role ?? 'admin') === 'super_admin' ? 'Quản trị viên tối cao' : 'Quản trị viên',
            'teacher' => 'Giáo viên',
            'student' => 'Học sinh',
            default   => 'Tài khoản',
        };

        $loginUrl = match ($role) {
            'admin'   => url('/admins'),
            'teacher' => url('/teachers'),
            default   => url('/login'),
        };

        try {
            Mail::to($newEmail)->queue(
                new EmailChangedMail(
                    fullName: $user->full_name ?? $user->username,
                    username: $user->username,
                    oldEmail: (string) $oldEmail,
                    newEmail: (string) $newEmail,
                    roleLabel: $roleLabel,
                    centerName: null,
                    changedAt: date('d/m/Y H:i:s'),
                    loginUrl: $loginUrl
                )
            );
        } catch (\Throwable $e) {
            Log::channel('queue')->error('[Profile Change Email] Lỗi gửi mail xác nhận đổi email: ' . $e->getMessage());
        }

        return [
            'success' => true,
            'message' => "Cập nhật địa chỉ email thành công sang '{$newEmail}'!",
        ];
    }

    /**
     * Ẩn bớt ký tự email để bảo mật hiển thị.
     * @param ?string $email
     */
    protected function maskEmail(?string $email): string
    {
        if (empty($email)) {
            return '';
        }

        $parts  = explode('@', $email);
        $name   = $parts[0];
        $domain = $parts[1] ?? '';

        $len = strlen($name);

        if ($len <= 3) {
            $maskedName = substr($name, 0, 1) . '***';
        } else {
            $maskedName = substr($name, 0, 2) . str_repeat('*', $len - 4) . substr($name, -2);
        }

        return $maskedName . '@' . $domain;
    }
}
