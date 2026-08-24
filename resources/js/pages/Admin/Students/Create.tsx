import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, User, HeartHandshake, Calendar, GraduationCap, Check } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import AppLayout from '@/layouts/AppLayout';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface SchoolClassOption {
    id: number;
    name: string;
    code: string;
    center_id: number;
}

interface CreateProps {
    centers: Center[];
    classes?: SchoolClassOption[];
    errors?: Record<string, string>;
}

export default function StudentCreate({ centers = [], classes = [], errors = {} }: CreateProps) {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';
    const userCenterId = auth?.user?.center_id;

    const [centerId, setCenterId] = useState<string>(
        !isSuperAdmin && userCenterId ? String(userCenterId) : (centers[0]?.id ? String(centers[0].id) : '')
    );
    const [fullName, setFullName] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [phone, setPhone] = useState<string>('');
    const [dateOfBirth, setDateOfBirth] = useState<string>('');
    const [gender, setGender] = useState<string>('male');
    const [address, setAddress] = useState<string>('');
    const [parentName, setParentName] = useState<string>('');
    const [parentPhone, setParentPhone] = useState<string>('');
    const [parentRelationship, setParentRelationship] = useState<string>('Bố/Mẹ');
    const [admissionDate, setAdmissionDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<number>(1);
    const [note, setNote] = useState<string>('');
    const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter classes for currently selected center
    const availableClasses = useMemo(() => {
        return classes.filter((c) => !centerId || Number(c.center_id) === Number(centerId));
    }, [classes, centerId]);

    const toggleClass = (classId: number) => {
        setSelectedClassIds((prev) =>
            prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
        );
    };

    const handleFullNameChange = (val: string) => {
        setFullName(val);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/students',
            {
                center_id: centerId ? Number(centerId) : undefined,
                full_name: fullName,
                username: username || undefined,
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
                class_ids: selectedClassIds,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title="Thêm Học Sinh Mới - SAM Digital">
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
                            {/* Center Selection (Super Admin only) */}
                            {isSuperAdmin && (
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
                            )}

                            {/* Full Name */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Họ Và Tên Học Sinh <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={fullName}
                                    onChange={(e) => handleFullNameChange(e.target.value)}
                                    placeholder="Ví dụ: Trần Thị Mai"
                                    maxLength={50}
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
                                    Tên Đăng Nhập (@username) <span className="text-xs font-normal text-gray-500">(Tùy chọn)</span>
                                </label>
                                <Input
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                                    placeholder="Để trống nếu không cấp tài khoản đăng nhập"
                                    maxLength={19}
                                    className="!py-3 !text-sm"
                                />
                                {errors.username && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.username}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mật Khẩu Đăng Nhập <span className="text-xs font-normal text-gray-500">(Tùy chọn)</span>
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Để trống nếu không cấp mật khẩu"
                                    maxLength={20}
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
                                    maxLength={100}
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
                                    maxLength={15}
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
                                <DatePicker
                                    value={dateOfBirth}
                                    onChange={(val) => setDateOfBirth(val)}
                                    className="!py-3 !text-sm w-full"
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
                                    maxLength={255}
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
                                    maxLength={50}
                                    className="!py-3 !text-sm"
                                />
                                {errors.parent_name && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.parent_name}</p>
                                )}
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
                                    maxLength={15}
                                    className="!py-3 !text-sm"
                                />
                                {errors.parent_phone && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.parent_phone}</p>
                                )}
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
                                    maxLength={50}
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
                                <DatePicker
                                    value={admissionDate}
                                    onChange={(val) => setAdmissionDate(val)}
                                    className="!py-3 !text-sm w-full"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Trạng Thái Học Viên
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value={1}>Đang học</option>
                                    <option value={0}>Nghỉ học</option>
                                    <option value={2}>Đã tốt nghiệp</option>
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

                    {/* Class Enrollment Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                                <GraduationCap className="h-5 w-5 text-indigo-600" />
                                4. Ghi Danh Vào Lớp Học (Tùy Chọn)
                            </h2>
                            {selectedClassIds.length > 0 && (
                                <Badge variant="active">
                                    Đã chọn {selectedClassIds.length} lớp học
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                            Chọn các lớp học mà học sinh sẽ tham gia ngay sau khi được tạo hồ sơ.
                        </p>

                        {availableClasses.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 bg-slate-50">
                                Trung tâm được chọn hiện chưa có lớp học nào. Bạn có thể phân lớp sau khi tạo học sinh.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {availableClasses.map((cls) => {
                                    const isSelected = selectedClassIds.includes(cls.id);
                                    return (
                                        <div
                                            key={cls.id}
                                            onClick={() => toggleClass(cls.id)}
                                            className={`cursor-pointer rounded-xl border p-3.5 flex items-center justify-between transition-all select-none ${
                                                isSelected
                                                    ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-500 shadow-xs'
                                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div
                                                    className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center border transition-colors ${
                                                        isSelected
                                                            ? 'bg-emerald-600 border-emerald-600 text-white'
                                                            : 'border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                                </div>
                                                <div className="truncate">
                                                    <p className="font-semibold text-gray-900 text-sm truncate">
                                                        {cls.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-mono">
                                                        {cls.code}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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
