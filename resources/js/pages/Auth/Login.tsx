import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router, usePage } from '@inertiajs/react';
import { Lock, User, ShieldCheck, GraduationCap, Users } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';

const loginSchema = z.object({
    role: z.enum(['admin', 'teacher', 'student']),
    username: z.string().min(1, 'Vui lòng nhập tên đăng nhập hoặc email'),
    password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
    const { errors: serverErrors } = usePage().props as any;
    const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'student'>('admin');

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            role: 'admin',
            username: '',
            password: '',
        },
    });

    const handleRoleChange = (role: 'admin' | 'teacher' | 'student') => {
        setSelectedRole(role);
        setValue('role', role);
    };

    const onSubmit = (data: LoginFormValues) => {
        router.post('/login', data);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-gray-900">
            <div className="w-full max-w-md space-y-6">
                {/* Brand Header with Link to Homepage */}
                <div className="text-center space-y-2">
                    <Link href="/" title="Về trang chủ Sam Edu" className="inline-flex flex-col items-center gap-2 group">
                        <div className="inline-flex items-center justify-center px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
                            SAM
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 group-hover:text-emerald-700 transition-colors">
                            Hệ thống Quản lý Giáo dục Sam
                        </h1>
                    </Link>
                    <p className="text-xs text-gray-500">Đăng nhập tài khoản quản trị, giáo viên hoặc học sinh</p>
                </div>

                {/* Main Login Card */}
                <Card className="shadow-lg border-gray-200 bg-white p-6 sm:p-8">
                    {/* Role Selection Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                        <button
                            type="button"
                            onClick={() => handleRoleChange('admin')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                                selectedRole === 'admin'
                                    ? 'bg-white text-emerald-800 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Quản trị
                        </button>

                        <button
                            type="button"
                            onClick={() => handleRoleChange('teacher')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                                selectedRole === 'teacher'
                                    ? 'bg-white text-emerald-800 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            Giáo viên
                        </button>

                        <button
                            type="button"
                            onClick={() => handleRoleChange('student')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                                selectedRole === 'student'
                                    ? 'bg-white text-emerald-800 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <GraduationCap className="w-3.5 h-3.5" />
                            Học sinh
                        </button>
                    </div>

                    {/* Server Error Notification */}
                    {(serverErrors?.username || serverErrors?.email) && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                            {serverErrors.username || serverErrors.email}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <input type="hidden" {...register('role')} />

                        <Input
                            label="Tên đăng nhập / Email"
                            placeholder="Nhập username hoặc email..."
                            icon={<User className="w-4 h-4" />}
                            error={errors.username?.message}
                            {...register('username')}
                        />

                        <Input
                            label="Mật khẩu"
                            type="password"
                            placeholder="••••••••"
                            icon={<Lock className="w-4 h-4" />}
                            error={errors.password?.message}
                            {...register('password')}
                        />

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="success"
                                isLoading={isSubmitting}
                                className="w-full justify-center py-3 text-base shadow-sm"
                            >
                                Đăng nhập hệ thống
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Footer Info */}
                <div className="text-center text-xs text-gray-500">
                    Gặp sự cố đăng nhập? Liên hệ Ban quản trị trung tâm.
                </div>
            </div>
        </div>
    );
};

export default Login;
