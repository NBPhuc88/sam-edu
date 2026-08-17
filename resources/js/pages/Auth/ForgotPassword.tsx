import { Link, router, usePage } from '@inertiajs/react';
import {
    Mail,
    ShieldCheck,
    Users,
    GraduationCap,
    ArrowLeft,
    KeyRound,
} from 'lucide-react';
import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

export const ForgotPassword: React.FC = () => {
    const { errors: serverErrors, flash } = usePage().props as any;
    const [accountType, setAccountType] = useState<
        'admin' | 'teacher' | 'student'
    >('admin');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/forgot-password/send-otp',
            { account_type: accountType, email },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 font-sans text-gray-900">
            <div className="w-full max-w-lg space-y-6">
                {/* Brand Header */}
                <div className="space-y-2 text-center">
                    <Link
                        href="/"
                        title="Về trang chủ Sam Edu"
                        className="group inline-flex flex-col items-center gap-2"
                    >
                        <div className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-xl font-black text-white shadow-md transition-transform group-hover:scale-105">
                            SAM
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 transition-colors group-hover:text-emerald-700">
                            Hệ thống Quản lý Giáo dục Sam
                        </h1>
                    </Link>
                    <p className="text-xs text-gray-500">
                        Quên mật khẩu & Gửi mã OTP xác thực
                    </p>
                </div>

                {/* Main Card */}
                <Card className="border-gray-200 bg-white p-6 shadow-lg sm:p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <KeyRound className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Yêu cầu Mã OTP Đăng nhập
                            </h2>
                            <p className="text-xs text-gray-500">
                                Chọn loại tài khoản và nhập email để nhận OTP 6 số
                            </p>
                        </div>
                    </div>

                    {/* Role Selection Tabs */}
                    <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
                        <button
                            type="button"
                            onClick={() => setAccountType('admin')}
                            className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                                accountType === 'admin'
                                    ? 'bg-white text-emerald-800 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Quản trị
                        </button>

                        <button
                            type="button"
                            onClick={() => setAccountType('teacher')}
                            className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                                accountType === 'teacher'
                                    ? 'bg-white text-emerald-800 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Users className="h-3.5 w-3.5" />
                            Giáo viên
                        </button>

                        <button
                            type="button"
                            onClick={() => setAccountType('student')}
                            className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                                accountType === 'student'
                                    ? 'bg-white text-emerald-800 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <GraduationCap className="h-3.5 w-3.5" />
                            Học sinh
                        </button>
                    </div>

                    {/* Server Messages */}
                    {serverErrors?.email && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                            {serverErrors.email}
                        </div>
                    )}
                    {flash?.success && (
                        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email đăng ký tài khoản (*)"
                            type="email"
                            placeholder="Nhập email của bạn..."
                            icon={<Mail className="h-4 w-4" />}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="success"
                                isLoading={isSubmitting}
                                className="w-full justify-center py-3 text-sm font-bold shadow-sm"
                            >
                                Gửi Mã OTP 6 Số Qua Email
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 border-t border-gray-100 pt-4 text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;
