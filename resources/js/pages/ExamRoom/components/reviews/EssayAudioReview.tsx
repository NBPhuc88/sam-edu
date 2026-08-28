import React from 'react';
import { Volume2, FileText, CheckCircle2 } from 'lucide-react';
import { QuestionReviewItem } from '../QuestionReviewDetail';
import { QUESTION_TYPE_AUDIO_RECORD } from '@/constants/enums';

interface Props {
    question: QuestionReviewItem;
}

export default function EssayAudioReview({ question }: Props) {
    const { question_type, correct_answer, user_answer, teacher_comment } = question;

    if (question_type === QUESTION_TYPE_AUDIO_RECORD) {
        const audioSrc = typeof user_answer === 'string' && user_answer
            ? (user_answer.startsWith('http') || user_answer.startsWith('/')
                ? user_answer
                : `/class-exams/audio-stream?path=${encodeURIComponent(user_answer)}`)
            : null;

        return (
            <div className="space-y-3 pt-2">
                <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-2 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <Volume2 className="h-4 w-4 text-indigo-600" />
                        <span>Bản ghi âm bài nói của bạn:</span>
                    </div>

                    {audioSrc ? (
                        <audio src={audioSrc} controls className="w-full h-10" />
                    ) : (
                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-gray-400 italic">
                            (Chưa có bản ghi âm nộp cho câu hỏi này)
                        </div>
                    )}
                </div>

                {correct_answer && (
                    <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs space-y-1.5 shadow-2xs">
                        <span className="font-bold uppercase tracking-wider text-2xs text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Gợi ý / Bài mẫu phát âm:
                        </span>
                        <div className="text-emerald-950 font-medium whitespace-pre-wrap leading-relaxed">
                            {String(correct_answer)}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Essay
    const essayText = typeof user_answer === 'string' ? user_answer : '';

    return (
        <div className="space-y-3 pt-2">
            <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span>Bài viết tự luận của bạn:</span>
                </div>

                {essayText ? (
                    <div className="p-3.5 bg-slate-50 rounded-xl text-xs sm:text-sm font-medium text-gray-900 whitespace-pre-wrap leading-relaxed border border-slate-200">
                        {essayText}
                    </div>
                ) : (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-gray-400 italic">
                        (Chưa có bài viết nộp cho câu hỏi này)
                    </div>
                )}
            </div>

            {correct_answer && (
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs space-y-1.5 shadow-2xs">
                    <span className="font-bold uppercase tracking-wider text-2xs text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Bài viết mẫu / Tiêu chí chấm điểm:
                    </span>
                    <div className="text-emerald-950 font-medium whitespace-pre-wrap leading-relaxed">
                        {String(correct_answer)}
                    </div>
                </div>
            )}
        </div>
    );
}
