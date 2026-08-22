import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    FileCheck,
    FileText,
    Mic,
    PenTool,
    Save,
    User,
    Volume2,
} from 'lucide-react';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AppLayout from '@/layouts/AppLayout';

interface ExamQuestion {
    id: number;
    question_type: string;
    content: string;
    score: number;
    image_url?: string;
    audio_url?: string;
    options?: any;
    correct_answer?: any;
    explanation?: string;
    order_index?: number;
}

interface ExamSection {
    id: number;
    title: string;
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

    return (
        <AppLayout title={`Chấm Bài: ${submission.student?.full_name} - ${classExam.title}`}>
            <Head title={`Chấm Bài: ${submission.student?.full_name}`} />

            <div className="mx-auto max-w-5xl space-y-6 pb-12">
                {/* Header Back & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href={`/grading?class_id=${classExam.schoolClass?.id || ''}&class_exam_id=${classExam.id}`}>
                            <Button variant="secondary" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                                Quay Lại Danh Sách
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <PenTool className="h-5 w-5 text-emerald-600" />
                                Chấm Bài Thi: {classExam.title}
                            </h1>
                            <p className="text-2xs text-gray-500 font-medium">
                                Lớp: <span className="text-emerald-700 font-bold">{classExam.schoolClass?.name}</span> | Thí sinh: <span className="font-bold text-gray-900">{submission.student?.full_name}</span>
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="success"
                        size="md"
                        className="font-bold shadow-md"
                        icon={<Save className="h-4 w-4" />}
                        onClick={() => setConfirmModalOpen(true)}
                        isLoading={isSaving}
                    >
                        Lưu & Hoàn Tất Chấm Bài
                    </Button>
                </div>

                {/* Candidate & Score Summary Card */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Student Details */}
                        <div className="flex items-start gap-4 border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 text-xl font-black shadow-xs">
                                {submission.student?.avatar ? (
                                    <img src={submission.student.avatar} alt="Avatar" className="h-14 w-14 rounded-2xl object-cover" />
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
                                <span className={`ml-2 text-2xs font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                                    isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                    {isPassed ? 'Đạt' : 'Chưa đạt'}
                                </span>
                            </div>
                            <p className="text-2xs text-gray-400">
                                Điểm số tự động cập nhật trực tiếp theo các ô điểm bạn chỉnh sửa bên dưới.
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Question List for Grading */}
                <div className="space-y-6">
                    {sections.map((sec, sIdx) => (
                        <div key={sec.id || sIdx} className="space-y-4">
                            <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-2xs">
                                <h3 className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-2">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-white text-2xs font-bold">
                                        {sIdx + 1}
                                    </span>
                                    {sec.title}
                                </h3>
                            </div>

                            {(sec.questions || []).map((q, qIdx) => {
                                const detail = gradingDetails[q.id];
                                const currentGrade = questionGrades[q.id] || { score_earned: 0, comment: '' };
                                const userAns = submission.answers ? submission.answers[q.id] : null;
                                const isManual = q.question_type === 'essay' || q.question_type === 'audio_record';

                                return (
                                    <Card
                                        key={q.id || qIdx}
                                        className={`p-5 shadow-2xs space-y-4 border transition-all ${
                                            isManual
                                                ? 'border-amber-200 bg-amber-50/10'
                                                : currentGrade.score_earned > 0
                                                ? 'border-emerald-200 bg-emerald-50/10'
                                                : 'border-slate-200 bg-white'
                                        }`}
                                    >
                                        {/* Question Title & Type Tag */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-white font-mono text-xs font-bold">
                                                    {qIdx + 1}
                                                </span>
                                                <span className="text-xs font-bold text-gray-900">
                                                    {isManual
                                                        ? q.question_type === 'essay'
                                                            ? 'Câu hỏi Tự luận (Viết)'
                                                            : 'Câu hỏi Ghi âm (Nói)'
                                                        : 'Câu hỏi Trắc nghiệm khách quan'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-2xs font-bold text-gray-500">
                                                    Thang điểm tối đa: <strong className="text-gray-900">{q.score}đ</strong>
                                                </span>
                                                {isManual && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-2xs font-bold text-amber-800 border border-amber-300">
                                                        <PenTool className="h-3 w-3" />
                                                        Cần giáo viên chấm
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Question Content */}
                                        <p className="text-xs font-medium text-gray-900 whitespace-pre-wrap leading-relaxed">
                                            {q.content}
                                        </p>

                                        {/* Question Media if exists */}
                                        {q.audio_url && (
                                            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-2.5 flex items-center gap-3">
                                                <Volume2 className="h-4 w-4 text-blue-600 shrink-0" />
                                                <audio src={q.audio_url} controls className="w-full h-7" />
                                            </div>
                                        )}

                                        {q.image_url && (
                                            <div className="rounded-xl border border-gray-200 p-2 bg-slate-50 flex justify-center max-h-44 overflow-hidden">
                                                <img src={q.image_url} alt="Minh họa" className="max-h-40 object-contain rounded" />
                                            </div>
                                        )}

                                        {/* Student Answer Box */}
                                        <div className="rounded-2xl border border-gray-200 bg-slate-50/80 p-4 space-y-3">
                                            <p className="text-2xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                                                <User className="h-3.5 w-3.5 text-emerald-600" />
                                                Bài làm của thí sinh:
                                            </p>

                                            {/* Essay Answer */}
                                            {q.question_type === 'essay' && (
                                                <div className="space-y-2">
                                                    <div className="rounded-xl border border-gray-300 bg-white p-3.5 text-xs text-gray-900 whitespace-pre-wrap leading-relaxed min-h-[100px] shadow-2xs">
                                                        {userAns || <span className="text-gray-400 italic">(Thí sinh không nhập nội dung bài viết)</span>}
                                                    </div>
                                                    <div className="text-right text-2xs text-gray-500 font-semibold">
                                                        Số lượng từ: <strong>{(userAns || '').trim().split(/\s+/).filter(Boolean).length}</strong> từ
                                                    </div>
                                                </div>
                                            )}

                                            {/* Speaking Audio Answer */}
                                            {q.question_type === 'audio_record' && (
                                                <div className="rounded-xl border border-emerald-200 bg-white p-4 space-y-2">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                                                        <Mic className="h-4 w-4 text-emerald-600" />
                                                        <span>Bản ghi âm giọng nói của học sinh:</span>
                                                    </div>
                                                    {userAns ? (
                                                        <audio
                                                            src={`/class-exams/audio-stream?path=${encodeURIComponent(userAns)}`}
                                                            controls
                                                            className="w-full h-10 mt-1"
                                                        />
                                                    ) : (
                                                        <p className="text-xs text-gray-400 italic py-2">
                                                            (Học sinh chưa thực hiện ghi âm câu hỏi này)
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Objective Answers */}
                                            {!isManual && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                                                        <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                                                            Câu trả lời của HS:
                                                        </span>
                                                        <div className="font-semibold text-gray-900">
                                                            {typeof userAns === 'object' ? (
                                                                <pre className="text-2xs font-mono overflow-x-auto bg-slate-50 p-2 rounded">
                                                                    {JSON.stringify(userAns, null, 2)}
                                                                </pre>
                                                            ) : (
                                                                userAns || '(Chưa trả lời)'
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
                                                        <span className="text-2xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                                                            Đáp án đúng hệ thống:
                                                        </span>
                                                        <div className="font-bold text-emerald-900">
                                                            {typeof q.correct_answer === 'object' ? (
                                                                <pre className="text-2xs font-mono overflow-x-auto bg-white p-2 rounded border border-emerald-200 text-emerald-900">
                                                                    {JSON.stringify(q.correct_answer, null, 2)}
                                                                </pre>
                                                            ) : (
                                                                q.correct_answer || '(Tự luận)'
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Score Input & Feedback Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-gray-100">
                                            <div className="md:col-span-4 space-y-1">
                                                <label className="text-2xs font-bold uppercase tracking-wider text-gray-700 flex items-center justify-between">
                                                    <span>Điểm chấm câu này:</span>
                                                    <span className="text-gray-400 font-normal">Tối đa: {q.score}đ</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max={q.score}
                                                        value={currentGrade.score_earned}
                                                        onChange={(e) => handleScoreChange(q.id, q.score, e.target.value)}
                                                        className="w-full rounded-xl border border-emerald-400 bg-white px-3 py-2 text-sm font-black text-emerald-800 focus:border-emerald-600 focus:outline-hidden"
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">điểm</span>
                                                </div>
                                            </div>

                                            <div className="md:col-span-8 space-y-1">
                                                <label className="text-2xs font-bold uppercase tracking-wider text-gray-700">
                                                    Ghi chú / Nhận xét riêng cho câu này (Tùy chọn):
                                                </label>
                                                <input
                                                    type="text"
                                                    value={currentGrade.comment}
                                                    onChange={(e) => handleCommentChange(q.id, e.target.value)}
                                                    placeholder="VD: Cần chú ý ngữ pháp thì quá khứ, phát âm rõ âm cuối..."
                                                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Overall Teacher Feedback Card */}
                <Card className="border-emerald-200 bg-white p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-emerald-600" />
                        <h3 className="text-sm font-bold text-gray-900">Nhận Xét Tổng Thể Của Giáo Viên</h3>
                    </div>
                    <textarea
                        rows={4}
                        value={teacherFeedback}
                        onChange={(e) => setTeacherFeedback(e.target.value)}
                        placeholder="Nhập nhận xét tổng quan về quá trình làm bài, ưu điểm, các điểm học sinh cần cải thiện thêm..."
                        className="w-full rounded-xl border border-gray-300 bg-white p-3.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden leading-relaxed"
                    />
                </Card>

                {/* Bottom Action Floating Bar */}
                <div className="sticky bottom-4 z-20 rounded-2xl bg-slate-900/90 backdrop-blur-md p-4 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-slate-700">
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-2xs font-medium uppercase tracking-wider text-gray-400">Tổng điểm bài thi</p>
                            <p className="text-2xl font-black text-emerald-400">
                                {calculatedTotalScore.toFixed(2)} <span className="text-xs font-semibold text-gray-300">/ {maxExamScore} điểm</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href={`/grading?class_id=${classExam.schoolClass?.id || ''}&class_exam_id=${classExam.id}`}>
                            <Button variant="secondary" size="md" className="bg-white/10 text-white border-white/20 hover:bg-white/20 font-bold">
                                Hủy & Quay Lại
                            </Button>
                        </Link>
                        <Button
                            type="button"
                            variant="success"
                            size="md"
                            className="font-bold px-6 shadow-md"
                            icon={<Save className="h-4 w-4" />}
                            onClick={() => setConfirmModalOpen(true)}
                            isLoading={isSaving}
                        >
                            Lưu Điểm & Hoàn Tất
                        </Button>
                    </div>
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
