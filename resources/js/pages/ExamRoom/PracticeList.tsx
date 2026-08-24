import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    CheckCircle2,
    Clock,
    FileCheck,
    Filter,
    HelpCircle,
    Play,
    RotateCcw,
    Search,
    Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Tooltip, { TruncatedText } from '@/components/ui/Tooltip';
import AppLayout from '@/layouts/AppLayout';
import { Center, Exam, PaginatedData, Subject } from '../Admin/Exams/types';

interface ExamTypeOption {
    id: number;
    name: string;
    code: string;
    center_id?: number | null;
}

interface Props {
    exams: PaginatedData<Exam>;
    centers: Center[];
    subjects: Subject[];
    exam_types?: ExamTypeOption[];
    filters: {
        search?: string;
        center_id?: number | null;
        subject_id?: number | null;
        exam_type_id?: number | string | null;
        exam_type?: string;
    };
}

export default function PracticeList({
    exams,
    centers = [],
    subjects = [],
    exam_types = [],
    filters,
}: Props) {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCenterId, setSelectedCenterId] = useState<string>(
        filters.center_id ? String(filters.center_id) : '',
    );
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
        filters.subject_id ? String(filters.subject_id) : '',
    );
    const [selectedExamType, setSelectedExamType] = useState<string>(
        filters.exam_type_id ? String(filters.exam_type_id) : (filters.exam_type || 'all'),
    );

    // Confirm Start Modal
    const [startModalOpen, setStartModalOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

    const filteredSubjects = selectedCenterId
        ? subjects.filter((s) => String(s.center_id) === String(selectedCenterId))
        : subjects;

    const filteredExamTypes = selectedCenterId
        ? exam_types.filter((t) => !t.center_id || String(t.center_id) === String(selectedCenterId))
        : exam_types;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/practice-exams',
            {
                search: search || undefined,
                center_id: selectedCenterId || undefined,
                subject_id: selectedSubjectId || undefined,
                exam_type_id: selectedExamType !== 'all' ? selectedExamType : undefined,
            },
            { preserveState: true },
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedCenterId('');
        setSelectedSubjectId('');
        setSelectedExamType('all');
        router.get('/practice-exams', {}, { preserveState: true });
    };

    const openStartModal = (exam: Exam) => {
        setSelectedExam(exam);
        setStartModalOpen(true);
    };

    const getExamTypeBadge = (exam: Exam) => {
        const typeName = exam.examType?.name || (typeof exam.exam_type === 'object' ? (exam.exam_type as any)?.name : exam.exam_type) || 'Đề thi';
        const typeCode = (exam.examType?.code || (typeof exam.exam_type === 'object' ? (exam.exam_type as any)?.code : exam.exam_type) || '').toLowerCase();

        switch (typeCode) {
            case 'ielts':
                return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-2xs font-bold text-blue-700 border border-blue-200">{typeName}</span>;
            case 'hsk':
                return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-2xs font-bold text-red-700 border border-red-200">{typeName}</span>;
            case 'toeic':
                return <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-2xs font-bold text-purple-700 border border-purple-200">{typeName}</span>;
            case 'custom':
                return <span className="inline-flex items-center rounded-md bg-teal-50 px-2 py-0.5 text-2xs font-bold text-teal-700 border border-teal-200">{typeName}</span>;
            default:
                return <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-2xs font-bold text-emerald-700 border border-emerald-200">{typeName}</span>;
        }
    };

    return (
        <AppLayout title="Thi Thử & Luyện Tập Trực Tuyến - SAM Digital">
            <Head title="Thi Thử & Luyện Tập Trực Tuyến" />

            <div className="mx-auto max-w-7xl space-y-6">
                {/* Hero Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 p-6 sm:p-8 text-white shadow-lg">
                    <div className="relative z-10 max-w-3xl space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-xs border border-emerald-400/30">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                            Phòng Thi Thử & Luyện Tập Tự Do
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                            Kho Đề Thi Thử & Luyện Đề Tự Động Chấm Điểm
                        </h1>
                        <p className="text-sm text-emerald-100/90 leading-relaxed">
                            Luyện tập không giới hạn với kho đề thi đa kỹ năng (Nghe, Nói, Đọc, Viết). Hệ thống tự động chấm điểm và cung cấp lời giải thích chi tiết ngay sau khi nộp bài.
                        </p>
                    </div>

                    <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
                        <Award className="h-80 w-80 text-white" />
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <Card className="border-gray-200 bg-white p-5 shadow-2xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                            {/* Search Keyword */}
                            <div className="sm:col-span-2">
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Tìm Kiếm Đề Thi
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Nhập tên đề thi, mã đề hoặc mô tả..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    icon={<Search className="h-4 w-4 text-gray-400" />}
                                    className="!py-2 !text-xs"
                                />
                            </div>

                            {/* Center Filter (Super Admin Only) */}
                            {isSuperAdmin && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                                        Trung Tâm
                                    </label>
                                    <select
                                        value={selectedCenterId}
                                        onChange={(e) => setSelectedCenterId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">Tất cả Trung tâm</option>
                                        {centers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Subject Filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Môn Học
                                </label>
                                <select
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">Tất cả Môn học</option>
                                    {filteredSubjects.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Exam Type Filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Loại Kỳ Thi
                                </label>
                                <select
                                    value={selectedExamType}
                                    onChange={(e) => setSelectedExamType(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="all">Tất cả định dạng</option>
                                    {filteredExamTypes.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} ({t.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 pt-3">
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
                                Áp Dụng
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Exam Cards Grid */}
                {exams.data.length === 0 ? (
                    <Card className="border-gray-200 bg-white p-12 text-center shadow-2xs">
                        <div className="flex flex-col items-center justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
                                <Award className="h-8 w-8" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                Chưa Có Đề Thi Thử Phù Hợp
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 max-w-md">
                                Hiện tại chưa có bài thi nào được đánh dấu là đề thi thử hoặc không có kết quả phù hợp với bộ lọc tìm kiếm của bạn.
                            </p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {exams.data.map((exam) => {
                            const totalQuestions = exam.questions_count ?? (exam.questions ? exam.questions.length : 0);
                            const totalSections = exam.sections_count ?? (exam.sections ? exam.sections.length : 0);

                            return (
                                <div
                                    key={exam.id}
                                    className="group relative flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
                                >
                                    {/* Card Header */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                                                {exam.code}
                                            </span>
                                            {getExamTypeBadge(exam)}
                                        </div>

                                        <div>
                                            <TruncatedText
                                                text={exam.name}
                                                maxLines={2}
                                                className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors"
                                            />
                                            {exam.subject && (
                                                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                                                    <BookOpen className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                    <TruncatedText
                                                        text={exam.subject.name}
                                                        maxLines={1}
                                                        className="font-medium truncate max-w-[140px]"
                                                    />
                                                    {exam.center && (
                                                        <TruncatedText
                                                            text={`• ${exam.center.name}`}
                                                            maxLines={1}
                                                            className="text-2xs text-gray-400 truncate max-w-[120px]"
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {exam.description && (
                                            <TruncatedText
                                                text={exam.description}
                                                maxLines={2}
                                                className="text-xs text-gray-600"
                                            />
                                        )}

                                        {/* Specs Grid */}
                                        <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-center">
                                            <div>
                                                <span className="block text-2xs text-gray-400 font-medium">Thời gian</span>
                                                <span className="text-xs font-bold text-gray-800 flex items-center justify-center gap-1 mt-0.5">
                                                    <Clock className="h-3 w-3 text-emerald-600" />
                                                    {exam.duration_minutes || 45}p
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-2xs text-gray-400 font-medium">Số câu</span>
                                                <span className="text-xs font-bold text-gray-800 flex items-center justify-center gap-1 mt-0.5">
                                                    <HelpCircle className="h-3 w-3 text-emerald-600" />
                                                    {totalQuestions}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-2xs text-gray-400 font-medium">Thang điểm</span>
                                                <span className="text-xs font-bold text-gray-800 flex items-center justify-center gap-1 mt-0.5">
                                                    <Award className="h-3 w-3 text-amber-500" />
                                                    {exam.max_score}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <span className="text-2xs font-semibold text-gray-500">
                                            {totalSections > 0 ? `${totalSections} phần thi` : 'Tất cả dạng bài'}
                                        </span>

                                        <Button
                                            type="button"
                                            variant="success"
                                            size="sm"
                                            icon={<Play className="h-3.5 w-3.5 fill-current" />}
                                            onClick={() => openStartModal(exam)}
                                        >
                                            Bắt Đầu Thi Thử
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {exams.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                        {exams.links.map((link, idx) => (
                            <Link
                                key={idx}
                                href={link.url || '#'}
                                preserveState
                                className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-xs font-bold transition-all ${
                                    link.active
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : link.url
                                          ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                          : 'cursor-not-allowed text-gray-300'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Confirm Start Exam Modal */}
            {selectedExam && (
                <Modal
                    isOpen={startModalOpen}
                    onClose={() => setStartModalOpen(false)}
                    title="Xác Nhận Bắt Đầu Thi Thử"
                    maxWidth="md"
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                            <Award className="h-6 w-6 text-emerald-600 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold">{selectedExam.name}</h4>
                                <p className="text-xs text-emerald-700">Mã đề: {selectedExam.code}</p>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs text-gray-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                            <div className="font-bold text-gray-800 mb-1">Quy định phòng thi thử:</div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5 text-gray-500" />
                                <span>Thời gian làm bài: <strong>{selectedExam.duration_minutes || 45} phút</strong> (có đồng hồ đếm ngược).</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-gray-500" />
                                <span>Hệ thống tự động chấm điểm và hiển thị giải thích chi tiết ngay khi nộp bài.</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <RotateCcw className="h-3.5 w-3.5 text-gray-500" />
                                <span>Bạn có thể thi thử lại nhiều lần để rèn luyện kỹ năng.</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setStartModalOpen(false)}
                            >
                                Đóng
                            </Button>
                            <Link href={`/exams/${selectedExam.id}/practice`}>
                                <Button
                                    type="button"
                                    variant="success"
                                    icon={<Play className="h-4 w-4 fill-current" />}
                                >
                                    Vào Làm Bài Ngay
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Modal>
            )}
        </AppLayout>
    );
}
