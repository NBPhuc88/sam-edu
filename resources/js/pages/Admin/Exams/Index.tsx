import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ScrollableSelect from '@/components/ui/ScrollableSelect';
import Tooltip,{ TruncatedText } from '@/components/ui/Tooltip';
import {
EXAM_STATUS_CANCELLED,
EXAM_STATUS_COMPLETED,
EXAM_STATUS_DRAFT,
EXAM_STATUS_LABELS,
EXAM_STATUS_PUBLISHED,
SKILL_LISTENING,
SKILL_SPEAKING,
SKILL_WRITING
} from '@/constants/enums';
import AppLayout from '@/layouts/AppLayout';
import { Head,Link,router,usePage } from '@inertiajs/react';
import {
Award,
CheckCircle2,
Clock,
Edit2,
Eye,
FileCheck,
HelpCircle,
Plus,
Search,
Trash2,
Users,
} from 'lucide-react';
import React,{ useState } from 'react';
import AssignExamModal from '../ClassExams/AssignExamModal';
import { Center,Exam,PaginatedData,QUESTION_TYPES,SchoolClass,Subject } from './types';

import { usePermission } from '@/hooks/usePermission';

interface Props {
    exams: PaginatedData<Exam>;
    centers: Center[];
    classes: SchoolClass[];
    subjects: Subject[];
    all_exams?: Exam[];
    stats?: {
        total: number;
        published: number;
        draft: number;
        total_questions: number;
    };
    filters: {
        search?: string;
        center_id?: number | null;
        class_id?: number | null;
        subject_id?: number | null;
        status?: number;
    };
}

export default function ExamIndex({
    exams,
    centers = [],
    classes = [],
    subjects = [],
    all_exams = [],
    stats,
    filters,
}: Props) {
    const { can } = usePermission();
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCenterId, setSelectedCenterId] = useState<string>(
        filters.center_id ? String(filters.center_id) : '',
    );
    const [selectedClassId, setSelectedClassId] = useState<string>(
        filters.class_id ? String(filters.class_id) : '',
    );
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
        filters.subject_id ? String(filters.subject_id) : '',
    );
    const [selectedStatus, setSelectedStatus] = useState<string>(
        filters.status !== undefined ? String(filters.status) : '',
    );

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Quick View Questions Modal
    const [viewQuestionsModalOpen, setViewQuestionsModalOpen] = useState(false);
    const [selectedExamQuestions, setSelectedExamQuestions] = useState<Exam | null>(null);

    // Assign Exam to Class Modal State
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assigningExamId, setAssigningExamId] = useState<number | null>(null);

    const availableExamsForModal = React.useMemo(() => {
        const combined = [...all_exams, ...(exams?.data || [])];
        const map = new Map<number, Exam>();
        for (const item of combined) {
            if (item && item.id && !map.has(item.id)) {
                map.set(item.id, item);
            }
        }
        return Array.from(map.values());
    }, [all_exams, exams]);

    // Filter subjects by selected center
    const filteredSubjects = selectedCenterId
        ? subjects.filter((s) => String(s.center_id) === String(selectedCenterId))
        : subjects;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/exams',
            {
                search: search || undefined,
                center_id: selectedCenterId ? Number(selectedCenterId) : undefined,
                class_id: selectedClassId ? Number(selectedClassId) : undefined,
                subject_id: selectedSubjectId ? Number(selectedSubjectId) : undefined,
                status: selectedStatus ? Number(selectedStatus) : undefined,
            },
            { preserveState: true },
        );
    };

    const handleReset = () => {
        setSearch('');
        setSelectedCenterId('');
        setSelectedClassId('');
        setSelectedSubjectId('');
        setSelectedStatus('');
        router.get('/exams', {}, { preserveState: true });
    };

    const openDeleteModal = (exam: Exam) => {
        setExamToDelete(exam);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setExamToDelete(null);
        setDeleteModalOpen(false);
    };

    const handleDelete = () => {
        if (!examToDelete) return;

        setIsDeleting(true);
        router.delete(`/exams/${examToDelete.id}`, {
            onSuccess: () => {
                closeDeleteModal();
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const openQuestionsModal = (exam: Exam) => {
        setSelectedExamQuestions(exam);
        setViewQuestionsModalOpen(true);
    };

    const openAssignModal = (examId: number) => {
        setAssigningExamId(examId);
        setAssignModalOpen(true);
    };

    const getStatusBadge = (status: number) => {
        switch (status) {
            case EXAM_STATUS_PUBLISHED:
                return <Badge variant="active" className="whitespace-nowrap">{EXAM_STATUS_LABELS[EXAM_STATUS_PUBLISHED]}</Badge>;
            case EXAM_STATUS_DRAFT:
                return <Badge variant="pending" className="whitespace-nowrap">{EXAM_STATUS_LABELS[EXAM_STATUS_DRAFT]}</Badge>;
            case EXAM_STATUS_COMPLETED:
                return <Badge variant="info" className="whitespace-nowrap">{EXAM_STATUS_LABELS[EXAM_STATUS_COMPLETED]}</Badge>;
            case EXAM_STATUS_CANCELLED:
                return <Badge variant="expired" className="whitespace-nowrap">{EXAM_STATUS_LABELS[EXAM_STATUS_CANCELLED]}</Badge>;
            default:
                return <Badge variant="info" className="whitespace-nowrap">{EXAM_STATUS_LABELS[status] || status}</Badge>;
        }
    };

    return (
        <AppLayout title="Kho Đề Thi - SAM Digital">
            <Head title="Kho Đề Thi" />

            <div className="space-y-6">
                {/* Top Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Kho Đề Thi & Quản Lý Đề Mẫu
                        </h1>
                        <p className="text-sm text-gray-500">
                            Quản lý ngân hàng đề thi mẫu của Trung tâm, cấu hình câu hỏi trắc nghiệm tương tác và hỗ trợ gán đề cho các lớp học.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link href="/practice-exams">
                            <Button
                                variant="secondary"
                                size="md"
                                className="!border-blue-300 !text-blue-700 hover:!bg-blue-50"
                                icon={<Award className="h-4.5 w-4.5 text-blue-600" />}
                            >
                                Phòng Thi Thử
                            </Button>
                        </Link>

                        {can('exams.create') && (
                            <Link href="/exams/create">
                                <Button
                                    variant="success"
                                    size="md"
                                    icon={<Plus className="h-4.5 w-4.5" />}
                                >
                                    Tạo Đề Thi Mới
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* KPI Stat Cards */}
                {stats && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-gray-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Tổng Số Đề Thi
                                    </p>
                                    <p className="mt-1.5 text-2xl font-extrabold text-gray-900">
                                        {stats.total}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                    <FileCheck className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>

                        <Card className="border-gray-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Đã Công Bố
                                    </p>
                                    <p className="mt-1.5 text-2xl font-extrabold text-emerald-600">
                                        {stats.published}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>

                        <Card className="border-gray-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Bản Nháp
                                    </p>
                                    <p className="mt-1.5 text-2xl font-extrabold text-amber-600">
                                        {stats.draft}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                                    <Clock className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>

                        <Card className="border-gray-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Tổng Số Câu Hỏi
                                    </p>
                                    <p className="mt-1.5 text-2xl font-extrabold text-purple-600">
                                        {stats.total_questions}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                                    <HelpCircle className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Filter Card */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Search */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Tìm kiếm đề thi
                                </label>
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tìm theo tên đề thi, mã đề..."
                                    icon={<Search className="h-4 w-4 text-gray-400" />}
                                    className="!py-2 !text-sm !h-[38px]"
                                />
                            </div>

                            {/* Center Filter (Super Admin only) */}
                            {isSuperAdmin && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                        Trung Tâm
                                    </label>
                                    <ScrollableSelect
                                        value={selectedCenterId}
                                        onChange={(val) => {
                                            setSelectedCenterId(val);
                                            setSelectedSubjectId('');
                                        }}
                                        placeholder="-- Tất cả Trung Tâm --"
                                        options={[
                                            { value: '', label: '-- Tất cả Trung Tâm --' },
                                            ...centers.map((c) => ({
                                                value: String(c.id),
                                                label: `${c.name} (${c.code})`,
                                            })),
                                        ]}
                                    />
                                </div>
                            )}

                            {/* Subject Filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Môn Học
                                </label>
                                <ScrollableSelect
                                    value={selectedSubjectId}
                                    onChange={(val) => setSelectedSubjectId(val)}
                                    placeholder="-- Tất cả Môn Học --"
                                    options={[
                                        { value: '', label: '-- Tất cả Môn Học --' },
                                        ...filteredSubjects.map((s) => ({
                                            value: String(s.id),
                                            label: `${s.name} (${s.code})`,
                                        })),
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleReset}
                            >
                                Đặt Lại
                            </Button>
                            <Button
                                type="submit"
                                variant="success"
                                size="sm"
                                icon={<Search className="h-4 w-4" />}
                            >
                                Tìm Kiếm
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Data Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="ui-table">
                            <thead>
                                <tr>
                                    <th className="w-12 text-center">STT</th>
                                    <th className="w-32">Mã Đề</th>
                                    <th>Tên Đề Thi & Môn Học</th>
                                    <th className="w-36">Thời Lượng & Số Câu</th>
                                    <th className="w-28">Điểm Tối Đa</th>
                                    <th className="w-28 text-center">Trạng Thái</th>
                                    {(can('exams.edit') || can('exams.delete') || can('class-exams.create')) && (
                                        <th className="text-right">Thao Tác</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {exams.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={can('exams.edit') || can('exams.delete') || can('class-exams.create') ? 7 : 6} className="py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <FileCheck className="h-10 w-10 text-gray-300" />
                                                <p className="mt-3 font-semibold text-gray-700">
                                                    Không tìm thấy bài kiểm tra nào
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Thử thay đổi bộ lọc hoặc thêm bài kiểm tra mới vào hệ thống.
                                                </p>
                                                <div className="mt-4">
                                                    <Link href="/exams/create">
                                                        <Button variant="success" size="sm" icon={<Plus className="h-4 w-4" />}>
                                                            Tạo Bài Kiểm Tra Ngay
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    exams.data.map((exam, idx) => (
                                        <tr key={exam.id} className="transition-colors hover:bg-slate-50/60">
                                            <td className="text-center font-medium text-gray-500 text-xs">
                                                {(exams.current_page - 1) * 15 + (idx + 1)}
                                            </td>
                                            <td>
                                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 font-mono text-xs font-bold text-emerald-800 border border-emerald-200/60 whitespace-nowrap">
                                                    {exam.code}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="space-y-1 py-1 max-w-sm">
                                                    <TruncatedText
                                                        text={exam.name}
                                                        maxLines={2}
                                                        className="font-bold text-gray-900 text-sm leading-snug"
                                                    />
                                                    <div className="flex items-center gap-1.5 text-2xs text-gray-600 flex-wrap">
                                                        {exam.is_practice && (
                                                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-2xs font-bold text-blue-700 border border-blue-200 shrink-0">
                                                                <Award className="h-3 w-3 text-blue-600" />
                                                                Thi Thử
                                                            </span>
                                                        )}
                                                        {exam.subject && (
                                                            <Tooltip content={`Môn: ${exam.subject.name}`}>
                                                                <span className="rounded-md bg-purple-50 px-2 py-0.5 text-purple-700 font-semibold border border-purple-200/60 inline-block max-w-[200px] truncate align-middle">
                                                                    Môn: {exam.subject.name}
                                                                </span>
                                                            </Tooltip>
                                                        )}
                                                        {exam.schoolClass && (
                                                            <Tooltip content={`Lớp: ${exam.schoolClass.name}`}>
                                                                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-blue-700 font-semibold border border-blue-200/60 inline-block max-w-[160px] truncate align-middle">
                                                                    Lớp: {exam.schoolClass.name}
                                                                </span>
                                                            </Tooltip>
                                                        )}
                                                        {isSuperAdmin && exam.center && (
                                                            <Tooltip content={`Trung tâm: ${exam.center.name}`}>
                                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 font-medium border border-slate-200 inline-block max-w-[160px] truncate align-middle">
                                                                    {exam.center.name}
                                                                </span>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                    {exam.description && (
                                                        <TruncatedText
                                                            text={exam.description}
                                                            maxLines={1}
                                                            className="text-2xs text-gray-400"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="space-y-1 text-xs">
                                                    <div className="flex items-center gap-1 font-semibold text-gray-700 whitespace-nowrap">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                        <span>{exam.duration_minutes || 45} phút</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => openQuestionsModal(exam)}
                                                        className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 transition-colors whitespace-nowrap"
                                                    >
                                                        <HelpCircle className="h-3 w-3 text-emerald-600" />
                                                        <span>{exam.questions_count ?? (exam.questions ? exam.questions.length : 0)} câu hỏi</span>
                                                        <Eye className="h-2.5 w-2.5 ml-0.5" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-xs space-y-0.5">
                                                    <div className="flex items-center gap-1 font-black text-gray-900 text-sm whitespace-nowrap">
                                                        <Award className="h-3.5 w-3.5 text-amber-500" />
                                                        <span>{exam.max_score}đ</span>
                                                    </div>
                                                    {exam.pass_score && (
                                                        <span className="text-2xs font-medium text-gray-500 whitespace-nowrap block">
                                                            (Đạt: {exam.pass_score}đ)
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="inline-flex justify-center">
                                                    {getStatusBadge(exam.status)}
                                                </div>
                                            </td>
                                            {(can('exams.edit') || can('exams.delete') || can('class-exams.create')) && (
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                                                        <Link href={`/exams/${exam.id}/practice`}>
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                size="sm"
                                                                className="!border-blue-300 !text-blue-700 hover:!bg-blue-50"
                                                                icon={<Award className="h-3.5 w-3.5 text-blue-600" />}
                                                                title="Thi thử / Làm thử bài thi này"
                                                            >
                                                                Thi Thử
                                                            </Button>
                                                        </Link>
                                                        {can('class-exams.create') && (
                                                            <Button
                                                                type="button"
                                                                variant="success"
                                                                size="sm"
                                                                icon={<Users className="h-3.5 w-3.5" />}
                                                                onClick={() => openAssignModal(exam.id)}
                                                                title="Gán đề thi này cho một lớp học"
                                                            >
                                                                Gán Lớp
                                                            </Button>
                                                        )}
                                                        {can('exams.edit') && (
                                                            <Link href={`/exams/${exam.id}/edit`}>
                                                                <Button
                                                                    variant="edit"
                                                                    size="sm"
                                                                    icon={<Edit2 className="h-3.5 w-3.5" />}
                                                                    title="Chỉnh sửa bài kiểm tra"
                                                                >
                                                                    Sửa
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {can('exams.delete') && (
                                                            <Button
                                                                type="button"
                                                                variant="danger"
                                                                size="sm"
                                                                icon={<Trash2 className="h-3.5 w-3.5" />}
                                                                onClick={() => openDeleteModal(exam)}
                                                                title="Xóa bài kiểm tra"
                                                            >
                                                                Xóa
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {exams.last_page > 1 && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row">
                            <p className="text-xs text-gray-500">
                                Hiển thị từ <span className="font-semibold text-gray-800">{exams.from || 0}</span> đến{' '}
                                <span className="font-semibold text-gray-800">{exams.to || 0}</span> trong tổng số{' '}
                                <span className="font-semibold text-gray-800">{exams.total}</span> đề thi
                            </p>
                            <div className="flex items-center gap-1">
                                {exams.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveState
                                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${link.active
                                            ? 'bg-emerald-600 text-white'
                                            : link.url
                                                ? 'text-gray-700 hover:bg-gray-100'
                                                : 'text-gray-300 cursor-not-allowed'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Quick View Questions Modal */}
            <Modal
                isOpen={viewQuestionsModalOpen}
                onClose={() => setViewQuestionsModalOpen(false)}
                title={`Danh Sách Câu Hỏi: ${selectedExamQuestions?.name || ''}`}
                maxWidth="max-w-2xl"
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                            <p className="text-xs text-gray-500">
                                Thời lượng: <span className="font-semibold text-gray-800">{selectedExamQuestions?.duration_minutes || 45} phút</span> • Điểm tối đa: <span className="font-semibold text-emerald-700">{selectedExamQuestions?.max_score}</span>
                            </p>
                        </div>
                        {can('exams.edit') && (
                            <Link href={`/exams/${selectedExamQuestions?.id}/edit`}>
                                <Button variant="edit" size="sm" icon={<Edit2 className="h-3.5 w-3.5" />}>
                                    Soạn Thảo Câu Hỏi
                                </Button>
                            </Link>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto space-y-3 p-1">
                        {selectedExamQuestions?.questions && selectedExamQuestions.questions.length > 0 ? (
                            selectedExamQuestions.questions.map((q, idx) => {
                                const typeMeta = QUESTION_TYPES.find((t) => t.type === q.question_type) || QUESTION_TYPES[0];
                                return (
                                    <div key={idx} className="rounded-xl border border-gray-200 bg-slate-50/70 p-3.5 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 font-mono text-2xs font-bold text-white">
                                                    {idx + 1}
                                                </span>
                                                <span className={`inline-flex items-center rounded px-2 py-0.5 text-2xs font-bold ${q.skill === SKILL_LISTENING
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    : q.skill === SKILL_WRITING
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : q.skill === SKILL_SPEAKING
                                                            ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    }`}>
                                                    {q.skill === SKILL_LISTENING
                                                        ? '🎧 Nghe'
                                                        : q.skill === SKILL_WRITING
                                                            ? '✍️ Viết'
                                                            : q.skill === SKILL_SPEAKING
                                                                ? '🗣️ Nói'
                                                                : '📖 Đọc'}
                                                </span>
                                                <span className={`inline-flex items-center rounded px-2 py-0.5 text-2xs font-bold border ${typeMeta.badgeColor}`}>
                                                    {typeMeta.label}
                                                </span>
                                            </div>
                                            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                                {q.score} điểm
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-900 whitespace-pre-wrap">
                                            {q.content}
                                        </p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-xs text-gray-500 py-8">
                                Đề thi này hiện chưa có câu hỏi chi tiết. Bấm &quot;Soạn Thảo Câu Hỏi&quot; để thêm câu hỏi.
                            </p>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Assign Exam to Class Modal */}
            <AssignExamModal
                isOpen={assignModalOpen}
                onClose={() => {
                    setAssignModalOpen(false);
                    setAssigningExamId(null);
                }}
                centers={centers}
                classes={classes}
                exams={availableExamsForModal}
                initialExamId={assigningExamId}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                entity="exams"
                entityId={examToDelete?.id || null}
                entityName={`đề thi "${examToDelete?.name}" (${examToDelete?.code})`}
                isDeleting={isDeleting}
            />
        </AppLayout>
    );
}
