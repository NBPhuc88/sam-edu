import React from 'react';

interface Props {
    content: string;
    options?: any;
    metadata?: any;
    value: Record<string, string>;
    onChange: (val: Record<string, string>) => void;
}

export default function FillInBlankRunner({
    content,
    options,
    metadata,
    value = {},
    onChange,
}: Props) {
    const bracketRegex = /\[([^\]]+)\]/g;
    const matches = Array.from((content || '').matchAll(bracketRegex));

    const slots = React.useMemo(() => {
        if (matches.length > 0) {
            return matches.map((m, idx) => {
                const raw = m[1].trim();
                const isBlankNum = /^blank_(\d+)$/i.exec(raw);
                const tagKey = isBlankNum ? `blank_${isBlankNum[1]}` : `blank_${idx + 1}`;
                return {
                    index: idx + 1,
                    tagKey,
                    fallbackKey: String(idx),
                    label: `Vị trí (${idx + 1})`,
                };
            });
        }
        return [
            {
                index: 1,
                tagKey: 'blank_1',
                fallbackKey: '0',
                label: 'Vị trí (1)',
            },
        ];
    }, [content]);

    const handleSlotChange = (tagKey: string, text: string) => {
        onChange({
            ...value,
            [tagKey]: text,
        });
    };

    return (
        <div className="space-y-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Nhập từ cần điền vào các vị trí trống ({slots.length} vị trí):
                </span>
                {metadata?.word_limit && (
                    <span className="text-2xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                        {metadata.word_limit}
                    </span>
                )}
            </div>

            {/* Word Bank Reference if available */}
            {metadata?.word_bank && Array.isArray(metadata.word_bank) && metadata.word_bank.length > 0 && (
                <div className="rounded-xl bg-white p-3 border border-gray-200 space-y-1.5 shadow-2xs">
                    <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 block">
                        Gợi ý từ vựng (Word Bank):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {metadata.word_bank.map((w: string, wIdx: number) => (
                            <span
                                key={wIdx}
                                className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200"
                            >
                                {w}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Slots Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slots.map((slot) => {
                    const currentAnswer = value[slot.tagKey] ?? value[slot.fallbackKey] ?? '';
                    return (
                        <div
                            key={slot.tagKey}
                            className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
                        >
                            <span className="flex h-7 px-2.5 shrink-0 items-center justify-center rounded-lg bg-amber-100 font-mono text-xs font-bold text-amber-900 border border-amber-200">
                                ({slot.index})
                            </span>
                            <input
                                type="text"
                                value={currentAnswer}
                                onChange={(e) => handleSlotChange(slot.tagKey, e.target.value)}
                                placeholder={`Nhập câu trả lời cho vị trí (${slot.index})...`}
                                className="w-full bg-transparent text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-hidden"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
