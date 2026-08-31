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
} from '@/constants/enums';
import { usePermission } from '@/hooks/usePermission';
import AppLayout from '@/layouts/AppLayout';
import { Head,Link,router,usePage } from '@inertiajs/react';
import { BookOpen,GraduationCap,Plus,Save,Trash2 } from 'lucide-react';
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

    // Dynamic list of subjects & assigned teachers & subject tuition fee
    const [subjectRows, setSubjectRows] = useState<SubjectTeacherRow[]>([
        { subject_id: '', teacher_id: '', tuition_fee: '' },
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const currentErrors = { ...errors, ...clientErrors };

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

    const totalTuitionFee = React.useMemo(() => {
        return subjectRows.reduce((sum, r) => {
            if (r.subject_id) {
                return sum + (Number(r.tuition_fee) || 0);
            }
            return sum;
        }, 0);
    }, [subjectRows]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const handleAddSubjectRow = () => {
        setSubjectRows([...subjectRows, { subject_id: '', teacher_id: '', tuition_fee: '' }]);
    };

    const handleRemoveSubjectRow = (index: number) => {
        if (subjectRows.length === 1) {
            setSubjectRows([{ subject_id: '', teacher_id: '', tuition_fee: '' }]);

            return;
        }

        setSubjectRows(subjectRows.filter((_, idx) => idx !== index));
    };

    const handleRowChange = (index: number, field: 'subject_id' | 'teacher_id' | 'tuition_fee', value: string) => {
        const updated = [...subjectRows];
        updated[index][field] = value;

        // Khi chọn môn học, tự động điền học phí mặc định của môn học nếu có
        if (field === 'subject_id') {
            const foundSubject = subjects.find((s) => String(s.id) === String(value));
            if (foundSubject && foundSubject.tuition_fee !== undefined && foundSubject.tuition_fee !== null) {
                updated[index].tuition_fee = String(Number(foundSubject.tuition_fee));
            }
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

        subjectRows.forEach((row, index) => {
            const hasSubject = Boolean(row.subject_id);
            const hasTeacher = Boolean(row.teacher_id);

            if (hasSubject && !hasTeacher) {
                newErrors[`subjects.${index}.teacher_id`] = `Vui lòng chọn giáo viên phụ trách cho môn học (dòng ${index + 1}).`;
            } else if (!hasSubject && hasTeacher) {
                newErrors[`subjects.${index}.subject_id`] = `Vui lòng chọn môn học tương ứng cho giáo viên (dòng ${index + 1}).`;
            }
        });

        setClientErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        const payloadSubjects = subjectRows
            .filter((r) => r.subject_id || r.teacher_id || (r.tuition_fee !== '' && r.tuition_fee !== null))
            .map((r) => ({
                subject_id: r.subject_id ? Number(r.subject_id) : null,
                teacher_id: r.teacher_id ? Number(r.teacher_id) : null,
                tuition_fee: r.tuition_fee !== '' && r.tuition_fee !== null ? Number(r.tuition_fee) : null,
            }));

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
                                            setSubjectRows([{ subject_id: '', teacher_id: '', tuition_fee: '' }]);
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
                                    1 lớp học có thể chọn nhiều môn học, mỗi môn học chọn 1 giáo viên giảng dạy và số tiền học tương ứng.
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
                                    icon={<Plus className="h-4 w-4 text-emerald-600" />}
                                    onClick={handleAddSubjectRow}
                                >
                                    Thêm Môn Học
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {subjectRows.map((row, index) => {
                                const subjectError = currentErrors[`subjects.${index}.subject_id`];
                                const teacherError = currentErrors[`subjects.${index}.teacher_id`];
                                const tuitionError = currentErrors[`subjects.${index}.tuition_fee`];
                                const hasRowError = Boolean(subjectError || teacherError || tuitionError);

                                return (
                                    <div
                                        key={index}
                                        className={`flex flex-col gap-4 rounded-xl p-4 sm:flex-row sm:items-start transition-all ${
                                            hasRowError
                                                ? 'border-2 border-red-400 bg-red-50/20 ring-1 ring-red-400/20 shadow-xs'
                                                : 'border border-gray-200 bg-slate-50'
                                        }`}
                                    >
                                        {/* Number Badge */}
                                        <div className="flex flex-col items-center">
                                            <span className="mb-1.5 hidden text-xs font-semibold text-transparent select-none sm:block">
                                                &nbsp;
                                            </span>
                                            <div
                                                className={`flex h-[42px] w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                                                    hasRowError ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                                }`}
                                            >
                                                {index + 1}
                                            </div>
                                        </div>

                                        {/* Subject Select */}
                                        <div className="flex-1">
                                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                Môn Học <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={row.subject_id}
                                                onChange={(e) => handleRowChange(index, 'subject_id', e.target.value)}
                                                className={`w-full rounded-lg bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:outline-hidden ${
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
                                        <div className="flex-1">
                                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                Giáo Viên Phụ Trách <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={row.teacher_id}
                                                onChange={(e) => handleRowChange(index, 'teacher_id', e.target.value)}
                                                className={`w-full rounded-lg bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:outline-hidden ${
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

                                        {/* Subject Tuition Fee */}
                                        <div className="w-full sm:w-44">
                                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                Học Phí Môn (VNĐ)
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="1000"
                                                value={row.tuition_fee}
                                                onChange={(e) => handleRowChange(index, 'tuition_fee', e.target.value)}
                                                placeholder="0"
                                                error={tuitionError}
                                                className="!py-2.5 !text-sm"
                                            />
                                        </div>

                                        {/* Remove Row Button */}
                                        <div className="flex flex-col">
                                            <span className="mb-1.5 hidden text-xs font-semibold text-transparent select-none sm:block">
                                                &nbsp;
                                            </span>
                                            <Button
                                                type="button"
                                                variant="danger"
                                                size="sm"
                                                icon={<Trash2 className="h-4 w-4" />}
                                                onClick={() => handleRemoveSubjectRow(index)}
                                                title="Xóa dòng môn học này"
                                                className="!h-[42px]"
                                            />
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
