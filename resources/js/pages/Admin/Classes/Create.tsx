import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, GraduationCap, BookOpen, Plus, Trash2 } from 'lucide-react';
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

interface Subject {
    id: number;
    name: string;
    code: string;
    center_id: number;
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
}

export default function ClassCreate({ centers = [], subjects = [], teachers = [], errors = {} }: CreateProps) {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';
    const userCenterId = auth?.user?.center_id;

    const [centerId, setCenterId] = useState<string>(
        !isSuperAdmin && userCenterId ? String(userCenterId) : (centers[0]?.id ? String(centers[0].id) : '')
    );
    const [name, setName] = useState<string>('');
    const [maxStudents, setMaxStudents] = useState<string>('30');
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>('');
    const [status, setStatus] = useState<string>('1');
    const [description, setDescription] = useState<string>('');

    // Dynamic list of subjects & assigned teachers
    const [subjectRows, setSubjectRows] = useState<SubjectTeacherRow[]>([
        { subject_id: '', teacher_id: '' },
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleAddSubjectRow = () => {
        setSubjectRows([...subjectRows, { subject_id: '', teacher_id: '' }]);
    };

    const handleRemoveSubjectRow = (index: number) => {
        if (subjectRows.length === 1) {
            setSubjectRows([{ subject_id: '', teacher_id: '' }]);

            return;
        }

        setSubjectRows(subjectRows.filter((_, idx) => idx !== index));
    };

    const handleRowChange = (index: number, field: 'subject_id' | 'teacher_id', value: string) => {
        const updated = [...subjectRows];
        updated[index][field] = value;
        setSubjectRows(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const validSubjects = subjectRows
            .filter((r) => r.subject_id && r.teacher_id)
            .map((r) => ({
                subject_id: Number(r.subject_id),
                teacher_id: Number(r.teacher_id),
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
                subjects: validSubjects,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title="Tạo Lớp Học Mới - Hệ Thống Giáo Dục Sam">
            <Head title="Tạo Lớp Học Mới" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/classes">
                            <Button variant="secondary" size="md" icon={<ArrowLeft className="h-5 w-5" />}>
                                Quay Lại
                            </Button>
                        </Link>
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
                                            setSubjectRows([{ subject_id: '', teacher_id: '' }]);
                                        }}
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

                            {/* Class Name */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Tên Lớp Học <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ví dụ: Lớp Ôn Thi THPT Quốc Gia 12A1"
                                    className="!py-3 !text-sm"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Class Code (Auto Generated) */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mã Lớp Học
                                </label>
                                <Input
                                    value="Hệ thống tự động sinh mã (VD: LH001)"
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
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="1">Đang mở lớp</option>
                                    <option value="2">Đã hoàn thành</option>
                                    <option value="0">Tạm dừng / Đóng</option>
                                </select>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ngày Bắt Đầu
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="!py-3 !text-sm"
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ngày Kết Thúc (Dự kiến)
                                </label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="!py-3 !text-sm"
                                />
                                {errors.end_date && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.end_date}</p>
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
                        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                                    <BookOpen className="h-5 w-5 text-blue-600" />
                                    2. Danh Sách Môn Học & Giáo Viên Phụ Trách
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    1 lớp học có thể chọn nhiều môn học, mỗi môn học chọn 1 giáo viên giảng dạy tương ứng.
                                </p>
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

                        <div className="space-y-4">
                            {subjectRows.map((row, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-slate-50 p-4 sm:flex-row sm:items-start"
                                >
                                    {/* Number Badge */}
                                    <div className="flex flex-col items-center">
                                        <span className="mb-1.5 hidden text-xs font-semibold text-transparent select-none sm:block">
                                            &nbsp;
                                        </span>
                                        <div className="flex h-[42px] w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                                            {index + 1}
                                        </div>
                                    </div>

                                    {/* Subject Select */}
                                    <div className="flex-1">
                                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                            Môn Học
                                        </label>
                                        <select
                                            value={row.subject_id}
                                            onChange={(e) => handleRowChange(index, 'subject_id', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="">-- Chọn Môn Học --</option>
                                            {availableSubjects.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} ({s.code})
                                                </option>
                                            ))}
                                        </select>
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
                                            Giáo Viên Phụ Trách
                                        </label>
                                        <select
                                            value={row.teacher_id}
                                            onChange={(e) => handleRowChange(index, 'teacher_id', e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="">-- Chọn Giáo Viên --</option>
                                            {availableTeachers.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.full_name} ({t.teacher_code})
                                                </option>
                                            ))}
                                        </select>
                                        {availableTeachers.length === 0 && (
                                            <p className="mt-1 text-xs text-amber-600">
                                                Chưa có giáo viên.{' '}
                                                <Link href="/teachers/create" className="font-semibold text-emerald-700 underline">
                                                    Tạo giáo viên mới
                                                </Link>
                                            </p>
                                        )}
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
                                        >
                                            Xóa
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href="/classes">
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
                            Tạo Lớp Học
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
