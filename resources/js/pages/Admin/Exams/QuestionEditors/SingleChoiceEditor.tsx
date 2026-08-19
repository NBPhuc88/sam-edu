import React from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Option {
    id: string;
    text: string;
}

interface Props {
    options: Option[];
    correctAnswer: string | null;
    onChangeOptions: (options: Option[]) => void;
    onChangeCorrectAnswer: (answer: string) => void;
}

const DEFAULT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function SingleChoiceEditor({
    options = [],
    correctAnswer,
    onChangeOptions,
    onChangeCorrectAnswer,
}: Props) {
    const safeOptions: Option[] = options && options.length > 0
        ? options
        : [
            { id: 'A', text: '' },
            { id: 'B', text: '' },
            { id: 'C', text: '' },
            { id: 'D', text: '' },
        ];

    const handleAddOption = () => {
        const nextIndex = safeOptions.length;
        const nextId = DEFAULT_LABELS[nextIndex] || `OPT_${nextIndex + 1}`;
        onChangeOptions([...safeOptions, { id: nextId, text: '' }]);
    };

    const handleRemoveOption = (index: number) => {
        if (safeOptions.length <= 2) {
            return;
        }
        const removed = safeOptions[index];
        const newOptions = safeOptions.filter((_, i) => i !== index);
        onChangeOptions(newOptions);

        if (correctAnswer === removed.id) {
            onChangeCorrectAnswer(newOptions[0]?.id || '');
        }
    };

    const handleTextChange = (index: number, text: string) => {
        const newOptions = [...safeOptions];
        newOptions[index] = { ...newOptions[index], text };
        onChangeOptions(newOptions);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Danh Sách Phương Án Lựa Chọn (Chọn 1 đáp án đúng)
                </label>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="h-3.5 w-3.5 text-emerald-600" />}
                    onClick={handleAddOption}
                >
                    Thêm Phương Án
                </Button>
            </div>

            <div className="space-y-2.5">
                {safeOptions.map((opt, idx) => {
                    const isCorrect = correctAnswer === opt.id;
                    return (
                        <div
                            key={opt.id || idx}
                            className={`flex items-center gap-2.5 sm:gap-3 rounded-xl border p-2.5 transition-all ${
                                isCorrect
                                    ? 'border-emerald-500 bg-emerald-50/60 shadow-2xs'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            {/* Radio button for Correct Answer */}
                            <label className="flex cursor-pointer items-center gap-2 select-none shrink-0">
                                <input
                                    type="radio"
                                    name={`single_choice_answer_${opt.id}`}
                                    checked={isCorrect}
                                    onChange={() => onChangeCorrectAnswer(opt.id)}
                                    className="h-4 w-4 shrink-0 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                                        isCorrect
                                            ? 'bg-emerald-600 text-white shadow-2xs'
                                            : 'bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    {opt.id}
                                </span>
                            </label>

                            {/* Option text input */}
                            <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => handleTextChange(idx, e.target.value)}
                                placeholder={`Nhập nội dung phương án ${opt.id}...`}
                                className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                required
                            />

                            {/* Correct Indicator Badge */}
                            {isCorrect && (
                                <span className="hidden sm:inline-flex shrink-0 items-center gap-1 text-2xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md whitespace-nowrap">
                                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                                    Đáp Án Đúng
                                </span>
                            )}

                            {/* Delete Option */}
                            {safeOptions.length > 2 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveOption(idx)}
                                    className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                    title="Xóa phương án này"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {!correctAnswer && (
                <p className="text-xs text-amber-600 font-medium">
                    ⚠️ Vui lòng tích chọn 1 phương án làm đáp án đúng.
                </p>
            )}
        </div>
    );
}
