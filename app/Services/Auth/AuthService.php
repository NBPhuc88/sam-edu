<?php

namespace App\Services\Auth;

use App\Repositories\Admin\AdminRepositoryInterface;
use App\Repositories\Student\StudentRepositoryInterface;
use App\Repositories\Teacher\TeacherRepositoryInterface;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthService implements AuthServiceInterface
{
    protected AdminRepositoryInterface $adminRepository;

    protected TeacherRepositoryInterface $teacherRepository;

    protected StudentRepositoryInterface $studentRepository;

    public function __construct(
        AdminRepositoryInterface $adminRepository,
        TeacherRepositoryInterface $teacherRepository,
        StudentRepositoryInterface $studentRepository
    ) {
        $this->adminRepository   = $adminRepository;
        $this->teacherRepository = $teacherRepository;
        $this->studentRepository = $studentRepository;
    }

    /**
     * Authenticate account credentials for specified role.
     *
     * @return array{success: bool, account: mixed, error: string|null}
     * @param  string                                                   $role
     * @param  string                                                   $username
     * @param  string                                                   $password
     */
    public function authenticate(string $role, string $username, string $password): array
    {
        $account = null;

        if ($role === 'admin') {
            $account = $this->adminRepository->findByUsernameOrEmail($username);
        } elseif ($role === 'teacher') {
            $account = $this->teacherRepository->findByUsernameOrEmail($username);
        } elseif ($role === 'student') {
            $account = $this->studentRepository->findByUsernameOrEmail($username);
        }

        if (! $account || ! Hash::check($password, (string) $account->password)) {
            return [
                'success' => false,
                'account' => null,
                'error'   => 'Tên đăng nhập hoặc mật khẩu không chính xác.',
            ];
        }

        if (isset($account->status) && in_array($account->status, ['inactive', 'locked', 'suspended', 'expired'])) {
            return [
                'success' => false,
                'account' => null,
                'error'   => 'Tài khoản của bạn đã bị khóa, hết hạn hoặc chưa kích hoạt.',
            ];
        }

        // Update last login if column exists
        if (\Illuminate\Support\Facades\Schema::hasColumn($account->getTable(), 'last_login_at')) {
            $account->update(['last_login_at' => now()]);
        }

        // Login with specified guard
        Auth::guard($role)->login($account);
        request()->session()->regenerate();

        // Single device login enforcement: generate new device session token
        $deviceToken = \Illuminate\Support\Str::random(40);
        $account->update([
            'current_session_id' => $deviceToken,
        ]);
        request()->session()->put('auth_device_token_' . $role, $deviceToken);

        return [
            'success' => true,
            'account' => $account,
            'error'   => null,
        ];
    }

    /**
     * Logout active sessions across all guards.
     */
    public function logout(): void
    {
        $user = Auth::guard('admin')->user()
            ?? Auth::guard('teacher')->user()
            ?? Auth::guard('student')->user();

        if ($user) {
            $user->update(['current_session_id' => null]);
        }

        Auth::guard('admin')->logout();
        Auth::guard('teacher')->logout();
        Auth::guard('student')->logout();

        request()->session()->invalidate();
        request()->session()->regenerateToken();
    }
}
