import { Check,X } from 'lucide-react';
import React from 'react';
import { QuestionReviewItem } from '../QuestionReviewDetail';

interface Props {
    question: QuestionReviewItem;
}

export default function DragDropClozeReview({ question }: Props) {
    const { content, options, correct_answer, user_answer } = question;

    const wordsList: Array<{ id: string; text: string }> = Array.isArray(options?.words) ? options.words : [];

    const getWordText = (wordId: any) => {
        if (!wordId) return '';
        const found = wordsList.find((w) => String(w.id) === String(wordId));
        return found ? found.text : String(wordId);
    };

    const userAnsMap: Record<string, string> = React.useMemo(() => {
        if (typeof user_answer === 'object' && user_answer !== null) {
            return user_answer;
        }
        return {};
    }, [user_answer]);

    const correctAnsMap: Record<string, string> = React.useMemo(() => {
        if (typeof correct_answer === 'object' && correct_answer !== null) {
            return correct_answer;
        }
        return {};
    }, [correct_answer]);

    const parts = (content || '').split(/(\[[^\]]+\])/g);
    let blankIndex = 0;

    return (
        <div className="space-y-4 pt-2">
            {/* Word Bank Reference */}
            {wordsList.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-2xs space-y-1.5">
                    <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 block">
                        Danh sách từ vựng đã cho (Word Bank):
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {wordsList.map((w) => (
                            <span
                                key={w.id}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1 text-xs font-bold text-indigo-950 shadow-2xs"
                            >
                                <span className="font-mono text-3xs bg-indigo-200/80 text-indigo-900 px-1 py-0.5 rounded">
                                    {w.id}
                                </span>
                                <span>{w.text}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Paragraph with filled slots */}
            <div className="p-4 bg-white rounded-2xl border border-gray-200 leading-loose text-xs sm:text-sm font-medium text-gray-900 shadow-2xs">
                {parts.map((part, idx) => {
                    const match = part.match(/^\[([^\]]+)\]$/);
                    if (match) {
                        blankIndex++;
                        const currentSlot = blankIndex;
                        const rawKey = match[1].trim();
                        const isBlankNum = /^blank_(\d+)$/i.exec(rawKey);
                        const tagKey = isBlankNum ? `blank_${isBlankNum[1]}` : `blank_${currentSlot}`;

                        const uWordId = userAnsMap[tagKey] ?? userAnsMap[rawKey] ?? userAnsMap[String(currentSlot - 1)];
                        const cWordId = correctAnsMap[tagKey] ?? correctAnsMap[rawKey] ?? correctAnsMap[String(currentSlot - 1)];

                        const uWordText = getWordText(uWordId);
                        const cWordText = getWordText(cWordId);

                        const isSlotCorrect = uWordId && cWordId && String(uWordId) === String(cWordId);

                        return (
                            <span key={idx} className="inline-flex flex-wrap items-center gap-1.5 mx-1 my-1 align-middle">
                                {isSlotCorrect ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 font-bold shadow-2xs">
                                        <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-3xs text-white font-mono">
                                            {currentSlot}
                                        </span>
                                        <span>{uWordText}</span>
                                        <Check className="h-3.5 w-3.5 text-emerald-700 stroke-[3]" />
                                    </span>
                                ) : (
                                    <span className="inline-flex flex-wrap items-center gap-1">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border-2 border-rose-500 text-rose-950 font-bold shadow-2xs">
                                            <span className="flex h-4 w-4 items-center justify-center rounded bg-rose-600 text-3xs text-white font-mono">
                                                {currentSlot}
                                            </span>
                                            <span className={uWordText ? '' : 'italic opacity-60'}>
                                                {uWordText || '(Chưa điền)'}
                                            </span>
                                            <X className="h-3.5 w-3.5 text-rose-700 stroke-[3]" />
                                        </span>
                                        {cWordText && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 text-2xs font-bold shadow-2xs">
                                                ✓ Đúng: {cWordText}
                                            </span>
                                        )}
                                    </span>
                                )}
                            </span>
                        );
                    }
                    return <span key={idx}>{part}</span>;
                })}
            </div>
        </div>
    );
}
