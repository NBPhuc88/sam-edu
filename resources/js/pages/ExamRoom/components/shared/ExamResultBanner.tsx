import React, { ReactNode } from 'react';
import { Award, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

export interface ExamResultSummaryData {
    earned_score: number;
    max_score: number;
    percentage: number;
    is_passed: boolean;
    total_questions: number;
    correct_count: number;
    incorrect_count: number;
    skipped_count?: number;
    duration_formatted?: string;
}

interface Props {
    title: string;
    code?: string;
    summary: ExamResultSummaryData;
    actions?: ReactNode;
}

export default function ExamResultBanner({
    title,
    code,
    summary,
    actions,
}: Props) {
    const isPassed = summary.is_passed;

    return (
        <div className="overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-md">
            {/* Top Gradient Card */}
            <div
                className={`p-6 sm:p-8 text-white ${
                    isPassed
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                        : 'bg-gradient-to-r from-rose-600 to-amber-700'
                }`}
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-xs">
                            <Award className="h-3.5 w-3.5" />
                            {isPassed ? 'Chúc mừng! Bạn đã đạt yêu cầu' : 'Kết quả bài thi'}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold">{title}</h1>
                        {code && <p className="text-xs text-white/80 font-mono">Mã đề: {code}</p>}
                    </div>

                    <div className="flex items-center gap-4 bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-xs">
                        <div className="text-center">
                            <span className="block text-2xs uppercase tracking-wider text-white/80 font-bold">
                                Điểm Đạt Được
                            </span>
                            <span className="text-3xl sm:text-4xl font-extrabold text-white">
                                {summary.earned_score}
                                <span className="text-lg font-normal text-white/70"> / {summary.max_score}</span>
                            </span>
                        </div>
                        <div className="h-12 w-px bg-white/20" />
                        <div className="text-center">
                            <span className="block text-2xs uppercase tracking-wider text-white/80 font-bold">
                                Tỉ Lệ Đúng
                            </span>
                            <span className="text-3xl sm:text-4xl font-extrabold text-white">
                                {summary.percentage}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 border-t border-gray-100 text-center">
                <div>
                    <span className="block text-2xs text-gray-500 font-bold uppercase">Tổng Số Câu</span>
                    <span className="text-lg font-extrabold text-gray-800">{summary.total_questions}</span>
                </div>
                <div>
                    <span className="block text-2xs text-emerald-600 font-bold uppercase">Số Câu Đúng</span>
                    <span className="text-lg font-extrabold text-emerald-700 flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {summary.correct_count}
                    </span>
                </div>
                <div>
                    <span className="block text-2xs text-rose-600 font-bold uppercase">Số Câu Sai</span>
                    <span className="text-lg font-extrabold text-rose-700 flex items-center justify-center gap-1">
                        <XCircle className="h-4 w-4" />
                        {summary.incorrect_count}
                    </span>
                </div>
                <div>
                    <span className="block text-2xs text-amber-600 font-bold uppercase">
                        {summary.duration_formatted ? 'Thời Gian Làm' : 'Chưa Làm'}
                    </span>
                    <span className="text-lg font-extrabold text-amber-700 flex items-center justify-center gap-1">
                        {summary.duration_formatted ? (
                            <>
                                <Clock className="h-4 w-4" />
                                {summary.duration_formatted}
                            </>
                        ) : (
                            <>
                                <AlertCircle className="h-4 w-4" />
                                {summary.skipped_count ?? 0}
                            </>
                        )}
                    </span>
                </div>
            </div>

            {/* Action Buttons if provided */}
            {actions && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border-t border-gray-100">
                    {actions}
                </div>
            )}
        </div>
    );
}
