import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    FileCheck,
    Plus,
    Search,
    Edit2,
    Trash2,
    AlertCircle,
    Filter,
    Clock,
    Calendar,
    Award,
    Eye,
    HelpCircle,
    CheckCircle2,
    FileText,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AppLayout from '@/layouts/AppLayout';
import { Center, Exam, PaginatedData, SchoolClass, Subject, QUESTION_TYPES } from './types';

interface Props {
    exams: PaginatedData<Exam>;
    centers: Center[];
    classes: SchoolClass[];
    subjects: Subject[];
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
        exam_type?: string;
        status?: string;
    };
}

export default function ExamIndex({
    exams,
    centers = [],
    classes = [],
    subjects = [],
    stats,
    filters,
}: Props) {
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
    const [selectedExamType, setSelectedExamType] = useState<string>(
        filters.exam_type || 'all',
    );
    const [selectedStatus, setSelectedStatus] = useState<string>(
        filters.status || 'all',
    );

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingExam, setDeletingExam] = useState<Exam | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Quick View Questions Modal
    const [viewQuestionsModalOpen, setViewQuestionsModalOpen] = useState(false);
    const [selectedExamQuestions, setSelectedExamQuestions] = useState<Exam | null>(null);

    // Filter classes and subjects by selected center
    const filteredClasses = selectedCenterId
        ? classes.filter((c) => String(c.center_id) === String(selectedCenterId))
        : classes;

    const filteredSubjects = selectedCenterId
        ? subjects.filter((s) => String(s.center_id) === String(selectedCenterId))
        : subjects;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/exams',
            {
                search: search || undefined,
                center_id: selectedCenterId || undefined,
                class_id: selectedClassId || undefined,
                subject_id: selectedSubjectId || undefined,
                exam_type: selectedExamType !== 'all' ? selectedExamType : undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
            },
            { preserveState: true },
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedCenterId('');
        setSelectedClassId('');
        setSelectedSubjectId('');
        setSelectedExamType('all');
        setSelectedStatus('all');
        router.get('/exams', {}, { preserveState: true });
    };

    const openDeleteModal = (exam: Exam) => {
        setDeletingExam(exam);
        setDeleteModalOpen(true);
    };

    const openQuestionsModal = (exam: Exam) => {
        setSelectedExamQuestions(exam);
        setViewQuestionsModalOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingExam) return;

        setIsDeleting(true);
        router.delete(`/exams/${deletingExam.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setDeletingExam(null);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <Badge variant="active">Đã công bố</Badge>;
            case 'draft':
                return <Badge variant="pending">Bản nháp</Badge>;
            case 'completed':
                return <Badge variant="info">Đã kết thúc</Badge>;
            case 'cancelled':
                return <Badge variant="expired">Đã hủy</Badge>;
            default:
                return <Badge variant="info">{status}</Badge>;
        }
    };

    const getExamTypeBadge = (type: string) => {
        switch (type) {
            case 'ielts':
                return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-2xs font-bold text-blue-700 border border-blue-200">IELTS Mock</span>;
            case 'hsk':
                return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-2xs font-bold text-red-700 border border-red-200">HSK Đề Thi</span>;
            case 'toeic':
                return <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-2xs font-bold text-purple-700 border border-purple-200">TOEIC Test</span>;
            case 'custom':
                return <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-2xs font-bold text-teal-700 border border-teal-200">Tuỳ Chỉnh</span>;
            default:
                return <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-2xs font-semibold text-gray-700">Chung (General)</span>;
        }
    };

    return (
        <AppLayout title="Quản Lý Bài Kiểm Tra & Kỳ Thi - Hệ Thống Giáo Dục Sam">
            <Head title="Quản Lý Bài Kiểm Tra" />

            <div className="space-y-6">
                {/* Top Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
                            <FileCheck className="h-7 w-7 text-emerald-600" />
                            Quản Lý Bài Kiểm Tra & Kỳ Thi
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Quản lý ngân hàng đề thi, bài kiểm tra định kỳ, phân loại 10 dạng câu hỏi và thiết lập cấu hình thi trực tuyến.
                        </p>
                    </div>

                    <Link href="/exams/create">
                        <Button
                            variant="success"
                            size="md"
                            icon={<Plus className="h-4.5 w-4.5" />}
                        >
                            Tạo Bài Kiểm Tra Mới
                        </Button>
                    </Link>
                </div>

                {/* KPI Stat Cards */}
                {stats && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-gray-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Tổng Số Bài Thi
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
                                        Bản Nháp (Draft)
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
                                    <FileText className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Filter Box */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
                            {/* Search Keyword */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Tìm kiếm
                                </label>
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tên bài thi, mã đề thi..."
                                    icon={<Search className="h-4 w-4 text-gray-400" />}
                                    className="!py-2 !text-sm"
                                />
                            </div>

                            {/* Center Filter (Super Admin only) */}
                            {isSuperAdmin && centers.length > 0 && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                        Trung Tâm Đào Tạo
                                    </label>
                                    <select
                                        value={selectedCenterId}
                                        onChange={(e) => {
                                            setSelectedCenterId(e.target.value);
                                            setSelectedClassId('');
                                            setSelectedSubjectId('');
                                        }}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">-- Tất cả Trung Tâm --</option>
                                        {centers.map((center) => (
                                            <option key={center.id} value={center.id}>
                                                {center.name} ({center.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Class Filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Lớp Học
                                </label>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">-- Tất cả Lớp Học --</option>
                                    {filteredClasses.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject Filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Môn Học
                                </label>
                                <select
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">-- Tất cả Môn Học --</option>
                                    {filteredSubjects.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Exam Type Filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Loại Bài Thi
                                </label>
                                <select
                                    value={selectedExamType}
                                    onChange={(e) => setSelectedExamType(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="all">Tất cả loại bài thi</option>
                                    <option value="general">Chung (General)</option>
                                    <option value="ielts">IELTS Mock Test</option>
                                    <option value="hsk">HSK Đề Thi Mẫu</option>
                                    <option value="toeic">TOEIC Practice Test</option>
                                    <option value="custom">Tuỳ Chỉnh</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Trạng thái
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="published">Đã công bố (Published)</option>
                                    <option value="draft">Bản nháp (Draft)</option>
                                    <option value="completed">Đã kết thúc (Completed)</option>
                                    <option value="cancelled">Đã hủy (Cancelled)</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleResetFilter}
                            >
                                Đặt Lại
                            </Button>
                            <Button
                                type="submit"
                                variant="success"
                                size="sm"
                                icon={<Filter className="h-4 w-4" />}
                            >
                                Áp Dụng Lọc
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
                                    <th>Mã Đề Thi</th>
                                    <th>Tên Bài Kiểm Tra</th>
                                    <th>Trung Tâm / Lớp / Môn</th>
                                    <th>Loại Bài Thi</th>
                                    <th>Thời Lượng & Số Câu</th>
                                    <th>Điểm Tối Đa</th>
                                    <th>Thời Gian Thi</th>
                                    <th>Trạng Thái</th>
                                    <th className="text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {exams.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-12 text-center text-gray-500">
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
                                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 font-mono text-xs font-bold text-emerald-800 border border-emerald-200/60">
                                                    {exam.code}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="space-y-0.5">
                                                    <span className="font-bold text-gray-900 block">
                                                        {exam.name}
                                                    </span>
                                                    {exam.description && (
                                                        <span className="text-2xs text-gray-500 line-clamp-1">
                                                            {exam.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="space-y-1 text-xs">
                                                    <div className="font-medium text-gray-800">
                                                        {exam.center?.name || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-2xs text-gray-500">
                                                        {exam.schoolClass && (
                                                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700 font-medium">
                                                                Lớp: {exam.schoolClass.name}
                                                            </span>
                                                        )}
                                                        {exam.subject && (
                                                            <span className="rounded bg-purple-50 px-1.5 py-0.5 text-purple-700 font-medium">
                                                                Môn: {exam.subject.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {getExamTypeBadge(exam.exam_type)}
                                            </td>
                                            <td>
                                                <div className="space-y-1 text-xs">
                                                    <div className="flex items-center gap-1 text-gray-700">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                        <span className="font-semibold">{exam.duration_minutes || 45}</span> phút
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => openQuestionsModal(exam)}
                                                        className="inline-flex items-center gap-1 text-2xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                                                    >
                                                        <HelpCircle className="h-3 w-3 text-emerald-600" />
                                                        <span>{exam.questions_count || (exam.questions ? exam.questions.length : 0)} câu hỏi</span>
                                                        <Eye className="h-2.5 w-2.5 ml-0.5" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                                                    <Award className="h-3.5 w-3.5 text-amber-500" />
                                                    <span>{exam.max_score}</span>
                                                    {exam.pass_score && (
                                                        <span className="text-2xs font-normal text-gray-500">
                                                            (Đạt: {exam.pass_score})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {exam.exam_date ? (
                                                    <div className="space-y-0.5 text-xs text-gray-700">
                                                        <div className="flex items-center gap-1 font-medium">
                                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                            <span>{exam.exam_date}</span>
                                                        </div>
                                                        {exam.start_time && (
                                                            <span className="text-2xs text-gray-500 block">
                                                                {exam.start_time.substring(0, 5)} {exam.end_time ? `- ${exam.end_time.substring(0, 5)}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Không giới hạn</span>
                                                )}
                                            </td>
                                            <td>
                                                {getStatusBadge(exam.status)}
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-2">
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
                                                </div>
                                            </td>
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
                                <span className="font-semibold text-gray-800">{exams.total}</span> bài kiểm tra
                            </p>
                            <div className="flex items-center gap-1">
                                {exams.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveState
                                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                            link.active
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : link.url
                                                  ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                  : 'cursor-not-allowed text-gray-300'
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
                title={`Danh Sách Câu Hỏi: ${selectedExamQuestions?.name} (${selectedExamQuestions?.code})`}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                            <p className="text-xs text-gray-500">
                                Trung tâm: <span className="font-semibold text-gray-800">{selectedExamQuestions?.center?.name}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Thời lượng: <span className="font-semibold text-gray-800">{selectedExamQuestions?.duration_minutes || 45} phút</span> • Điểm tối đa: <span className="font-semibold text-emerald-700">{selectedExamQuestions?.max_score}</span>
                            </p>
                        </div>
                        <Link href={`/exams/${selectedExamQuestions?.id}/edit`}>
                            <Button variant="edit" size="sm" icon={<Edit2 className="h-3.5 w-3.5" />}>
                                Soạn Thảo Câu Hỏi
                            </Button>
                        </Link>
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
                                                <span className={`inline-flex items-center rounded px-2 py-0.5 text-2xs font-bold ${
                                                    q.skill === 'listening'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : q.skill === 'writing'
                                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                          : q.skill === 'speaking'
                                                            ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                    {q.skill === 'listening'
                                                        ? '🎧 Nghe'
                                                        : q.skill === 'writing'
                                                          ? '✍️ Viết'
                                                          : q.skill === 'speaking'
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Xác Nhận Xóa Bài Kiểm Tra"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="h-8 w-8 shrink-0" />
                        <div>
                            <p className="font-bold text-gray-900">
                                Bạn có chắc chắn muốn xóa bài kiểm tra này?
                            </p>
                            <p className="text-sm text-gray-500">
                                Đề thi: <span className="font-semibold text-gray-800">{deletingExam?.name}</span> ({deletingExam?.code})
                            </p>
                        </div>
                    </div>

                    <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                        Lưu ý: Tất cả các câu hỏi thuộc bài kiểm tra này sẽ được xóa đồng thời. Dữ liệu kết quả thi của học sinh (nếu có) sẽ được bảo toàn an toàn.
                    </p>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            Hủy Bỏ
                        </Button>
                        <Button
                            variant="danger"
                            size="md"
                            isLoading={isDeleting}
                            onClick={confirmDelete}
                        >
                            Xóa Bài Kiểm Tra
                        </Button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
