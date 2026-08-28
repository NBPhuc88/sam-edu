import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AppLayout from '@/layouts/AppLayout';
import { Head,Link,router,usePage } from '@inertiajs/react';
import { AlertTriangle,ArrowLeft,BookOpen,Calendar,GraduationCap,Plus,Save,Trash2 } from 'lucide-react';
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
}

interface Teacher {
    id: number;
    full_name: string;
    teacher_code: string;
    center_id: number;
}

interface ClassSubject {
    id: number;
    subject_id: number;
    teacher_id: number;
}

interface SchoolClass {
    id: number;
    center_id: number;
    code: string;
    name: string;
    description: string | null;
    max_students: number | null;
    start_date: string | null;
    end_date: string | null;
    status: number;
    class_subjects?: ClassSubject[];
}

interface EditProps {
    schoolClass: SchoolClass;
    centers: Center[];
    subjects: Subject[];
    teachers: Teacher[];
    errors?: Record<string, string>;
}

interface SubjectTeacherRow {
    subject_id: string;
    teacher_id: string;
}

export default function ClassEdit({
    schoolClass,
    centers = [],
    subjects = [],
    teachers = [],
    errors = {},
}: EditProps) {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';

    const [centerId, setCenterId] = useState<string>(String(schoolClass.center_id));
    const [name, setName] = useState<string>(schoolClass.name || '');
    const code = schoolClass.code || '';
    const [maxStudents, setMaxStudents] = useState<string>(
        schoolClass.max_students !== null && schoolClass.max_students !== undefined ? String(schoolClass.max_students) : '',
    );
    const [startDate, setStartDate] = useState<string>(schoolClass.start_date || '');
    const [endDate, setEndDate] = useState<string>(schoolClass.end_date || '');
    const [status, setStatus] = useState<number>(Number(schoolClass.status ?? 1));
    const [description, setDescription] = useState<string>(schoolClass.description || '');

    // Pre-populate dynamic list of subjects & assigned teachers
    const initialRows: SubjectTeacherRow[] =
        schoolClass.class_subjects && schoolClass.class_subjects.length > 0
            ? schoolClass.class_subjects.map((cs) => ({
                  subject_id: String(cs.subject_id),
                  teacher_id: String(cs.teacher_id),
              }))
            : [{ subject_id: '', teacher_id: '' }];

    const [subjectRows, setSubjectRows] = useState<SubjectTeacherRow[]>(initialRows);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter available subjects and teachers by selected center with fallback & including current class subjects
    const availableSubjects = React.useMemo(() => {
        const list: Subject[] = [];
        const seenIds = new Set<number>();

        // Always include currently assigned subjects
        if (schoolClass?.class_subjects) {
            for (const cs of schoolClass.class_subjects) {
                if (cs.subject_id && !seenIds.has(cs.subject_id)) {
                    seenIds.add(cs.subject_id);
                    const found = subjects.find((s) => s.id === cs.subject_id);
                    list.push(found || {
                        id: cs.subject_id,
                        name: `Môn học #${cs.subject_id}`,
                        code: `MH${cs.subject_id}`,
                        center_id: Number(centerId) || 0,
                    });
                }
            }
        }

        const centerSubjects = subjects.filter((s) => !centerId || String(s.center_id) === String(centerId));

        for (const s of centerSubjects) {
            if (!seenIds.has(s.id)) {
                seenIds.add(s.id);
                list.push(s);
            }
        }

        if (list.length === 0) {
            return subjects;
        }

        return list;
    }, [schoolClass, centerId, subjects]);

    const availableTeachers = React.useMemo(() => {
        const list: Teacher[] = [];
        const seenIds = new Set<number>();

        // Always include currently assigned teachers
        if (schoolClass?.class_subjects) {
            for (const cs of schoolClass.class_subjects) {
                if (cs.teacher_id && !seenIds.has(cs.teacher_id)) {
                    seenIds.add(cs.teacher_id);
                    const found = teachers.find((t) => t.id === cs.teacher_id);
                    list.push(found || {
                        id: cs.teacher_id,
                        full_name: `Giáo viên #${cs.teacher_id}`,
                        teacher_code: `GV${cs.teacher_id}`,
                        center_id: Number(centerId) || 0,
                    });
                }
            }
        }

        const centerTeachers = teachers.filter((t) => !centerId || String(t.center_id) === String(centerId));

        for (const t of centerTeachers) {
            if (!seenIds.has(t.id)) {
                seenIds.add(t.id);
                list.push(t);
            }
        }

        if (list.length === 0) {
            return teachers;
        }

        return list;
    }, [schoolClass, centerId, teachers]);

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

    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const isClosedOrCompleted = Number(schoolClass.status) === 2 || Number(schoolClass.status) === 3;
    const canEditStatus = isSuperAdmin || !isClosedOrCompleted;

    const executeSubmit = () => {
        setIsSubmitting(true);
        setShowConfirmModal(false);

        const subjectMap = new Map<number, number>();
        subjectRows.forEach((r) => {
            if (r.subject_id && r.teacher_id) {
                subjectMap.set(Number(r.subject_id), Number(r.teacher_id));
            }
        });
        const validSubjects = Array.from(subjectMap.entries()).map(([subject_id, teacher_id]) => ({
            subject_id,
            teacher_id,
        }));

        router.patch(
            `/classes/${schoolClass.id}`,
            {
                center_id: Number(centerId),
                name,
                code,
                max_students: maxStudents ? Number(maxStudents) : null,
                start_date: startDate || null,
                end_date: endDate || null,
                status: Number(status),
                description: description || null,
                subjects: validSubjects,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Nếu chuyển sang trạng thái Hoàn thành (2) hoặc Đã đóng (3) khác với ban đầu, yêu cầu xác nhận qua Modal
        const selectedStatusNum = Number(status);
        const originalStatusNum = Number(schoolClass.status);

        if ((selectedStatusNum === 2 || selectedStatusNum === 3) && selectedStatusNum !== originalStatusNum) {
            setShowConfirmModal(true);
            return;
        }

        executeSubmit();
    };

    return (
        <AppLayout title={`Chỉnh Sửa Lớp: ${schoolClass.name} - SAM Digital`}>
            <Head title={`Chỉnh Sửa Lớp: ${schoolClass.name}`} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header Top Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/classes">
                            <Button variant="secondary" size="md" icon={<ArrowLeft className="h-5 w-5" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Chỉnh Sửa Lớp Học: {schoolClass.name}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Cập nhật thông tin lớp học, phân công thêm hoặc thay đổi giáo viên phụ trách từng môn.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={`/classes/${schoolClass.id}/schedule`}>
                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                icon={<Calendar className="h-5 w-5 text-emerald-600" />}
                            >
                                Xem Thời Khóa Biểu
                            </Button>
                        </Link>
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
                                        onChange={(e) => setCenterId(e.target.value)}
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
                                    className="!py-3 !text-sm"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Class Code */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mã Lớp Học
                                </label>
                                <Input
                                    value={code}
                                    disabled
                                    className="cursor-not-allowed bg-slate-50 font-mono !py-3 !text-sm text-gray-600"
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
                                    disabled={!canEditStatus}
                                    className={`w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 ${
                                        !canEditStatus ? 'bg-slate-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'
                                    }`}
                                >
                                    <option value={1}>Đang hoạt động</option>
                                    <option value={0}>Tạm dừng</option>
                                    <option value={2}>Đã hoàn thành</option>
                                    <option value={3}>Đã đóng</option>
                                </select>
                                {!canEditStatus && (
                                    <p className="mt-1.5 text-xs text-amber-700 font-medium">
                                        * Lớp học đã hoàn thành hoặc đã đóng. Chỉ Super Admin mới có quyền mở lại.
                                    </p>
                                )}
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
                                                    {s.name}
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
                                                    {t.full_name}
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
                            variant="edit"
                            size="lg"
                            isLoading={isSubmitting}
                            icon={<Save className="h-5 w-5" />}
                        >
                            Cập Nhật Lớp Học
                        </Button>
                    </div>
                </form>

                {/* Modal Xác Nhận Hoàn Thành / Đóng Lớp */}
                <Modal
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    title="Xác Nhận Thay Đổi Trạng Thái Lớp Học"
                    maxWidth="md"
                    footer={
                        <div className="flex items-center justify-end gap-2.5 w-full">
                            <Button
                                variant="secondary"
                                size="md"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                Hủy Bỏ
                            </Button>
                            <Button
                                variant="danger"
                                size="md"
                                isLoading={isSubmitting}
                                onClick={executeSubmit}
                            >
                                Xác Nhận Chuyển Trạng Thái
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-3.5 text-sm text-gray-700">
                        <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <div className="font-bold">Cảnh báo hành động không thể đảo ngược!</div>
                                <div className="mt-1 text-xs text-amber-800 leading-relaxed">
                                    Bạn đang chọn chuyển trạng thái lớp sang{' '}
                                    <strong className="font-bold text-amber-950">
                                        {Number(status) === 2 ? 'ĐÃ HOÀN THÀNH' : 'ĐÃ ĐÓNG'}
                                    </strong>
                                    . Khi hoàn tất, các tính năng lịch học, thi cử và chat nhóm của lớp sẽ bị khóa vĩnh viễn và chỉ có{' '}
                                    <strong className="underline">Super Admin</strong> mới có quyền mở lại lớp học này.
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500">
                            Hệ thống cũng sẽ tự động chuyển trạng thái của các học sinh chỉ tham gia duy nhất lớp này sang trạng thái tương ứng (Đã tốt nghiệp / Tạm dừng).
                        </p>
                    </div>
                </Modal>
            </div>
        </AppLayout>
    );
}
