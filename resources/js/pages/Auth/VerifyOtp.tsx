import { Link, router, usePage } from '@inertiajs/react';
import { ShieldCheck, ArrowLeft, KeyRound, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

interface VerifyOtpProps {
    email: string;
    account_type: 'admin' | 'teacher' | 'student';
}

export const VerifyOtp: React.FC<VerifyOtpProps> = ({
    email,
    account_type,
}) => {
    const { errors: serverErrors, flash } = usePage().props as any;
    const [otp, setOtp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/verify-otp',
            { account_type, email, otp },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleResendOtp = () => {
        setIsResending(true);
        router.post(
            '/forgot-password/send-otp',
            { account_type, email },
            {
                onFinish: () => setIsResending(false),
            },
        );
    };

    const getRoleName = (type: string) => {
        switch (type) {
            case 'admin':
                return 'Quản trị viên';
            case 'teacher':
                return 'Giáo viên';
            case 'student':
                return 'Học sinh';
            default:
                return 'Tài khoản';
        }
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
                        Xác thực mã OTP 6 chữ số
                    </p>
                </div>

                {/* Main Card */}
                <Card className="border-gray-200 bg-white p-6 shadow-lg sm:p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Nhập Mã Xác Thực OTP
                            </h2>
                            <p className="text-xs text-gray-500">
                                Mã OTP 6 số đã được gửi tới email:{' '}
                                <strong className="text-gray-800 font-semibold">
                                    {email || 'của bạn'}
                                </strong>{' '}
                                ({getRoleName(account_type)})
                            </p>
                        </div>
                    </div>

                    {/* Server Notifications */}
                    {flash?.success && (
                        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}
                    {serverErrors?.otp && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                            {serverErrors.otp}
                        </div>
                    )}

                    {/* Form OTP */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 text-center mb-2">
                                Nhập 6 chữ số OTP (*):
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="000000"
                                className="w-full text-center text-3xl font-black tracking-[12px] py-3 rounded-xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="success"
                                isLoading={isSubmitting}
                                disabled={otp.length !== 6}
                                className="w-full justify-center py-3 text-sm font-bold shadow-sm"
                            >
                                Xác Thực OTP & Đăng Nhập
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 text-xs">
                        <Link
                            href="/forgot-password"
                            className="inline-flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Đổi email khác
                        </Link>

                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isResending}
                            className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline disabled:opacity-50"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
                            Gửi lại mã OTP
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default VerifyOtp;
