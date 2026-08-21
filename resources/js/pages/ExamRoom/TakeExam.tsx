import { Head, router } from '@inertiajs/react';
import {
    Clock,
    Award,
    FileCheck,
    Send,
    AlertCircle,
    CheckCircle2,
    BookOpen,
    Headphones,
    PenTool,
    Mic,
    HelpCircle,
    ArrowRight,
    ArrowUpDown,
    Check,
    Volume2,
    Image as ImageIcon,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import AudioRecorder from './components/AudioRecorder';
import { parseDate } from '@/lib/date';
import { ClassExam, ClassExamSubmission, ExamQuestionData, ExamSectionData, QuestionType, Student } from './types';

interface Props {
    classExam: ClassExam;
    submission: ClassExamSubmission;
    serverTime: string;
    student: Student;
}

export default function TakeExam({
    classExam,
    submission,
    serverTime,
    student,
}: Props) {
    const exam = classExam.exam;
    const sections: ExamSectionData[] = exam?.sections || [];

    // All questions flat array with section index
    const allQuestions: { question: ExamQuestionData; secIdx: number; qIdx: number; num: number }[] = [];
    let qCount = 0;
    sections.forEach((sec, sIdx) => {
        (sec.questions || []).forEach((q, qIndex) => {
            qCount++;
            allQuestions.push({ question: q, secIdx: sIdx, qIdx: qIndex, num: qCount });
        });
    });

    // Answers State: { [question_id]: answer_value }
    const [answers, setAnswers] = useState<Record<number | string, any>>(() => {
        return submission.answers || {};
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);

    // ─── Countdown Timer Setup ───
    const durationMinutes = classExam.duration_minutes || exam?.duration_minutes || 45;
    const totalSecondsAllocated = durationMinutes * 60;

    const startedAt = submission.started_at
        ? parseDate(submission.started_at)?.getTime() || new Date().getTime()
        : new Date().getTime();

    const calculateRemainingSeconds = () => {
        const now = new Date().getTime();
        const elapsedSeconds = Math.floor((now - startedAt) / 1000);
        return Math.max(0, totalSecondsAllocated - elapsedSeconds);
    };

    const [remainingSeconds, setRemainingSeconds] = useState(calculateRemainingSeconds);
    const hasAutoSubmittedRef = useRef(false);

    useEffect(() => {
        const interval = window.setInterval(() => {
            const rem = calculateRemainingSeconds();
            setRemainingSeconds(rem);

            if (rem <= 0 && !hasAutoSubmittedRef.current) {
                hasAutoSubmittedRef.current = true;
                clearInterval(interval);
                handleAutoSubmitTimeout();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleAutoSubmitTimeout = () => {
        setIsSubmitting(true);
        router.post(`/class-exams/${classExam.id}/submit/${submission.id}`, {
            answers,
            is_timeout: true,
        });
    };

    const handleManualSubmit = () => {
        setIsSubmitting(true);
        router.post(`/class-exams/${classExam.id}/submit/${submission.id}`, {
            answers,
            is_timeout: false,
        }, {
            onFinish: () => {
                setIsSubmitting(false);
                setSubmitConfirmOpen(false);
            },
        });
    };

    const handleAnswerChange = (questionId: number | string, val: any) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: val,
        }));
    };

    const scrollToQuestion = (qNum: number) => {
        const el = document.getElementById(`question-card-${qNum}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Calculate count of answered questions
    const answeredCount = allQuestions.filter((item) => {
        const ans = answers[item.question.id!];
        if (ans === undefined || ans === null || ans === '') return false;
        if (Array.isArray(ans) && ans.length === 0) return false;
        if (typeof ans === 'object' && Object.keys(ans).length === 0) return false;
        return true;
    }).length;

    const formatTimer = (secs: number) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        if (h > 0) {
            return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        }
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const isTimerUrgent = remainingSeconds <= 300; // <= 5 mins
    const isTimerCritical = remainingSeconds <= 60; // <= 1 min

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <Head title={`Đang Làm Bài: ${classExam.title}`} />

            {/* Fixed Exam Header */}
            <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-xs px-4 sm:px-8 py-3">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                    {/* Exam Title & Student Info */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold shrink-0">
                            <FileCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1">
                                {classExam.title}
                            </h1>
                            <p className="text-2xs text-gray-500 font-medium">
                                Thí sinh: <strong className="text-gray-800">{student.full_name}</strong> ({student.student_code || student.username})
                            </p>
                        </div>
                    </div>

                    {/* Progress & Countdown Timer & Submit */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        {/* Progress Bar */}
                        <div className="hidden md:flex flex-col items-end gap-1">
                            <span className="text-2xs font-bold text-gray-600">
                                Tiến độ: <strong className="text-emerald-700">{answeredCount}</strong> / {allQuestions.length} câu
                            </span>
                            <div className="h-2 w-32 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                                    style={{ width: `${allQuestions.length > 0 ? (answeredCount / allQuestions.length) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Countdown Timer */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-black text-sm sm:text-base border shadow-2xs transition-colors ${
                            isTimerCritical
                                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                                : isTimerUrgent
                                ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                                : 'bg-slate-900 text-emerald-400 border-slate-800'
                        }`}>
                            <Clock className="h-4 w-4" />
                            <span>{formatTimer(remainingSeconds)}</span>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="button"
                            variant="success"
                            size="md"
                            icon={<Send className="h-4 w-4" />}
                            onClick={() => setSubmitConfirmOpen(true)}
                            isLoading={isSubmitting}
                            className="font-bold text-xs"
                        >
                            Nộp Bài Thi
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content Body */}
            <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Questions Column */}
                <main className="lg:col-span-8 space-y-6">
                    {sections.map((section, sIdx) => {
                        return (
                            <div key={section.id || sIdx} className="space-y-4">
                                {/* Section Header Card */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                            <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black ${
                                                section.skill === 'listening' ? 'bg-blue-100 text-blue-800' :
                                                section.skill === 'writing' ? 'bg-amber-100 text-amber-800' :
                                                section.skill === 'speaking' ? 'bg-pink-100 text-pink-800' :
                                                'bg-emerald-100 text-emerald-800'
                                            }`}>
                                                {sIdx + 1}
                                            </span>
                                            {section.title}
                                        </h2>
                                        <span className={`text-2xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                            section.skill === 'listening' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                            section.skill === 'writing' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                            section.skill === 'speaking' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}>
                                            {section.skill === 'listening' ? '🎧 Listening' : section.skill === 'writing' ? '✍️ Writing' : section.skill === 'speaking' ? '🗣️ Speaking' : '📖 Reading'}
                                        </span>
                                    </div>

                                    {section.description && (
                                        <p className="text-xs text-gray-600 bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-wrap">
                                            {section.description}
                                        </p>
                                    )}
                                </div>

                                {/* Questions in Section */}
                                {(section.questions || []).map((q, qIndex) => {
                                    const qGlobalNum = allQuestions.find((item) => item.question.id === q.id)?.num || (qIndex + 1);
                                    const currentVal = answers[q.id!];

                                    return (
                                        <div
                                            key={q.id || qIndex}
                                            id={`question-card-${qGlobalNum}`}
                                            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-4 transition-all"
                                        >
                                            {/* Question Top Header */}
                                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold">
                                                        {qGlobalNum}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-700">
                                                        Câu {qGlobalNum}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                                    {q.score} điểm
                                                </span>
                                            </div>

                                            {/* Question Content */}
                                            <div className="text-sm font-semibold text-gray-900 whitespace-pre-wrap leading-relaxed">
                                                {q.question_type === 'fill_in_blank' ? (
                                                    <RenderFillInBlankQuestion
                                                        content={q.content}
                                                        userAnswers={currentVal || {}}
                                                        onChange={(newBlankAns) => handleAnswerChange(q.id!, newBlankAns)}
                                                    />
                                                ) : (
                                                    q.content
                                                )}
                                            </div>

                                            {/* Audio / Image Attachment */}
                                            {q.audio_url && (
                                                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 flex items-center gap-3">
                                                    <Volume2 className="h-5 w-5 text-blue-600 shrink-0" />
                                                    <audio src={q.audio_url} controls className="w-full h-8" />
                                                </div>
                                            )}

                                            {q.image_url && q.question_type !== 'diagram_labelling' && (
                                                <div className="rounded-xl border border-gray-200 p-2 bg-slate-50 flex justify-center max-h-60 overflow-hidden">
                                                    <img src={q.image_url} alt="Minh họa" className="max-h-56 object-contain rounded" />
                                                </div>
                                            )}

                                            {/* Question Type Interactive Answer Form */}
                                            <div className="pt-2">
                                                {/* 1. Single Choice */}
                                                {q.question_type === 'single_choice' && (
                                                    <div className="space-y-2.5">
                                                        {(q.options || []).map((opt: any, idx: number) => {
                                                            const optId = String(opt?.id ?? opt?.key ?? opt?.value ?? String.fromCharCode(65 + idx));
                                                            const optText = String(opt?.text ?? opt?.label ?? opt?.content ?? (typeof opt === 'string' ? opt : ''));
                                                            const isSelected = String(currentVal) === optId;
                                                            return (
                                                                <label
                                                                    key={optId || idx}
                                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                                        isSelected
                                                                            ? 'border-emerald-500 bg-emerald-50/60 shadow-2xs'
                                                                            : 'border-gray-200 bg-white hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="radio"
                                                                        name={`question_${q.id}`}
                                                                        value={optId}
                                                                        checked={isSelected}
                                                                        onChange={() => handleAnswerChange(q.id!, optId)}
                                                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                                                                    />
                                                                    <span className="font-mono text-xs font-bold text-gray-700 shrink-0">
                                                                        {optId}.
                                                                    </span>
                                                                    <span className="text-xs font-medium text-gray-800">
                                                                        {optText}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* 2. Multiple Choice */}
                                                {q.question_type === 'multiple_choice' && (
                                                    <div className="space-y-2.5">
                                                        {(q.options || []).map((opt: any, idx: number) => {
                                                            const optId = String(opt?.id ?? opt?.key ?? opt?.value ?? String.fromCharCode(65 + idx));
                                                            const optText = String(opt?.text ?? opt?.label ?? opt?.content ?? (typeof opt === 'string' ? opt : ''));
                                                            const selectedArr: string[] = Array.isArray(currentVal) ? currentVal.map(String) : [];
                                                            const isChecked = selectedArr.includes(optId);

                                                            const toggleChoice = () => {
                                                                if (isChecked) {
                                                                    handleAnswerChange(q.id!, selectedArr.filter((x) => x !== optId));
                                                                } else {
                                                                    handleAnswerChange(q.id!, [...selectedArr, optId]);
                                                                }
                                                            };

                                                            return (
                                                                <label
                                                                    key={optId || idx}
                                                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                                                        isChecked
                                                                            ? 'border-indigo-500 bg-indigo-50/60 shadow-2xs'
                                                                            : 'border-gray-200 bg-white hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={toggleChoice}
                                                                        className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                                                                    />
                                                                    <span className="font-mono text-xs font-bold text-gray-700 shrink-0">
                                                                        {optId}.
                                                                    </span>
                                                                    <span className="text-xs font-medium text-gray-800">
                                                                        {optText}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* 3. True / False / Not Given */}
                                                {q.question_type === 'true_false_not_given' && (
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                        {['TRUE', 'FALSE', 'NOT GIVEN'].map((tfVal) => {
                                                            const isSelected = currentVal === tfVal;
                                                            return (
                                                                <button
                                                                    key={tfVal}
                                                                    type="button"
                                                                    onClick={() => handleAnswerChange(q.id!, tfVal)}
                                                                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                                                                        isSelected
                                                                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                                                                            : 'border-gray-200 bg-white text-gray-800 hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    {tfVal}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* 4. Matching */}
                                                {(q.question_type === 'matching' || q.question_type === 'matching_sentences') && (
                                                    <RenderMatchingAnswerForm
                                                        options={q.options}
                                                        userAnswers={currentVal || {}}
                                                        onChange={(newMap) => handleAnswerChange(q.id!, newMap)}
                                                    />
                                                )}

                                                {/* 5. Matching Image */}
                                                {q.question_type === 'matching_image' && (
                                                    <RenderMatchingImageAnswerForm
                                                        options={q.options}
                                                        userAnswers={currentVal || {}}
                                                        onChange={(newMap) => handleAnswerChange(q.id!, newMap)}
                                                    />
                                                )}

                                                {/* 6. Find Mistake */}
                                                {q.question_type === 'find_mistake' && (
                                                    <div className="space-y-3">
                                                        <p className="text-2xs text-gray-500 font-semibold">Chọn phần gạch chân chứa lỗi sai:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {['A', 'B', 'C', 'D'].map((char) => (
                                                                <button
                                                                    key={char}
                                                                    type="button"
                                                                    onClick={() => handleAnswerChange(q.id!, char)}
                                                                    className={`h-10 w-10 rounded-xl border text-xs font-bold transition-all ${
                                                                        currentVal === char
                                                                            ? 'border-rose-600 bg-rose-600 text-white shadow-xs'
                                                                            : 'border-gray-200 bg-white text-gray-800 hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    {char}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 7. Essay Writing */}
                                                {q.question_type === 'essay' && (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            rows={6}
                                                            value={currentVal || ''}
                                                            onChange={(e) => handleAnswerChange(q.id!, e.target.value)}
                                                            placeholder="Nhập bài văn tự luận của bạn tại đây..."
                                                            className="w-full rounded-xl border border-gray-300 bg-white p-3.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden leading-relaxed"
                                                        />
                                                        <div className="text-right text-2xs text-gray-400 font-semibold">
                                                            Số từ: {(currentVal || '').trim().split(/\s+/).filter(Boolean).length} từ
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 8. Speaking Audio Recording */}
                                                {q.question_type === 'audio_record' && (
                                                    <AudioRecorder
                                                        classExamId={classExam.id}
                                                        questionId={q.id!}
                                                        savedAudioPath={currentVal}
                                                        onAudioUploaded={(audioPath) => handleAnswerChange(q.id!, audioPath)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </main>

                {/* Sidebar Question Navigation Grid */}
                <aside className="lg:col-span-4 sticky top-20 space-y-4">
                    <Card className="border-gray-200 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                                Bảng Câu Hỏi ({allQuestions.length})
                            </span>
                            <span className="text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Đã làm: {answeredCount}/{allQuestions.length}
                            </span>
                        </div>

                        {/* Question Numbers Grid */}
                        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[50vh] overflow-y-auto pr-1">
                            {allQuestions.map((item) => {
                                const ans = answers[item.question.id!];
                                const isDone = ans !== undefined && ans !== null && ans !== '' && (!Array.isArray(ans) || ans.length > 0) && (typeof ans !== 'object' || Object.keys(ans).length > 0);

                                return (
                                    <button
                                        key={item.num}
                                        type="button"
                                        onClick={() => scrollToQuestion(item.num)}
                                        className={`h-9 rounded-xl font-mono text-xs font-bold transition-all border ${
                                            isDone
                                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                                : 'bg-slate-50 text-gray-700 border-gray-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        {item.num}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <Button
                                type="button"
                                variant="success"
                                size="lg"
                                className="w-full font-bold text-sm py-3 shadow-md"
                                icon={<Send className="h-4 w-4" />}
                                onClick={() => setSubmitConfirmOpen(true)}
                                isLoading={isSubmitting}
                            >
                                Nộp Bài Thi
                            </Button>
                        </div>
                    </Card>
                </aside>
            </div>

            {/* Manual Submit Confirmation Dialog */}
            <ConfirmDialog
                isOpen={submitConfirmOpen}
                title="Xác Nhận Nộp Bài Thi"
                message={`Bạn đã trả lời ${answeredCount} / ${allQuestions.length} câu hỏi. Bạn có chắc chắn muốn nộp bài thi ngay bây giờ?`}
                confirmLabel="Xác Nhận Nộp Bài"
                cancelLabel="Tiếp Tục Làm Bài"
                variant="success"
                isLoading={isSubmitting}
                onConfirm={handleManualSubmit}
                onCancel={() => setSubmitConfirmOpen(false)}
            />
        </div>
    );
}

// ─── Sub-component: Fill in blank interactive renderer ───
function RenderFillInBlankQuestion({ content, userAnswers, onChange }: { content: string; userAnswers: Record<string, string>; onChange: (ans: Record<string, string>) => void }) {
    const parts = content.split(/(\[blank_\d+\])/g);

    const handleBlankChange = (tagKey: string, val: string) => {
        onChange({
            ...userAnswers,
            [tagKey]: val,
        });
    };

    return (
        <span className="inline">
            {parts.map((part, pIdx) => {
                const match = part.match(/\[blank_(\d+)\]/);
                if (match) {
                    const tagKey = `blank_${match[1]}`;
                    const currentVal = userAnswers[tagKey] || '';
                    return (
                        <input
                            key={pIdx}
                            type="text"
                            value={currentVal}
                            onChange={(e) => handleBlankChange(tagKey, e.target.value)}
                            placeholder={`(${match[1]})`}
                            className="mx-1.5 inline-block w-28 rounded-lg border border-amber-300 bg-amber-50/40 px-2.5 py-1 font-mono text-xs font-bold text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                        />
                    );
                }
                return <span key={pIdx}>{part}</span>;
            })}
        </span>
    );
}

// ─── Sub-component: Matching Answer Form ───
function RenderMatchingAnswerForm({ options, userAnswers, onChange }: { options: any; userAnswers: Record<string, string>; onChange: (ans: Record<string, string>) => void }) {
    const leftItems: any[] = options?.left_items || [];
    const rightItems: any[] = options?.right_items || [];

    const handlePairChange = (lId: string, rId: string) => {
        onChange({
            ...userAnswers,
            [lId]: rId,
        });
    };

    return (
        <div className="space-y-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
            <p className="text-2xs font-bold uppercase tracking-wider text-gray-600">Ghép nối các cặp tương ứng:</p>
            <div className="space-y-2">
                {leftItems.map((lItem, idx) => {
                    const selectedRight = userAnswers[lItem.id] || '';
                    return (
                        <div key={lItem.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-gray-200 text-xs">
                            <span className="font-semibold text-gray-800 flex-1">
                                {idx + 1}. {lItem.label || lItem.text}
                            </span>
                            <div className="flex items-center gap-2 w-full sm:w-1/2">
                                <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <select
                                    value={selectedRight}
                                    onChange={(e) => handlePairChange(lItem.id, e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-900 focus:outline-hidden"
                                >
                                    <option value="">-- Chọn vế ghép --</option>
                                    {rightItems.map((rItem) => (
                                        <option key={rItem.id} value={rItem.id}>
                                            {rItem.text}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Sub-component: Matching Image Answer Form ───
function RenderMatchingImageAnswerForm({ options, userAnswers, onChange }: { options: any; userAnswers: Record<string, string>; onChange: (ans: Record<string, string>) => void }) {
    const sentences: any[] = options?.sentences || [];
    const images: any[] = options?.images || [];

    const handlePairChange = (sId: string, imgId: string) => {
        onChange({
            ...userAnswers,
            [sId]: imgId,
        });
    };

    return (
        <div className="space-y-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
            {/* Images Preview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                    <div key={img.id} className="bg-white p-2 rounded-xl border border-gray-200 text-center space-y-1">
                        <span className="font-mono text-xs font-bold text-teal-700">{img.label || `Hình ${String.fromCharCode(65 + idx)}`}</span>
                        {img.image_url && (
                            <img src={img.image_url} alt={img.label} className="h-24 w-full object-contain rounded-lg bg-slate-50" />
                        )}
                    </div>
                ))}
            </div>

            {/* Pairing */}
            <div className="space-y-2">
                {sentences.map((sent, idx) => {
                    const selectedImg = userAnswers[sent.id] || '';
                    return (
                        <div key={sent.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white p-2.5 rounded-lg border border-gray-200 text-xs">
                            <span className="font-semibold text-gray-800 flex-1">
                                Câu {idx + 1}: {sent.text}
                            </span>
                            <div className="flex items-center gap-2 w-full sm:w-48">
                                <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <select
                                    value={selectedImg}
                                    onChange={(e) => handlePairChange(sent.id, e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-bold text-gray-900 focus:outline-hidden"
                                >
                                    <option value="">-- Chọn hình --</option>
                                    {images.map((img, imgIdx) => (
                                        <option key={img.id} value={img.id}>
                                            {img.label || `Hình ${String.fromCharCode(65 + imgIdx)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
