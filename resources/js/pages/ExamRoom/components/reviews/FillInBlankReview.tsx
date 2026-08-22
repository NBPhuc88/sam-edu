import React from 'react';
import { Check, X } from 'lucide-react';
import { QuestionReviewItem } from '../QuestionReviewDetail';

interface Props {
    question: QuestionReviewItem;
}

export default function FillInBlankReview({ question }: Props) {
    const { content, correct_answer, user_answer, options } = question;

    const userAnsObj: Record<string, string> = React.useMemo(() => {
        if (typeof user_answer === 'object' && user_answer !== null) {
            return user_answer;
        }
        if (typeof user_answer === 'string') {
            return { blank_1: user_answer, '0': user_answer };
        }
        return {};
    }, [user_answer]);

    const correctAnsObj: Record<string, any> = React.useMemo(() => {
        if (typeof correct_answer === 'object' && correct_answer !== null) {
            return correct_answer;
        }
        if (typeof correct_answer === 'string') {
            return { blank_1: correct_answer, '0': correct_answer };
        }
        return {};
    }, [correct_answer]);

    const parts = (content || '').split(/(\[[^\]]+\])/g);
    const hasBrackets = /\[[^\]]+\]/.test(content || '');
    let blankCount = 0;

    const slotsList: Array<{
        index: number;
        tagKey: string;
        userVal: string;
        correctText: string;
        isCorrect: boolean;
    }> = [];

    return (
        <div className="space-y-4 pt-2">
            {/* Inline Paragraph Render */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200 leading-loose text-xs sm:text-sm font-medium text-gray-900 shadow-2xs">
                {hasBrackets ? (
                    parts.map((part, idx) => {
                        const match = part.match(/^\[([^\]]+)\]$/);
                        if (match) {
                            blankCount++;
                            const rawKey = match[1].trim();
                            const isBlankNum = /^blank_(\d+)$/i.exec(rawKey);
                            const tagKey = isBlankNum ? `blank_${isBlankNum[1]}` : `blank_${blankCount}`;
                            const uVal = String(userAnsObj[tagKey] ?? userAnsObj[rawKey] ?? userAnsObj[String(blankCount - 1)] ?? '').trim();

                            const cData = correctAnsObj[tagKey] ?? correctAnsObj[rawKey] ?? correctAnsObj[String(blankCount - 1)];
                            let cValText = '';
                            if (typeof cData === 'object' && cData?.accepted_answers) {
                                cValText = Array.isArray(cData.accepted_answers)
                                    ? cData.accepted_answers.join(' / ')
                                    : String(cData.accepted_answers);
                            } else if (typeof cData === 'string') {
                                cValText = cData;
                            } else {
                                cValText = String(cData ?? '');
                            }

                            const isBlankCorrect =
                                uVal !== '' &&
                                cValText
                                    .toLowerCase()
                                    .split(' / ')
                                    .some((acc) => acc.trim().toLowerCase() === uVal.toLowerCase());

                            slotsList.push({
                                index: blankCount,
                                tagKey,
                                userVal: uVal,
                                correctText: cValText,
                                isCorrect: isBlankCorrect,
                            });

                            return (
                                <span key={idx} className="inline-flex flex-wrap items-center gap-1.5 mx-1 my-1 align-middle">
                                    {isBlankCorrect ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold shadow-2xs">
                                            <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-3xs text-white font-mono">
                                                {blankCount}
                                            </span>
                                            <span>{uVal}</span>
                                            <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" />
                                        </span>
                                    ) : (
                                        <span className="inline-flex flex-wrap items-center gap-1">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-950 font-bold shadow-2xs">
                                                <span className="flex h-4 w-4 items-center justify-center rounded bg-rose-600 text-3xs text-white font-mono">
                                                    {blankCount}
                                                </span>
                                                <span className={uVal ? '' : 'italic opacity-60'}>
                                                    {uVal || '(Chưa điền)'}
                                                </span>
                                                <X className="h-3.5 w-3.5 text-rose-700 stroke-[3]" />
                                            </span>
                                            {cValText && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-bold shadow-2xs">
                                                    ✓ Đúng: {cValText}
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </span>
                            );
                        }
                        return <span key={idx}>{part}</span>;
                    })
                ) : (
                    <span>{content}</span>
                )}
            </div>

            {/* Summary Grid of All Blanks */}
            {slotsList.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {slotsList.map((slot) => (
                        <div
                            key={slot.index}
                            className={`flex items-center justify-between p-3 rounded-2xl border ${
                                slot.isCorrect
                                    ? 'border-emerald-300 bg-emerald-50/60'
                                    : 'border-rose-300 bg-rose-50/60'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                                        slot.isCorrect
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-rose-600 text-white'
                                    }`}
                                >
                                    {slot.index}
                                </span>
                                <div className="text-xs">
                                    <span className="text-gray-500 block text-2xs font-bold uppercase tracking-wider">
                                        Bài làm:
                                    </span>
                                    <span className={`font-bold ${slot.isCorrect ? 'text-emerald-950' : 'text-rose-950'}`}>
                                        {slot.userVal || '(Bỏ trống)'}
                                    </span>
                                </div>
                            </div>

                            {!slot.isCorrect && slot.correctText && (
                                <div className="text-right text-xs">
                                    <span className="text-emerald-700 block text-2xs font-bold uppercase tracking-wider">
                                        Đáp án chuẩn:
                                    </span>
                                    <span className="font-bold text-emerald-900">{slot.correctText}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
