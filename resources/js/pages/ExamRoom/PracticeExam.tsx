import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    CheckCircle2,
    Clock,
    Flag,
    HelpCircle,
    Home,
    Layers,
    Pause,
    Play,
    RotateCcw,
    Send,
    Volume2,
    XCircle,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { ExamSkill, QuestionType } from '../Admin/Exams/types';
import SortableOrderingList from './components/SortableOrderingList';
import DiagramLabellingQuestion from './components/DiagramLabellingQuestion';
import MatchingAnswerForm from './components/MatchingAnswerForm';
import MatchingImageAnswerForm from './components/MatchingImageAnswerForm';
import DragDropClozeQuestion from './components/DragDropClozeQuestion';
import FindMistakeQuestion from './components/FindMistakeQuestion';
import QuestionReviewDetail from './components/QuestionReviewDetail';

interface QuestionItem {
    id: number;
    section_id: number;
    code?: string;
    title?: string | null;
    question_type: QuestionType;
    skill?: ExamSkill;
    content: string;
    score: number;
    image_url?: string | null;
    audio_url?: string | null;
    options?: any;
    metadata?: any;
    order_index?: number;
}

interface SectionItem {
    id: number;
    title: string;
    description?: string | null;
    skill: ExamSkill;
    order_index?: number;
    questions: QuestionItem[];
}

interface PracticeExamData {
    id: number;
    code: string;
    name: string;
    exam_type: string;
    duration_minutes: number;
    max_score: number;
    pass_score: number;
    description?: string | null;
    center?: { id: number; name: string };
    subject?: { id: number; name: string };
    sections: SectionItem[];
    total_questions: number;
}

interface Props {
    exam: PracticeExamData;
    serverTime?: string;
    user?: any;
}

interface GradedQuestion {
    id: number;
    section_id: number;
    code?: string;
    title?: string | null;
    question_type: QuestionType;
    skill?: ExamSkill;
    content: string;
    image_url?: string | null;
    audio_url?: string | null;
    options?: any;
    max_score: number;
    earned_score: number;
    user_answer: any;
    correct_answer: any;
    is_correct: boolean;
    is_skipped: boolean;
    explanation?: string | null;
}

interface ResultSummary {
    total_questions: number;
    correct_count: number;
    incorrect_count: number;
    skipped_count: number;
    earned_score: number;
    max_score: number;
    percentage: number;
    is_passed: boolean;
    submitted_at: string;
}

export default function PracticeExam({ exam, serverTime, user }: Props) {
    // Flatten all questions
    const allQuestions: QuestionItem[] = (exam.sections || []).flatMap((sec) => sec.questions || []);

    // Current State
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
    const [activeQuestionId, setActiveQuestionId] = useState<number | null>(
        allQuestions.length > 0 ? allQuestions[0].id : null,
    );

    // Timer State
    const initialSeconds = (exam.duration_minutes || 45) * 60;
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isPaused, setIsPaused] = useState(false);

    // Submission & Result State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [result, setResult] = useState<{
        summary: ResultSummary;
        graded_questions: GradedQuestion[];
    } | null>(null);

    // Filter review questions
    const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'skipped'>('all');

    // Countdown Timer
    useEffect(() => {
        if (result || isPaused) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [result, isPaused]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const extractFillInBlankSlots = (content: string, options?: any, correctAnswer?: any) => {
        const bracketRegex = /\[([^\]]+)\]/g;
        const matches = Array.from((content || '').matchAll(bracketRegex));

        if (matches.length > 0) {
            return matches.map((m, idx) => {
                const raw = m[1].trim();
                const isBlankNumber = /^blank_(\d+)$/i.exec(raw);
                const tagKey = isBlankNumber ? `blank_${isBlankNumber[1]}` : `blank_${idx + 1}`;
                return {
                    index: idx + 1,
                    tagKey,
                    fallbackKey: String(idx),
                    label: `Vị trí (${idx + 1})`,
                    originalWord: raw,
                };
            });
        }

        if (correctAnswer && typeof correctAnswer === 'object') {
            const keys = Object.keys(correctAnswer);
            if (keys.length > 0) {
                return keys.map((k, idx) => ({
                    index: idx + 1,
                    tagKey: k,
                    fallbackKey: String(idx),
                    label: `Vị trí (${idx + 1})`,
                }));
            }
        }

        return [
            {
                index: 1,
                tagKey: 'blank_1',
                fallbackKey: '0',
                label: 'Vị trí (1)',
            },
        ];
    };

    const renderFillInBlankContent = (content: string) => {
        const parts = (content || '').split(/(\[[^\]]+\])/g);
        let blankIndex = 0;

        return (
            <span className="inline leading-loose">
                {parts.map((part, idx) => {
                    const match = part.match(/^\[([^\]]+)\]$/);
                    if (match) {
                        blankIndex++;
                        return (
                            <span
                                key={idx}
                                className="inline-flex items-center mx-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 font-mono text-xs font-bold shadow-2xs"
                            >
                                ({blankIndex}) [...........]
                            </span>
                        );
                    }
                    return <span key={idx}>{part}</span>;
                })}
            </span>
        );
    };

    const handleAnswerChange = (questionId: number, val: any) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: val,
        }));
    };

    const toggleFlag = (questionId: number) => {
        setFlaggedQuestions((prev) =>
            prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
        );
    };

    const answeredCount = Object.keys(answers).filter(
        (k) => answers[Number(k)] !== undefined && answers[Number(k)] !== '' && answers[Number(k)] !== null,
    ).length;

    const handleAutoSubmit = () => {
        handleSubmitExam();
    };

    const handleSubmitExam = async () => {
        setSubmitConfirmOpen(false);
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const response = await axios.post(`/exams/${exam.id}/practice-submit`, {
                answers,
            });

            setResult(response.data);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error: any) {
            console.error('Submit error:', error);
            const msg = error?.response?.data?.message || 'Có lỗi xảy ra khi nộp bài thi thử. Vui lòng thử lại!';
            setErrorMessage(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPractice = () => {
        setAnswers({});
        setFlaggedQuestions([]);
        setTimeLeft((exam.duration_minutes || 45) * 60);
        setIsPaused(false);
        setResult(null);
        setActiveQuestionId(allQuestions.length > 0 ? allQuestions[0].id : null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const currentQuestion = allQuestions.find((q) => q.id === activeQuestionId) || allQuestions[0];
    const computedSectionIdx = (exam.sections || []).findIndex((sec) =>
        (sec.questions || []).some((q) => q.id === currentQuestion?.id)
    );
    const activeSectionIdx = computedSectionIdx >= 0 ? computedSectionIdx : 0;
    const currentSection = exam.sections[activeSectionIdx] || exam.sections[0];

    // ==========================================
    // RENDER QUESTION RUNNER
    // ==========================================
    const renderQuestionInput = (q: QuestionItem) => {
        const currentVal = answers[q.id];

        switch (q.question_type) {
            case 'single_choice': {
                const optsList = Array.isArray(q.options) ? q.options : [];
                return (
                    <div className="space-y-2.5">
                        {optsList.map((opt: any, idx: number) => {
                            const optId = String(opt?.id ?? opt?.key ?? opt?.value ?? String.fromCharCode(65 + idx));
                            const optText = String(opt?.text ?? opt?.label ?? opt?.content ?? (typeof opt === 'string' ? opt : ''));
                            const isSelected = String(currentVal) === optId;

                            return (
                                <label
                                    key={optId || idx}
                                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${isSelected
                                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-semibold shadow-2xs'
                                        : 'border-gray-200 bg-white hover:bg-slate-50 text-gray-800'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name={`practice_q_${q.id}`}
                                        value={optId}
                                        checked={isSelected}
                                        onChange={() => handleAnswerChange(q.id, optId)}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 font-mono text-xs font-bold text-gray-700">
                                        {optId}
                                    </span>
                                    <span className="text-sm font-medium">{optText}</span>
                                </label>
                            );
                        })}
                    </div>
                );
            }

            case 'multiple_choice': {
                const optsList = Array.isArray(q.options) ? q.options : [];
                const selectedArr: string[] = Array.isArray(currentVal) ? currentVal.map(String) : [];

                return (
                    <div className="space-y-2.5">
                        {optsList.map((opt: any, idx: number) => {
                            const optId = String(opt?.id ?? opt?.key ?? opt?.value ?? String.fromCharCode(65 + idx));
                            const optText = String(opt?.text ?? opt?.label ?? opt?.content ?? (typeof opt === 'string' ? opt : ''));
                            const isChecked = selectedArr.includes(optId);

                            const toggleChoice = () => {
                                if (isChecked) {
                                    handleAnswerChange(q.id, selectedArr.filter((x) => x !== optId));
                                } else {
                                    handleAnswerChange(q.id, [...selectedArr, optId]);
                                }
                            };

                            return (
                                <label
                                    key={optId || idx}
                                    className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${isChecked
                                        ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 font-semibold shadow-2xs'
                                        : 'border-gray-200 bg-white hover:bg-slate-50 text-gray-800'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={toggleChoice}
                                        className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 font-mono text-xs font-bold text-gray-700">
                                        {optId}
                                    </span>
                                    <span className="text-sm font-medium">{optText}</span>
                                </label>
                            );
                        })}
                    </div>
                );
            }

            case 'true_false_not_given': {
                const tfOptions = [
                    { id: 'TRUE', label: 'TRUE' },
                    { id: 'FALSE', label: 'FALSE' },
                    { id: 'NOT_GIVEN', label: 'NOT GIVEN' },
                ];

                return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {tfOptions.map((opt) => {
                            const isSelected = String(currentVal) === opt.id;
                            return (
                                <label
                                    key={opt.id}
                                    className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border cursor-pointer text-center transition-all ${isSelected
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                                        : 'border-gray-200 bg-white hover:bg-slate-50 text-gray-800'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name={`practice_tf_${q.id}`}
                                        value={opt.id}
                                        checked={isSelected}
                                        onChange={() => handleAnswerChange(q.id, opt.id)}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-xs font-bold">{opt.label}</span>
                                </label>
                            );
                        })}
                    </div>
                );
            }

            case 'fill_in_blank': {
                const userObj: Record<string, string> = (currentVal && typeof currentVal === 'object') ? currentVal : {};
                const slots = extractFillInBlankSlots(q.content, q.options, (q as any).correct_answer);

                return (
                    <div className="space-y-4 rounded-xl bg-slate-50 p-4 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Nhập từ cần điền vào các vị trí trống ({slots.length} vị trí):
                            </div>
                            {q.metadata?.word_limit && (
                                <span className="text-2xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                                    {q.metadata.word_limit}
                                </span>
                            )}
                        </div>

                        {/* Word Bank if available */}
                        {q.metadata?.word_bank && Array.isArray(q.metadata.word_bank) && q.metadata.word_bank.length > 0 && (
                            <div className="rounded-lg bg-white p-3 border border-gray-200 space-y-1.5">
                                <span className="text-2xs font-bold uppercase tracking-wider text-gray-500">
                                    Gợi ý từ vựng (Word Bank):
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {q.metadata.word_bank.map((w: string, wIdx: number) => (
                                        <span
                                            key={wIdx}
                                            className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200"
                                        >
                                            {w}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {slots.map((slot) => {
                                const currentAnswer = userObj[slot.tagKey] ?? userObj[slot.fallbackKey] ?? '';
                                return (
                                    <div
                                        key={slot.tagKey}
                                        className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all"
                                    >
                                        <span className="flex h-7 px-2.5 shrink-0 items-center justify-center rounded-lg bg-amber-100 font-mono text-xs font-bold text-amber-900 border border-amber-200">
                                            ({slot.index})
                                        </span>
                                        <input
                                            type="text"
                                            value={currentAnswer}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                handleAnswerChange(q.id, {
                                                    ...userObj,
                                                    [slot.tagKey]: val,
                                                });
                                            }}
                                            placeholder={`Nhập câu trả lời cho vị trí (${slot.index})...`}
                                            className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-hidden"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }

            case 'find_mistake': {
                return (
                    <FindMistakeQuestion
                        content={q.content}
                        options={q.options}
                        value={String(currentVal || '')}
                        onChange={(ans) => handleAnswerChange(q.id, ans)}
                    />
                );
            }

            case 'drag_drop_cloze': {
                return (
                    <DragDropClozeQuestion
                        content={q.content}
                        options={q.options}
                        userAnswers={currentVal || {}}
                        onChange={(newMap) => handleAnswerChange(q.id, newMap)}
                    />
                );
            }

            case 'matching':
            case 'matching_sentences': {
                return (
                    <MatchingAnswerForm
                        options={q.options}
                        userAnswers={currentVal || {}}
                        onChange={(newMap) => handleAnswerChange(q.id, newMap)}
                    />
                );
            }

            case 'matching_image': {
                return (
                    <MatchingImageAnswerForm
                        options={q.options}
                        userAnswers={currentVal || {}}
                        onChange={(newMap) => handleAnswerChange(q.id, newMap)}
                    />
                );
            }

            case 'ordering': {
                return (
                    <SortableOrderingList
                        options={q.options}
                        value={Array.isArray(currentVal) ? currentVal : []}
                        onChange={(sortedIds) => handleAnswerChange(q.id, sortedIds)}
                    />
                );
            }

            case 'diagram_labelling': {
                return (
                    <DiagramLabellingQuestion
                        imageUrl={q.image_url}
                        options={q.options}
                        value={currentVal || {}}
                        onChange={(newMap) => handleAnswerChange(q.id, newMap)}
                    />
                );
            }

            case 'essay': {
                const textVal = String(currentVal || '');
                const wordCount = textVal.trim().split(/\s+/).filter(Boolean).length;
                return (
                    <div className="space-y-3 rounded-2xl bg-slate-50 p-4 border border-slate-200">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Viết bài luận / bài văn tự luận:
                            </label>
                            <span className="text-2xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                Số từ đã viết: <strong className="text-emerald-700">{wordCount}</strong> từ
                            </span>
                        </div>
                        <textarea
                            rows={8}
                            value={textVal}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            placeholder="Nhập nội dung bài văn tự luận của bạn tại đây..."
                            className="w-full rounded-xl border border-gray-300 bg-white p-3.5 text-sm text-gray-900 leading-relaxed focus:border-emerald-500 focus:outline-hidden shadow-2xs"
                        />
                    </div>
                );
            }

            case 'audio_record': {
                return (
                    <div className="space-y-3 rounded-2xl bg-pink-50/60 p-4 border border-pink-200">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-900">
                            <span>🎙️ Phần thi Nói / Ghi âm phát âm (Speaking)</span>
                        </div>
                        <p className="text-xs text-pink-800 leading-relaxed">
                            Đối với chế độ thi thử (Practice Exam), bạn có thể tự luyện nói theo chủ đề trên. Khi làm bài thi chính thức trong lớp, hệ thống sẽ mở tính năng ghi âm trực tiếp qua Micro.
                        </p>
                        <textarea
                            rows={3}
                            value={currentVal || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            placeholder="Ghi chú dàn ý câu trả lời Speaking của bạn (tùy chọn)..."
                            className="w-full rounded-xl border border-pink-300 bg-white p-3 text-xs text-gray-900 focus:border-pink-500 focus:outline-hidden"
                        />
                    </div>
                );
            }

            default:
                return (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            Nhập câu trả lời của bạn:
                        </label>
                        <textarea
                            rows={4}
                            value={currentVal || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            placeholder="Nhập câu trả lời làm bài..."
                            className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                        />
                    </div>
                );
        }
    };

    // ==========================================
    // RENDER RESULT SCREEN
    // ==========================================
    if (result) {
        const filteredGradedQuestions = result.graded_questions.filter((gq) => {
            if (reviewFilter === 'correct') return gq.is_correct;
            if (reviewFilter === 'incorrect') return !gq.is_correct && !gq.is_skipped;
            if (reviewFilter === 'skipped') return gq.is_skipped;
            return true;
        });

        return (
            <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
                <Head title={`Kết Quả Thi Thử: ${exam.name}`} />

                <div className="mx-auto max-w-5xl space-y-6">
                    {/* Top Result Banner */}
                    <div className="overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-md">
                        <div className={`p-6 sm:p-8 text-white ${result.summary.is_passed ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : 'bg-gradient-to-r from-rose-600 to-amber-700'}`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
                                        <Award className="h-3.5 w-3.5" />
                                        Kết Quả Thi Thử Tự Động
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold">{exam.name}</h1>
                                    <p className="text-xs text-white/80 font-mono">Mã đề: {exam.code}</p>
                                </div>

                                <div className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-xs">
                                    <div className="text-center">
                                        <span className="block text-2xs uppercase tracking-wider text-white/80 font-bold">Điểm Đạt Được</span>
                                        <span className="text-3xl sm:text-4xl font-extrabold text-white">
                                            {result.summary.earned_score}
                                            <span className="text-lg font-normal text-white/70"> / {result.summary.max_score}</span>
                                        </span>
                                    </div>
                                    <div className="h-12 w-px bg-white/20" />
                                    <div className="text-center">
                                        <span className="block text-2xs uppercase tracking-wider text-white/80 font-bold">Tỉ Lệ Đúng</span>
                                        <span className="text-3xl sm:text-4xl font-extrabold text-white">
                                            {result.summary.percentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Stats Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 border-t border-gray-100 text-center">
                            <div>
                                <span className="block text-2xs text-gray-500 font-bold uppercase">Tổng Số Câu</span>
                                <span className="text-lg font-extrabold text-gray-800">{result.summary.total_questions}</span>
                            </div>
                            <div>
                                <span className="block text-2xs text-emerald-600 font-bold uppercase">Số Câu Đúng</span>
                                <span className="text-lg font-extrabold text-emerald-700 flex items-center justify-center gap-1">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {result.summary.correct_count}
                                </span>
                            </div>
                            <div>
                                <span className="block text-2xs text-rose-600 font-bold uppercase">Số Câu Sai</span>
                                <span className="text-lg font-extrabold text-rose-700 flex items-center justify-center gap-1">
                                    <XCircle className="h-4 w-4" />
                                    {result.summary.incorrect_count}
                                </span>
                            </div>
                            <div>
                                <span className="block text-2xs text-amber-600 font-bold uppercase">Chưa Làm</span>
                                <span className="text-lg font-extrabold text-amber-700 flex items-center justify-center gap-1">
                                    <AlertCircle className="h-4 w-4" />
                                    {result.summary.skipped_count}
                                </span>
                            </div>
                        </div>

                        {/* Result Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border-t border-gray-100">
                            <Link href="/practice-exams">
                                <Button variant="secondary" icon={<Home className="h-4 w-4" />}>
                                    Về Danh Sách Đề Thi
                                </Button>
                            </Link>

                            <Button
                                type="button"
                                variant="success"
                                icon={<RotateCcw className="h-4 w-4" />}
                                onClick={handleResetPractice}
                            >
                                Làm Lại Đề Thi Này
                            </Button>
                        </div>
                    </div>

                    {/* Filter Tabs for Graded Questions */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-bold text-gray-900">
                            Chi Tiết Từng Câu Hỏi & Hướng Dẫn Giải
                        </h2>

                        <div className="flex items-center gap-1 rounded-xl bg-white p-1 border border-gray-200 shadow-2xs">
                            <button
                                type="button"
                                onClick={() => setReviewFilter('all')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${reviewFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-slate-100'
                                    }`}
                            >
                                Tất cả ({result.summary.total_questions})
                            </button>
                            <button
                                type="button"
                                onClick={() => setReviewFilter('correct')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${reviewFilter === 'correct' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-50'
                                    }`}
                            >
                                Đúng ({result.summary.correct_count})
                            </button>
                            <button
                                type="button"
                                onClick={() => setReviewFilter('incorrect')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${reviewFilter === 'incorrect' ? 'bg-rose-600 text-white' : 'text-rose-700 hover:bg-rose-50'
                                    }`}
                            >
                                Sai ({result.summary.incorrect_count})
                            </button>
                            <button
                                type="button"
                                onClick={() => setReviewFilter('skipped')}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${reviewFilter === 'skipped' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'
                                    }`}
                            >
                                Chưa làm ({result.summary.skipped_count})
                            </button>
                        </div>
                    </div>

                    {/* Graded Question Cards */}
                    <div className="space-y-4">
                        {filteredGradedQuestions.map((gq, idx) => {
                            const isCorrect = gq.is_correct;
                            const isSkipped = gq.is_skipped;

                            return (
                                <Card
                                    key={gq.id}
                                    className={`p-5 sm:p-6 border transition-all ${isCorrect
                                        ? 'border-emerald-200 bg-white'
                                        : isSkipped
                                            ? 'border-amber-200 bg-white'
                                            : 'border-rose-200 bg-white'
                                        }`}
                                >
                                    <div className="space-y-4">
                                        {/* Header */}
                                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                            <div className="flex items-center gap-2.5">
                                                <span
                                                    className={`flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-extrabold text-white ${isCorrect ? 'bg-emerald-600' : isSkipped ? 'bg-amber-500' : 'bg-rose-600'
                                                        }`}
                                                >
                                                    {idx + 1}
                                                </span>
                                                <span className="font-mono text-xs font-bold text-gray-500">
                                                    {gq.code || `Q${idx + 1}`}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${isCorrect
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : isSkipped
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-rose-100 text-rose-800'
                                                        }`}
                                                >
                                                    {isCorrect ? 'Chính xác' : isSkipped ? 'Chưa trả lời' : 'Chưa đúng'}
                                                </span>

                                                <span className="text-xs font-bold text-gray-700 font-mono">
                                                    {gq.earned_score} / {gq.max_score} đ
                                                </span>
                                            </div>
                                        </div>

                                        {/* Title & Content */}
                                        <div className="space-y-1.5">
                                            {gq.title && (
                                                <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                                                    {gq.title}
                                                </h4>
                                            )}
                                            {gq.question_type !== 'fill_in_blank' && gq.question_type !== 'drag_drop_cloze' && (
                                                <div className="text-sm font-medium text-gray-800 whitespace-pre-wrap leading-relaxed">
                                                    {gq.content}
                                                </div>
                                            )}
                                        </div>

                                        {/* Audio Track */}
                                        {gq.audio_url && (
                                            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                                                <audio controls src={gq.audio_url} className="w-full h-8" />
                                            </div>
                                        )}

                                        {/* Visual Interactive Review UI with Color Highlights */}
                                        <QuestionReviewDetail question={gq} />

                                        {/* Explanation */}
                                        {gq.explanation && (
                                            <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
                                                <div className="font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                                                    <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                                                    Lời Giải Thích Chi Tiết:
                                                </div>
                                                <p className="leading-relaxed">{gq.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // RENDER ACTIVE PRACTICE TEST RUNNER
    // ==========================================
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            <Head title={`Thi Thử: ${exam.name}`} />

            {/* Top Fixed Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs px-4 sm:px-6 py-3">
                <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
                    {/* Left: Exam Info */}
                    <div className="flex items-center gap-3">
                        <Link href="/practice-exams">
                            <button
                                type="button"
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                                title="Thoát phòng thi thử"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-base sm:text-lg font-extrabold text-gray-900 truncate max-w-xs sm:max-w-md">
                                {exam.name}
                            </h1>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                    {exam.code}
                                </span>
                                <span>• Đã làm {answeredCount} / {allQuestions.length} câu</span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Timer */}
                    <div className="flex items-center gap-2">
                        <div
                            className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-base sm:text-lg font-extrabold transition-all border ${timeLeft <= 300
                                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                }`}
                        >
                            <Clock className="h-5 w-5 shrink-0" />
                            <span>{formatTime(timeLeft)}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsPaused(!isPaused)}
                            className="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 hover:bg-slate-50 transition-colors"
                            title={isPaused ? 'Tiếp tục làm bài' : 'Tạm dừng đồng hồ'}
                        >
                            {isPaused ? <Play className="h-4 w-4 text-emerald-600 fill-current" /> : <Pause className="h-4 w-4 text-gray-600" />}
                        </button>
                    </div>

                    {/* Right: Submit Button */}
                    <Button
                        type="button"
                        variant="success"
                        size="md"
                        icon={<Send className="h-4 w-4" />}
                        onClick={() => setSubmitConfirmOpen(true)}
                        disabled={isSubmitting}
                    >
                        Nộp Bài Thi Thử
                    </Button>
                </div>
            </header>

            {/* Pause Overlay */}
            {isPaused && (
                <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center space-y-4">
                    <Pause className="h-16 w-16 text-emerald-400" />
                    <h2 className="text-2xl font-bold">Bài Thi Thử Đang Tạm Dừng</h2>
                    <p className="text-sm text-slate-300 max-w-md">
                        Đồng hồ đếm ngược đã dừng lại. Bạn có thể nghỉ ngơi và bấm nút bên dưới để tiếp tục làm bài bất cứ khi nào sẵn sàng.
                    </p>
                    <Button
                        type="button"
                        variant="success"
                        size="lg"
                        icon={<Play className="h-5 w-5 fill-current" />}
                        onClick={() => setIsPaused(false)}
                    >
                        Tiếp Tục Làm Bài
                    </Button>
                </div>
            )}

            {/* Main Content Layout */}
            <main className="flex-1 mx-auto max-w-7xl w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Area (Question Content & Input) - 3 Columns */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Section Switcher Tabs */}
                    {exam.sections.length > 1 && (
                        <div className="flex overflow-x-auto gap-2 p-1.5 bg-white rounded-2xl border border-gray-200 shadow-2xs">
                            {exam.sections.map((sec, sIdx) => {
                                const isActive = activeSectionIdx === sIdx;
                                return (
                                    <button
                                        key={sec.id || sIdx}
                                        type="button"
                                        onClick={() => {
                                            if (sec.questions && sec.questions.length > 0) {
                                                setActiveQuestionId(sec.questions[0].id);
                                            }
                                        }}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all ${isActive
                                            ? 'bg-emerald-600 text-white shadow-2xs'
                                            : 'text-gray-700 hover:bg-slate-100'
                                            }`}
                                    >
                                        <Layers className="h-4 w-4" />
                                        <span>{sec.title}</span>
                                        <span className={`text-2xs px-1.5 py-0.5 rounded-md ${isActive ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-gray-500'}`}>
                                            {sec.questions.length} câu
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Active Question Box */}
                    {currentQuestion ? (
                        <Card className="p-6 sm:p-8 border-gray-200 bg-white shadow-xs space-y-6">
                            {/* Question Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 font-mono text-sm font-extrabold text-white">
                                        {allQuestions.findIndex((q) => q.id === currentQuestion.id) + 1}
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-xs font-bold text-gray-500">
                                                {currentQuestion.code || `Câu ${allQuestions.findIndex((q) => q.id === currentQuestion.id) + 1}`}
                                            </span>
                                            {currentSection && (
                                                <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                                    {currentSection.title}
                                                </span>
                                            )}
                                            <span className="text-2xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                                                {currentQuestion.score} điểm
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => toggleFlag(currentQuestion.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${flaggedQuestions.includes(currentQuestion.id)
                                        ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-2xs'
                                        : 'bg-white text-gray-500 border-gray-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <Flag className={`h-4 w-4 ${flaggedQuestions.includes(currentQuestion.id) ? 'fill-current text-amber-500' : ''}`} />
                                    <span>{flaggedQuestions.includes(currentQuestion.id) ? 'Đã đánh dấu cờ' : 'Đánh dấu xem lại'}</span>
                                </button>
                            </div>

                            {/* Audio Track Player if Listening */}
                            {currentQuestion.audio_url && (
                                <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
                                        <Volume2 className="h-4 w-4 text-blue-600" />
                                        File Âm Thanh Đoạn Nghe
                                    </div>
                                    <audio controls src={currentQuestion.audio_url} className="w-full h-9" />
                                </div>
                            )}

                            {/* Image Attachment */}
                            {currentQuestion.image_url && (
                                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-slate-50 p-2 max-w-lg mx-auto">
                                    <img
                                        src={currentQuestion.image_url}
                                        alt="Đính kèm đề bài"
                                        className="max-h-72 w-auto mx-auto rounded-xl object-contain"
                                    />
                                </div>
                            )}

                            {/* Question Title & Content */}
                            <div className="space-y-2">
                                {currentQuestion.title && (
                                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                                        {currentQuestion.title}
                                    </h3>
                                )}
                                <div className="text-sm sm:text-base font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                                    {currentQuestion.question_type === 'fill_in_blank'
                                        ? renderFillInBlankContent(currentQuestion.content)
                                        : currentQuestion.question_type === 'drag_drop_cloze'
                                        ? null
                                        : currentQuestion.content}
                                </div>
                            </div>

                            {/* Interactive Input Form */}
                            <div className="pt-2">
                                {renderQuestionInput(currentQuestion)}
                            </div>

                            {/* Prev / Next Question Navigators */}
                            <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    disabled={allQuestions.findIndex((q) => q.id === currentQuestion.id) === 0}
                                    onClick={() => {
                                        const cIdx = allQuestions.findIndex((q) => q.id === currentQuestion.id);
                                        if (cIdx > 0) setActiveQuestionId(allQuestions[cIdx - 1].id);
                                    }}
                                >
                                    ← Câu Trước
                                </Button>

                                <Button
                                    type="button"
                                    variant="success"
                                    size="sm"
                                    disabled={allQuestions.findIndex((q) => q.id === currentQuestion.id) === allQuestions.length - 1}
                                    onClick={() => {
                                        const cIdx = allQuestions.findIndex((q) => q.id === currentQuestion.id);
                                        if (cIdx < allQuestions.length - 1) setActiveQuestionId(allQuestions[cIdx + 1].id);
                                    }}
                                >
                                    Câu Kế Tiếp →
                                </Button>
                            </div>
                        </Card>
                    ) : null}
                </div>

                {/* Right Sidebar: Question Palette (1 Column) */}
                <div className="space-y-5">
                    <Card className="p-5 border-gray-200 bg-white shadow-2xs space-y-4 sticky top-20">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                Bảng Điều Hướng Câu Hỏi
                            </span>
                            <span className="font-mono text-xs font-bold text-emerald-700">
                                {answeredCount}/{allQuestions.length}
                            </span>
                        </div>

                        {/* Status Legend */}
                        <div className="grid grid-cols-2 gap-2 text-2xs text-gray-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-md bg-emerald-600 inline-block" />
                                <span>Đã làm</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-md bg-white border border-gray-300 inline-block" />
                                <span>Chưa làm</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-md bg-amber-400 inline-block" />
                                <span>Cắm cờ</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-md ring-2 ring-emerald-500 inline-block bg-slate-200" />
                                <span>Đang xem</span>
                            </div>
                        </div>

                        {/* Palette Grid by Section */}
                        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                            {exam.sections.map((sec, sIdx) => (
                                <div key={sec.id || sIdx} className="space-y-2">
                                    <div className="text-2xs font-bold uppercase text-gray-400">
                                        {sec.title}
                                    </div>
                                    <div className="grid grid-cols-5 gap-2">
                                        {sec.questions.map((q) => {
                                            const globalIdx = allQuestions.findIndex((item) => item.id === q.id) + 1;
                                            const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '' && answers[q.id] !== null;
                                            const isFlagged = flaggedQuestions.includes(q.id);
                                            const isActive = activeQuestionId === q.id;

                                            return (
                                                <button
                                                    key={q.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveQuestionId(q.id);
                                                    }}
                                                    className={`relative flex h-9 w-full items-center justify-center rounded-xl font-mono text-xs font-bold transition-all ${isActive
                                                        ? 'ring-2 ring-emerald-600 ring-offset-1 font-extrabold shadow-sm'
                                                        : ''
                                                        } ${isAnswered
                                                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {globalIdx}
                                                    {isFlagged && (
                                                        <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-amber-500">
                                                            <Flag className="h-2 w-2 text-white fill-current" />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="success"
                                className="w-full justify-center"
                                icon={<Send className="h-4 w-4" />}
                                onClick={() => setSubmitConfirmOpen(true)}
                                disabled={isSubmitting}
                            >
                                Nộp Bài Thi Thử
                            </Button>
                        </div>
                    </Card>
                </div>
            </main>

            {/* Confirm Submit Modal */}
            <Modal
                isOpen={submitConfirmOpen}
                onClose={() => setSubmitConfirmOpen(false)}
                title="Xác Nhận Nộp Bài Thi Thử"
                maxWidth="md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Bạn đã hoàn thành <strong className="text-emerald-700">{answeredCount}</strong> trên tổng số{' '}
                        <strong>{allQuestions.length}</strong> câu hỏi.
                    </p>

                    {answeredCount < allQuestions.length && (
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>Vẫn còn {allQuestions.length - answeredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài ngay?</span>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setSubmitConfirmOpen(false)}
                        >
                            Tiếp Tục Làm
                        </Button>
                        <Button
                            type="button"
                            variant="success"
                            icon={<Send className="h-4 w-4" />}
                            onClick={handleSubmitExam}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang Chấm Điểm...' : 'Nộp Bài & Xem Điểm'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Error Feedback Modal */}
            <Modal
                isOpen={Boolean(errorMessage)}
                onClose={() => setErrorMessage(null)}
                title="Thông Báo Lỗi"
                maxWidth="sm"
            >
                <div className="space-y-4 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                        {errorMessage}
                    </p>
                    <div className="pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full justify-center"
                            onClick={() => setErrorMessage(null)}
                        >
                            Đóng
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
