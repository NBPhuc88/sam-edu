import { Check,X } from 'lucide-react';
import { QuestionReviewItem } from '../QuestionReviewDetail';

interface Props {
    question: QuestionReviewItem;
}

export default function FindMistakeReview({ question }: Props) {
    const { options, correct_answer, user_answer } = question;

    const segs = Array.isArray(options?.sentence_segments) ? options.sentence_segments : [];
    const correctSegId = String(correct_answer ?? '').trim().toUpperCase();
    const userSegId = user_answer !== null && user_answer !== undefined ? String(user_answer).trim().toUpperCase() : null;

    const isCorrect = userSegId && correctSegId && userSegId === correctSegId;

    return (
        <div className="space-y-3 pt-2">
            {segs.length > 0 ? (
                <div className="p-4 bg-white rounded-2xl border border-gray-200 leading-loose text-xs sm:text-sm font-medium text-gray-900 shadow-2xs">
                    {segs.map((seg: any, idx: number) => {
                        if (seg.underlined) {
                            const segId = String(seg.id ?? '').trim().toUpperCase();
                            const isCorrectMistake = segId === correctSegId;
                            const isUserSelected = segId === userSegId;

                            let styleClass = 'border-gray-200 bg-slate-50 text-gray-800';
                            let badge = null;

                            if (isCorrectMistake && isUserSelected) {
                                styleClass = 'border-2 border-emerald-500 bg-emerald-100 text-emerald-950 font-bold shadow-xs';
                                badge = (
                                    <span className="inline-flex items-center gap-0.5 text-3xs font-bold text-emerald-800 bg-emerald-200/80 px-1.5 py-0.2 rounded ml-1">
                                        <Check className="h-2.5 w-2.5 stroke-[3]" /> Đúng
                                    </span>
                                );
                            } else if (isCorrectMistake) {
                                styleClass = 'border-2 border-emerald-500 bg-emerald-100 text-emerald-950 font-bold shadow-xs';
                                badge = (
                                    <span className="inline-flex items-center gap-0.5 text-3xs font-bold text-emerald-800 bg-emerald-200/80 px-1.5 py-0.2 rounded ml-1">
                                        <Check className="h-2.5 w-2.5 stroke-[3]" /> Lỗi sai đúng
                                    </span>
                                );
                            } else if (isUserSelected) {
                                styleClass = 'border-2 border-rose-500 bg-rose-100 text-rose-950 font-bold shadow-xs';
                                badge = (
                                    <span className="inline-flex items-center gap-0.5 text-3xs font-bold text-rose-800 bg-rose-200/80 px-1.5 py-0.2 rounded ml-1">
                                        <X className="h-2.5 w-2.5 stroke-[3]" /> Chọn sai
                                    </span>
                                );
                            }

                            return (
                                <span
                                    key={idx}
                                    className={`inline-flex items-center mx-1 px-2.5 py-1 rounded-xl border underline underline-offset-4 decoration-2 ${styleClass}`}
                                >
                                    <span className="font-mono text-2xs font-bold mr-1 opacity-70">
                                        ({segId})
                                    </span>
                                    <span>{seg.text}</span>
                                    {badge}
                                </span>
                            );
                        }
                        return <span key={idx}>{seg.text}</span>;
                    })}
                </div>
            ) : (
                <div className="p-3 bg-white rounded-2xl border border-gray-200 text-xs text-gray-800">
                    {question.content}
                </div>
            )}

            <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Lỗi sai bạn chọn:</span>
                    <span className={`font-bold ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {userSegId ? `[${userSegId}]` : '(Chưa chọn)'}
                    </span>
                </div>
                {!isCorrect && correctSegId && (
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                        <span className="text-emerald-700">Đáp án lỗi sai đúng:</span>
                        <span className="bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                            [{correctSegId}]
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
