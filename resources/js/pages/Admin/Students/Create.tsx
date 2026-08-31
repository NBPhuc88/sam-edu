import BackButton from '@/components/ui/BackButton';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
    STUDENT_STATUS_ACTIVE,
    STUDENT_STATUS_GRADUATED,
    STUDENT_STATUS_INACTIVE,
    STUDENT_STATUS_LABELS,
} from '@/constants/enums';
import { usePermission } from '@/hooks/usePermission';
import AppLayout from '@/layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Calendar, Check, GraduationCap, HeartHandshake, HelpCircle, Save, User } from 'lucide-react';
import React, { useMemo, useState } from 'react';

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
    const { isSuperAdmin } = usePermission();
    const { auth } = usePage<any>().props;
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
    const [gender, setGender] = useState<number>(1);
    const [address, setAddress] = useState<string>('');
    const [parentName, setParentName] = useState<string>('');
    const [parentPhone, setParentPhone] = useState<string>('');
    const [parentRelationship, setParentRelationship] = useState<string>('Bố/Mẹ');
    const [admissionDate, setAdmissionDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState<number>(STUDENT_STATUS_ACTIVE);
    const [note, setNote] = useState<string>('');
    const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);
    const [selectedTuitionClassIds, setSelectedTuitionClassIds] = useState<number[]>([]);
    const [showTuitionConfirm, setShowTuitionConfirm] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter classes for currently selected center
    const availableClasses = useMemo(() => {
        return classes.filter((c) => !centerId || Number(c.center_id) === Number(centerId));
    }, [classes, centerId]);

    const selectedClasses = useMemo(() => {
        return availableClasses.filter((c) => selectedClassIds.includes(c.id));
    }, [availableClasses, selectedClassIds]);

    const toggleClass = (classId: number) => {
        setSelectedClassIds((prev) =>
            prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
        );
    };

    const toggleTuitionClass = (classId: number) => {
        setSelectedTuitionClassIds((prev) =>
            prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
        );
    };

    const handleSelectAllTuitionClasses = () => {
        if (selectedTuitionClassIds.length === selectedClasses.length) {
            setSelectedTuitionClassIds([]);
        } else {
            setSelectedTuitionClassIds(selectedClasses.map((c) => c.id));
        }
    };

    const handleFullNameChange = (val: string) => {
        setFullName(val);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedClassIds.length > 0) {
            setSelectedTuitionClassIds(selectedClassIds);
            setShowTuitionConfirm(true);
        } else {
            executeSubmit(0, []);
        }
    };

    const executeSubmit = (createTuition: number, tuitionClassIds: number[] = []) => {
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
                create_tuition: createTuition,
                tuition_class_ids: createTuition ? tuitionClassIds : [],
            },
            {
                onFinish: () => setIsSubmitting(false),
                onError: () => setShowTuitionConfirm(false),
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
                        <BackButton fallbackUrl="/students" size="md" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Thêm Học Sinh Mới</h1>
                            <p className="text-sm text-gray-500">
                                Khởi tạo hồ sơ học viên, thông tin tài khoản và thông tin liên hệ phụ huynh.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
                    {/* Hidden dummy inputs to absorb browser password manager auto-fill */}
                    <div style={{ position: 'absolute', opacity: 0, height: 0, width: 0, overflow: 'hidden', zIndex: -1 }} aria-hidden="true">
                        <input type="text" name="prevent_autofill_username" tabIndex={-1} autoComplete="username" />
                        <input type="password" name="prevent_autofill_password" tabIndex={-1} autoComplete="current-password" />
                    </div>

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
                                        id="student_center_id"
                                        name="center_id"
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
                                    id="student_full_name"
                                    name="full_name"
                                    autoComplete="off"
                                    data-lpignore="true"
                                    data-1p-ignore="true"
                                    data-form-type="other"
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
                                    id="student_code_display"
                                    name="student_code_display"
                                    value="Hệ thống tự động sinh mã (VD: HS0000001)"
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
                                    id="student_username"
                                    name="student_user_login"
                                    autoComplete="off"
                                    data-lpignore="true"
                                    data-1p-ignore="true"
                                    data-form-type="other"
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
                                    id="student_password"
                                    name="student_user_password"
                                    type="password"
                                    autoComplete="new-password"
                                    data-lpignore="true"
                                    data-1p-ignore="true"
                                    data-form-type="other"
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
                                    id="student_email"
                                    name="student_contact_email"
                                    type="email"
                                    autoComplete="off"
                                    data-lpignore="true"
                                    data-1p-ignore="true"
                                    data-form-type="other"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@gmail.com"
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
                                    id="student_phone"
                                    name="phone"
                                    autoComplete="off"
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
                                    id="student_gender"
                                    name="gender"
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
                                    id="student_address"
                                    name="address"
                                    autoComplete="off"
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
                                    id="student_parent_name"
                                    name="parent_name"
                                    autoComplete="off"
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
                                    id="student_parent_phone"
                                    name="parent_phone"
                                    autoComplete="off"
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
                                    id="student_parent_relationship"
                                    name="parent_relationship"
                                    autoComplete="off"
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
                                    <option value={STUDENT_STATUS_ACTIVE}>{STUDENT_STATUS_LABELS[STUDENT_STATUS_ACTIVE] || 'Đang theo học'}</option>
                                    <option value={STUDENT_STATUS_INACTIVE}>{STUDENT_STATUS_LABELS[STUDENT_STATUS_INACTIVE] || 'Tạm ngưng / Nghỉ học'}</option>
                                    <option value={STUDENT_STATUS_GRADUATED}>{STUDENT_STATUS_LABELS[STUDENT_STATUS_GRADUATED] || 'Đã tốt nghiệp'}</option>
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
                        <BackButton fallbackUrl="/students" size="lg" label="Hủy Bỏ" />
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

            {showTuitionConfirm && (
                <Modal
                    isOpen={showTuitionConfirm}
                    onClose={() => !isSubmitting && setShowTuitionConfirm(false)}
                    title="Xác Nhận Tạo Học Phí Cho Lớp Học"
                    maxWidth="lg"
                >
                    <div className="space-y-4">
                        <div className="flex items-start gap-3.5 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 text-sm">
                                <p className="font-semibold text-gray-900">
                                    Có tạo học phí cho các lớp đã chọn?
                                </p>
                                <p className="text-gray-600 leading-relaxed text-xs">
                                    Học sinh <span className="font-medium text-gray-900">{fullName || 'mới'}</span> được ghi danh vào <span className="font-semibold text-emerald-800">{selectedClasses.length} lớp học</span>. Chọn các lớp bạn muốn tự động sinh hồ sơ học phí:
                                </p>
                            </div>
                        </div>

                        {/* List of classes with checkboxes */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <button
                                    type="button"
                                    onClick={handleSelectAllTuitionClasses}
                                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer select-none"
                                >
                                    <div
                                        className={`w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors ${
                                            selectedTuitionClassIds.length === selectedClasses.length
                                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                                : 'border-gray-300 bg-white'
                                        }`}
                                    >
                                        {selectedTuitionClassIds.length === selectedClasses.length && (
                                            <Check className="w-3 h-3 stroke-[3]" />
                                        )}
                                    </div>
                                    Chọn tất cả lớp ({selectedTuitionClassIds.length}/{selectedClasses.length})
                                </button>
                            </div>

                            <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-xl border border-gray-200">
                                {selectedClasses.map((cls) => {
                                    const isChecked = selectedTuitionClassIds.includes(cls.id);
                                    return (
                                        <div
                                            key={cls.id}
                                            onClick={() => toggleTuitionClass(cls.id)}
                                            className={`cursor-pointer flex items-center justify-between gap-3 p-2.5 rounded-lg border transition-all select-none ${
                                                isChecked
                                                    ? 'bg-white border-emerald-400 ring-1 ring-emerald-400/40 shadow-2xs'
                                                    : 'bg-white/60 border-gray-200 hover:bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div
                                                    className={`w-4.5 h-4.5 rounded shrink-0 flex items-center justify-center border transition-colors ${
                                                        isChecked
                                                            ? 'bg-emerald-600 border-emerald-600 text-white'
                                                            : 'border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <span className="font-semibold text-gray-900 text-xs">
                                                        {cls.name}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-2xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono border border-gray-200">
                                                {cls.code}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowTuitionConfirm(false)}
                                disabled={isSubmitting}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => executeSubmit(0, [])}
                                isLoading={isSubmitting}
                            >
                                Không tạo học phí
                            </Button>
                            <Button
                                type="button"
                                variant="success"
                                onClick={() => executeSubmit(selectedTuitionClassIds.length > 0 ? 1 : 0, selectedTuitionClassIds)}
                                isLoading={isSubmitting}
                            >
                                {selectedTuitionClassIds.length > 0
                                    ? `Có, tạo học phí (${selectedTuitionClassIds.length} lớp)`
                                    : 'Có, tạo học phí'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AppLayout>
    );
}
