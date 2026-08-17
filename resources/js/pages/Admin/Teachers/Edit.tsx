import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save, User, BookOpen } from 'lucide-react';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import AppLayout from '@/layouts/AppLayout';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface Teacher {
    id: number;
    teacher_code: string;
    username: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    specialization: string | null;
    gender: 'male' | 'female' | 'other' | null;
    date_of_birth: string | null;
    hire_date: string | null;
    status: string;
    note: string | null;
    center_id: number;
    center?: Center;
}

interface EditProps {
    teacher: Teacher;
    centers: Center[];
    errors?: Record<string, string>;
}

export default function TeacherEdit({ teacher, centers = [], errors = {} }: EditProps) {
    const [centerId, setCenterId] = useState<string>(String(teacher.center_id));
    const [fullName, setFullName] = useState<string>(teacher.full_name || '');
    const [username, setUsername] = useState<string>(teacher.username || '');
    const [email, setEmail] = useState<string>(teacher.email || '');
    const [password, setPassword] = useState<string>('');
    const [teacherCode, setTeacherCode] = useState<string>(teacher.teacher_code || '');
    const [phone, setPhone] = useState<string>(teacher.phone || '');
    const [dateOfBirth, setDateOfBirth] = useState<string>(teacher.date_of_birth || '');
    const [gender, setGender] = useState<string>(teacher.gender || 'male');
    const [hireDate, setHireDate] = useState<string>(teacher.hire_date || '');
    const [specialization, setSpecialization] = useState<string>(teacher.specialization || '');
    const [status, setStatus] = useState<string>(teacher.status || 'active');
    const [note, setNote] = useState<string>(teacher.note || '');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload: any = {
            center_id: Number(centerId),
            full_name: fullName,
            username,
            email: email || null,
            teacher_code: teacherCode,
            phone: phone || null,
            date_of_birth: dateOfBirth || null,
            gender: gender || null,
            hire_date: hireDate || null,
            specialization: specialization || null,
            status,
            note: note || null,
        };

        if (password && password.trim() !== '') {
            payload.password = password;
        }

        router.patch(`/teachers/${teacher.id}`, payload, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout title="Chỉnh Sửa Giáo Viên - Hệ Thống Giáo Dục Sam">
            <Head title="Chỉnh Sửa Giáo Viên" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Top bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/teachers">
                            <Button variant="secondary" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Chỉnh Sửa Giáo Viên: {teacher.full_name}
                            </h1>
                            <p className="text-xs text-gray-500">
                                Cập nhật thông tin giảng dạy, số điện thoại hoặc mật khẩu tài khoản.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                            <User className="h-4 w-4 text-emerald-600" />
                            1. Thông Tin Cơ Bản & Tài Khoản
                        </h2>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Center Selection */}
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Trung Tâm Đào Tạo (*)
                                </label>
                                <select
                                    value={centerId}
                                    onChange={(e) => setCenterId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    {centers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.center_id && (
                                    <p className="mt-1 text-xs text-red-600">{errors.center_id}</p>
                                )}
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Họ Và Tên Giáo Viên (*)
                                </label>
                                <Input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                                {errors.full_name && (
                                    <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>
                                )}
                            </div>

                            {/* Teacher Code */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Mã Giáo Viên
                                </label>
                                <Input
                                    value={teacherCode}
                                    disabled
                                    className="cursor-not-allowed bg-slate-50 font-mono text-gray-600"
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Tên Đăng Nhập (@username) (*)
                                </label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                                {errors.username && (
                                    <p className="mt-1 text-xs text-red-600">{errors.username}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Mật Khẩu Mới (Để trống nếu không đổi)
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Địa Chỉ Email
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Số Điện Thoại Liên Hệ
                                </label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Professional Info Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            2. Chuyên Môn Giảng Dạy & Trạng Thái
                        </h2>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Specialization */}
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Chuyên Môn Đào Tạo / Bộ Môn Phụ Trách
                                </label>
                                <Input
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                />
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Ngày Sinh
                                </label>
                                <Input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                />
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Giới Tính
                                </label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>

                            {/* Hire Date */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Ngày Bắt Đầu Làm Việc
                                </label>
                                <Input
                                    type="date"
                                    value={hireDate}
                                    onChange={(e) => setHireDate(e.target.value)}
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Trạng Thái Hoạt Động
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="active">Đang hoạt động</option>
                                    <option value="inactive">Tạm dừng giảng dạy</option>
                                    <option value="locked">Khóa tài khoản</option>
                                </select>
                            </div>

                            {/* Note */}
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Ghi Chú Thêm
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 p-3 text-xs text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href="/teachers">
                            <Button variant="secondary" size="md">
                                Hủy Bỏ
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            variant="edit"
                            size="md"
                            isLoading={isSubmitting}
                            icon={<Save className="h-4 w-4" />}
                        >
                            Cập Nhật Giáo Viên
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
