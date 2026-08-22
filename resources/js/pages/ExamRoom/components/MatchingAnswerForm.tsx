import React from 'react';
import { ArrowRight } from 'lucide-react';

interface Props {
    options: any;
    userAnswers: Record<string, string>;
    onChange: (ans: Record<string, string>) => void;
}

export default function MatchingAnswerForm({ options, userAnswers = {}, onChange }: Props) {
    const { leftItems, rightItems } = React.useMemo<{
        leftItems: { id: string; text: string }[];
        rightItems: { id: string; text: string }[];
    }>(() => {
        if (!options) return { leftItems: [], rightItems: [] };

        // Format A: { left_items: [...], right_items: [...] }
        if (Array.isArray(options.left_items) && Array.isArray(options.right_items)) {
            return {
                leftItems: options.left_items.map((item: any, idx: number) => ({
                    id: String(item.id ?? idx + 1),
                    text: String(item.text ?? item.label ?? ''),
                })),
                rightItems: options.right_items.map((item: any, idx: number) => ({
                    id: String(item.id ?? idx + 1),
                    text: String(item.text ?? item.label ?? ''),
                })),
            };
        }

        // Format B: Array of { left: '...', right: '...' }
        if (Array.isArray(options)) {
            const lList: { id: string; text: string }[] = [];
            const rList: { id: string; text: string }[] = [];

            options.forEach((item: any, idx: number) => {
                const lText = item.left ?? item.left_text ?? item.text ?? '';
                const rText = item.right ?? item.right_text ?? item.match ?? '';
                const lId = String(item.left_id ?? item.id ?? lText ?? idx + 1);
                const rId = String(item.right_id ?? rText ?? idx + 1);

                if (lText) lList.push({ id: lId, text: lText });
                if (rText) rList.push({ id: rId, text: rText });
            });

            return { leftItems: lList, rightItems: rList };
        }

        return { leftItems: [], rightItems: [] };
    }, [options]);

    const handlePairChange = (lId: string, rId: string) => {
        onChange({
            ...userAnswers,
            [lId]: rId,
        });
    };

    if (leftItems.length === 0) {
        return (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-gray-500">
                Không có dữ liệu các cặp để ghép nối.
            </div>
        );
    }

    return (
        <div className="space-y-3 rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                Ghép nối các thông tin tương ứng ở hai vế ({leftItems.length} cặp):
            </span>

            <div className="space-y-2.5">
                {leftItems.map((lItem, idx) => {
                    const selectedRight = userAnswers[lItem.id] || '';

                    return (
                        <div
                            key={lItem.id}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all text-xs"
                        >
                            <div className="flex items-center gap-2 flex-1">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-100 font-mono text-xs font-bold text-purple-800 border border-purple-200">
                                    {idx + 1}
                                </span>
                                <span className="font-semibold text-gray-900 leading-relaxed">
                                    {lItem.text}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-1/2 shrink-0">
                                <ArrowRight className="h-4 w-4 text-purple-500 shrink-0 hidden sm:block" />
                                <select
                                    value={selectedRight}
                                    onChange={(e) => handlePairChange(lItem.id, e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-gray-900 focus:bg-white focus:outline-hidden"
                                >
                                    <option value="">-- Chọn vế ghép phù hợp --</option>
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
