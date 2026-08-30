import BackButton from '@/components/ui/BackButton';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { Calendar,Check,GraduationCap,HeartHandshake,Save,User } from 'lucide-react';
import React,{ useMemo,useState } from 'react';

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

interface StudentClassTag {
    id: number;
    name: string;
    code: string;
}

interface Student {
    id: number;
    student_code: string;
    username: string | null;
    full_name: string;
    email: string | null;
    phone: string | null;
    gender: number | null;
    date_of_birth: string | null;
    address: string | null;
    parent_name: string | null;
    parent_phone: string | null;
    parent_relationship: string | null;
    admission_date: string | null;
    status: number;
    note: string | null;
    center_id: number;
    center?: Center;
    classes?: StudentClassTag[];
}

interface EditProps {
    student: Student;
    centers: Center[];
    classes?: SchoolClassOption[];
    errors?: Record<string, string>;
}

export default function StudentEdit({ student, centers = [], classes = [], errors = {} }: EditProps) {
    const [centerId, setCenterId] = useState<string>(String(student.center_id));
    const [fullName, setFullName] = useState<string>(student.full_name || '');
    const [username, setUsername] = useState<string>(student.username || '');
    const [email, setEmail] = useState<string>(student.email || '');
    const [password, setPassword] = useState<string>('');
    const studentCode = student.student_code || '';
    const [phone, setPhone] = useState<string>(student.phone || '');
    const [dateOfBirth, setDateOfBirth] = useState<string>(student.date_of_birth || '');
    const [gender, setGender] = useState<number>(student.gender === 2 ? 2 : student.gender === 3 ? 3 : 1);
    const [address, setAddress] = useState<string>(student.address || '');
    const [parentName, setParentName] = useState<string>(student.parent_name || '');
    const [parentPhone, setParentPhone] = useState<string>(student.parent_phone || '');
    const [parentRelationship, setParentRelationship] = useState<string>(student.parent_relationship || 'Bố/Mẹ');
    const [selectedClassIds, setSelectedClassIds] = useState<number[]>(
        student.classes?.map((c) => c.id) || []
    );

    // Filter classes for currently selected center
    const availableClasses = useMemo(() => {
        return classes.filter((c) => !centerId || Number(c.center_id) === Number(centerId));
    }, [classes, centerId]);

    const toggleClass = (classId: number) => {
        setSelectedClassIds((prev) =>
            prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
        );
    };

    const normalizeStatus = (val: any): number => {
        if (val === 1 || val === '1' || val === 'active') return 1;
        if (val === 0 || val === '0' || val === 'inactive' || val === 'paused' || val === 'suspended' || val === 'locked') return 0;
        if (val === 2 || val === '2' || val === 'graduated' || val === 'completed') return 2;
        return 1;
    };

    const [admissionDate, setAdmissionDate] = useState<string>(student.admission_date || '');
    const [status, setStatus] = useState<number>(() => normalizeStatus(student.status));
    const [note, setNote] = useState<string>(student.note || '');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload: any = {
            center_id: Number(centerId),
            full_name: fullName,
            username: username ? username.trim() : null,
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
            class_ids: selectedClassIds,
        };

        if (password && password.trim() !== '') {
            payload.password = password;
        }

        router.patch(`/students/${student.id}`, payload, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout title={`Chỉnh Sửa Học Sinh: ${student.full_name} - SAM Digital`}>
            <Head title={`Chỉnh Sửa Học Sinh: ${student.full_name}`} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BackButton fallbackUrl="/students" size="md" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Chỉnh Sửa: {student.full_name}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Cập nhật thông tin học viên, mã học sinh và thông tin liên hệ phụ huynh.
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

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Center */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Trung Tâm Đào Tạo <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={centerId}
                                    onChange={(e) => setCenterId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-3 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="">-- Chọn Trung Tâm --</option>
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
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Ví dụ: Trần Thị Mai"
                                    maxLength={50}
                                    className="!py-3 !text-sm font-medium"
                                    required
                                />
                                {errors.full_name && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.full_name}</p>
                                )}
                            </div>

                            {/* Student Code */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mã Học Sinh (Không thể thay đổi)
                                </label>
                                <Input
                                    value={studentCode}
                                    disabled
                                    className="cursor-not-allowed bg-slate-50 font-mono !py-3 !text-sm text-gray-600"
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
                                    Mật Khẩu Mới (Để trống nếu không đổi/không dùng)
                                </label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
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
                                    placeholder="Ví dụ: 0912345678"
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
                                    onChange={(e) => setGender(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value={1}>Nam</option>
                                    <option value={2}>Nữ</option>
                                    <option value={3}>Khác</option>
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
                                    maxLength={50}
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
                                    placeholder="Ví dụ: 0901234567"
                                    maxLength={15}
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
                                4. Lớp Học Tham Gia
                            </h2>
                            {selectedClassIds.length > 0 && (
                                <Badge variant="active">
                                    Đang tham gia {selectedClassIds.length} lớp
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                            Tích chọn các lớp học mà học sinh này đang theo học tại trung tâm.
                        </p>

                        {availableClasses.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 bg-slate-50">
                                Trung tâm này hiện chưa có lớp học nào khả dụng.
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
                        <BackButton fallbackUrl="/students" size="lg" label="Hủy Bỏ" />
                        <Button
                            type="submit"
                            variant="edit"
                            size="lg"
                            isLoading={isSubmitting}
                            icon={<Save className="h-5 w-5" />}
                        >
                            Cập Nhật Học Sinh
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
