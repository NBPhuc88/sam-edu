import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
QUESTION_TYPE_AUDIO_RECORD,
QUESTION_TYPE_DIAGRAM_LABELLING,
QUESTION_TYPE_DRAG_DROP_CLOZE,
QUESTION_TYPE_ESSAY,
QUESTION_TYPE_FILL_IN_BLANK,
QUESTION_TYPE_FIND_MISTAKE,
QUESTION_TYPE_MATCHING,
QUESTION_TYPE_MATCHING_IMAGE,
QUESTION_TYPE_MATCHING_SENTENCES,
QUESTION_TYPE_MULTIPLE_CHOICE,
QUESTION_TYPE_ORDERING,
QUESTION_TYPE_SINGLE_CHOICE,
QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN,
SKILL_LISTENING,
SKILL_SPEAKING,
SKILL_WRITING
} from '@/constants/enums';
import { parseDate } from '@/lib/date';
import { Head,router } from '@inertiajs/react';
import {
AlertTriangle,
CheckCircle2,
Clock,
CloudUpload,
FileCheck,
FileText,
LayoutGrid,
Send,
Volume2,
X,
} from 'lucide-react';
import { useCallback,useEffect,useRef,useState } from 'react';
import AudioRecorder from './components/AudioRecorder';
import DiagramLabellingQuestion from './components/DiagramLabellingQuestion';
import DragDropClozeQuestion from './components/DragDropClozeQuestion';
import FindMistakeQuestion from './components/FindMistakeQuestion';
import MatchingAnswerForm from './components/MatchingAnswerForm';
import MatchingImageAnswerForm from './components/MatchingImageAnswerForm';
import SortableOrderingList from './components/SortableOrderingList';
import { ClassExam,ClassExamSubmission,ExamQuestionData,ExamSectionData,Student } from './types';

interface Props {
    classExam: ClassExam;
    submission: ClassExamSubmission;
    serverTime: string;
    student: Student;
}

function getCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    if (meta?.content) return meta.content;

    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);

    return '';
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

    // Answers State initialized directly from Redis Cache / Server Submission
    const [answers, setAnswers] = useState<Record<number | string, any>>(() => {
        return submission.answers || {};
    });

    // Auto-Save Status: 'saved' | 'saving' | 'offline'
    const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstMount = useRef(true);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
    const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

    // ─── Countdown Timer Setup With Server Clock Drift Sync ───
    const durationMinutes = classExam.duration_minutes || exam?.duration_minutes || 45;
    const totalSecondsAllocated = durationMinutes * 60;

    const startedAtTimestamp = submission.started_at
        ? parseDate(submission.started_at)?.getTime() || new Date(submission.started_at).getTime()
        : Date.now();

    const serverOffsetMs = serverTime
        ? (parseDate(serverTime)?.getTime() || new Date(serverTime).getTime()) - Date.now()
        : 0;

    const calculateRemainingSeconds = useCallback(() => {
        const effectiveNow = Date.now() + serverOffsetMs;
        const elapsedSeconds = Math.max(0, Math.floor((effectiveNow - startedAtTimestamp) / 1000));
        return Math.max(0, totalSecondsAllocated - elapsedSeconds);
    }, [serverOffsetMs, startedAtTimestamp, totalSecondsAllocated]);

    const [remainingSeconds, setRemainingSeconds] = useState(calculateRemainingSeconds);
    const hasAutoSubmittedRef = useRef(false);

    // ─── Background Server AutoSave (Saves into Redis Cache with TTL) ───
    const syncToServer = useCallback(async (currentAnswers: Record<number | string, any>) => {
        setAutoSaveStatus('saving');
        try {
            const token = getCsrfToken();
            const res = await fetch(`/class-exams/${classExam.id}/autosave/${submission.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-XSRF-TOKEN': token,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ answers: currentAnswers }),
            });

            if (res.ok) {
                setAutoSaveStatus('saved');
            } else {
                setAutoSaveStatus('offline');
            }
        } catch {
            setAutoSaveStatus('offline');
        }
    }, [classExam.id, submission.id]);

    // ─── Debounced AutoSave to Redis Server (2.0s) ───
    useEffect(() => {
        // Avoid triggering background autosave on initial load mount
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        setAutoSaveStatus('saving');
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
            syncToServer(answers);
        }, 2000);

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [answers, syncToServer]);

    // ─── Timer Interval ───
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
    }, [calculateRemainingSeconds]);

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
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-2xs text-gray-500 font-medium">
                                    Thí sinh: <strong className="text-gray-800">{student.full_name}</strong> ({student.student_code || student.username})
                                </p>
                                
                                {/* Auto-Save Status Indicator */}
                                {autoSaveStatus === 'saving' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-2xs font-semibold animate-pulse">
                                        <CloudUpload className="h-3 w-3 text-amber-600 animate-bounce" />
                                        Đang lưu...
                                    </span>
                                )}
                                {autoSaveStatus === 'saved' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-2xs font-medium">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                        Đã tự động lưu
                                    </span>
                                )}
                                {autoSaveStatus === 'offline' && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-2xs font-medium">
                                        <AlertTriangle className="h-3 w-3 text-rose-600" />
                                        Đã lưu máy (Mất mạng)
                                    </span>
                                )}
                            </div>
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
            <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-28 sm:pb-32 lg:pb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Questions Column */}
                <main className="lg:col-span-8 space-y-6">
                    {sections.map((section, sIdx) => {
                        return (
                            <div key={section.id || sIdx} className="space-y-4">
                                {/* Section Header Card */}
                                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                            <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black ${
                                                section.skill === SKILL_LISTENING ? 'bg-blue-100 text-blue-800' :
                                                section.skill === SKILL_WRITING ? 'bg-amber-100 text-amber-800' :
                                                section.skill === SKILL_SPEAKING ? 'bg-pink-100 text-pink-800' :
                                                'bg-emerald-100 text-emerald-800'
                                            }`}>
                                                {sIdx + 1}
                                            </span>
                                            {section.title}
                                        </h2>
                                        <span className={`text-2xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                            section.skill === SKILL_LISTENING ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                            section.skill === SKILL_WRITING ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                            section.skill === SKILL_SPEAKING ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}>
                                            {section.skill === SKILL_LISTENING ? '🎧 Listening' : section.skill === SKILL_WRITING ? '✍️ Writing' : section.skill === SKILL_SPEAKING ? '🗣️ Speaking' : '📖 Reading'}
                                        </span>
                                    </div>

                                    {section.description && (
                                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-1.5">
                                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                                                <FileText className="h-4 w-4 text-indigo-600 shrink-0" />
                                                <span>Mô Tả / Đoạn Văn Bản Hướng Dẫn Chung Cho Phần Này</span>
                                            </div>
                                            <div className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">
                                                {section.description}
                                            </div>
                                        </div>
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
                                                    <span className="text-xs sm:text-sm font-bold text-gray-900">
                                                        {q.title || q.code || `Câu ${qGlobalNum}`}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                                    {q.score} điểm
                                                </span>
                                            </div>

                                            {/* Question Content */}
                                            <div className="text-sm font-semibold text-gray-900 whitespace-pre-wrap leading-relaxed">
                                                {q.question_type === QUESTION_TYPE_FILL_IN_BLANK ? (
                                                    <RenderFillInBlankQuestion
                                                        content={q.content}
                                                        userAnswers={currentVal || {}}
                                                        onChange={(newBlankAns) => handleAnswerChange(q.id!, newBlankAns)}
                                                    />
                                                ) : q.question_type === QUESTION_TYPE_DRAG_DROP_CLOZE ? null : (
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

                                            {q.image_url && q.question_type !== QUESTION_TYPE_DIAGRAM_LABELLING && (
                                                <div className="rounded-xl border border-gray-200 p-2 bg-slate-50 flex justify-center max-h-60 overflow-hidden">
                                                    <img
                                                        src={q.image_url}
                                                        alt="Minh họa"
                                                        className="max-h-56 object-contain rounded"
                                                        onError={(e) => {
                                                            (e.target as HTMLElement).style.display = 'none';
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {/* Question Type Interactive Answer Form */}
                                            <div className="pt-2">
                                                {/* 1. Single Choice */}
                                                {q.question_type === QUESTION_TYPE_SINGLE_CHOICE && (
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
                                                {q.question_type === QUESTION_TYPE_MULTIPLE_CHOICE && (
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
                                                {q.question_type === QUESTION_TYPE_TRUE_FALSE_NOT_GIVEN && (
                                                    <div className={`grid grid-cols-1 ${
                                                        Array.isArray(q.options) && q.options.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
                                                    } gap-2.5`}>
                                                        {(Array.isArray(q.options) && q.options.length > 0
                                                            ? q.options.map((opt: any) =>
                                                                  typeof opt === 'string'
                                                                      ? { id: opt, label: opt }
                                                                      : {
                                                                            id: String(opt.id ?? opt.key ?? opt.value ?? ''),
                                                                            label: String(opt.label ?? opt.text ?? opt.content ?? opt.id ?? ''),
                                                                        }
                                                              )
                                                            : [
                                                                  { id: 'TRUE', label: 'TRUE' },
                                                                  { id: 'FALSE', label: 'FALSE' },
                                                                  { id: 'NOT_GIVEN', label: 'NOT GIVEN' },
                                                              ]
                                                        ).map((opt) => {
                                                            const isSelected =
                                                                currentVal !== null &&
                                                                currentVal !== undefined &&
                                                                String(currentVal).trim().toUpperCase() === opt.id.toUpperCase();
                                                            return (
                                                                <button
                                                                    key={opt.id}
                                                                    type="button"
                                                                    onClick={() => handleAnswerChange(q.id!, opt.id)}
                                                                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                                                                        isSelected
                                                                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                                                                            : 'border-gray-200 bg-white text-gray-800 hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    {opt.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* 4. Drag Drop Cloze */}
                                                {q.question_type === QUESTION_TYPE_DRAG_DROP_CLOZE && (
                                                    <DragDropClozeQuestion
                                                        content={q.content}
                                                        options={q.options}
                                                        userAnswers={currentVal || {}}
                                                        onChange={(newMap) => handleAnswerChange(q.id!, newMap)}
                                                    />
                                                )}

                                                {/* 5. Matching */}
                                                {(q.question_type === QUESTION_TYPE_MATCHING || q.question_type === QUESTION_TYPE_MATCHING_SENTENCES) && (
                                                    <MatchingAnswerForm
                                                        options={q.options}
                                                        userAnswers={currentVal || {}}
                                                        onChange={(newMap) => handleAnswerChange(q.id!, newMap)}
                                                    />
                                                )}

                                                {/* 5. Matching Image */}
                                                {q.question_type === QUESTION_TYPE_MATCHING_IMAGE && (
                                                    <MatchingImageAnswerForm
                                                        options={q.options}
                                                        userAnswers={currentVal || {}}
                                                        onChange={(newMap) => handleAnswerChange(q.id!, newMap)}
                                                    />
                                                )}

                                                {/* 6. Find Mistake */}
                                                {q.question_type === QUESTION_TYPE_FIND_MISTAKE && (
                                                    <FindMistakeQuestion
                                                        content={q.content}
                                                        options={q.options}
                                                        value={String(currentVal || '')}
                                                        onChange={(ans) => handleAnswerChange(q.id!, ans)}
                                                    />
                                                )}

                                                {/* 7. Ordering (Drag and Drop) */}
                                                {q.question_type === QUESTION_TYPE_ORDERING && (
                                                    <SortableOrderingList
                                                        options={q.options}
                                                        value={Array.isArray(currentVal) ? currentVal : []}
                                                        onChange={(sortedIds) => handleAnswerChange(q.id!, sortedIds)}
                                                    />
                                                )}

                                                {/* 8. Diagram Labelling */}
                                                {q.question_type === QUESTION_TYPE_DIAGRAM_LABELLING && (
                                                    <DiagramLabellingQuestion
                                                        imageUrl={q.image_url}
                                                        options={q.options}
                                                        value={currentVal || {}}
                                                        onChange={(newMap) => handleAnswerChange(q.id!, newMap)}
                                                    />
                                                )}

                                                {/* 9. Essay Writing */}
                                                {q.question_type === QUESTION_TYPE_ESSAY && (
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

                                                {/* 10. Speaking Audio Recording */}
                                                {q.question_type === QUESTION_TYPE_AUDIO_RECORD && (
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

                {/* Sidebar Question Navigation Grid (Desktop) */}
                <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4">
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

            {/* Mobile Bottom Floating Action Bar (< lg) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-lg flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => setMobilePaletteOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 border border-slate-200 text-gray-800 text-xs font-bold active:scale-98 transition-transform"
                >
                    <LayoutGrid className="h-4 w-4 text-emerald-600" />
                    <span>Câu Hỏi ({answeredCount}/{allQuestions.length})</span>
                </button>

                <Button
                    type="button"
                    variant="success"
                    size="md"
                    className="flex-1 font-bold text-xs py-2.5 shadow-xs"
                    icon={<Send className="h-4 w-4" />}
                    onClick={() => setSubmitConfirmOpen(true)}
                    isLoading={isSubmitting}
                >
                    Nộp Bài
                </Button>
            </div>

            {/* Mobile Question Palette Modal Drawer (< lg) */}
            {mobilePaletteOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-t-3xl max-h-[80vh] flex flex-col shadow-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">
                                    Bảng Danh Sách Câu Hỏi
                                </h3>
                                <p className="text-2xs text-gray-500 mt-0.5">
                                    Đã hoàn thành <strong className="text-emerald-600">{answeredCount}</strong> trên tổng số {allQuestions.length} câu
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMobilePaletteOpen(false)}
                                className="h-8 w-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Question Numbers Grid Mobile */}
                        <div className="grid grid-cols-5 gap-2.5 overflow-y-auto max-h-[50vh] p-1">
                            {allQuestions.map((item) => {
                                const ans = answers[item.question.id!];
                                const isDone = ans !== undefined && ans !== null && ans !== '' && (!Array.isArray(ans) || ans.length > 0) && (typeof ans !== 'object' || Object.keys(ans).length > 0);

                                return (
                                    <button
                                        key={item.num}
                                        type="button"
                                        onClick={() => {
                                            scrollToQuestion(item.num);
                                            setMobilePaletteOpen(false);
                                        }}
                                        className={`h-11 rounded-xl font-mono text-xs font-black transition-all border ${
                                            isDone
                                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                                : 'bg-slate-50 text-gray-700 border-gray-200'
                                        }`}
                                    >
                                        {item.num}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="pt-2">
                            <Button
                                type="button"
                                variant="success"
                                size="lg"
                                className="w-full font-bold text-sm py-3"
                                icon={<Send className="h-4 w-4" />}
                                onClick={() => {
                                    setMobilePaletteOpen(false);
                                    setSubmitConfirmOpen(true);
                                }}
                                isLoading={isSubmitting}
                            >
                                Nộp Bài Thi Ngay
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
    const parts = (content || '').split(/(\[[^\]]+\])/g);
    let blankCounter = 0;

    const handleBlankChange = (tagKey: string, val: string) => {
        onChange({
            ...userAnswers,
            [tagKey]: val,
        });
    };

    const hasBrackets = /\[[^\]]+\]/.test(content || '');

    if (!hasBrackets) {
        return (
            <div className="space-y-3">
                <p>{content}</p>
                <div className="flex items-center gap-2 max-w-md">
                    <span className="text-xs font-bold text-gray-500 font-mono">(1)</span>
                    <input
                        type="text"
                        value={userAnswers['blank_1'] ?? userAnswers['0'] ?? ''}
                        onChange={(e) => handleBlankChange('blank_1', e.target.value)}
                        placeholder="Nhập câu trả lời..."
                        className="w-full rounded-lg border border-amber-300 bg-amber-50/40 px-3 py-1.5 font-mono text-xs font-bold text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                    />
                </div>
            </div>
        );
    }

    return (
        <span className="inline leading-loose">
            {parts.map((part, pIdx) => {
                const match = part.match(/^\[([^\]]+)\]$/);
                if (match) {
                    blankCounter++;
                    const currentIdx = blankCounter;
                    const rawKey = match[1].trim();
                    const isBlankNum = /^blank_(\d+)$/i.exec(rawKey);
                    const tagKey = isBlankNum ? `blank_${isBlankNum[1]}` : `blank_${currentIdx}`;
                    const fallbackKey = String(currentIdx - 1);
                    const currentVal = userAnswers[tagKey] ?? userAnswers[fallbackKey] ?? '';

                    return (
                        <input
                            key={pIdx}
                            type="text"
                            value={currentVal}
                            onChange={(e) => handleBlankChange(tagKey, e.target.value)}
                            placeholder={`(${currentIdx})`}
                            className="mx-1.5 inline-block w-32 rounded-lg border border-amber-300 bg-amber-50/50 px-2.5 py-1 font-mono text-xs font-bold text-gray-900 focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                    );
                }
                return <span key={pIdx}>{part}</span>;
            })}
        </span>
    );
}
