<?php

namespace App\Http\Controllers;

use App\Services\Profile\ProfileServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        protected ProfileServiceInterface $profileService
    ) {
    }

    /**
     * Lấy người dùng và vai trò đang đăng nhập.
     * @return array{0: object, 1: string}
     */
    protected function resolveAuthUser(): array
    {
        if ($admin = Auth::guard('admin')->user()) {
            return [$admin, 'admin'];
        }

        if ($teacher = Auth::guard('teacher')->user()) {
            return [$teacher, 'teacher'];
        }

        if ($student = Auth::guard('student')->user()) {
            return [$student, 'student'];
        }

        abort(401, 'Chưa đăng nhập');
    }

    /**
     * Hiển thị trang Thông Tin Tài Khoản.
     */
    public function index(): Response
    {
        [$user, $role] = $this->resolveAuthUser();
        $profileData   = $this->profileService->getProfileData($user, $role);

        return Inertia::render('Profile/Index', [
            'profile' => $profileData,
        ]);
    }

    /**
     * Gửi mã OTP đổi mật khẩu về email tài khoản.
     */
    public function sendPasswordChangeOtp(): RedirectResponse
    {
        [$user, $role] = $this->resolveAuthUser();
        $result        = $this->profileService->sendPasswordChangeOtp($user, $role);

        if (! $result['success']) {
            return redirect()->back()->with('error', $result['message']);
        }

        return redirect()->back()->with('success', $result['message']);
    }

    /**
     * Xác thực OTP và cập nhật mật khẩu mới.
     * @param Request $request
     */
    public function updatePassword(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'string', 'min:6', 'confirmed'],
            'otp'              => ['required', 'string', 'regex:/^[0-9]{6}$/'],
        ], [
            'current_password.required' => 'Vui lòng nhập mật khẩu hiện tại.',
            'password.required'         => 'Vui lòng nhập mật khẩu mới.',
            'password.min'              => 'Mật khẩu mới phải có ít nhất 6 ký tự.',
            'password.confirmed'        => 'Mật khẩu xác nhận không khớp.',
            'otp.required'              => 'Vui lòng nhập mã xác thực OTP 6 số.',
            'otp.regex'                 => 'Mã xác thực OTP phải gồm đúng 6 chữ số.',
        ]);

        [$user, $role] = $this->resolveAuthUser();
        $result        = $this->profileService->updatePassword(
            $user,
            $role,
            (string) $request->input('current_password'),
            (string) $request->input('password'),
            (string) $request->input('otp')
        );

        if (! $result['success']) {
            return redirect()->back()->with('error', $result['message']);
        }

        return redirect()->back()->with('success', $result['message']);
    }

    /**
     * Gửi mã OTP xác thực Email cũ (Bước 1 đổi Email).
     * @param Request $request
     */
    public function sendChangeEmailOldOtp(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'string'],
        ], [
            'current_password.required' => 'Vui lòng nhập mật khẩu hiện tại để xác thực danh tính.',
        ]);

        [$user, $role] = $this->resolveAuthUser();
        $result        = $this->profileService->sendChangeEmailOldOtp(
            $user,
            $role,
            (string) $request->input('current_password')
        );

        if (! $result['success']) {
            return redirect()->back()->with('error', $result['message']);
        }

        return redirect()->back()->with('success', $result['message']);
    }

    /**
     * Xác thực mã OTP Email cũ (Hoàn tất Bước 1).
     * @param Request $request
     */
    public function verifyChangeEmailOldOtp(Request $request): RedirectResponse
    {
        $request->validate([
            'otp' => ['required', 'string', 'regex:/^[0-9]{6}$/'],
        ], [
            'otp.required' => 'Vui lòng nhập mã xác thực OTP 6 số gửi về Email cũ.',
            'otp.regex'    => 'Mã OTP phải gồm đúng 6 chữ số.',
        ]);

        [$user, $role] = $this->resolveAuthUser();
        $result        = $this->profileService->verifyChangeEmailOldOtp(
            $user,
            $role,
            (string) $request->input('otp')
        );

        if (! $result['success']) {
            return redirect()->back()->with('error', $result['message']);
        }

        return redirect()->back()->with('success', $result['message']);
    }

    /**
     * Gửi mã OTP về Email mới (Bước 2 đổi Email).
     * @param Request $request
     */
    public function sendChangeEmailNewOtp(Request $request): RedirectResponse
    {
        $request->validate([
            'new_email' => ['required', 'email', 'max:255'],
        ], [
            'new_email.required' => 'Vui lòng nhập địa chỉ Email mới.',
            'new_email.email'    => 'Địa chỉ Email mới không đúng định dạng.',
        ]);

        [$user, $role] = $this->resolveAuthUser();
        $result        = $this->profileService->sendChangeEmailNewOtp(
            $user,
            $role,
            (string) $request->input('new_email')
        );

        if (! $result['success']) {
            return redirect()->back()->with('error', $result['message']);
        }

        return redirect()->back()->with('success', $result['message']);
    }

    /**
     * Xác thực mã OTP Email mới và hoàn tất đổi Email.
     * @param Request $request
     */
    public function updateEmail(Request $request): RedirectResponse
    {
        $request->validate([
            'new_email' => ['required', 'email', 'max:255'],
            'otp'       => ['required', 'string', 'regex:/^[0-9]{6}$/'],
        ], [
            'new_email.required' => 'Vui lòng nhập địa chỉ Email mới.',
            'new_email.email'    => 'Địa chỉ Email mới không đúng định dạng.',
            'otp.required'       => 'Vui lòng nhập mã xác thực OTP 6 số gửi về Email mới.',
            'otp.regex'          => 'Mã OTP phải gồm đúng 6 chữ số.',
        ]);

        [$user, $role] = $this->resolveAuthUser();
        $result        = $this->profileService->updateEmail(
            $user,
            $role,
            (string) $request->input('new_email'),
            (string) $request->input('otp')
        );

        if (! $result['success']) {
            return redirect()->back()->with('error', $result['message']);
        }

        return redirect()->back()->with('success', $result['message']);
    }
}
