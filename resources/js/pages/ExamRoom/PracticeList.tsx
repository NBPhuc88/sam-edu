import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { TruncatedText } from '@/components/ui/Tooltip';
import { usePermission } from '@/hooks/usePermission';
import AppLayout from '@/layouts/AppLayout';
import { Head,Link,router,usePage } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    CheckCircle2,
    Clock,
    Filter,
    GraduationCap,
    HelpCircle,
    Play,
    RotateCcw,
    Search,
    Sparkles,
} from 'lucide-react';
import React,{ useState } from 'react';
import { Center,Exam,PaginatedData,Subject } from '../Admin/Exams/types';

interface Props {
    exams: PaginatedData<Exam>;
    centers: Center[];
    subjects: Subject[];
    filters: {
        search?: string;
        center_id?: number | null;
        subject_id?: number | null;
    };
}

export default function PracticeList({
    exams,
    centers = [],
    subjects = [],
    filters,
}: Props) {
    const { isSuperAdmin } = usePermission();

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCenterId, setSelectedCenterId] = useState<number>(
        filters.center_id ? Number(filters.center_id) : 0,
    );
    const [selectedSubjectId, setSelectedSubjectId] = useState<number>(
        filters.subject_id ? Number(filters.subject_id) : 0,
    );

    // Confirm Start Modal
    const [startModalOpen, setStartModalOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

    const filteredSubjects = selectedCenterId
        ? subjects.filter((s) => Number(s.center_id) === selectedCenterId)
        : subjects;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/practice-exams',
            {
                search: search || undefined,
                center_id: selectedCenterId ? Number(selectedCenterId) : undefined,
                subject_id: selectedSubjectId ? Number(selectedSubjectId) : undefined,
            },
            { preserveState: true },
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedCenterId(0);
        setSelectedSubjectId(0);
        router.get('/practice-exams', {}, { preserveState: true });
    };

    const openStartModal = (exam: Exam) => {
        setSelectedExam(exam);
        setStartModalOpen(true);
    };

    return (
        <AppLayout title="Thi Thử & Luyện Tập Trực Tuyến - SAM Digital">
            <Head title="Thi Thử & Luyện Tập Trực Tuyến" />

            <div className="mx-auto max-w-7xl space-y-6">
                {/* Hero Banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 p-6 sm:p-8 text-white shadow-lg">
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                            Phòng Luyện Thi Trực Tuyến 24/7
                        </div>
                        <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl text-white">
                            Luyện Tập & Đánh Giá Năng Lực
                        </h1>
                        <p className="mt-2 text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                            Tham gia các đề thi thử, kiểm tra trình độ với ngân hàng câu hỏi phong phú. Tự động chấm điểm Trắc nghiệm & lưu lại lịch sử làm bài.
                        </p>
                    </div>

                    <div className="absolute right-0 top-0 -mt-8 -mr-8 hidden lg:block opacity-20">
                        <GraduationCap className="h-72 w-72 text-white" />
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <Card className="border-gray-200 bg-white p-4 shadow-2xs">
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Search Input */}
                            <div className={isSuperAdmin ? '' : 'sm:col-span-2'}>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Tìm Kiếm Đề Thi
                                </label>
                                <Input
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
                                        onChange={(e) => setSelectedCenterId(Number(e.target.value))}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="0">Tất cả Trung tâm</option>
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
                                    onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="0">Tất cả Môn học</option>
                                    {filteredSubjects.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
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
                                size="md"
                                icon={<Filter className="h-4 w-4" />}
                            >
                                Tìm kiếm
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Exam Cards Grid */}
                {exams.data.length === 0 ? (
                    <Card className="border-gray-200 bg-white p-12 text-center shadow-2xs">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <BookOpen className="h-8 w-8" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-gray-900">Không tìm thấy đề thi thử nào</h3>
                        <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
                            Hiện chưa có đề thi thử nào phù hợp với bộ lọc của bạn. Thử thay đổi từ khóa hoặc bộ lọc môn học.
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
