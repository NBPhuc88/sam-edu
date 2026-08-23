import { Head, Link, router } from '@inertiajs/react';
import {
    Award,
    ArrowLeft,
    Download,
    Search,
    BookOpen,
    GraduationCap,
    Users,
    CheckCircle2,
    Calendar,
    Filter,
    BarChart3,
    FileSpreadsheet,
    FileCheck,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import AppLayout from '@/layouts/AppLayout';
import { formatDate } from '@/lib/date';

interface SchoolClass {
    id: number;
    name: string;
    code: string;
    students_count?: number;
    center?: {
        id: number;
        name: string;
        code: string;
    };
    class_subjects?: {
        id: number;
        subject?: { name: string; code: string };
        teacher?: { full_name: string; teacher_code: string };
    }[];
}

interface ClassExamOption {
    id: number;
    title: string;
    exam_date?: string | null;
    max_score: number;
    pass_score: number;
    exam?: {
        subject?: { name: string; code: string };
    };
}

interface SubmissionItem {
    id: number;
    score: number | string | null;
    status: string;
    submitted_at?: string | null;
    student?: {
        id: number;
        full_name: string;
        student_code: string;
        phone?: string | null;
    } | null;
    class_exam?: {
        id: number;
        title: string;
        exam_date?: string | null;
        max_score: number;
        pass_score: number;
        exam?: {
            subject?: { name: string; code: string };
        };
    } | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    schoolClass: SchoolClass;
    classExams: ClassExamOption[];
    submissions: PaginatedData<SubmissionItem>;
    stats: {
        total_exams: number;
        total_submissions: number;
        average_score: number;
        highest_score: number;
        pass_rate: number;
        passed_count: number;
    };
    filters: {
        search?: string;
        class_exam_id?: number | null;
    };
    isStudent?: boolean;
    isTeacher?: boolean;
    isAdmin?: boolean;
}

export default function ClassExamResultsPage({
    schoolClass,
    classExams = [],
    submissions,
    stats,
    filters,
    isStudent = false,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedExamId, setSelectedExamId] = useState<string>(
        filters.class_exam_id ? String(filters.class_exam_id) : '',
    );

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            `/classes/${schoolClass.id}/exam-results`,
            {
                search: search || undefined,
                class_exam_id: selectedExamId || undefined,
            },
            { preserveState: true },
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedExamId('');
        router.get(`/classes/${schoolClass.id}/exam-results`, {}, { preserveState: true });
    };

    const getScoreGradeBadge = (score: number | null, passScore: number = 5.0) => {
        if (score === null || score === undefined) {
            return <Badge variant="pending">Chờ chấm</Badge>;
        }

        if (score >= 9.0) {
            return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">Xuất Sắc</span>;
        }
        if (score >= 8.0) {
            return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold bg-blue-100 text-blue-800 border border-blue-300">Giỏi</span>;
        }
        if (score >= 6.5) {
            return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-teal-100 text-teal-800 border border-teal-300">Khá</span>;
        }
        if (score >= passScore) {
            return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-amber-100 text-amber-800 border border-amber-300">Trung Bình</span>;
        }

        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-300">Chưa Đạt</span>;
    };

    return (
        <AppLayout title={`Bảng Điểm Bài Thi - Lớp ${schoolClass.name}`}>
            <Head title={`Bảng điểm: ${schoolClass.name} | SAM-EDU`} />

            <div className="space-y-6 pb-12">
                {/* Header with Navigation and Export Button */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                href="/classes"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-emerald-600 transition-colors"
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                <span>Quay lại danh sách lớp học</span>
                            </Link>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl flex items-center gap-2.5">
                            <Award className="h-6 w-6 text-amber-500" />
                            <span>Bảng Điểm & Bài Thi Đã Thi</span>
                            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                                {schoolClass.code}
                            </span>
                        </h1>
                        <p className="text-xs text-gray-500 sm:text-sm mt-0.5">
                            Lớp: <span className="font-semibold text-gray-800">{schoolClass.name}</span>
                            {schoolClass.center?.name && ` • ${schoolClass.center.name}`}
                            {schoolClass.students_count !== undefined && ` • ${schoolClass.students_count} học sinh`}
                        </p>
                    </div>

                    {!isStudent && (
                        <div className="flex items-center gap-2">
                            <a
                                href={`/classes/${schoolClass.id}/exam-results/export${selectedExamId ? `?class_exam_id=${selectedExamId}` : ''}`}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Button
                                    variant="success"
                                    size="sm"
                                    icon={<FileSpreadsheet className="h-4 w-4 text-white" />}
                                >
                                    Xuất Điểm Thi (CSV)
                                </Button>
                            </a>
                        </div>
                    )}
                </div>

                {/* Summary Stat Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                    <Card className="border-gray-200 bg-white p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xs sm:text-xs font-semibold text-gray-500 uppercase">Kỳ Thi Lớp</p>
                                <h3 className="mt-1 text-xl sm:text-2xl font-black text-gray-900 font-mono">
                                    {stats.total_exams}
                                </h3>
                                <p className="text-3xs sm:text-2xs text-gray-400 mt-0.5">Bài thi chính thức</p>
                            </div>
                            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <FileCheck className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-gray-200 bg-white p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xs sm:text-xs font-semibold text-gray-500 uppercase">Lượt Làm Bài</p>
                                <h3 className="mt-1 text-xl sm:text-2xl font-black text-purple-700 font-mono">
                                    {stats.total_submissions}
                                </h3>
                                <p className="text-3xs sm:text-2xs text-gray-400 mt-0.5">Tổng bài thi đã nộp</p>
                            </div>
                            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                <Users className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-gray-200 bg-white p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xs sm:text-xs font-semibold text-emerald-700 uppercase">Điểm Trung Bình</p>
                                <h3 className="mt-1 text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                                    {stats.average_score} <span className="text-xs font-normal text-gray-400">/ 10</span>
                                </h3>
                                <p className="text-3xs sm:text-2xs text-emerald-700 font-semibold mt-0.5">
                                    Cao nhất: {stats.highest_score}đ
                                </p>
                            </div>
                            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-gray-200 bg-white p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xs sm:text-xs font-semibold text-amber-700 uppercase">Tỉ Lệ Đạt Chuẩn</p>
                                <h3 className="mt-1 text-xl sm:text-2xl font-black text-amber-600 font-mono">
                                    {stats.pass_rate}%
                                </h3>
                                <p className="text-3xs sm:text-2xs text-amber-700 font-semibold mt-0.5">
                                    {stats.passed_count} / {stats.total_submissions} lượt đạt
                                </p>
                            </div>
                            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filter and Search Bar */}
                <Card className="border-gray-200 bg-white p-4 shadow-xs">
                    <form onSubmit={handleFilter} className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên học sinh, mã học sinh, môn học..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs sm:text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={selectedExamId}
                                onChange={(e) => {
                                    setSelectedExamId(e.target.value);
                                }}
                                className="rounded-xl border border-gray-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-gray-700 focus:border-emerald-500 focus:bg-white focus:outline-hidden max-w-[200px]"
                            >
                                <option value="">Tất cả bài thi của lớp</option>
                                {classExams.map((ex) => (
                                    <option key={ex.id} value={ex.id}>
                                        {ex.title}
                                    </option>
                                ))}
                            </select>

                            <Button variant="success" size="sm" type="submit">
                                Lọc
                            </Button>
                            {(search || selectedExamId) && (
                                <Button variant="secondary" size="sm" type="button" onClick={handleResetFilter}>
                                    Đặt Lại
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>

                {/* Submissions & Results Table */}
                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                        <thead className="bg-slate-50/90 text-gray-700">
                            <tr>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500">
                                    Học Sinh
                                </th>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500">
                                    Tên Bài Thi & Môn Học
                                </th>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500 text-center">
                                    Ngày Thi
                                </th>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500 text-center">
                                    Điểm Số
                                </th>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500 text-center">
                                    Điểm Đạt
                                </th>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500 text-center">
                                    Xếp Loại
                                </th>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500 text-center">
                                    Thời Gian Nộp
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {submissions.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-sm text-gray-400 italic">
                                        Chưa có bài thi hoặc kết quả nộp bài nào của lớp học này.
                                    </td>
                                </tr>
                            ) : (
                                submissions.data.map((sub) => {
                                    const numScore = sub.score !== null ? Number(sub.score) : null;
                                    const passScore = sub.class_exam?.pass_score || 5.0;

                                    return (
                                        <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="space-y-0.5">
                                                    <div className="font-extrabold text-sm text-gray-900">
                                                        {sub.student?.full_name || 'Học sinh'}
                                                    </div>
                                                    {sub.student?.student_code && (
                                                        <div className="font-mono text-xs text-gray-400">
                                                            Mã: {sub.student.student_code}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5">
                                                <div className="space-y-0.5">
                                                    <div className="font-bold text-gray-800 text-xs sm:text-sm">
                                                        {sub.class_exam?.title || 'Bài thi'}
                                                    </div>
                                                    {sub.class_exam?.exam?.subject?.name && (
                                                        <div className="text-2xs text-emerald-700 font-semibold flex items-center gap-1">
                                                            <GraduationCap className="h-3 w-3" />
                                                            <span>{sub.class_exam.exam.subject.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3.5 text-center font-mono text-xs text-gray-600">
                                                {sub.class_exam?.exam_date ? formatDate(sub.class_exam.exam_date, '/') : '-'}
                                            </td>

                                            <td className="px-4 py-3.5 text-center">
                                                {numScore !== null ? (
                                                    <span className={`font-mono font-black text-base ${numScore >= passScore ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {numScore} <span className="text-2xs font-normal text-gray-400">/ {sub.class_exam?.max_score || 10}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic">Chưa chấm</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3.5 text-center font-mono text-xs text-gray-500">
                                                {passScore}đ
                                            </td>

                                            <td className="px-4 py-3.5 text-center">
                                                {getScoreGradeBadge(numScore, passScore)}
                                            </td>

                                            <td className="px-4 py-3.5 text-center font-mono text-2xs text-gray-500">
                                                {sub.submitted_at ? formatDate(sub.submitted_at, '/') : '-'}
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
                    <div className="pt-2">
                        <Pagination links={submissions.links} total={submissions.total} />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
