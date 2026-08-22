import React from 'react';
import { Plus, Trash2, ArrowRight, GitMerge } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Item {
    id: string;
    label?: string;
    text?: string;
}

interface MatchingOptions {
    left_items: Item[];
    right_items: Item[];
}

interface Props {
    options: MatchingOptions;
    correctAnswer: Record<string, string>;
    onChangeOptions?: (options: MatchingOptions) => void;
    onChangeCorrectAnswer?: (answer: Record<string, string>) => void;
    onChangeQuestion?: (fields: { options?: MatchingOptions; correct_answer?: Record<string, string> }) => void;
}

export default function MatchingEditor({
    options = { left_items: [], right_items: [] },
    correctAnswer = {},
    onChangeOptions,
    onChangeCorrectAnswer,
    onChangeQuestion,
}: Props) {
    const leftItems: Item[] = options?.left_items && options.left_items.length > 0
        ? options.left_items.map((item: any, idx: number) => ({
            id: String(item?.id ?? item?.key ?? `L${idx + 1}`),
            label: String(item?.label ?? item?.text ?? item?.name ?? ''),
            text: String(item?.text ?? item?.label ?? ''),
        }))
        : [
            { id: 'L1', label: 'Vế 1 (Cột Trái)', text: 'Vế 1 (Cột Trái)' },
            { id: 'L2', label: 'Vế 2 (Cột Trái)', text: 'Vế 2 (Cột Trái)' },
            { id: 'L3', label: 'Vế 3 (Cột Trái)', text: 'Vế 3 (Cột Trái)' },
        ];

    const rightItems: Item[] = options?.right_items && options.right_items.length > 0
        ? options.right_items.map((item: any, idx: number) => ({
            id: String(item?.id ?? item?.key ?? `R${idx + 1}`),
            text: String(item?.text ?? item?.label ?? item?.name ?? ''),
            label: String(item?.label ?? item?.text ?? ''),
        }))
        : [
            { id: 'R1', text: 'Ý nghĩa / Tiêu đề i (Cột Phải)', label: 'Ý nghĩa / Tiêu đề i (Cột Phải)' },
            { id: 'R2', text: 'Ý nghĩa / Tiêu đề ii (Cột Phải)', label: 'Ý nghĩa / Tiêu đề ii (Cột Phải)' },
            { id: 'R3', text: 'Ý nghĩa / Tiêu đề iii (Cột Phải)', label: 'Ý nghĩa / Tiêu đề iii (Cột Phải)' },
            { id: 'R4', text: 'Ý nghĩa / Tiêu đề iv (Cột Phải - tùy chọn thừa)', label: 'Ý nghĩa / Tiêu đề iv (Cột Phải - tùy chọn thừa)' },
        ];

    const updateAll = (newOptions: MatchingOptions, newAns: Record<string, string>) => {
        if (onChangeQuestion) {
            onChangeQuestion({ options: newOptions, correct_answer: newAns });
        } else {
            onChangeOptions?.(newOptions);
            onChangeCorrectAnswer?.(newAns);
        }
    };

    const handleAddLeft = () => {
        const numbers = leftItems.map((i) => {
            const m = String(i.id).match(/^L(\d+)$/i);
            return m ? parseInt(m[1], 10) : 0;
        });
        const maxNum = numbers.length > 0 ? Math.max(...numbers, 0) : 0;
        const nextId = `L${maxNum + 1}`;
        const updated = [...leftItems, { id: nextId, label: '', text: '' }];
        updateAll({ ...options, left_items: updated, right_items: rightItems }, correctAnswer);
    };

    const handleRemoveLeft = (index: number) => {
        if (leftItems.length <= 1) return;
        const removed = leftItems[index];
        const updated = leftItems.filter((_, i) => i !== index);
        const newAns = { ...correctAnswer };
        delete newAns[removed.id];
        updateAll({ ...options, left_items: updated, right_items: rightItems }, newAns);
    };

    const handleLeftTextChange = (index: number, text: string) => {
        const updated = [...leftItems];
        updated[index] = { ...updated[index], label: text, text };
        updateAll({ ...options, left_items: updated, right_items: rightItems }, correctAnswer);
    };

    const handleAddRight = () => {
        const numbers = rightItems.map((i) => {
            const m = String(i.id).match(/^R(\d+)$/i);
            return m ? parseInt(m[1], 10) : 0;
        });
        const maxNum = numbers.length > 0 ? Math.max(...numbers, 0) : 0;
        const nextId = `R${maxNum + 1}`;
        const updated = [...rightItems, { id: nextId, text: '', label: '' }];
        updateAll({ ...options, left_items: leftItems, right_items: updated }, correctAnswer);
    };

    const handleRemoveRight = (index: number) => {
        if (rightItems.length <= 1) return;
        const removed = rightItems[index];
        const updated = rightItems.filter((_, i) => i !== index);
        const newAns = { ...correctAnswer };
        Object.keys(newAns).forEach((k) => {
            if (newAns[k] === removed.id) {
                delete newAns[k];
            }
        });
        updateAll({ ...options, left_items: leftItems, right_items: updated }, newAns);
    };

    const handleRightTextChange = (index: number, text: string) => {
        const updated = [...rightItems];
        updated[index] = { ...updated[index], text, label: text };
        updateAll({ ...options, left_items: leftItems, right_items: updated }, correctAnswer);
    };

    const handlePairChange = (leftId: string, rightId: string) => {
        const newAns = {
            ...correctAnswer,
            [leftId]: rightId,
        };
        if (!rightId) {
            delete newAns[leftId];
        }
        updateAll({ ...options, left_items: leftItems, right_items: rightItems }, newAns);
    };

    return (
        <div className="space-y-6">
            {/* 2 Columns Builder */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Column 1: Left Items */}
                <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-purple-200/60 pb-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-900">
                            Cột Trái (Left Items - Đề mục / Đoạn văn)
                        </span>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<Plus className="h-3 w-3 text-purple-700" />}
                            onClick={handleAddLeft}
                        >
                            Thêm Mục Trái
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {leftItems.map((item, idx) => (
                            <div key={item.id || idx} className="flex items-center gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-purple-200 font-mono text-2xs font-bold text-purple-900">
                                    {item.id}
                                </span>
                                <input
                                    type="text"
                                    value={item.label || item.text || ''}
                                    onChange={(e) => handleLeftTextChange(idx, e.target.value)}
                                    placeholder={`Nhập tên/nội dung mục ${item.id}...`}
                                    className="flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-purple-500 focus:outline-hidden"
                                    required
                                />
                                {leftItems.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLeft(idx)}
                                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Column 2: Right Items */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-200/60 pb-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                            Cột Phải (Right Items - Tiêu đề / Giải thích)
                        </span>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<Plus className="h-3 w-3 text-blue-700" />}
                            onClick={handleAddRight}
                        >
                            Thêm Mục Phải
                        </Button>
                    </div>

                    <div className="space-y-2">
                        {rightItems.map((item, idx) => (
                            <div key={item.id || idx} className="flex items-center gap-2">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-200 font-mono text-2xs font-bold text-blue-900">
                                    {item.id}
                                </span>
                                <input
                                    type="text"
                                    value={item.text || item.label || ''}
                                    onChange={(e) => handleRightTextChange(idx, e.target.value)}
                                    placeholder={`Nhập nội dung tiêu đề/câu ${item.id}...`}
                                    className="flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-hidden"
                                    required
                                />
                                {rightItems.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveRight(idx)}
                                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Answer Pairs Mapping Table */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
                    <GitMerge className="h-4 w-4 text-purple-600" />
                    Thiết Lập Cặp Ghép Đúng (Correct Answer Pairs)
                </div>

                <div className="space-y-2">
                    {leftItems.map((lItem) => {
                        const matchedRightId = correctAnswer?.[lItem.id] || '';
                        return (
                            <div
                                key={lItem.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg bg-slate-50 p-2.5 border border-slate-200"
                            >
                                <div className="flex items-center gap-2 sm:w-1/2">
                                    <span className="font-mono text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                                        {lItem.id}
                                    </span>
                                    <span className="text-xs font-medium text-gray-900 truncate">
                                        {lItem.label || lItem.text || `Mục ${lItem.id}`}
                                    </span>
                                </div>

                                <ArrowRight className="hidden sm:block h-4 w-4 text-gray-400 shrink-0" />

                                <div className="sm:w-1/2">
                                    <select
                                        value={matchedRightId}
                                        onChange={(e) => handlePairChange(lItem.id, e.target.value)}
                                        className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-900 focus:border-purple-500 focus:outline-hidden"
                                    >
                                        <option value="">-- Chọn mục ghép đúng ở cột phải --</option>
                                        {rightItems.map((rItem) => (
                                            <option key={rItem.id} value={rItem.id}>
                                                [{rItem.id}] {rItem.text || rItem.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
