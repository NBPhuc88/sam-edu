import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import {
    CLASS_STATUS_ACTIVE,
    CLASS_STATUS_CLOSED,
    CLASS_STATUS_COMPLETED,
    CLASS_STATUS_INACTIVE,
    CLASS_STATUS_LABELS,
    DISCOUNT_TYPE_DIRECT,
    DISCOUNT_TYPE_OPTIONS,
    DISCOUNT_TYPE_PERCENTAGE,
} from '@/constants/enums';
import { usePermission } from '@/hooks/usePermission';
import AppLayout from '@/layouts/AppLayout';
import { Head,Link,router,usePage } from '@inertiajs/react';
import { AlertCircle,BookOpen,GraduationCap,Plus,Save,Trash2 } from 'lucide-react';
import React,{ useState } from 'react';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface Subject {
    id: number;
    name: string;
    code: string;
    center_id: number;
    tuition_fee?: number | string | null;
}

interface Teacher {
    id: number;
    full_name: string;
    teacher_code: string;
    center_id: number;
}

interface CreateProps {
    centers: Center[];
    subjects: Subject[];
    teachers: Teacher[];
    errors?: Record<string, string>;
}

interface SubjectTeacherRow {
    subject_id: string;
    teacher_id: string;
    tuition_fee: string;
    discount_type: string;
    discount_value: string;
}

export default function ClassCreate({ centers = [], subjects = [], teachers = [], errors = {} }: CreateProps) {
    const { isSuperAdmin } = usePermission();
    const { auth } = usePage<any>().props;
    const userCenterId = auth?.user?.center_id;

    const [centerId, setCenterId] = useState<string>(
        !isSuperAdmin && userCenterId ? String(userCenterId) : (centers[0]?.id ? String(centers[0].id) : '')
    );
    const [name, setName] = useState<string>('');
    const [maxStudents, setMaxStudents] = useState<string>('30');
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>('' );
    const [status, setStatus] = useState<number>(CLASS_STATUS_ACTIVE);
    const [description, setDescription] = useState<string>('');

    // Dynamic list of subjects & assigned teachers & subject tuition fee & discounts
    const [subjectRows, setSubjectRows] = useState<SubjectTeacherRow[]>([
        { subject_id: '', teacher_id: '', tuition_fee: '', discount_type: '', discount_value: '' },
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const currentErrors = { ...errors, ...clientErrors };

    const isActiveStatus = Number(status) === CLASS_STATUS_ACTIVE;

    // Filter available subjects and teachers by selected center with fallback to all items
    const availableSubjects = React.useMemo(() => {
        const centerSubjects = subjects.filter((s) => !centerId || String(s.center_id) === String(centerId));

        if (centerSubjects.length > 0) {
            return centerSubjects;
        }

        return subjects; // Fallback to all subjects if none match this center
    }, [centerId, subjects]);

    const availableTeachers = React.useMemo(() => {
        const centerTeachers = teachers.filter((t) => !centerId || String(t.center_id) === String(centerId));

        if (centerTeachers.length > 0) {
            return centerTeachers;
        }

        return teachers; // Fallback to all teachers if none match this center
    }, [centerId, teachers]);

    const calculateRowFinalFee = (row: SubjectTeacherRow): number => {
        const baseFee = Number(row.tuition_fee) || 0;
        if (baseFee <= 0) return 0;
        const type = Number(row.discount_type);
        const val = Number(row.discount_value) || 0;
        if (type === DISCOUNT_TYPE_DIRECT) {
            return Math.max(0, baseFee - val);
        }
        if (type === DISCOUNT_TYPE_PERCENTAGE) {
            return Math.max(0, Math.round(baseFee * (1 - val / 100)));
        }
        return baseFee;
    };

    const totalTuitionFee = React.useMemo(() => {
        if (!isActiveStatus) return 0;
        return subjectRows.reduce((sum, r) => {
            if (r.subject_id) {
                return sum + calculateRowFinalFee(r);
            }
            return sum;
        }, 0);
    }, [subjectRows, isActiveStatus]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const handleAddSubjectRow = () => {
        if (!isActiveStatus) return;
        setSubjectRows([...subjectRows, { subject_id: '', teacher_id: '', tuition_fee: '', discount_type: '', discount_value: '' }]);
    };

    const handleRemoveSubjectRow = (index: number) => {
        if (subjectRows.length === 1) {
            setSubjectRows([{ subject_id: '', teacher_id: '', tuition_fee: '', discount_type: '', discount_value: '' }]);

            return;
        }

        setSubjectRows(subjectRows.filter((_, idx) => idx !== index));
    };

    const handleRowChange = (index: number, field: keyof SubjectTeacherRow, value: string) => {
        const updated = [...subjectRows];
        updated[index][field] = value;

        // Khi chọn môn học, tự động điền học phí mặc định của môn học nếu có
        if (field === 'subject_id') {
            const foundSubject = subjects.find((s) => String(s.id) === String(value));
            if (foundSubject && foundSubject.tuition_fee !== undefined && foundSubject.tuition_fee !== null) {
                updated[index].tuition_fee = String(Number(foundSubject.tuition_fee));
            }
        }

        // Khi đổi kiểu giảm giá về rỗng -> reset discount_value
        if (field === 'discount_type' && !value) {
            updated[index].discount_value = '';
        }

        setSubjectRows(updated);

        // Xóa lỗi client của trường tương ứng nếu đang có
        if (clientErrors[`subjects.${index}.${field}`]) {
            const nextErrors = { ...clientErrors };
            delete nextErrors[`subjects.${index}.${field}`];
            setClientErrors(nextErrors);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (isSuperAdmin && !centerId) {
            newErrors['center_id'] = 'Vui lòng chọn Trung tâm đào tạo.';
        }

        if (!name.trim()) {
            newErrors['name'] = 'Vui lòng nhập tên lớp học.';
        }

        if (!isActiveStatus) {
            const hasAnySubject = subjectRows.some((r) => Boolean(r.subject_id));
            if (hasAnySubject) {
                newErrors['subjects'] = 'Chỉ lớp học ở trạng thái Đang hoạt động mới có thể thêm môn học.';
            }
        } else {
            subjectRows.forEach((row, index) => {
                const hasSubject = Boolean(row.subject_id);
                const hasTeacher = Boolean(row.teacher_id);
                const baseFee = Number(row.tuition_fee) || 0;
                const discountType = Number(row.discount_type);
                const discountVal = Number(row.discount_value) || 0;

                if (hasSubject && !hasTeacher) {
                    newErrors[`subjects.${index}.teacher_id`] = `Vui lòng chọn giáo viên phụ trách cho môn học (dòng ${index + 1}).`;
                } else if (!hasSubject && hasTeacher) {
                    newErrors[`subjects.${index}.subject_id`] = `Vui lòng chọn môn học tương ứng cho giáo viên (dòng ${index + 1}).`;
                }

                if (discountType === DISCOUNT_TYPE_DIRECT && discountVal > baseFee) {
                    newErrors[`subjects.${index}.discount_value`] = `Mức giảm trực tiếp (${formatCurrency(discountVal)}) không được vượt quá học phí môn (${formatCurrency(baseFee)}).`;
                } else if (discountType === DISCOUNT_TYPE_PERCENTAGE && discountVal > 100) {
                    newErrors[`subjects.${index}.discount_value`] = `Mức giảm phần trăm (${discountVal}%) không được vượt quá 100%.`;
                }
            });
        }

        setClientErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        const payloadSubjects = isActiveStatus
            ? subjectRows
                .filter((r) => r.subject_id || r.teacher_id || (r.tuition_fee !== '' && r.tuition_fee !== null))
                .map((r) => ({
                    subject_id: r.subject_id ? Number(r.subject_id) : null,
                    teacher_id: r.teacher_id ? Number(r.teacher_id) : null,
                    tuition_fee: r.tuition_fee !== '' && r.tuition_fee !== null ? Number(r.tuition_fee) : null,
                    discount_type: r.discount_type ? Number(r.discount_type) : null,
                    discount_value: r.discount_value !== '' && r.discount_value !== null ? Number(r.discount_value) : 0,
                }))
            : [];

        router.post(
            '/classes',
            {
                center_id: centerId ? Number(centerId) : undefined,
                name,
                max_students: maxStudents ? Number(maxStudents) : undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                status: Number(status),
                description: description || undefined,
                subjects: payloadSubjects,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title="Tạo Lớp Học Mới - SAM Digital">
            <Head title="Tạo Lớp Học Mới" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BackButton fallbackUrl="/classes" size="md" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tạo Lớp Học Mới</h1>
                            <p className="text-sm text-gray-500">
                                Khởi tạo thông tin lớp học, thiết lập nhiều môn học và chọn giáo viên phụ trách từng môn.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-5 flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                            <GraduationCap className="h-5 w-5 text-emerald-600" />
                            1. Thông Tin Chung Lớp Học
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
                                        onChange={(e) => {
                                            setCenterId(e.target.value);
                                            // Reset subject rows when center changes
                                            setSubjectRows([{ subject_id: '', teacher_id: '', tuition_fee: '', discount_type: '', discount_value: '' }]);
                                        }}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                        required
                                    >
                                        <option value="">-- Chọn Trung tâm --</option>
                                        {centers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                    {currentErrors.center_id && (
                                        <p className="mt-1.5 text-sm text-red-600">{currentErrors.center_id}</p>
                                    )}
                                </div>
                            )}

                            {/* Class Name */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Tên Lớp Học <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        if (clientErrors.name) {
                                            const next = { ...clientErrors };
                                            delete next.name;
                                            setClientErrors(next);
                                        }
                                    }}
                                    placeholder="Ví dụ: Lớp Ôn Thi THPT Quốc Gia 12A1"
                                    className="!py-3 !text-sm"
                                    required
                                />
                                {currentErrors.name && (
                                    <p className="mt-1.5 text-sm text-red-600">{currentErrors.name}</p>
                                )}
                            </div>

                            {/* Class Code (Auto Generated) */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mã Lớp Học
                                </label>
                                <Input
                                    value="Hệ thống tự động sinh mã (VD: C0000001)"
                                    disabled
                                    className="cursor-not-allowed bg-slate-50 !py-3 !text-sm text-gray-500 italic"
                                />
                            </div>

                            {/* Max Students */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Sĩ Số Tối Đa (Học sinh)
                                </label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={maxStudents}
                                    onChange={(e) => setMaxStudents(e.target.value)}
                                    placeholder="30"
                                    className="!py-3 !text-sm"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Trạng Thái Lớp Học
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value={CLASS_STATUS_ACTIVE}>{CLASS_STATUS_LABELS[CLASS_STATUS_ACTIVE] || 'Đang hoạt động'}</option>
                                    <option value={CLASS_STATUS_INACTIVE}>{CLASS_STATUS_LABELS[CLASS_STATUS_INACTIVE] || 'Tạm ngưng'}</option>
                                    <option value={CLASS_STATUS_COMPLETED}>{CLASS_STATUS_LABELS[CLASS_STATUS_COMPLETED] || 'Đã hoàn thành'}</option>
                                    <option value={CLASS_STATUS_CLOSED}>{CLASS_STATUS_LABELS[CLASS_STATUS_CLOSED] || 'Đã đóng'}</option>
                                </select>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ngày Bắt Đầu
                                </label>
                                <DatePicker
                                    value={startDate}
                                    onChange={(val) => setStartDate(val)}
                                    className="!py-3 !text-sm w-full"
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ngày Kết Thúc (Dự kiến)
                                </label>
                                <DatePicker
                                    value={endDate}
                                    onChange={(val) => setEndDate(val)}
                                    className="!py-3 !text-sm w-full"
                                />
                                {currentErrors.end_date && (
                                    <p className="mt-1.5 text-sm text-red-600">{currentErrors.end_date}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mô Tả & Ghi Chú
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Thông tin lộ trình học tập, mục tiêu của lớp..."
                                    className="w-full rounded-lg border border-gray-300 p-3.5 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Subjects & Teachers Configuration Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                    2. Danh Sách Môn Học & Giáo Viên Phụ Trách
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    1 lớp học có thể chọn nhiều môn học, thiết lập giáo viên và mức chiết khấu/giảm giá cho từng môn.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 border border-emerald-200 text-emerald-900">
                                    <span className="text-xs font-semibold text-emerald-800">Tổng Học Phí:</span>
                                    <span className="text-base font-black text-emerald-700">{formatCurrency(totalTuitionFee)}</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="md"
                                    disabled={!isActiveStatus}
                                    icon={<Plus className="h-4 w-4 text-emerald-600" />}
                                    onClick={handleAddSubjectRow}
                                    title={!isActiveStatus ? 'Chỉ lớp đang hoạt động mới có thể thêm môn' : 'Thêm môn học'}
                                >
                                    Thêm Môn Học
                                </Button>
                            </div>
                        </div>

                        {!isActiveStatus && (
                            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
                                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                                <span>
                                    <strong>Lưu ý:</strong> Lớp học không ở trạng thái <strong>Đang hoạt động</strong> nên không thể thêm hoặc cấu hình môn học. Vui lòng chuyển trạng thái sang Đang hoạt động nếu muốn thêm môn.
                                </span>
                            </div>
                        )}

                        {currentErrors.subjects && (
                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200">
                                {currentErrors.subjects}
                            </div>
                        )}

                        <div className="space-y-4">
                            {subjectRows.map((row, index) => {
                                const subjectError = currentErrors[`subjects.${index}.subject_id`];
                                const teacherError = currentErrors[`subjects.${index}.teacher_id`];
                                const tuitionError = currentErrors[`subjects.${index}.tuition_fee`];
                                const discountValueError = currentErrors[`subjects.${index}.discount_value`];
                                const hasRowError = Boolean(subjectError || teacherError || tuitionError || discountValueError);
                                const finalFee = calculateRowFinalFee(row);

                                return (
                                    <div
                                        key={index}
                                        className={`rounded-2xl p-4 sm:p-5 transition-all space-y-3.5 ${
                                            hasRowError
                                                ? 'border-2 border-red-400 bg-red-50/20 ring-1 ring-red-400/20 shadow-xs'
                                                : 'border border-gray-200 bg-slate-50/90 shadow-2xs'
                                        }`}
                                    >
                                        {/* Row Header: Badge, Subject Select, Teacher Select & Delete */}
                                        <div className="flex items-start gap-3">
                                            {/* Number Badge */}
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold mt-7 ${
                                                    hasRowError ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                                }`}
                                            >
                                                {index + 1}
                                            </div>

                                            {/* Primary Info: Subject & Teacher */}
                                            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                                                {/* Subject Select */}
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                        Môn Học <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={row.subject_id}
                                                        disabled={!isActiveStatus}
                                                        onChange={(e) => handleRowChange(index, 'subject_id', e.target.value)}
                                                        className={`w-full rounded-lg bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:outline-hidden disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                                            subjectError
                                                                ? 'border-2 border-red-500 bg-red-50/20 ring-1 ring-red-500'
                                                                : 'border border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                                                        }`}
                                                    >
                                                        <option value="">-- Chọn Môn Học --</option>
                                                        {availableSubjects.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.name} {s.tuition_fee ? `(${formatCurrency(Number(s.tuition_fee))})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {subjectError && (
                                                        <p className="mt-1 text-xs font-medium text-red-600">
                                                            {subjectError}
                                                        </p>
                                                    )}
                                                    {availableSubjects.length === 0 && (
                                                        <p className="mt-1 text-xs text-amber-600">
                                                            Chưa có môn học.{' '}
                                                            <Link href="/subjects/create" className="font-semibold text-emerald-700 underline">
                                                                Tạo môn học mới
                                                            </Link>
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Teacher Select */}
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                        Giáo Viên Phụ Trách <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={row.teacher_id}
                                                        disabled={!isActiveStatus}
                                                        onChange={(e) => handleRowChange(index, 'teacher_id', e.target.value)}
                                                        className={`w-full rounded-lg bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:outline-hidden disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                                            teacherError
                                                                ? 'border-2 border-red-500 bg-red-50/20 ring-1 ring-red-500'
                                                                : 'border border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                                                        }`}
                                                    >
                                                        <option value="">-- Chọn Giáo Viên --</option>
                                                        {availableTeachers.map((t) => (
                                                            <option key={t.id} value={t.id}>
                                                                {t.full_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {teacherError && (
                                                        <p className="mt-1 text-xs font-medium text-red-600">
                                                            {teacherError}
                                                        </p>
                                                    )}
                                                    {availableTeachers.length === 0 && (
                                                        <p className="mt-1 text-xs text-amber-600">
                                                            Chưa có giáo viên.{' '}
                                                            <Link href="/teachers/create" className="font-semibold text-emerald-700 underline">
                                                                Tạo giáo viên mới
                                                            </Link>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Remove Row Button */}
                                            {subjectRows.length > 1 && (
                                                <div className="mt-7">
                                                    <Button
                                                        type="button"
                                                        variant="danger"
                                                        size="sm"
                                                        disabled={!isActiveStatus}
                                                        icon={<Trash2 className="h-4 w-4" />}
                                                        onClick={() => handleRemoveSubjectRow(index)}
                                                        title="Xóa môn học này"
                                                        className="!h-[42px] !w-[42px] !p-0"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Financial & Discount Breakdown Sub-grid */}
                                        <div className="grid grid-cols-1 gap-3.5 rounded-xl border border-gray-200/90 bg-white p-3.5 sm:grid-cols-4 sm:items-end">
                                            {/* Subject Tuition Fee */}
                                            <div>
                                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                    Học Phí Gốc (VNĐ)
                                                </label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    disabled={!isActiveStatus}
                                                    value={row.tuition_fee}
                                                    onChange={(e) => handleRowChange(index, 'tuition_fee', e.target.value)}
                                                    placeholder="0"
                                                    error={tuitionError}
                                                    className="!py-2.5 !text-sm"
                                                />
                                            </div>

                                            {/* Discount Type */}
                                            <div>
                                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                    Kiểu Giảm Giá
                                                </label>
                                                <select
                                                    value={row.discount_type}
                                                    disabled={!isActiveStatus}
                                                    onChange={(e) => handleRowChange(index, 'discount_type', e.target.value)}
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">Không giảm</option>
                                                    <option value={DISCOUNT_TYPE_DIRECT}>Giảm tiền (VNĐ)</option>
                                                    <option value={DISCOUNT_TYPE_PERCENTAGE}>Giảm theo %</option>
                                                </select>
                                            </div>

                                            {/* Discount Value */}
                                            <div>
                                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                    Mức Giảm {Number(row.discount_type) === DISCOUNT_TYPE_PERCENTAGE ? '(%)' : '(VNĐ)'}
                                                </label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max={Number(row.discount_type) === DISCOUNT_TYPE_PERCENTAGE ? '100' : undefined}
                                                    step={Number(row.discount_type) === DISCOUNT_TYPE_PERCENTAGE ? '1' : '1000'}
                                                    disabled={!isActiveStatus || !row.discount_type}
                                                    value={row.discount_value}
                                                    onChange={(e) => handleRowChange(index, 'discount_value', e.target.value)}
                                                    placeholder="0"
                                                    error={discountValueError}
                                                    className="!py-2.5 !text-sm disabled:bg-gray-100"
                                                />
                                            </div>

                                            {/* Final Fee Column */}
                                            <div>
                                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                    Thành Tiền
                                                </label>
                                                <div className="flex h-[42px] items-center justify-between px-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-bold text-emerald-800">
                                                    <span className="truncate">{formatCurrency(finalFee)}</span>
                                                    {row.discount_type && (
                                                        <span className="text-[11px] font-medium text-emerald-600">
                                                            (Đã giảm)
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <BackButton fallbackUrl="/classes" size="lg" label="Hủy Bỏ" />
                        <Button
                            type="submit"
                            variant="success"
                            size="lg"
                            isLoading={isSubmitting}
                            icon={<Save className="h-5 w-5" />}
                        >
                            Tạo Lớp Học
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
