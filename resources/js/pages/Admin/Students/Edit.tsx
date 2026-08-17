import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save, Users, Building2, User, Mail, Phone, Lock, Calendar, Home, HeartHandshake } from 'lucide-react';
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

interface Student {
    id: number;
    student_code: string;
    username: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    gender: 'male' | 'female' | 'other' | null;
    date_of_birth: string | null;
    address: string | null;
    parent_name: string | null;
    parent_phone: string | null;
    parent_relationship: string | null;
    admission_date: string | null;
    status: string;
    note: string | null;
    center_id: number;
    center?: Center;
}

interface EditProps {
    student: Student;
    centers: Center[];
    errors?: Record<string, string>;
}

export default function StudentEdit({ student, centers = [], errors = {} }: EditProps) {
    const [centerId, setCenterId] = useState<string>(String(student.center_id));
    const [fullName, setFullName] = useState<string>(student.full_name || '');
    const [username, setUsername] = useState<string>(student.username || '');
    const [email, setEmail] = useState<string>(student.email || '');
    const [password, setPassword] = useState<string>('');
    const [studentCode, setStudentCode] = useState<string>(student.student_code || '');
    const [phone, setPhone] = useState<string>(student.phone || '');
    const [dateOfBirth, setDateOfBirth] = useState<string>(student.date_of_birth || '');
    const [gender, setGender] = useState<string>(student.gender || 'male');
    const [address, setAddress] = useState<string>(student.address || '');
    const [parentName, setParentName] = useState<string>(student.parent_name || '');
    const [parentPhone, setParentPhone] = useState<string>(student.parent_phone || '');
    const [parentRelationship, setParentRelationship] = useState<string>(student.parent_relationship || 'Bố/Mẹ');
    const [admissionDate, setAdmissionDate] = useState<string>(student.admission_date || '');
    const [status, setStatus] = useState<string>(student.status || 'active');
    const [note, setNote] = useState<string>(student.note || '');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload: any = {
            center_id: Number(centerId),
            full_name: fullName,
            username,
            email: email || null,
            student_code: studentCode,
            phone: phone || null,
            date_of_birth: dateOfBirth || null,
            gender: gender || null,
            address: address || null,
            parent_name: parentName || null,
            parent_phone: parentPhone || null,
            parent_relationship: parentRelationship || null,
            admission_date: admissionDate || null,
            status,
            note: note || null,
        };

        if (password && password.trim() !== '') {
            payload.password = password;
        }

        router.patch(`/students/${student.id}`, payload, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout title="Chỉnh Sửa Học Sinh - Hệ Thống Giáo Dục Sam">
            <Head title="Chỉnh Sửa Học Sinh" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Top bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/students">
                            <Button variant="secondary" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Chỉnh Sửa Học Sinh: {student.full_name}
                            </h1>
                            <p className="text-xs text-gray-500">
                                Cập nhật thông tin học viên, thông tin phụ huynh hoặc trạng thái học tập.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                            <User className="h-4 w-4 text-emerald-600" />
                            1. Thông Tin Học Sinh & Tài Khoản
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
                                    Họ Và Tên Học Sinh (*)
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

                            {/* Student Code */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Mã Học Sinh (*)
                                </label>
                                <Input
                                    value={studentCode}
                                    onChange={(e) => setStudentCode(e.target.value)}
                                    required
                                />
                                {errors.student_code && (
                                    <p className="mt-1 text-xs text-red-600">{errors.student_code}</p>
                                )}
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
                                    Số Điện Thoại Học Sinh
                                </label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                                )}
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

                            {/* Address */}
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Địa Chỉ Thường Trú
                                </label>
                                <Input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Parent / Guardian Info Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                            <HeartHandshake className="h-4 w-4 text-blue-600" />
                            2. Thông Tin Phụ Huynh / Người Giám Hộ
                        </h2>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            {/* Parent Name */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Họ Tên Phụ Huynh
                                </label>
                                <Input
                                    value={parentName}
                                    onChange={(e) => setParentName(e.target.value)}
                                />
                            </div>

                            {/* Parent Phone */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Số Điện Thoại Phụ Huynh
                                </label>
                                <Input
                                    value={parentPhone}
                                    onChange={(e) => setParentPhone(e.target.value)}
                                />
                            </div>

                            {/* Parent Relationship */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Mối Quan Hệ
                                </label>
                                <Input
                                    value={parentRelationship}
                                    onChange={(e) => setParentRelationship(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Schooling & Status Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                            <Calendar className="h-4 w-4 text-amber-600" />
                            3. Trạng Thái & Ngày Nhập Học
                        </h2>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Admission Date */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Ngày Nhập Học
                                </label>
                                <Input
                                    type="date"
                                    value={admissionDate}
                                    onChange={(e) => setAdmissionDate(e.target.value)}
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Trạng Thái Học Viên
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="active">Đang học</option>
                                    <option value="inactive">Nghỉ học</option>
                                    <option value="graduated">Đã tốt nghiệp</option>
                                    <option value="suspended">Đình chỉ học</option>
                                    <option value="locked">Khóa tài khoản</option>
                                </select>
                            </div>

                            {/* Note */}
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Ghi Chú
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
                        <Link href="/students">
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
                            Cập Nhật Học Sinh
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
