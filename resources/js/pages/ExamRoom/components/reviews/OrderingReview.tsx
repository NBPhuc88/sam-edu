import React from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { QuestionReviewItem } from '../QuestionReviewDetail';

interface Props {
    question: QuestionReviewItem;
}

export default function OrderingReview({ question }: Props) {
    const { options, correct_answer, user_answer } = question;

    const itemsMap = React.useMemo<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        if (Array.isArray(options)) {
            options.forEach((item: any, idx: number) => {
                if (typeof item === 'string') {
                    map[String(idx + 1)] = item;
                } else if (item && typeof item === 'object') {
                    map[String(item.id ?? idx + 1)] = String(item.text ?? item.content ?? '');
                }
            });
        }
        return map;
    }, [options]);

    const userOrder: string[] = React.useMemo(() => {
        if (Array.isArray(user_answer)) {
            return user_answer.map(String);
        }
        return [];
    }, [user_answer]);

    const correctOrder: string[] = React.useMemo(() => {
        if (Array.isArray(correct_answer)) {
            return correct_answer.map(String);
        }
        return [];
    }, [correct_answer]);

    const isAllCorrect = React.useMemo(() => {
        if (userOrder.length === 0 || correctOrder.length === 0) return false;
        if (userOrder.length !== correctOrder.length) return false;
        return userOrder.every((id, idx) => id === correctOrder[idx]);
    }, [userOrder, correctOrder]);

    const getItemText = (id: string) => itemsMap[id] || `Mục ${id}`;

    return (
        <div className="space-y-4 pt-2">
            {isAllCorrect ? (
                /* ─── Case 1: Exactly 1 row in Green when correct 100% ─── */
                <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-300 w-fit shadow-2xs">
                        <Check className="h-4 w-4 stroke-[3] text-emerald-700" />
                        <span>Bạn đã sắp xếp thứ tự hoàn toàn chính xác!</span>
                    </div>

                    <div className="space-y-2">
                        {userOrder.map((id, idx) => (
                            <div
                                key={id}
                                className="flex items-center gap-3 p-3 rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-xs text-xs sm:text-sm"
                            >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold shadow-2xs">
                                    {idx + 1}
                                </span>
                                <span className="min-w-0 flex-1">{getItemText(id)}</span>
                                <Check className="h-4 w-4 text-emerald-700 stroke-[3] shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* ─── Case 2: 2 rows (User Sequence & Correct Sequence) when wrong ─── */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left: User Answer Order */}
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-100/80 px-3 py-1.5 rounded-xl border border-rose-300 w-fit shadow-2xs">
                            <X className="h-4 w-4 stroke-[3] text-rose-700" />
                            <span>Thứ tự bạn đã chọn:</span>
                        </div>

                        <div className="space-y-2">
                            {userOrder.length > 0 ? (
                                userOrder.map((id, idx) => {
                                    const isPositionCorrect = correctOrder[idx] === id;
                                    return (
                                        <div
                                            key={`${id}-${idx}`}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-xs sm:text-sm ${
                                                isPositionCorrect
                                                    ? 'border-2 border-emerald-500 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                                                    : 'border-2 border-rose-500 bg-rose-50/70 text-rose-950 font-bold shadow-xs'
                                            }`}
                                        >
                                            <span
                                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold ${
                                                    isPositionCorrect
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'bg-rose-600 text-white'
                                                }`}
                                            >
                                                {idx + 1}
                                            </span>
                                            <span className="min-w-0 flex-1">{getItemText(id)}</span>
                                            {isPositionCorrect ? (
                                                <Check className="h-4 w-4 text-emerald-700 stroke-[3] shrink-0" />
                                            ) : (
                                                <X className="h-4 w-4 text-rose-700 stroke-[3] shrink-0" />
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-4 rounded-2xl border border-dashed border-gray-300 bg-slate-50 text-xs text-gray-500 italic">
                                    (Chưa thực hiện sắp xếp)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Correct Answer Order */}
                    <div className="space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-300 w-fit shadow-2xs">
                            <Check className="h-4 w-4 stroke-[3] text-emerald-700" />
                            <span>Thứ tự đúng chuẩn của đề:</span>
                        </div>

                        <div className="space-y-2">
                            {correctOrder.map((id, idx) => (
                                <div
                                    key={`correct-${id}-${idx}`}
                                    className="flex items-center gap-3 p-3 rounded-2xl border-2 border-emerald-500 bg-emerald-50/90 text-emerald-950 font-bold shadow-xs text-xs sm:text-sm"
                                >
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold shadow-2xs">
                                        {idx + 1}
                                    </span>
                                    <span className="min-w-0 flex-1">{getItemText(id)}</span>
                                    <Check className="h-4 w-4 text-emerald-700 stroke-[3] shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
