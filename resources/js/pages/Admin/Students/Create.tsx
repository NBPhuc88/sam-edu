import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save, User, HeartHandshake, Calendar } from 'lucide-react';
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

interface CreateProps {
    centers: Center[];
    errors?: Record<string, string>;
}

export default function StudentCreate({ centers = [], errors = {} }: CreateProps) {
    const [centerId, setCenterId] = useState<string>(centers[0]?.id ? String(centers[0].id) : '');
    const [fullName, setFullName] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('12345678');
    const [phone, setPhone] = useState<string>('');
    const [dateOfBirth, setDateOfBirth] = useState<string>('');
    const [gender, setGender] = useState<string>('male');
    const [address, setAddress] = useState<string>('');
    const [parentName, setParentName] = useState<string>('');
    const [parentPhone, setParentPhone] = useState<string>('');
    const [parentRelationship, setParentRelationship] = useState<string>('Bố/Mẹ');
    const [admissionDate, setAdmissionDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<string>('active');
    const [note, setNote] = useState<string>('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto generate username from full name
    const handleFullNameChange = (val: string) => {
        setFullName(val);

        if (!username) {
            const clean = val
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'd')
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '');

            if (clean) {
                setUsername(clean);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/students',
            {
                center_id: centerId ? Number(centerId) : undefined,
                full_name: fullName,
                username,
                email: email || undefined,
                password: password || undefined,
                phone: phone || undefined,
                date_of_birth: dateOfBirth || undefined,
                gender: gender || undefined,
                address: address || undefined,
                parent_name: parentName || undefined,
                parent_phone: parentPhone || undefined,
                parent_relationship: parentRelationship || undefined,
                admission_date: admissionDate || undefined,
                status,
                note: note || undefined,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title="Thêm Học Sinh Mới - Hệ Thống Giáo Dục Sam">
            <Head title="Thêm Học Sinh Mới" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/students">
                            <Button variant="secondary" size="md" icon={<ArrowLeft className="h-5 w-5" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Thêm Học Sinh Mới</h1>
                            <p className="text-sm text-gray-500">
                                Khởi tạo hồ sơ học viên, thông tin tài khoản và thông tin liên hệ phụ huynh.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-5 flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                            <User className="h-5 w-5 text-emerald-600" />
                            1. Thông Tin Học Sinh & Tài Khoản
                        </h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
                            {/* Center Selection */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Trung Tâm Đào Tạo <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={centerId}
                                    onChange={(e) => setCenterId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="">-- Chọn Trung tâm --</option>
                                    {centers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.center_id && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.center_id}</p>
                                )}
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Họ Và Tên Học Sinh <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={fullName}
                                    onChange={(e) => handleFullNameChange(e.target.value)}
                                    placeholder="Ví dụ: Trần Thị Mai"
                                    className="!py-3 !text-sm"
                                    required
                                />
                                {errors.full_name && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.full_name}</p>
                                )}
                            </div>

                            {/* Student Code (Auto Generated) */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mã Học Sinh
                                </label>
                                <Input
                                    value="Hệ thống tự động sinh mã (VD: HS0001)"
                                    disabled
                                    className="cursor-not-allowed bg-slate-50 !py-3 !text-sm text-gray-500 italic"
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Tên Đăng Nhập (@username) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Ví dụ: hs_tranmai"
                                    className="!py-3 !text-sm"
                                    required
                                />
                                {errors.username && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.username}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mật Khẩu Đăng Nhập (Mặc định: 12345678)
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="!py-3 !text-sm"
                                />
                                {errors.password && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Địa Chỉ Email
                                </label>
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tranthimai@gmail.com"
                                    className="!py-3 !text-sm"
                                />
                                {errors.email && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Số Điện Thoại Học Sinh
                                </label>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0987654321"
                                    className="!py-3 !text-sm"
                                />
                                {errors.phone && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
                                )}
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ngày Sinh
                                </label>
                                <Input
                                    type="date"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                    className="!py-3 !text-sm"
                                />
                            </div>

                            {/* Gender */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Giới Tính
                                </label>
                                <select
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>

                            {/* Address */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Địa Chỉ Thường Trú
                                </label>
                                <Input
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Ví dụ: Số 123 Đường Nguyễn Trãi, Quận 1, TP.HCM"
                                    className="!py-3 !text-sm"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Parent / Guardian Info Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-5 flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                            <HeartHandshake className="h-5 w-5 text-blue-600" />
                            2. Thông Tin Phụ Huynh / Người Giám Hộ
                        </h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
                            {/* Parent Name */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Họ Tên Phụ Huynh
                                </label>
                                <Input
                                    value={parentName}
                                    onChange={(e) => setParentName(e.target.value)}
                                    placeholder="Ví dụ: Trần Văn Hùng"
                                    className="!py-3 !text-sm"
                                />
                            </div>

                            {/* Parent Phone */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Số Điện Thoại Phụ Huynh
                                </label>
                                <Input
                                    value={parentPhone}
                                    onChange={(e) => setParentPhone(e.target.value)}
                                    placeholder="0901234567"
                                    className="!py-3 !text-sm"
                                />
                            </div>

                            {/* Parent Relationship */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mối Quan Hệ
                                </label>
                                <Input
                                    value={parentRelationship}
                                    onChange={(e) => setParentRelationship(e.target.value)}
                                    placeholder="Ví dụ: Bố, Mẹ, Người giám hộ..."
                                    className="!py-3 !text-sm"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Schooling & Status Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-5 flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                            <Calendar className="h-5 w-5 text-amber-600" />
                            3. Trạng Thái & Ngày Nhập Học
                        </h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
                            {/* Admission Date */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ngày Nhập Học
                                </label>
                                <Input
                                    type="date"
                                    value={admissionDate}
                                    onChange={(e) => setAdmissionDate(e.target.value)}
                                    className="!py-3 !text-sm"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Trạng Thái Học Viên
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ghi Chú
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    placeholder="Năng lực tiếp thu, nguyện vọng học tập hoặc ghi chú riêng..."
                                    className="w-full rounded-lg border border-gray-300 p-3.5 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href="/students">
                            <Button variant="secondary" size="lg">
                                Hủy Bỏ
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            variant="success"
                            size="lg"
                            isLoading={isSubmitting}
                            icon={<Save className="h-5 w-5" />}
                        >
                            Lưu Học Sinh
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
