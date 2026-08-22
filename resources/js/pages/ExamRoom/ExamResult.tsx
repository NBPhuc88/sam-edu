import { Head, Link } from '@inertiajs/react';
import {
    Award,
    CheckCircle2,
    XCircle,
    Clock,
    FileCheck,
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
import { ClassExam, ClassExamSubmission, ExamQuestionData, ExamSectionData } from './types';

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
        <AppLayout title={`Kết Quả Bài Thi: ${classExam.title} - Hệ Thống Giáo Dục Sam`}>
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

                            <div className="flex items-center gap-6 text-xs font-medium">
                                <div>
                                    <p className="opacity-80">Đúng / Tổng câu</p>
                                    <p className="mt-0.5 text-lg font-extrabold">
                                        {submission.total_correct} / {submission.total_questions} câu ({accuracyPercent}%)
                                    </p>
                                </div>
                                <div>
                                    <p className="opacity-80">Thời gian làm bài</p>
                                    <p className="mt-0.5 text-lg font-extrabold">
                                        {formatDuration(submission.duration_seconds_used)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-2xs opacity-80">
                            <span>
                                Thí sinh: <strong>{submission.student?.full_name}</strong> ({submission.student?.student_code || submission.student?.username})
                            </span>
                            <span>
                                Trạng thái: {submission.status === 'timeout_submitted' ? '⏱️ Tự động nộp khi hết giờ' : '✅ Đã nộp bài thành công'}
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
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
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

                {/* Question Review List */}
                <div className="space-y-6">
                    {sections.map((section, sIdx) => {
                        return (
                            <div key={section.id || sIdx} className="space-y-4">
                                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                                            {sIdx + 1}
                                        </span>
                                        {section.title}
                                    </h3>
                                </div>

                                {(section.questions || []).map((q, qIdx) => {
                                    const grade = gradingDetails[q.id!] || {};
                                    const isCorrect = grade.is_correct === true;
                                    const isManual = q.question_type === 'essay' || q.question_type === 'audio_record';
                                    const userAns = grade.user_answer;
                                    const correctAns = grade.correct_answer;

                                    if (activeFilter === 'correct' && !isCorrect) return null;
                                    if (activeFilter === 'incorrect' && isCorrect) return null;

                                    return (
                                        <Card
                                            key={q.id || qIdx}
                                            className={`border p-5 shadow-xs space-y-4 transition-all ${
                                                isManual && !submission.is_graded
                                                    ? 'border-amber-200 bg-amber-50/20'
                                                    : isCorrect
                                                    ? 'border-emerald-200 bg-emerald-50/20'
                                                    : 'border-rose-200 bg-rose-50/20'
                                            }`}
                                        >
                                            {/* Question Header */}
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-white font-mono text-xs font-bold ${
                                                        isManual && !submission.is_graded
                                                            ? 'bg-amber-600'
                                                            : isCorrect
                                                            ? 'bg-emerald-600'
                                                            : 'bg-rose-600'
                                                    }`}>
                                                        {isManual && !submission.is_graded ? '✍️' : isCorrect ? '✓' : '✗'}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-800">
                                                        Câu hỏi (Điểm: {grade.score_earned || 0} / {q.score}đ)
                                                    </span>
                                                </div>
                                                <span className={`text-2xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                    isManual && !submission.is_graded
                                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                        : isCorrect
                                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                                                }`}>
                                                    {isManual && !submission.is_graded
                                                        ? 'Chờ giáo viên chấm'
                                                        : isCorrect
                                                        ? 'Chính xác'
                                                        : 'Chưa chính xác'}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <p className="text-xs font-semibold text-gray-900 whitespace-pre-wrap leading-relaxed">
                                                {q.content}
                                            </p>

                                            {/* Audio / Image */}
                                            {q.audio_url && (
                                                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-2.5 flex items-center gap-3">
                                                    <Volume2 className="h-4 w-4 text-blue-600 shrink-0" />
                                                    <audio src={q.audio_url} controls className="w-full h-7" />
                                                </div>
                                            )}

                                            {q.image_url && (
                                                <div className="rounded-xl border border-gray-200 p-2 bg-slate-50 flex justify-center max-h-48 overflow-hidden">
                                                    <img src={q.image_url} alt="Minh họa" className="max-h-44 object-contain rounded" />
                                                </div>
                                            )}

                                            {/* Answers Compare Box */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                                {/* Student Answer */}
                                                <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-1.5 text-xs">
                                                    <span className="font-bold text-2xs uppercase tracking-wider text-gray-500">
                                                        Câu trả lời của bạn:
                                                    </span>
                                                    <div className="font-semibold text-gray-900">
                                                        {q.question_type === 'audio_record' ? (
                                                            userAns ? (
                                                                <div className="space-y-1.5">
                                                                    <span className="text-2xs text-emerald-700 font-bold">🎧 Bản ghi âm bài làm:</span>
                                                                    <audio
                                                                        src={`/class-exams/audio-stream?path=${encodeURIComponent(userAns)}`}
                                                                        controls
                                                                        className="w-full h-8"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400 italic">Chưa ghi âm</span>
                                                            )
                                                        ) : typeof userAns === 'object' ? (
                                                            <pre className="text-2xs font-mono bg-slate-50 p-2 rounded border overflow-x-auto">
                                                                {JSON.stringify(userAns, null, 2)}
                                                            </pre>
                                                        ) : (
                                                            <span className={userAns ? 'text-gray-900' : 'text-gray-400 italic'}>
                                                                {userAns || '(Chưa trả lời)'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Correct Answer */}
                                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-1.5 text-xs">
                                                    <span className="font-bold text-2xs uppercase tracking-wider text-emerald-800">
                                                        Đáp án đúng hệ thống:
                                                    </span>
                                                    <div className="font-bold text-emerald-900">
                                                        {typeof correctAns === 'object' ? (
                                                            <pre className="text-2xs font-mono bg-white p-2 rounded border border-emerald-200 overflow-x-auto text-emerald-900">
                                                                {JSON.stringify(correctAns, null, 2)}
                                                            </pre>
                                                        ) : (
                                                            <span>{correctAns || 'Cần giáo viên chấm'}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Teacher Comment on Question */}
                                            {grade.teacher_comment && (
                                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-950 space-y-1">
                                                    <span className="text-2xs font-bold uppercase tracking-wider text-emerald-800 block">
                                                        💬 Nhận xét của giáo viên:
                                                    </span>
                                                    <p className="text-xs font-semibold">{grade.teacher_comment}</p>
                                                </div>
                                            )}

                                            {/* Explanation */}
                                            {q.explanation && (
                                                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-900 space-y-1">
                                                    <div className="flex items-center gap-1.5 font-bold text-blue-800">
                                                        <Info className="h-3.5 w-3.5" />
                                                        <span>Giải thích chi tiết:</span>
                                                    </div>
                                                    <p className="text-xs text-blue-950 whitespace-pre-wrap leading-relaxed">
                                                        {q.explanation}
                                                    </p>
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
