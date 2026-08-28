import { Head, Link } from '@inertiajs/react';
import {
    Award,
    CheckCircle2,
    XCircle,
    Clock,
    FileCheck,
    FileText,
    ArrowLeft,
    HelpCircle,
    Volume2,
    BookOpen,
    AlertCircle,
    Info,
    RotateCcw,
} from 'lucide-react';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import AppLayout from '@/layouts/AppLayout';
import QuestionReviewDetail from './components/QuestionReviewDetail';
import { ClassExam, ClassExamSubmission, ExamQuestionData, ExamSectionData } from './types';
import {
    SUBMISSION_STATUS_TIMEOUT_SUBMITTED,
    QUESTION_TYPE_ESSAY,
    QUESTION_TYPE_AUDIO_RECORD,
    QUESTION_TYPE_FILL_IN_BLANK,
    QUESTION_TYPE_DRAG_DROP_CLOZE,
} from '@/constants/enums';

interface Props {
    submission: ClassExamSubmission;
    classExam: ClassExam;
    isStudent: boolean;
}

export default function ExamResult({
    submission,
    classExam,
    isStudent,
}: Props) {
    const exam = classExam.exam;
    const sections: ExamSectionData[] = exam?.sections || [];
    const gradingDetails = submission.grading_details || {};

    const maxScore = Number(classExam.max_score) || 10;
    const passScore = classExam.pass_score ? Number(classExam.pass_score) : null;
    const studentScore = Number(submission.score) || 0;

    const isPassed = passScore !== null ? studentScore >= passScore : studentScore >= maxScore / 2;

    const [activeFilter, setActiveFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
    const [activeSectionIndex, setActiveSectionIndex] = useState(0);

    const sectionStats = React.useMemo(() => {
        return sections.map((sec, sIdx) => {
            const secQuestions = sec.questions || [];
            let secCorrect = 0;
            let secEarnedScore = 0;
            let secMaxScore = 0;

            secQuestions.forEach((q) => {
                const grade = gradingDetails[q.id!] || {};
                if (grade.is_correct) secCorrect++;
                secEarnedScore += Number(grade.score_earned || 0);
                secMaxScore += Number(q.score || 1);
            });

            return {
                ...sec,
                index: sIdx,
                questions: secQuestions,
                totalQuestions: secQuestions.length,
                correctCount: secCorrect,
                earnedScore: Number(secEarnedScore.toFixed(2)),
                maxScore: Number(secMaxScore.toFixed(2)),
            };
        });
    }, [sections, gradingDetails]);

    const activeSection = sectionStats[activeSectionIndex] || sectionStats[0];

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m} phút ${s < 10 ? '0' : ''}${s} giây`;
    };

    // Calculate accuracy percentage
    const accuracyPercent = submission.total_questions > 0
        ? Math.round((submission.total_correct / submission.total_questions) * 100)
        : 0;

    const isManualPending = submission.requires_manual_grading && !submission.is_graded;

    return (
        <AppLayout title={`Kết Quả Bài Thi: ${classExam.title} - SAM Digital`}>
            <Head title={`Kết Quả Bài Thi: ${classExam.title}`} />

            <div className="mx-auto max-w-4xl space-y-6 py-6 px-4">
                {/* Result Overview Banner */}
                <div className={`rounded-3xl p-8 text-white shadow-md relative overflow-hidden ${
                    isManualPending
                        ? 'bg-linear-to-r from-amber-700 to-orange-800'
                        : isPassed
                        ? 'bg-linear-to-r from-emerald-700 to-teal-800'
                        : 'bg-linear-to-r from-rose-700 to-red-800'
                }`}>
                    <div className="relative z-10 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-2xs font-extrabold uppercase tracking-wider backdrop-blur-xs">
                                <FileCheck className="h-3.5 w-3.5" />
                                <span>{classExam.title}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                isManualPending
                                    ? 'bg-amber-400/30 text-amber-100 border border-amber-300/40'
                                    : isPassed
                                    ? 'bg-emerald-400/30 text-emerald-100 border border-emerald-300/40'
                                    : 'bg-red-400/30 text-red-100 border border-red-300/40'
                            }`}>
                                {isManualPending ? '⏳ ĐANG CHỜ GIÁO VIÊN CHẤM' : isPassed ? '✓ ĐẠT YÊU CẦU' : '✗ CHƯA ĐẠT'}
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-white/15 pb-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                                    {isManualPending ? 'Điểm Trắc Nghiệm Tạm Tính' : 'Điểm Số Chính Thức'}
                                </p>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-5xl font-black">{studentScore}</span>
                                    <span className="text-xl font-bold opacity-75">/ {maxScore} điểm</span>
                                </div>
                                {isManualPending && (
                                    <p className="text-2xs text-amber-200 mt-1 font-semibold">
                                        * Điểm tổng kết chính thức sẽ được công bố sau khi giáo viên chấm xong phần Viết & Nói.
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-medium">
                                <div>
                                    <p className="opacity-80">Đúng / Tổng câu</p>
                                    <p className="mt-0.5 text-base sm:text-lg font-extrabold">
                                        {submission.total_correct} / {submission.total_questions} câu ({accuracyPercent}%)
                                    </p>
                                </div>
                                <div>
                                    <p className="opacity-80">Thời gian làm bài</p>
                                    <p className="mt-0.5 text-base sm:text-lg font-extrabold">
                                        {formatDuration(submission.duration_seconds_used)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-2xs opacity-80">
                            <span>
                                Thí sinh: <strong>{submission.student?.full_name}</strong> ({submission.student?.student_code || submission.student?.username})
                            </span>
                            <span>
                                Trạng thái: {submission.status === SUBMISSION_STATUS_TIMEOUT_SUBMITTED ? '⏱️ Tự động nộp khi hết giờ' : '✅ Đã nộp bài thành công'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Manual Grading Pending Notice Banner */}
                {isManualPending && (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                            <p className="font-bold text-amber-950">
                                Bài thi có câu hỏi Tự luận (Viết) hoặc Ghi âm (Nói) đang được giáo viên chấm điểm
                            </p>
                            <p className="text-amber-800 leading-relaxed">
                                Điểm số trắc nghiệm đã được hệ thống ghi nhận. Giáo viên phụ trách sẽ chấm và nhận xét chi tiết cho bài làm tự luận của bạn trong thời gian sớm nhất.
                            </p>
                        </div>
                    </div>
                )}

                {/* Overall Teacher Feedback Card (if graded) */}
                {submission.teacher_feedback && (
                    <Card className="border-emerald-200 bg-emerald-50/40 p-5 shadow-xs space-y-2">
                        <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                            <FileCheck className="h-4 w-4 text-emerald-700" />
                            <span>Nhận Xét Của Giáo Viên:</span>
                        </div>
                        <p className="text-xs text-emerald-950 whitespace-pre-wrap leading-relaxed bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs font-medium">
                            {submission.teacher_feedback}
                        </p>
                    </Card>
                )}

                {/* Filter & Navigation Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveFilter('all')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                                activeFilter === 'all'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-slate-50'
                            }`}
                        >
                            Tất cả ({submission.total_questions})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveFilter('correct')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                                activeFilter === 'correct'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                            }`}
                        >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Đúng ({submission.total_correct})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveFilter('incorrect')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                                activeFilter === 'incorrect'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                            }`}
                        >
                            <XCircle className="h-3.5 w-3.5" />
                            Sai / Chưa chấm ({submission.total_questions - submission.total_correct})
                        </button>
                    </div>

                    <Link href="/dashboard">
                        <Button variant="secondary" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                            Về Trang Chủ
                        </Button>
                    </Link>
                </div>

                {/* Section Navigation Tabs */}
                {sectionStats.length > 1 && (
                    <div className="rounded-2xl bg-white p-3 border border-gray-200 shadow-2xs space-y-2">
                        <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 block px-1">
                            Chọn phần thi cần xem chi tiết:
                        </span>
                        <div className="flex overflow-x-auto pb-1 gap-2">
                            {sectionStats.map((sec, sIdx) => {
                                const isActive = sIdx === activeSectionIndex;
                                return (
                                    <button
                                        key={sec.id || sIdx}
                                        type="button"
                                        onClick={() => setActiveSectionIndex(sIdx)}
                                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                                            isActive
                                                ? 'bg-slate-900 text-white shadow-xs scale-[1.02]'
                                                : 'bg-slate-50 text-gray-700 border border-gray-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span
                                            className={`flex h-5 w-5 items-center justify-center rounded-lg font-mono text-2xs font-bold ${
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-gray-200 text-gray-800'
                                            }`}
                                        >
                                            {sIdx + 1}
                                        </span>
                                        <span>{sec.title}</span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                                                isActive
                                                    ? 'bg-emerald-500/30 text-emerald-300'
                                                    : 'bg-emerald-100 text-emerald-800'
                                            }`}
                                        >
                                            ✓ {sec.correctCount}/{sec.totalQuestions}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Active Section Header Card */}
                {activeSection && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 font-mono text-xs font-bold text-white shadow-2xs">
                                    {activeSection.index + 1}
                                </span>
                                <div>
                                    <h2 className="text-base font-extrabold text-gray-900">
                                        {activeSection.title}
                                    </h2>
                                    <span className="text-xs font-semibold text-gray-500">
                                        {activeSection.correctCount}/{activeSection.totalQuestions} câu đúng ({activeSection.earnedScore}/{activeSection.maxScore} điểm)
                                    </span>
                                </div>
                            </div>
                        </div>

                        {activeSection.description && (
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                                    <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                                    <span>Mô Tả / Đoạn Văn Bản Hướng Dẫn Chung Cho Phần Này</span>
                                </div>
                                <div className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                                    {activeSection.description}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Question Review List for Active Section */}
                <div className="space-y-4">
                    {(activeSection?.questions || []).map((q, qIdx) => {
                        const grade = gradingDetails[q.id!] || {};
                        const isCorrect = grade.is_correct === true;
                        const isManual = q.question_type === QUESTION_TYPE_ESSAY || q.question_type === QUESTION_TYPE_AUDIO_RECORD;
                        const userAns = grade.user_answer;
                        const correctAns = grade.correct_answer;

                        if (activeFilter === 'correct' && !isCorrect) return null;
                        if (activeFilter === 'incorrect' && isCorrect) return null;

                        return (
                            <Card
                                key={q.id || qIdx}
                                className={`border p-5 shadow-2xs space-y-4 transition-all ${
                                    isManual && !submission.is_graded
                                        ? 'border-amber-200 bg-white'
                                        : isCorrect
                                        ? 'border-emerald-200 bg-white'
                                        : 'border-rose-200 bg-white'
                                }`}
                            >
                                {/* Question Header */}
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`flex h-6 w-6 items-center justify-center rounded-lg text-white font-mono text-xs font-bold ${
                                                isManual && !submission.is_graded
                                                    ? 'bg-amber-600'
                                                    : isCorrect
                                                    ? 'bg-emerald-600'
                                                    : 'bg-rose-600'
                                            }`}
                                        >
                                            {isManual && !submission.is_graded ? '✍️' : isCorrect ? '✓' : '✗'}
                                        </span>
                                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                                            {q.title || q.code || `Câu ${qIdx + 1}`}
                                        </span>
                                        <span className="text-2xs font-bold text-gray-600">
                                            (Điểm: {grade.score_earned || 0} / {q.score}đ)
                                        </span>
                                    </div>
                                    <span
                                        className={`text-2xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                            isManual && !submission.is_graded
                                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                : isCorrect
                                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                                        }`}
                                    >
                                        {isManual && !submission.is_graded
                                            ? 'Chờ giáo viên chấm'
                                            : isCorrect
                                            ? 'Chính xác'
                                            : 'Chưa chính xác'}
                                    </span>
                                </div>

                                {/* Question Content */}
                                {q.question_type !== QUESTION_TYPE_FILL_IN_BLANK && q.question_type !== QUESTION_TYPE_DRAG_DROP_CLOZE && (
                                    <p className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-pre-wrap leading-relaxed">
                                        {q.content}
                                    </p>
                                )}

                                {/* Audio / Image */}
                                {q.audio_url && (
                                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-2.5 flex items-center gap-3">
                                        <Volume2 className="h-4 w-4 text-blue-600 shrink-0" />
                                        <audio src={q.audio_url} controls className="w-full h-7" />
                                    </div>
                                )}

                                {/* Visual Interactive Review UI with Color Highlights */}
                                <QuestionReviewDetail
                                    question={{
                                        ...q,
                                        correct_answer: correctAns,
                                        user_answer: userAns,
                                        is_correct: isCorrect,
                                        teacher_comment: grade.teacher_comment,
                                    }}
                                />
                            </Card>
                        );
                    })}
                </div>

                {/* Section Pagination Footer */}
                {sectionStats.length > 1 && (
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={activeSectionIndex === 0}
                            onClick={() => {
                                setActiveSectionIndex((prev) => Math.max(0, prev - 1));
                                window.scrollTo({ top: 400, behavior: 'smooth' });
                            }}
                        >
                            ← Phần Trước
                        </Button>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-700">
                                Phần {activeSectionIndex + 1} / {sectionStats.length}
                            </span>
                        </div>

                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={activeSectionIndex >= sectionStats.length - 1}
                            onClick={() => {
                                setActiveSectionIndex((prev) => Math.min(sectionStats.length - 1, prev + 1));
                                window.scrollTo({ top: 400, behavior: 'smooth' });
                            }}
                        >
                            Phần Tiếp Theo →
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
