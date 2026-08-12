import { router, usePage } from '@inertiajs/react';
import { Lock, ShieldAlert, KeyRound } from 'lucide-react';
import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

export const ForceChangePassword: React.FC = () => {
    const { errors: serverErrors, flash } = usePage().props as any;
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/force-change-password',
            {
                password,
                password_confirmation: passwordConfirmation,
            },
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
                    <div className="inline-flex items-center justify-center rounded-2xl bg-amber-600 px-4 py-2.5 text-xl font-black text-white shadow-md">
                        SAM
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                        Bắt Buộc Cập Nhật Mật Khẩu Mới
                    </h1>
                    <p className="text-xs text-amber-700 font-semibold">
                        Bạn vừa đăng nhập qua mã xác thực OTP
                    </p>
                </div>

                {/* Main Card */}
                <Card className="border-amber-200 bg-white p-6 shadow-xl sm:p-8">
                    {/* Security Notice Banner */}
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-900">
                        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                            <span className="font-bold">Yêu cầu bảo mật hệ thống:</span>
                            <p className="mt-1 text-amber-800 leading-relaxed">
                                Để bảo vệ tài khoản cá nhân, vui lòng đặt lại mật khẩu mới ngay bây giờ. Mật khẩu mới sẽ thay thế hoàn toàn mật khẩu cũ và mã OTP vừa sử dụng.
                            </p>
                        </div>
                    </div>

                    {/* Server Error / Info Notifications */}
                    {flash?.info && (
                        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                            {flash.info}
                        </div>
                    )}
                    {flash?.warning && (
                        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                            {flash.warning}
                        </div>
                    )}
                    {serverErrors?.password && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                            {serverErrors.password}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Mật khẩu mới (*)"
                            type="password"
                            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                            icon={<Lock className="h-4 w-4" />}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <Input
                            label="Xác nhận mật khẩu mới (*)"
                            type="password"
                            placeholder="Nhập lại mật khẩu mới..."
                            icon={<KeyRound className="h-4 w-4" />}
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                        />

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="success"
                                isLoading={isSubmitting}
                                className="w-full justify-center py-3 text-sm font-bold shadow-sm"
                            >
                                Lưu & Cập Nhật Mật Khẩu Mới
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default ForceChangePassword;
