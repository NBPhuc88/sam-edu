import React from 'react';
import { Clock, Pause, Play, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Props {
    title: string;
    code?: string;
    timeLeft: number; // in seconds
    isPaused?: boolean;
    onTogglePause?: () => void;
    allowPause?: boolean;
    totalQuestions: number;
    answeredCount: number;
    onSubmit: () => void;
    isSubmitting?: boolean;
}

export default function ExamTimerHeader({
    title,
    code,
    timeLeft,
    isPaused = false,
    onTogglePause,
    allowPause = false,
    totalQuestions,
    answeredCount,
    onSubmit,
    isSubmitting = false,
}: Props) {
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const isUrgent = timeLeft < 300; // less than 5 mins
    const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    return (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Title & Progress */}
                    <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h1 className="text-base sm:text-lg font-extrabold text-gray-900 truncate">
                                {title}
                            </h1>
                            {code && (
                                <span className="font-mono text-2xs font-bold text-gray-500 bg-slate-100 px-2 py-0.5 rounded-md border border-gray-200 shrink-0">
                                    {code}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                            <span>
                                Tiến độ: <strong className="text-emerald-700">{answeredCount}</strong> / {totalQuestions} câu ({progressPercent}%)
                            </span>
                            <div className="w-24 sm:w-32 bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Timer & Submit Controls */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Countdown Timer Badge */}
                        <div
                            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-sm sm:text-base font-bold shadow-2xs transition-colors ${
                                isUrgent
                                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                                    : 'bg-slate-900 border-slate-800 text-white'
                            }`}
                        >
                            <Clock className="h-4 w-4 shrink-0" />
                            <span>{formatTime(timeLeft)}</span>
                        </div>

                        {/* Pause button if allowed */}
                        {allowPause && onTogglePause && (
                            <button
                                type="button"
                                onClick={onTogglePause}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors shadow-2xs"
                                title={isPaused ? 'Tiếp tục làm bài' : 'Tạm dừng làm bài'}
                            >
                                {isPaused ? <Play className="h-4 w-4 fill-current text-emerald-600" /> : <Pause className="h-4 w-4" />}
                            </button>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="button"
                            variant="success"
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            icon={<Send className="h-4 w-4" />}
                        >
                            {isSubmitting ? 'Đang nộp bài...' : 'Nộp Bài Thi'}
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
