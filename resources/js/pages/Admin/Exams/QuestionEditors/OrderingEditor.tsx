import React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

interface FragmentItem {
    id: string;
    text: string;
}

interface Props {
    options: FragmentItem[];
    correctAnswer: string[];
    onChangeOptions?: (options: FragmentItem[]) => void;
    onChangeCorrectAnswer?: (answer: string[]) => void;
    onChangeQuestion?: (fields: { options?: FragmentItem[]; correct_answer?: string[] }) => void;
}

export default function OrderingEditor({
    options = [],
    correctAnswer = [],
    onChangeOptions,
    onChangeCorrectAnswer,
    onChangeQuestion,
}: Props) {
    // Safely normalize options whether passed as array of objects, array of strings, or object map
    let rawOptionsList: any[] = [];
    if (Array.isArray(options)) {
        rawOptionsList = options;
    } else if (options && typeof options === 'object') {
        rawOptionsList = Object.entries(options).map(([key, val]) => {
            if (val && typeof val === 'object') {
                return { id: key, ...(val as object) };
            }
            return { id: key, text: String(val) };
        });
    }

    const safeOptions: FragmentItem[] = rawOptionsList.length > 0
        ? rawOptionsList.map((opt: any, idx: number) => {
            if (typeof opt === 'string') {
                return { id: `t${idx + 1}`, text: opt };
            }
            const id = String(opt?.id ?? opt?.key ?? opt?.value ?? `t${idx + 1}`);
            const text = String(opt?.text ?? opt?.label ?? opt?.content ?? opt?.value ?? '');
            return { id, text };
        })
        : [
            { id: 't1', text: '这本书' },
            { id: 't2', text: '请你' },
            { id: 't3', text: '借给' },
            { id: 't4', text: '王老师' },
        ];

    // Ensure correctAnswer has all ids in correct order
    const safeCorrectOrder = Array.isArray(correctAnswer) && correctAnswer.length > 0
        ? correctAnswer.map(String)
        : safeOptions.map((o) => o.id);

    const updateAll = (newOptions: FragmentItem[], newAns: string[]) => {
        if (onChangeQuestion) {
            onChangeQuestion({ options: newOptions, correct_answer: newAns });
        } else {
            onChangeOptions?.(newOptions);
            onChangeCorrectAnswer?.(newAns);
        }
    };

    const handleAddFragment = () => {
        const numbers = safeOptions.map((o) => {
            const m = String(o.id).match(/^t(\d+)$/i);
            return m ? parseInt(m[1], 10) : 0;
        });
        const maxNum = numbers.length > 0 ? Math.max(...numbers, 0) : 0;
        const nextId = `t${maxNum + 1}`;
        const newOptions = [...safeOptions, { id: nextId, text: '' }];
        updateAll(newOptions, [...safeCorrectOrder, nextId]);
    };

    const handleRemoveFragment = (index: number) => {
        if (safeOptions.length <= 2) return;
        const removed = safeOptions[index];
        const newOptions = safeOptions.filter((_, i) => i !== index);
        const newAns = safeCorrectOrder.filter((id) => id !== removed.id);
        updateAll(newOptions, newAns);
    };

    const handleTextChange = (index: number, text: string) => {
        const newOptions = [...safeOptions];
        newOptions[index] = { ...newOptions[index], text };
        updateAll(newOptions, safeCorrectOrder);
    };

    const moveOrder = (fromIdx: number, toIdx: number) => {
        if (toIdx < 0 || toIdx >= safeCorrectOrder.length) return;
        const newOrder = [...safeCorrectOrder];
        const [moved] = newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, moved);
        updateAll(safeOptions, newOrder);
    };

    // Helper map
    const optionMap = new Map(safeOptions.map((o) => [o.id, o.text]));

    return (
        <div className="space-y-6">
            {/* Section 1: Fragments Input */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            1. Danh Sách Các Mảnh Ghép / Cụm Từ Cần Sắp Xếp
                        </label>
                        <p className="text-xs text-gray-400">
                            Các mảnh này sẽ được xáo trộn ngẫu nhiên khi học sinh làm bài
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<Plus className="h-3.5 w-3.5 text-cyan-700" />}
                        onClick={handleAddFragment}
                    >
                        Thêm Mảnh Từ
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {safeOptions.map((item, idx) => (
                        <div key={item.id || idx} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-slate-50 p-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-100 font-mono text-2xs font-bold text-cyan-900">
                                {item.id}
                            </span>
                            <input
                                type="text"
                                value={item.text}
                                onChange={(e) => handleTextChange(idx, e.target.value)}
                                placeholder={`Nhập cụm từ ${item.id}...`}
                                className="flex-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 focus:border-cyan-500 focus:outline-hidden"
                                required
                            />
                            {safeOptions.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFragment(idx)}
                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Section 2: Correct Order Configurator */}
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-cyan-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-cyan-700" />
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-900">
                            2. Thứ Tự Chuẩn Hoàn Chỉnh (Correct Sequence)
                        </span>
                    </div>
                    <span className="text-xs text-cyan-800 font-medium">
                        Dùng nút Lên/Xuống để sắp xếp theo đúng thứ tự
                    </span>
                </div>

                <div className="space-y-2">
                    {safeCorrectOrder.map((id, idx) => {
                        const text = optionMap.get(id) || `[${id}]`;
                        return (
                            <div
                                key={id}
                                className="flex items-center justify-between rounded-lg border border-cyan-200 bg-white p-2.5 shadow-2xs"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600 font-mono text-xs font-extrabold text-white">
                                        {idx + 1}
                                    </span>
                                    <span className="font-mono text-2xs font-bold text-gray-400">
                                        ({id})
                                    </span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {text || <span className="italic text-gray-400">Chưa nhập nội dung</span>}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={idx === 0}
                                        onClick={() => moveOrder(idx, idx - 1)}
                                        className="rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Chuyển lên trước"
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={idx === safeCorrectOrder.length - 1}
                                        onClick={() => moveOrder(idx, idx + 1)}
                                        className="rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        title="Chuyển xuống sau"
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Sentence preview */}
                <div className="mt-3 rounded-lg bg-white/80 p-3 border border-cyan-200/70 text-xs">
                    <span className="font-bold text-cyan-900">Câu hoàn chỉnh: </span>
                    <span className="font-semibold text-gray-800">
                        {safeCorrectOrder.map((id) => optionMap.get(id)).filter(Boolean).join(' ')}
                    </span>
                </div>
            </div>
        </div>
    );
}
