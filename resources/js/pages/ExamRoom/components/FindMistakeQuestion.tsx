import React from 'react';

interface Props {
    content?: string;
    options: any;
    value: string;
    onChange: (ans: string) => void;
}

export default function FindMistakeQuestion({ content, options, value, onChange }: Props) {
    const { sentenceSegments, optionsList } = React.useMemo(() => {
        if (!options) return { sentenceSegments: [], optionsList: [] };

        // Format A: { sentence_segments: [{ text: '...', underlined: true, id: 'A' }, ...] }
        if (Array.isArray(options.sentence_segments) && options.sentence_segments.length > 0) {
            const segs = options.sentence_segments;
            const opts = segs.filter((s: any) => s.underlined).map((s: any) => ({
                id: String(s.id ?? s.key ?? ''),
                text: String(s.text ?? ''),
            }));
            return { sentenceSegments: segs, optionsList: opts };
        }

        // Format B: Array of options [{ key: 'A', text: '...' }, ...]
        if (Array.isArray(options) && options.length > 0) {
            const opts = options.map((item: any, idx: number) => ({
                id: String(item.key ?? item.id ?? String.fromCharCode(65 + idx)),
                text: String(item.text ?? item.content ?? item.label ?? (typeof item === 'string' ? item : '')),
            }));
            return { sentenceSegments: [], optionsList: opts };
        }

        return {
            sentenceSegments: [],
            optionsList: ['A', 'B', 'C', 'D'].map((char) => ({ id: char, text: `Phương án (${char})` })),
        };
    }, [options]);

    return (
        <div className="space-y-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
            {/* If sentence segments are available, render interactive sentence with underlined words */}
            {sentenceSegments.length > 0 && (
                <div className="p-4 bg-white rounded-xl border border-gray-200 leading-loose text-sm font-medium text-gray-900 shadow-2xs">
                    {sentenceSegments.map((seg: any, idx: number) => {
                        if (seg.underlined) {
                            const isChosen = String(value) === String(seg.id);
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => onChange(String(seg.id))}
                                    className={`inline-flex flex-col items-center mx-1 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                        isChosen
                                            ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-400/40 shadow-xs'
                                            : 'border-gray-200 bg-slate-50 text-gray-900 underline underline-offset-4 decoration-rose-500 decoration-2 hover:bg-rose-50/60'
                                    }`}
                                >
                                    <span>{seg.text}</span>
                                    <span className="text-2xs font-mono font-bold text-rose-700 bg-rose-100 px-1 rounded mt-0.5">
                                        ({seg.id})
                                    </span>
                                </button>
                            );
                        }
                        return <span key={idx}>{seg.text}</span>;
                    })}
                </div>
            )}

            {/* Selection Buttons Bar */}
            <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                    Chọn phần gạch chân chứa lỗi sai cần sửa:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {optionsList.map((opt: any) => {
                        const isSelected = String(value) === String(opt.id);
                        return (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => onChange(String(opt.id))}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                    isSelected
                                        ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-400/40 shadow-xs'
                                        : 'border-gray-200 bg-white text-gray-800 hover:bg-slate-50'
                                }`}
                            >
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                                    isSelected
                                        ? 'bg-rose-600 text-white shadow-2xs'
                                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}>
                                    {opt.id}
                                </span>
                                <span className="text-xs font-semibold truncate">
                                    {opt.text}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
