import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    FileText,
    PenTool,
    RotateCcw,
    Save,
    Sparkles,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AppLayout from '@/layouts/AppLayout';
import QuestionReviewDetail, { QuestionReviewItem } from '@/pages/ExamRoom/components/QuestionReviewDetail';
import ExamSectionPagination from '@/pages/ExamRoom/components/shared/ExamSectionPagination';
import ExamSectionTabs, { ExamSectionTabItem } from '@/pages/ExamRoom/components/shared/ExamSectionTabs';

interface ExamQuestion {
    id: number;
    code?: string;
    title?: string | null;
    question_type: string;
    skill?: string;
    content: string;
    score: number;
    image_url?: string | null;
    audio_url?: string | null;
    options?: any;
    correct_answer?: any;
    explanation?: string | null;
    metadata?: any;
    order_index?: number;
}

interface ExamSection {
    id: number;
    title: string;
    description?: string | null;
    skill?: string;
    order_index?: number;
    questions: ExamQuestion[];
}

interface ClassExamData {
    id: number;
    code?: string;
    title: string;
    max_score: number;
    pass_score?: number;
    duration_minutes: number;
    schoolClass?: {
        id: number;
        name: string;
        code?: string;
        center?: { id: number; name: string };
    };
    exam?: {
        id: number;
        name: string;
        code?: string;
        sections: ExamSection[];
    };
}

interface QuestionGradeDetail {
    question_id: number;
    question_type: string;
    user_answer: any;
    correct_answer: any;
    is_correct: boolean;
    score_earned: number;
    max_score: number;
    explanation?: string;
    teacher_comment?: string;
}

interface SubmissionData {
    id: number;
    class_exam_id: number;
    student_id: number;
    score: number | null;
    total_correct: number;
    total_questions: number;
    status: string;
    is_graded: boolean;
    requires_manual_grading: boolean;
    graded_at?: string;
    duration_seconds_used: number;
    submitted_at?: string;
    teacher_feedback?: string;
    answers?: Record<string | number, any>;
    grading_details?: Record<string | number, QuestionGradeDetail>;
    student?: {
        id: number;
        full_name: string;
        student_code?: string;
        username: string;
        email?: string;
        phone?: string;
        avatar?: string;
    };
    gradedByTeacher?: {
        id: number;
        full_name: string;
    };
    gradedByAdmin?: {
        id: number;
        full_name: string;
    };
}

interface Props {
    submission: SubmissionData;
    classExam: ClassExamData;
    isTeacher: boolean;
    isAdmin: boolean;
}

export default function GradingShow({
    submission,
    classExam,
    isTeacher,
    isAdmin,
}: Props) {
    const exam = classExam.exam;
    const sections: ExamSection[] = exam?.sections || [];
    const gradingDetails = submission.grading_details || {};

    const [activeSectionIndex, setActiveSectionIndex] = useState(0);

    // Local state for question grades: { [qId]: { score_earned: number, comment: string } }
    const [questionGrades, setQuestionGrades] = useState<Record<number, { score_earned: number; comment: string }>>(() => {
        const initial: Record<number, { score_earned: number; comment: string }> = {};
        sections.forEach((sec) => {
            (sec.questions || []).forEach((q) => {
                const detail = gradingDetails[q.id];
                initial[q.id] = {
                    score_earned: detail ? Number(detail.score_earned || 0) : 0,
                    comment: detail?.teacher_comment || '',
                };
            });
        });
        return initial;
    });

    const [teacherFeedback, setTeacherFeedback] = useState<string>(submission.teacher_feedback || '');
    const [isSaving, setIsSaving] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    // Calculate all questions with global numbers
    const allQuestions: { question: ExamQuestion; num: number; sectionIndex: number }[] = [];
    let globalCounter = 1;
    sections.forEach((sec, sIdx) => {
        (sec.questions || []).forEach((q) => {
            allQuestions.push({ question: q, num: globalCounter++, sectionIndex: sIdx });
        });
    });

    const activeSection = sections[activeSectionIndex] || sections[0];

    // Calculate live total score
    const calculatedTotalScore = Object.values(questionGrades).reduce(
        (sum, item) => sum + (Number(item.score_earned) || 0),
        0
    );

    const maxExamScore = Number(classExam.max_score) || 10;
    const passScore = classExam.pass_score ? Number(classExam.pass_score) : null;
    const isPassed = passScore !== null ? calculatedTotalScore >= passScore : calculatedTotalScore >= maxExamScore / 2;

    const handleScoreChange = (qId: number, maxScore: number, val: string) => {
        let numericVal = parseFloat(val);
        if (isNaN(numericVal)) numericVal = 0;
        if (numericVal < 0) numericVal = 0;
        if (numericVal > maxScore) numericVal = maxScore;

        setQuestionGrades((prev) => ({
            ...prev,
            [qId]: {
                ...prev[qId],
                score_earned: numericVal,
            },
        }));
    };

    const handleCommentChange = (qId: number, comment: string) => {
        setQuestionGrades((prev) => ({
            ...prev,
            [qId]: {
                ...prev[qId],
                comment,
            },
        }));
    };

    const handleSaveGrades = () => {
        setIsSaving(true);
        router.post(
            `/grading/submissions/${submission.id}`,
            {
                question_grades: questionGrades,
                teacher_feedback: teacherFeedback,
            },
            {
                onFinish: () => {
                    setIsSaving(false);
                    setConfirmModalOpen(false);
                },
            }
        );
    };

    const formatDuration = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m} phút ${s < 10 ? '0' : ''}${s} giây`;
    };

    // Prepare section tab items with live earned score
    const sectionTabItems: ExamSectionTabItem[] = sections.map((sec, sIdx) => {
        const secQuestions = sec.questions || [];
        const correctCount = secQuestions.filter(
            (q) => (Number(questionGrades[q.id]?.score_earned) || 0) >= q.score && q.score > 0
        ).length;

        return {
            id: sec.id || sIdx,
            title: sec.title,
            skill: sec.skill,
            totalQuestions: secQuestions.length,
            correctCount,
        };
    });

    const activeSecQuestions = activeSection?.questions || [];
    const activeSecEarned = activeSecQuestions.reduce(
        (sum, q) => sum + (Number(questionGrades[q.id]?.score_earned) || 0),
        0
    );
    const activeSecMax = activeSecQuestions.reduce((sum, q) => sum + (Number(q.score) || 0), 0);

    return (
        <AppLayout title={`Chấm Bài: ${submission.student?.full_name} - ${classExam.title}`}>
            <Head title={`Chấm Bài: ${submission.student?.full_name}`} />

            <div className="mx-auto max-w-5xl space-y-6 pb-16">
                {/* Sticky Top Header with Live Total Score */}
                <div className="sticky top-16 z-20 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md p-3 sm:p-3.5 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Link href={`/grading?class_id=${classExam.schoolClass?.id || ''}&class_exam_id=${classExam.id}`}>
                                <Button variant="secondary" size="sm" className="h-8 px-2.5 text-xs font-semibold" icon={<ArrowLeft className="h-3.5 w-3.5" />}>
                                    Quay Lại
                                </Button>
                            </Link>
                            <div className="space-y-0.5">
                                <h1 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                                    <PenTool className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                    <span className="truncate max-w-[160px] sm:max-w-xs md:max-w-md">{classExam.title}</span>
                                </h1>
                                <p className="text-2xs text-gray-500 font-medium">
                                    Lớp: <span className="text-emerald-700 font-bold">{classExam.schoolClass?.name || '---'}</span> | Thí sinh: <span className="font-bold text-gray-900">{submission.student?.full_name}</span>
                                </p>
                            </div>
                        </div>

                        {/* Sticky Live Total Score Display */}
                        <div className="flex items-center gap-2.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-white shadow-xs border border-slate-800">
                            <div className="text-right">
                                <span className="block text-[9px] font-semibold uppercase tracking-wider text-gray-400">Tổng điểm:</span>
                                <div className="flex items-baseline gap-1 leading-none">
                                    <span className="font-mono text-base font-black text-emerald-400">
                                        {calculatedTotalScore.toFixed(2)}
                                    </span>
                                    <span className="font-mono text-2xs text-gray-400 font-semibold">/ {maxExamScore}đ</span>
                                </div>
                            </div>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                isPassed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                                {isPassed ? 'Đạt' : 'Chưa đạt'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Candidate & Score Summary Card */}
                <Card className="border-gray-200 bg-white p-5 sm:p-6 shadow-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Student Details */}
                        <div className="flex items-start gap-4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 text-xl font-black shadow-xs">
                                {submission.student?.avatar ? (
                                    <img
                                        src={submission.student.avatar}
                                        alt="Avatar"
                                        className="h-14 w-14 rounded-2xl object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    submission.student?.full_name?.charAt(0) || 'U'
                                )}
                            </div>
                            <div className="space-y-1">
                                <p className="font-black text-gray-900 text-base">{submission.student?.full_name}</p>
                                <p className="text-2xs font-mono text-gray-500">Mã HS: <strong>{submission.student?.student_code || submission.student?.username}</strong></p>
                                {submission.student?.email && <p className="text-2xs text-gray-500">{submission.student.email}</p>}
                                <div className="pt-1">
                                    {submission.is_graded ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-2xs font-bold text-emerald-800">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                            Đã hoàn tất chấm điểm
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-2xs font-bold text-amber-800">
                                            <Clock className="h-3 w-3 text-amber-600" />
                                            Đang chờ giáo viên chấm
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submission Timing */}
                        <div className="space-y-2 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4 text-xs">
                            <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Thông Tin Nộp Bài</p>
                            <div className="space-y-1 text-gray-700">
                                <p className="flex justify-between">
                                    <span className="text-gray-500">Thời gian nộp:</span>
                                    <span className="font-semibold">{submission.submitted_at || '(Chưa rõ)'}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-gray-500">Thời lượng làm bài:</span>
                                    <span className="font-semibold">{formatDuration(submission.duration_seconds_used)}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-gray-500">Hình thức nộp:</span>
                                    <span className="font-semibold">
                                        {submission.status === 'timeout_submitted' ? 'Hết giờ tự thu bài' : 'Chủ động nộp bài'}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Total Score Live Calculation */}
                        <div className="space-y-2 flex flex-col justify-center">
                            <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Tổng Điểm Tính Toán</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-emerald-700">{calculatedTotalScore.toFixed(2)}</span>
                                <span className="text-sm font-bold text-gray-400">/ {maxExamScore} điểm</span>
                                <span className={`ml-2 text-2xs font-extrabold uppercase px-2.5 py-0.5 rounded-full ${isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}>
                                    {isPassed ? 'Đạt' : 'Chưa đạt'}
                                </span>
                            </div>
                            <p className="text-2xs text-gray-400">
                                Điểm số tự động cập nhật trực tiếp theo các ô điểm bạn chấm bên dưới.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Section Navigation Tabs */}
                <ExamSectionTabs
                    sections={sectionTabItems}
                    activeSectionIndex={activeSectionIndex}
                    onSelectSection={(idx) => setActiveSectionIndex(idx)}
                    isReviewMode={true}
                />

                {/* Active Section Header Card */}
                {activeSection && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 font-mono text-xs font-bold text-white shadow-2xs">
                                    {activeSectionIndex + 1}
                                </span>
                                <div>
                                    <h2 className="text-base font-extrabold text-gray-900">
                                        {activeSection.title}
                                    </h2>
                                    <span className="text-xs font-semibold text-gray-500">
                                        Kỹ năng: {activeSection.skill === 'listening' ? 'Nghe hiểu' : activeSection.skill === 'reading' ? 'Đọc hiểu' : activeSection.skill === 'writing' ? 'Viết' : activeSection.skill === 'speaking' ? 'Nói' : 'Tổng hợp'} • Điểm phần này: <strong className="text-emerald-700">{activeSecEarned.toFixed(2)}</strong> / {activeSecMax} điểm
                                    </span>
                                </div>
                            </div>
                            <span className={`text-2xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${activeSection.skill === 'listening' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                activeSection.skill === 'writing' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    activeSection.skill === 'speaking' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                {activeSection.skill === 'listening' ? '🎧 Listening' : activeSection.skill === 'writing' ? '✍️ Writing' : activeSection.skill === 'speaking' ? '🗣️ Speaking' : '📖 Reading'}
                            </span>
                        </div>

                        {/* Passage / Section Description Card */}
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

                {/* Question Grading List for Active Section */}
                <div className="space-y-6">
                    {activeSecQuestions.map((q, qLocalIdx) => {
                        const globalNum = allQuestions.find((item) => item.question.id === q.id)?.num || (qLocalIdx + 1);
                        const qDetail = gradingDetails[q.id] || ({} as QuestionGradeDetail);
                        const currentGrade = questionGrades[q.id] || { score_earned: 0, comment: '' };
                        const userAns = submission.answers ? submission.answers[q.id] : qDetail.user_answer;
                        const isManual = q.question_type === 'essay' || q.question_type === 'audio_record';
                        const isSkipped = userAns === null || userAns === undefined || userAns === '' || (Array.isArray(userAns) && userAns.length === 0) || (typeof userAns === 'object' && Object.keys(userAns).length === 0);
                        const isCorrect = qDetail.is_correct === true || (currentGrade.score_earned >= q.score && q.score > 0);

                        const reviewItem: QuestionReviewItem = {
                            id: q.id,
                            code: q.code,
                            title: q.title,
                            question_type: q.question_type,
                            skill: q.skill || activeSection?.skill,
                            content: q.content,
                            image_url: q.image_url,
                            audio_url: q.audio_url,
                            options: q.options,
                            correct_answer: q.correct_answer,
                            user_answer: userAns,
                            is_correct: isCorrect,
                            explanation: q.explanation || qDetail.explanation,
                            teacher_comment: null,
                        };

                        return (
                            <Card
                                key={q.id || qLocalIdx}
                                className={`p-5 sm:p-6 shadow-xs space-y-5 border transition-all ${isManual
                                    ? 'border-amber-200 bg-white'
                                    : currentGrade.score_earned >= q.score
                                        ? 'border-emerald-200 bg-white'
                                        : isSkipped && currentGrade.score_earned === 0
                                            ? 'border-amber-200 bg-white'
                                            : currentGrade.score_earned > 0
                                                ? 'border-amber-200 bg-white'
                                                : 'border-slate-200 bg-white'
                                    }`}
                            >
                                {/* Question Top Header */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className={`flex h-7 w-7 items-center justify-center rounded-xl font-mono text-xs font-extrabold text-white shadow-2xs ${isManual
                                                ? 'bg-amber-600'
                                                : currentGrade.score_earned >= q.score
                                                    ? 'bg-emerald-600'
                                                    : isSkipped && currentGrade.score_earned === 0
                                                        ? 'bg-amber-500'
                                                        : currentGrade.score_earned > 0
                                                            ? 'bg-amber-500'
                                                            : 'bg-rose-600'
                                                }`}
                                        >
                                            {globalNum}
                                        </span>
                                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                                            {q.title || q.code || `Câu ${globalNum}`}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-2xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                            Tối đa: {q.score} điểm
                                        </span>
                                        {isManual ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-2xs font-bold text-amber-800 border border-amber-300">
                                                <PenTool className="h-3 w-3" />
                                                Tự luận: Cần chấm
                                            </span>
                                        ) : qDetail.is_correct ? (
                                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-2xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                Đúng
                                            </span>
                                        ) : isSkipped ? (
                                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-2xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                                <AlertCircle className="h-3 w-3 text-amber-600" />
                                                Chưa làm
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                                <XCircle className="h-3 w-3 text-rose-600" />
                                                Sai
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Rich Question & Student Answer Visual Review */}
                                <div className="pt-1">
                                    <QuestionReviewDetail question={reviewItem} />
                                </div>

                                {/* Teacher Grading Control Panel */}
                                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3 mt-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100/60 pb-2">
                                        <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                            <PenTool className="h-3.5 w-3.5 text-indigo-600" />
                                            Đánh Giá & Chấm Điểm Giáo Viên
                                        </span>
                                        {/* Quick Score Buttons */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-2xs font-bold text-gray-500 mr-1">Chấm nhanh:</span>
                                            {!isManual && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleScoreChange(q.id, q.score, (qDetail.score_earned !== undefined ? Number(qDetail.score_earned) : (qDetail.is_correct ? q.score : 0)).toString())}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-bold rounded-lg bg-indigo-100 border border-indigo-300 text-indigo-800 hover:bg-indigo-200 shadow-2xs transition-all"
                                                    title="Khôi phục về điểm tự động chấm"
                                                >
                                                    <RotateCcw className="h-2.5 w-2.5" />
                                                    Mặc định ({qDetail.score_earned !== undefined ? Number(qDetail.score_earned) : (qDetail.is_correct ? q.score : 0)}đ)
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleScoreChange(q.id, q.score, '0')}
                                                className="px-2.5 py-1 text-2xs font-bold rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 shadow-2xs transition-all"
                                            >
                                                0đ (Sai)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleScoreChange(q.id, q.score, (q.score / 2).toString())}
                                                className="px-2.5 py-1 text-2xs font-bold rounded-lg bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 shadow-2xs transition-all"
                                            >
                                                50% ({(q.score / 2).toFixed(1)}đ)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleScoreChange(q.id, q.score, q.score.toString())}
                                                className="px-2.5 py-1 text-2xs font-bold rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-2xs transition-all"
                                            >
                                                100% ({q.score}đ)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                                        <div className="md:col-span-4 space-y-1">
                                            <label className="text-2xs font-bold uppercase tracking-wider text-gray-700 flex items-center justify-between">
                                                <span>Điểm chấm câu này:</span>
                                                <span className="text-emerald-700 font-bold">Tối đa: {q.score}đ</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max={q.score}
                                                    value={currentGrade.score_earned}
                                                    onChange={(e) => handleScoreChange(q.id, q.score, e.target.value)}
                                                    className="w-full rounded-xl border border-emerald-400 bg-white px-3 py-2 text-sm font-black text-emerald-800 focus:border-emerald-600 focus:outline-hidden shadow-2xs"
                                                />
                                                <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">điểm</span>
                                            </div>
                                        </div>

                                        <div className="md:col-span-8 space-y-1">
                                            <label className="text-2xs font-bold uppercase tracking-wider text-gray-700">
                                                Ghi chú / Lời phê cho câu này (Tùy chọn):
                                            </label>
                                            <input
                                                type="text"
                                                value={currentGrade.comment}
                                                onChange={(e) => handleCommentChange(q.id, e.target.value)}
                                                placeholder="VD: Cần chú ý cách dùng từ, phát âm âm cuối..."
                                                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden shadow-2xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* Section Bottom Pagination */}
                <ExamSectionPagination
                    currentIndex={activeSectionIndex}
                    totalCount={sections.length}
                    onPrev={() => {
                        setActiveSectionIndex((prev) => Math.max(0, prev - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onNext={() => {
                        setActiveSectionIndex((prev) => Math.min(sections.length - 1, prev + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                />

                {/* Overall Teacher Feedback Card */}
                <Card className="border-emerald-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-sm font-bold text-gray-900">Nhận Xét Tổng Thể Của Giáo Viên</h3>
                    </div>
                    <textarea
                        rows={4}
                        value={teacherFeedback}
                        onChange={(e) => setTeacherFeedback(e.target.value)}
                        placeholder="Nhập nhận xét tổng quan về quá trình làm bài, đánh giá năng lực, điểm mạnh và các điểm học sinh cần khắc phục..."
                        className="w-full rounded-xl border border-gray-300 bg-white p-3.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden leading-relaxed shadow-2xs"
                    />
                </Card>

                {/* Bottom Action Buttons (Static / In-flow at bottom of page) */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-gray-200">
                    <Link href={`/grading?class_id=${classExam.schoolClass?.id || ''}&class_exam_id=${classExam.id}`}>
                        <Button variant="secondary" size="md" className="font-bold px-5">
                            Hủy & Quay Lại
                        </Button>
                    </Link>
                    <Button
                        type="button"
                        variant="success"
                        size="md"
                        className="font-bold px-8 shadow-md"
                        icon={<Save className="h-4 w-4" />}
                        onClick={() => setConfirmModalOpen(true)}
                        isLoading={isSaving}
                    >
                        Lưu Điểm & Hoàn Tất
                    </Button>
                </div>

                {/* Confirm Dialog */}
                <ConfirmDialog
                    isOpen={confirmModalOpen}
                    title="Xác Nhận Lưu Điểm Chấm Bài"
                    message={`Bạn đang lưu kết quả chấm bài cho học sinh ${submission.student?.full_name} với tổng điểm là ${calculatedTotalScore.toFixed(2)} / ${maxExamScore} điểm. Điểm số và nhận xét sẽ được công bố cho học sinh.`}
                    confirmLabel="Xác Nhận & Lưu Kết Quả"
                    cancelLabel="Kiểm Tra Lại"
                    variant="success"
                    isLoading={isSaving}
                    onConfirm={handleSaveGrades}
                    onCancel={() => setConfirmModalOpen(false)}
                />
            </div>
        </AppLayout>
    );
}
