import React, { useId } from 'react';
import { HelpCircle } from 'lucide-react';

interface Props {
    correctAnswer: string | null;
    metadata: { variant?: 'T_F_NG' | 'Y_N_NG' | 'T_F' };
    onChangeCorrectAnswer: (answer: string) => void;
    onChangeMetadata: (metadata: any) => void;
    onChangeOptions: (options: any) => void;
}

const VARIANTS = [
    {
        id: 'T_F_NG',
        label: 'IELTS: TRUE / FALSE / NOT GIVEN',
        options: [
            { id: 'TRUE', label: 'TRUE' },
            { id: 'FALSE', label: 'FALSE' },
            { id: 'NOT_GIVEN', label: 'NOT' },
        ],
    },
    {
        id: 'Y_N_NG',
        label: 'IELTS: YES / NO / NOT GIVEN',
        options: [
            { id: 'YES', label: 'YES' },
            { id: 'NO', label: 'NO' },
            { id: 'NOT_GIVEN', label: 'NOT' },
        ],
    },
    {
        id: 'T_F',
        label: 'Tiếng Trung / THPT: ĐÚNG / SAI (对 / 错)',
        options: [
            { id: 'TRUE', label: 'ĐÚNG (True / 对)' },
            { id: 'FALSE', label: 'SAI (False / 错)' },
        ],
    },
];

export default function TrueFalseEditor({
    correctAnswer,
    metadata = {},
    onChangeCorrectAnswer,
    onChangeMetadata,
    onChangeOptions,
}: Props) {
    const radioGroupName = useId();
    const currentVariantId = metadata.variant || 'T_F_NG';
    const currentVariant = VARIANTS.find((v) => v.id === currentVariantId) || VARIANTS[0];

    const handleVariantChange = (variantId: 'T_F_NG' | 'Y_N_NG' | 'T_F') => {
        const selected = VARIANTS.find((v) => v.id === variantId) || VARIANTS[0];
        onChangeMetadata({ ...metadata, variant: variantId });
        onChangeOptions(selected.options);

        // Reset correct answer to first option of the selected variant
        onChangeCorrectAnswer(selected.options[0].id);
    };

    return (
        <div className="space-y-4">
            {/* Variant Selector */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-emerald-600" />
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Chọn Bộ Nhãn Dạng Câu Hỏi
                    </label>
                </div>
                <select
                    value={currentVariantId}
                    onChange={(e) => handleVariantChange(e.target.value as any)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
                >
                    {VARIANTS.map((v) => (
                        <option key={v.id} value={v.id}>
                            {v.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Answer Options Radio Cards */}
            <div className="space-y-2.5">
                <p className="text-xs font-semibold text-gray-600">
                    Tích chọn đáp án chuẩn xác của bài đọc/nghe:
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {currentVariant.options.map((opt) => {
                        const isSelected = Boolean(correctAnswer && String(correctAnswer).trim() === opt.id);
                        return (
                            <label
                                key={opt.id}
                                className={`flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all ${isSelected
                                        ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500'
                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`font-mono text-sm font-extrabold ${isSelected ? 'text-emerald-800' : 'text-gray-800'
                                            }`}
                                    >
                                        {opt.id}
                                    </span>
                                    <input
                                        type="radio"
                                        name={radioGroupName}
                                        value={opt.id}
                                        checked={isSelected}
                                        onChange={() => onChangeCorrectAnswer(opt.id)}
                                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                                    />
                                </div>
                                <span className="mt-2 text-xs text-gray-600">
                                    {opt.label}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
