import { Head, Link, router } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    CheckCircle2,
    Clock,
    FileCheck,
    Filter,
    HelpCircle,
    PenTool,
    RotateCcw,
    Search,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { ScrollableSelect } from '@/components/ui/ScrollableSelect';
import AppLayout from '@/layouts/AppLayout';

interface SchoolClassItem {
    id: number;
    code?: string;
    name: string;
    center?: { id: number; name: string };
}

interface ClassExamItem {
    id: number;
    code?: string;
    class_id: number;
    title: string;
    max_score: number;
    duration_minutes: number;
}

interface SubmissionItem {
    id: number;
    class_exam_id: number;
    student_id: number;
    score: number | null;
    total_correct: number;
    total_questions: number;
    status: 'in_progress' | 'submitted' | 'timeout_submitted' | 'missed';
    is_graded: boolean;
    requires_manual_grading: boolean;
    graded_at: string | null;
    duration_seconds_used: number;
    submitted_at: string | null;
    student?: {
        id: number;
        full_name: string;
        student_code?: string;
        username: string;
        avatar?: string;
    };
    classExam?: {
        id: number;
        code?: string;
        title: string;
        max_score: number;
        pass_score?: number;
        schoolClass?: {
            id: number;
            name: string;
            code?: string;
        };
    };
    gradedByTeacher?: {
        id: number;
        full_name: string;
        teacher_code?: string;
    };
    gradedByAdmin?: {
        id: number;
        full_name: string;
        username: string;
    };
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    submissions: PaginatedData<SubmissionItem>;
    classes: SchoolClassItem[];
    classExams: ClassExamItem[];
    stats: {
        total_submissions: number;
        graded_count: number;
        pending_count: number;
        average_score: number;
    };
    filters: {
        class_id?: number | null;
        class_exam_id?: number | null;
        status?: string;
        search?: string;
        per_page?: number;
    };
    isTeacher: boolean;
    isAdmin: boolean;
}

export default function GradingIndex({
    submissions,
    classes,
    classExams,
    stats,
    filters,
    isTeacher,
    isAdmin,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedClassId, setSelectedClassId] = useState(filters.class_id ? String(filters.class_id) : '');
    const [selectedExamId, setSelectedExamId] = useState(filters.class_exam_id ? String(filters.class_exam_id) : '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');

    // Available exams filtered by selected class
    const availableExams = selectedClassId
        ? classExams.filter((e) => String(e.class_id) === selectedClassId)
        : classExams;

    const handleFilterChange = (override: Partial<typeof filters> = {}) => {
        router.get(
            '/grading',
            {
                search: override.search !== undefined ? override.search : search,
                class_id: override.class_id !== undefined ? override.class_id : (selectedClassId ? Number(selectedClassId) : null),
                class_exam_id: override.class_exam_id !== undefined ? override.class_exam_id : (selectedExamId ? Number(selectedExamId) : null),
                status: override.status !== undefined ? override.status : selectedStatus,
                page: 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange({ search });
    };

    const handleResetFilters = () => {
        setSearch('');
        setSelectedClassId('');
        setSelectedExamId('');
        setSelectedStatus('all');
        router.get('/grading', {}, { preserveState: true });
    };

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s < 10 ? '0' : ''}${s}s`;
    };

    return (
        <AppLayout title="Chấm Bài Thi - Hệ Thống Quản Lý Giáo Dục Sam">
            <Head title="Chấm Bài Thi Theo Lớp" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
                            <FileCheck className="h-6 w-6 text-emerald-600" />
                            Quản Lý Chấm Bài Thi
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Xem danh sách bài thi theo lớp, chấm điểm câu hỏi Tự luận (Viết) & Ghi âm (Nói) và quản lý kết quả thi
                        </p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-gray-200 bg-white p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Tổng Bài Nộp</p>
                                <p className="mt-1 text-2xl font-black text-gray-900">{stats.total_submissions}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-gray-200 bg-white p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xs font-bold uppercase tracking-wider text-emerald-600">Đã Chấm Điểm</p>
                                <p className="mt-1 text-2xl font-black text-emerald-700">{stats.graded_count}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-gray-200 bg-white p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xs font-bold uppercase tracking-wider text-amber-600">Đang Chờ Chấm</p>
                                <p className="mt-1 text-2xl font-black text-amber-600">{stats.pending_count}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <PenTool className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-gray-200 bg-white p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xs font-bold uppercase tracking-wider text-purple-600">Điểm Trung Bình</p>
                                <p className="mt-1 text-2xl font-black text-purple-700">{stats.average_score} <span className="text-xs font-semibold text-gray-500">/ 10</span></p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                <Award className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filter & Search Bar */}
                <Card className="border-gray-200 bg-white p-4 shadow-2xs">
                    <form onSubmit={handleSearchSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Class Filter */}
                            <div>
                                <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-600">Lớp Học</label>
                                <ScrollableSelect
                                    value={selectedClassId}
                                    onChange={(val) => {
                                        setSelectedClassId(val);
                                        setSelectedExamId('');
                                        handleFilterChange({ class_id: val ? Number(val) : null, class_exam_id: null });
                                    }}
                                    options={[
                                        { value: '', label: '-- Tất cả lớp học --' },
                                        ...classes.map((cls) => ({
                                            value: String(cls.id),
                                            label: `${cls.name} (${cls.code || 'Mã #' + cls.id})`,
                                        })),
                                    ]}
                                    placeholder="Chọn lớp học"
                                />
                            </div>

                            {/* Exam Filter */}
                            <div>
                                <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-600">Kỳ Thi / Bài Thi</label>
                                <ScrollableSelect
                                    value={selectedExamId}
                                    onChange={(val) => {
                                        setSelectedExamId(val);
                                        handleFilterChange({ class_exam_id: val ? Number(val) : null });
                                    }}
                                    options={[
                                        { value: '', label: '-- Tất cả bài thi --' },
                                        ...availableExams.map((e) => ({
                                            value: String(e.id),
                                            label: `${e.title} (${e.code || 'Mã #' + e.id})`,
                                        })),
                                    ]}
                                    placeholder="Chọn bài thi"
                                />
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-600">Trạng Thái Chấm</label>
                                <ScrollableSelect
                                    value={selectedStatus}
                                    onChange={(val) => {
                                        setSelectedStatus(val);
                                        handleFilterChange({ status: val });
                                    }}
                                    options={[
                                        { value: 'all', label: 'Tất cả trạng thái' },
                                        { value: 'pending', label: '⏳ Chờ chấm điểm' },
                                        { value: 'manual_needed', label: '✍️ Cần chấm tự luận / nói' },
                                        { value: 'graded', label: '✅ Đã chấm xong' },
                                    ]}
                                    placeholder="Chọn trạng thái"
                                />
                            </div>

                            {/* Search Student */}
                            <div>
                                <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-600">Tìm Kiếm Thí Sinh</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Tên, mã học sinh..."
                                        className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                    />
                                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                            <p className="text-2xs font-medium text-gray-500">
                                Hiển thị <strong>{submissions.data.length}</strong> / <strong>{submissions.total}</strong> bài làm
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    icon={<RotateCcw className="h-3.5 w-3.5" />}
                                    onClick={handleResetFilters}
                                >
                                    Đặt Lại
                                </Button>
                                <Button
                                    type="submit"
                                    variant="success"
                                    size="sm"
                                    icon={<Filter className="h-3.5 w-3.5" />}
                                >
                                    Lọc Kết Quả
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>

                {/* Submissions List Table */}
                <Card className="border-gray-200 bg-white shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-700">
                            <thead className="border-b border-gray-200 bg-slate-50 font-bold uppercase tracking-wider text-2xs text-gray-600">
                                <tr>
                                    <th className="px-4 py-3.5">Học Sinh</th>
                                    <th className="px-4 py-3.5">Lớp Học & Bài Thi</th>
                                    <th className="px-4 py-3.5">Thời Gian Nộp</th>
                                    <th className="px-4 py-3.5">Thời Gian Làm</th>
                                    <th className="px-4 py-3.5 text-center">Phần Tự Luận</th>
                                    <th className="px-4 py-3.5 text-center">Trạng Thái Chấm</th>
                                    <th className="px-4 py-3.5 text-right">Điểm Số</th>
                                    <th className="px-4 py-3.5 text-center">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {submissions.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                                            <HelpCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                            <p className="font-semibold text-xs text-gray-600">Không tìm thấy bài làm nào</p>
                                            <p className="text-2xs text-gray-400 mt-1">Hãy thử thay đổi bộ lọc lớp học hoặc bài thi.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    submissions.data.map((sub) => {
                                        const maxScore = Number(sub.classExam?.max_score) || 10;
                                        const score = sub.score !== null ? Number(sub.score) : null;

                                        return (
                                            <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                                                {/* Student Info */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                                                            {sub.student?.avatar ? (
                                                                <img
                                                                    src={sub.student.avatar}
                                                                    alt="Avatar"
                                                                    className="h-8 w-8 rounded-full object-cover"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLElement).style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                sub.student?.full_name?.charAt(0) || 'U'
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900">{sub.student?.full_name}</p>
                                                            <p className="font-mono text-2xs text-gray-400">
                                                                {sub.student?.student_code || sub.student?.username}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Class & Exam */}
                                                <td className="px-4 py-3">
                                                    <div className="space-y-0.5">
                                                        <p className="font-bold text-gray-900">{sub.classExam?.title}</p>
                                                        <p className="text-2xs text-emerald-700 font-semibold flex items-center gap-1">
                                                            <BookOpen className="h-3 w-3" />
                                                            {sub.classExam?.schoolClass?.name}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Submitted At */}
                                                <td className="px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                                                    {sub.submitted_at || sub.graded_at || '(Chưa xác định)'}
                                                </td>

                                                {/* Duration */}
                                                <td className="px-4 py-3 font-mono text-2xs text-gray-600 whitespace-nowrap">
                                                    {formatDuration(sub.duration_seconds_used)}
                                                </td>

                                                {/* Manual Grading Tag */}
                                                <td className="px-4 py-3 text-center">
                                                    {sub.requires_manual_grading ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-2xs font-bold text-amber-800 border border-amber-200">
                                                            <PenTool className="h-3 w-3" />
                                                            Có Viết/Nói
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-2xs font-semibold text-gray-500">
                                                            Trắc nghiệm
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Grading Status */}
                                                <td className="px-4 py-3 text-center">
                                                    {sub.is_graded ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-2xs font-bold text-emerald-800 border border-emerald-200">
                                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                            Đã chấm điểm
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-2xs font-bold text-amber-800 border border-amber-300 animate-pulse">
                                                            <Clock className="h-3 w-3 text-amber-600" />
                                                            Chờ chấm bài
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Score */}
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    {sub.is_graded && score !== null ? (
                                                        <span className="text-sm font-black text-gray-900">
                                                            {score} <span className="text-2xs font-medium text-gray-400">/{maxScore}đ</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-2xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                                            Chờ điểm
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Action Button */}
                                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                                    <Link href={`/grading/submissions/${sub.id}`}>
                                                        {sub.is_graded ? (
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className="text-2xs font-bold py-1 px-2.5"
                                                                icon={<FileCheck className="h-3.5 w-3.5 text-emerald-600" />}
                                                            >
                                                                Xem / Sửa Điểm
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="edit"
                                                                size="sm"
                                                                className="text-2xs font-bold py-1 px-3 shadow-xs"
                                                                icon={<PenTool className="h-3.5 w-3.5" />}
                                                            >
                                                                Chấm Bài
                                                            </Button>
                                                        )}
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {submissions.total > submissions.per_page && (
                        <div className="border-t border-gray-100 p-4">
                            <Pagination
                                links={submissions.links}
                                from={submissions.from}
                                to={submissions.to}
                                total={submissions.total}
                                perPage={submissions.per_page}
                                currentParams={filters}
                            />
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
