import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import AppLayout from '@/layouts/AppLayout';
import { Head,router } from '@inertiajs/react';
import {
Building2,
CheckCircle2,
Clock,
Eye,
EyeOff,
KeyRound,
Mail,
Send,
ShieldCheck,
User,
UserCheck
} from 'lucide-react';
import React,{ useEffect,useState } from 'react';

interface ProfileData {
    id: number;
    user_code: string;
    full_name: string;
    username: string;
    email: string | null;
    phone: string | null;
    role: string;
    admin_role?: string | null;
    role_label: string;
    center_name?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
    address?: string | null;
    admission_date?: string | null;
    hire_date?: string | null;
    specialization?: string | null;
    parent_name?: string | null;
    parent_phone?: string | null;
    parent_relationship?: string | null;
    created_at?: string | null;
}

interface ProfileProps {
    profile: ProfileData;
    errors?: Record<string, string>;
}

export default function ProfileIndex({ profile, errors = {} }: ProfileProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'password' | 'email'>('info');

    // ─── Đổi Mật Khẩu State ───
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordOtp, setPasswordOtp] = useState('');
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [isSendingPassOtp, setIsSendingPassOtp] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passOtpCountdown, setPassOtpCountdown] = useState(0);

    // ─── Đổi Email State ───
    const [emailStep, setEmailStep] = useState<1 | 2>(1);
    const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
    const [emailOldOtp, setEmailOldOtp] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [emailNewOtp, setEmailNewOtp] = useState('');
    const [isSendingOldOtp, setIsSendingOldOtp] = useState(false);
    const [isVerifyingOldOtp, setIsVerifyingOldOtp] = useState(false);
    const [isSendingNewOtp, setIsSendingNewOtp] = useState(false);
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
    const [oldOtpCountdown, setOldOtpCountdown] = useState(0);
    const [newOtpCountdown, setNewOtpCountdown] = useState(0);

    // Timers
    useEffect(() => {
        if (passOtpCountdown > 0) {
            const timer = setTimeout(() => setPassOtpCountdown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [passOtpCountdown]);

    useEffect(() => {
        if (oldOtpCountdown > 0) {
            const timer = setTimeout(() => setOldOtpCountdown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [oldOtpCountdown]);

    useEffect(() => {
        if (newOtpCountdown > 0) {
            const timer = setTimeout(() => setNewOtpCountdown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [newOtpCountdown]);

    // ─── Xử Lý Gửi OTP Đổi Mật Khẩu ───
    const handleSendPasswordOtp = () => {
        setIsSendingPassOtp(true);
        router.post('/profile/password/send-otp', {}, {
            preserveScroll: true,
            onFinish: () => {
                setIsSendingPassOtp(false);
                setPassOtpCountdown(60);
            },
        });
    };

    // ─── Xử Lý Đổi Mật Khẩu ───
    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingPassword(true);
        router.post(
            '/profile/password/update',
            {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: confirmPassword,
                otp: passwordOtp,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordOtp('');
                    setPassOtpCountdown(0);
                },
                onFinish: () => setIsUpdatingPassword(false),
            }
        );
    };

    // ─── Bước 1 Đổi Email: Gửi OTP Email Cũ ───
    const handleSendOldEmailOtp = () => {
        if (!emailCurrentPassword) {
            alert('Vui lòng nhập mật khẩu hiện tại.');
            return;
        }
        setIsSendingOldOtp(true);
        router.post(
            '/profile/email/send-old-otp',
            { current_password: emailCurrentPassword },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsSendingOldOtp(false);
                    setOldOtpCountdown(60);
                },
            }
        );
    };

    // ─── Bước 1 Đổi Email: Xác Thực OTP Email Cũ ───
    const handleVerifyOldEmailOtp = () => {
        if (!emailOldOtp) {
            alert('Vui lòng nhập mã OTP 6 số từ email cũ.');
            return;
        }
        setIsVerifyingOldOtp(true);
        router.post(
            '/profile/email/verify-old-otp',
            { otp: emailOldOtp },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEmailStep(2);
                },
                onFinish: () => setIsVerifyingOldOtp(false),
            }
        );
    };

    // ─── Bước 2 Đổi Email: Gửi OTP Email Mới ───
    const handleSendNewEmailOtp = () => {
        if (!newEmail) {
            alert('Vui lòng nhập địa chỉ Email mới.');
            return;
        }
        setIsSendingNewOtp(true);
        router.post(
            '/profile/email/send-new-otp',
            { new_email: newEmail },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsSendingNewOtp(false);
                    setNewOtpCountdown(60);
                },
            }
        );
    };

    // ─── Bước 2 Đổi Email: Hoàn Tất Đổi Email ───
    const handleUpdateEmail = (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingEmail(true);
        router.post(
            '/profile/email/update',
            {
                new_email: newEmail,
                otp: emailNewOtp,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEmailStep(1);
                    setEmailCurrentPassword('');
                    setEmailOldOtp('');
                    setNewEmail('');
                    setEmailNewOtp('');
                    setOldOtpCountdown(0);
                    setNewOtpCountdown(0);
                },
                onFinish: () => setIsUpdatingEmail(false),
            }
        );
    };

    // Ẩn bớt email hiển thị
    const maskEmail = (email: string | null) => {
        if (!email) return '(Chưa có)';
        const parts = email.split('@');
        const name = parts[0];
        const domain = parts[1] || '';
        if (name.length <= 3) return name.slice(0, 1) + '***@' + domain;
        return name.slice(0, 2) + '*'.repeat(Math.max(2, name.length - 4)) + name.slice(-2) + '@' + domain;
    };

    return (
        <AppLayout title="Thông Tin Tài Khoản - SAM Digital">
            <Head title="Thông Tin Tài Khoản" />

            <div className="mx-auto max-w-5xl space-y-6">
                {/* User Banner Header Card */}
                <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-black text-white shadow-md ring-4 ring-emerald-50">
                                {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                                        {profile.full_name}
                                    </h1>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        {profile.role_label}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                                    <span className="font-mono text-gray-700 bg-slate-100 px-2 py-0.5 rounded border border-gray-200">
                                        Mã: <strong>{profile.user_code}</strong>
                                    </span>
                                    <span>Tên đăng nhập: <strong>@{profile.username}</strong></span>
                                    {profile.center_name && (
                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                            <Building2 className="h-3.5 w-3.5" />
                                            {profile.center_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-stretch sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                            <Button
                                variant={activeTab === 'password' ? 'edit' : 'secondary'}
                                size="sm"
                                icon={<KeyRound className="h-4 w-4" />}
                                onClick={() => setActiveTab('password')}
                            >
                                Đổi Mật Khẩu
                            </Button>
                            <Button
                                variant={activeTab === 'email' ? 'edit' : 'secondary'}
                                size="sm"
                                icon={<Mail className="h-4 w-4" />}
                                onClick={() => setActiveTab('email')}
                            >
                                Đổi Email
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Tabs Switcher */}
                <div className="flex overflow-x-auto border-b border-gray-200 gap-2 pb-px">
                    <button
                        type="button"
                        onClick={() => setActiveTab('info')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'info'
                                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50 rounded-t-xl'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <User className="h-4 w-4" />
                        1. Chi Tiết Thông Tin
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('password')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'password'
                                ? 'border-amber-500 text-amber-700 bg-amber-50/50 rounded-t-xl'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <KeyRound className="h-4 w-4" />
                        2. Đổi Mật Khẩu (Xác thực OTP)
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('email')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === 'email'
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl'
                                : 'border-transparent text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        <Mail className="h-4 w-4" />
                        3. Đổi Địa Chỉ Email (Xác thực 2 bước)
                    </button>
                </div>

                {/* ─── TAB 1: CHI TIẾT THÔNG TIN TÀI KHOẢN ─── */}
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-gray-200 bg-white p-6 shadow-xs space-y-4">
                            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3">
                                <UserCheck className="h-4 w-4 text-emerald-600" />
                                Thông Tin Cơ Bản
                            </h2>

                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <dt className="text-gray-500">Mã định danh</dt>
                                    <dd className="mt-1 font-mono font-bold text-gray-900">{profile.user_code}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Tên đăng nhập</dt>
                                    <dd className="mt-1 font-mono font-bold text-gray-900">@{profile.username}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Họ và tên</dt>
                                    <dd className="mt-1 font-bold text-gray-900">{profile.full_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Vai trò</dt>
                                    <dd className="mt-1 font-bold text-emerald-700">{profile.role_label}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Địa chỉ Email</dt>
                                    <dd className="mt-1 font-medium text-gray-900">{profile.email || '(Chưa cấu hình)'}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Số điện thoại</dt>
                                    <dd className="mt-1 font-medium text-gray-900">{profile.phone || '(Chưa cấu hình)'}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Giới tính</dt>
                                    <dd className="mt-1 font-medium text-gray-900">
                                        {String(profile.gender) === '1' || profile.gender === 'male' ? 'Nam' : String(profile.gender) === '2' || profile.gender === 'female' ? 'Nữ' : profile.gender ? 'Khác' : '(Chưa cập nhật)'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Ngày sinh</dt>
                                    <dd className="mt-1 font-medium text-gray-900">{profile.date_of_birth || '(Chưa cập nhật)'}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-gray-500">Địa chỉ thường trú</dt>
                                    <dd className="mt-1 font-medium text-gray-900">{profile.address || '(Chưa cập nhật)'}</dd>
                                </div>
                            </dl>
                        </Card>

                        <Card className="border-gray-200 bg-white p-6 shadow-xs space-y-4">
                            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-3">
                                <Building2 className="h-4 w-4 text-blue-600" />
                                Thông Tin Tổ Chức & Đào Tạo
                            </h2>

                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div className="sm:col-span-2">
                                    <dt className="text-gray-500">Trung tâm trực thuộc</dt>
                                    <dd className="mt-1 font-bold text-gray-900 text-sm">{profile.center_name || 'Hệ thống Quản trị Toàn cục'}</dd>
                                </div>
                                {profile.role === 'teacher' && (
                                    <>
                                        <div>
                                            <dt className="text-gray-500">Chuyên môn / Bộ môn</dt>
                                            <dd className="mt-1 font-bold text-gray-900">{profile.specialization || '(Chưa cập nhật)'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500">Ngày bắt đầu giảng dạy</dt>
                                            <dd className="mt-1 font-medium text-gray-900">{profile.hire_date || '(Chưa cập nhật)'}</dd>
                                        </div>
                                    </>
                                )}
                                {profile.role === 'student' && (
                                    <>
                                        <div>
                                            <dt className="text-gray-500">Ngày nhập học</dt>
                                            <dd className="mt-1 font-medium text-gray-900">{profile.admission_date || '(Chưa cập nhật)'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500">Phụ huynh / Người giám hộ</dt>
                                            <dd className="mt-1 font-bold text-gray-900">
                                                {profile.parent_name ? `${profile.parent_name} (${profile.parent_relationship || 'Phụ huynh'})` : '(Chưa cập nhật)'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-gray-500">Số điện thoại phụ huynh</dt>
                                            <dd className="mt-1 font-medium text-gray-900">{profile.parent_phone || '(Chưa cập nhật)'}</dd>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <dt className="text-gray-500">Thời gian tạo tài khoản</dt>
                                    <dd className="mt-1 font-medium text-gray-900">{profile.created_at || 'Mặc định'}</dd>
                                </div>
                            </dl>
                        </Card>
                    </div>
                )}

                {/* ─── TAB 2: ĐỔI MẬT KHẨU (XÁC THỰC OTP 5 PHÚT) ─── */}
                {activeTab === 'password' && (
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8 max-w-2xl mx-auto space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-amber-500" />
                                Thay Đổi Mật Khẩu Tài Khoản
                            </h2>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Để đảm bảo an toàn tuyệt đối, hệ thống sẽ gửi một mã xác thực OTP 6 số về địa chỉ Email{' '}
                                <strong className="text-emerald-700 font-mono">{maskEmail(profile.email)}</strong>. Mã có hiệu lực trong <strong>5 phút</strong>.
                            </p>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            {/* Mật khẩu hiện tại */}
                            <div>
                                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                                    Mật Khẩu Hiện Tại <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Input
                                        type={showCurrentPass ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Nhập mật khẩu đang dùng"
                                        required
                                        className="!py-2.5 !text-sm pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.current_password && (
                                    <p className="mt-1 text-xs text-red-600">{errors.current_password}</p>
                                )}
                            </div>

                            {/* Mật khẩu mới */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                                        Mật Khẩu Mới (ít nhất 6 ký tự) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showNewPass ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="!py-2.5 !text-sm pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPass(!showNewPass)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                                        Xác Nhận Mật Khẩu Mới <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPass ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            className="!py-2.5 !text-sm pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Mã OTP Xác Thực */}
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-amber-950">
                                        Mã Xác Thực OTP (6 Chữ Số) <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleSendPasswordOtp}
                                        disabled={isSendingPassOtp || passOtpCountdown > 0}
                                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 disabled:text-gray-400 transition-colors flex items-center gap-1.5"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        {isSendingPassOtp
                                            ? 'Đang gửi mã...'
                                            : passOtpCountdown > 0
                                              ? `Gửi lại sau (${passOtpCountdown}s)`
                                              : 'Gửi Mã OTP Về Email'}
                                    </button>
                                </div>

                                <Input
                                    type="text"
                                    maxLength={6}
                                    value={passwordOtp}
                                    onChange={(e) => setPasswordOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="123456"
                                    required
                                    className="!py-3 !text-center font-mono !text-xl font-bold tracking-widest bg-white"
                                />
                                {errors.otp && (
                                    <p className="text-xs text-red-600 font-medium">{errors.otp}</p>
                                )}
                                <p className="text-2xs text-amber-800 flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    Mã OTP chỉ tồn tại trong <strong>5 phút</strong>. Quá 5 phút vui lòng bấm gửi lại mã mới.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                variant="success"
                                size="lg"
                                isLoading={isUpdatingPassword}
                                className="w-full font-bold text-sm py-3 shadow-md"
                            >
                                Xác Nhận Đổi Mật Khẩu
                            </Button>
                        </form>
                    </Card>
                )}

                {/* ─── TAB 3: ĐỔI ĐỊA CHỈ EMAIL (XÁC THỰC 2 BƯỚC) ─── */}
                {activeTab === 'email' && (
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8 max-w-2xl mx-auto space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-blue-600" />
                                Thay Đổi Địa Chỉ Email Tài Khoản
                            </h2>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Quy trình đổi email yêu cầu <strong>xác thực 2 bước nghiêm ngặt</strong>: 1 mã xác thực gửi về Email cũ hiện tại và 1 mã gửi về Email mới cần cập nhật.
                            </p>
                        </div>

                        {/* Stepper Wizard Bar */}
                        <div className="grid grid-cols-2 gap-3 border-b border-gray-100 pb-4">
                            <div
                                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                                    emailStep === 1
                                        ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold'
                                        : 'bg-emerald-50 border-emerald-200 text-emerald-950 font-medium'
                                }`}
                            >
                                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                    emailStep === 1 ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                                }`}>
                                    {emailStep > 1 ? '✓' : '1'}
                                </span>
                                <span className="text-xs">Bước 1: Email Cũ</span>
                            </div>

                            <div
                                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                                    emailStep === 2
                                        ? 'bg-blue-50 border-blue-300 text-blue-950 font-bold'
                                        : 'bg-slate-50 border-gray-200 text-gray-400 font-medium'
                                }`}
                            >
                                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                    emailStep === 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                                }`}>
                                    2
                                </span>
                                <span className="text-xs">Bước 2: Email Mới</span>
                            </div>
                        </div>

                        {/* ─── BƯỚC 1: XÁC THỰC EMAIL CŨ ─── */}
                        {emailStep === 1 && (
                            <div className="space-y-4">
                                <div className="rounded-xl bg-slate-50 border border-gray-200 p-4 space-y-1">
                                    <p className="text-2xs uppercase tracking-wider font-bold text-gray-500">Email hiện tại của bạn:</p>
                                    <p className="text-sm font-mono font-bold text-gray-900">{profile.email || '(Chưa có)'}</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                                        Mật Khẩu Hiện Tại <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="password"
                                        value={emailCurrentPassword}
                                        onChange={(e) => setEmailCurrentPassword(e.target.value)}
                                        placeholder="Nhập mật khẩu tài khoản để xác nhận"
                                        required
                                        className="!py-2.5 !text-sm"
                                    />
                                </div>

                                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-blue-950">
                                            Mã Xác Thực Gửi Về Email Cũ (6 số) <span className="text-red-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleSendOldEmailOtp}
                                            disabled={isSendingOldOtp || oldOtpCountdown > 0}
                                            className="text-xs font-bold text-blue-700 hover:text-blue-800 disabled:text-gray-400 transition-colors flex items-center gap-1.5"
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                            {isSendingOldOtp
                                                ? 'Đang gửi...'
                                                : oldOtpCountdown > 0
                                                  ? `Gửi lại sau (${oldOtpCountdown}s)`
                                                  : 'Gửi Mã Về Email Cũ'}
                                        </button>
                                    </div>

                                    <Input
                                        type="text"
                                        maxLength={6}
                                        value={emailOldOtp}
                                        onChange={(e) => setEmailOldOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123456"
                                        className="!py-3 !text-center font-mono !text-xl font-bold tracking-widest bg-white"
                                    />
                                    <p className="text-2xs text-blue-800 flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        Mã OTP chỉ có hiệu lực trong <strong>5 phút</strong>.
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    variant="success"
                                    size="lg"
                                    isLoading={isVerifyingOldOtp}
                                    onClick={handleVerifyOldEmailOtp}
                                    className="w-full font-bold text-sm py-3"
                                >
                                    Xác Thực Bước 1 & Tiếp Tục 👉
                                </Button>
                            </div>
                        )}

                        {/* ─── BƯỚC 2: XÁC THỰC EMAIL MỚI ─── */}
                        {emailStep === 2 && (
                            <form onSubmit={handleUpdateEmail} className="space-y-4">
                                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span>Bước 1 xác thực Email cũ hoàn tất thành công!</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                                        Địa Chỉ Email Mới <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="email"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        placeholder="vidu@sam-edu.vn"
                                        required
                                        className="!py-2.5 !text-sm"
                                    />
                                    {errors.new_email && (
                                        <p className="mt-1 text-xs text-red-600">{errors.new_email}</p>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-bold text-blue-950">
                                            Mã Xác Thực Gửi Về Email Mới (6 số) <span className="text-red-500">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleSendNewEmailOtp}
                                            disabled={isSendingNewOtp || newOtpCountdown > 0 || !newEmail}
                                            className="text-xs font-bold text-blue-700 hover:text-blue-800 disabled:text-gray-400 transition-colors flex items-center gap-1.5"
                                        >
                                            <Send className="h-3.5 w-3.5" />
                                            {isSendingNewOtp
                                                ? 'Đang gửi...'
                                                : newOtpCountdown > 0
                                                  ? `Gửi lại sau (${newOtpCountdown}s)`
                                                  : 'Gửi Mã Về Email Mới'}
                                        </button>
                                    </div>

                                    <Input
                                        type="text"
                                        maxLength={6}
                                        value={emailNewOtp}
                                        onChange={(e) => setEmailNewOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123456"
                                        required
                                        className="!py-3 !text-center font-mono !text-xl font-bold tracking-widest bg-white"
                                    />
                                    {errors.otp && (
                                        <p className="text-xs text-red-600 font-medium">{errors.otp}</p>
                                    )}
                                    <p className="text-2xs text-blue-800 flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        Mã OTP chỉ có hiệu lực trong <strong>5 phút</strong>.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="lg"
                                        onClick={() => setEmailStep(1)}
                                    >
                                        Quay Lại Bước 1
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="success"
                                        size="lg"
                                        isLoading={isUpdatingEmail}
                                        className="flex-1 font-bold text-sm py-3"
                                    >
                                        Hoàn Tất Đổi Email Mới
                                    </Button>
                                </div>
                            </form>
                        )}
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
