import React from 'react';
import { Check } from 'lucide-react';

interface Props {
    questionType: 'single_choice' | 'multiple_choice' | 'true_false_not_given' | string;
    options: any;
    value: any;
    onChange: (val: any) => void;
}

export default function ChoiceRunner({
    questionType,
    options,
    value,
    onChange,
}: Props) {
    if (questionType === 'true_false_not_given') {
        let tfOptions: Array<{ id: string; label: string }> = [];

        if (Array.isArray(options) && options.length > 0) {
            tfOptions = options.map((opt: any) => {
                if (typeof opt === 'string') {
                    return { id: opt, label: opt };
                }
                return {
                    id: String(opt.id ?? opt.key ?? opt.value ?? ''),
                    label: String(opt.label ?? opt.text ?? opt.content ?? opt.id ?? ''),
                };
            });
        }

        if (tfOptions.length === 0) {
            tfOptions = [
                { id: 'TRUE', label: 'TRUE' },
                { id: 'FALSE', label: 'FALSE' },
                { id: 'NOT_GIVEN', label: 'NOT GIVEN' },
            ];
        }

        const currentVal = value !== null && value !== undefined ? String(value).trim().toUpperCase() : '';

        return (
            <div className={`grid grid-cols-1 ${tfOptions.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-2.5`}>
                {tfOptions.map((opt) => {
                    const isSelected = currentVal === opt.id.toUpperCase();
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => onChange(opt.id)}
                            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all ${
                                isSelected
                                    ? 'border-2 border-emerald-500 bg-emerald-50/80 text-emerald-950 font-extrabold shadow-2xs scale-[1.02]'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-slate-50 hover:border-gray-300'
                            }`}
                        >
                            <span className="text-sm tracking-wide">{opt.label}</span>
                            {isSelected && (
                                <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 mt-1">
                                    <Check className="h-3 w-3 stroke-[3]" /> Đã chọn
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    const isMulti = questionType === 'multiple_choice';
    const optsList: Array<{ key: string; text: string }> = Array.isArray(options)
        ? options.map((opt: any, idx: number) => {
              if (typeof opt === 'string') {
                  const key = String.fromCharCode(65 + idx);
                  return { key, text: opt };
              }
              return {
                  key: String(opt.key ?? opt.id ?? String.fromCharCode(65 + idx)),
                  text: String(opt.text ?? opt.content ?? opt.label ?? ''),
              };
          })
        : [];

    const selectedKeys: string[] = isMulti
        ? Array.isArray(value)
            ? value.map(String)
            : value !== null && value !== undefined && value !== ''
            ? [String(value)]
            : []
        : value !== null && value !== undefined && value !== ''
        ? [String(value)]
        : [];

    const handleSingleClick = (key: string) => {
        onChange(key);
    };

    const handleMultiClick = (key: string) => {
        if (selectedKeys.includes(key)) {
            onChange(selectedKeys.filter((k) => k !== key));
        } else {
            onChange([...selectedKeys, key]);
        }
    };

    return (
        <div className="space-y-2">
            {optsList.map((opt) => {
                const isSelected = selectedKeys.includes(opt.key);

                return (
                    <button
                        key={opt.key}
                        type="button"
                        onClick={() => (isMulti ? handleMultiClick(opt.key) : handleSingleClick(opt.key))}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                            isSelected
                                ? 'border-2 border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold shadow-2xs'
                                : 'border-gray-200 bg-white text-gray-800 hover:bg-slate-50 hover:border-gray-300'
                        }`}
                    >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                            <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors ${
                                    isSelected
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {opt.key}
                            </span>
                            <span className="text-xs sm:text-sm">{opt.text}</span>
                        </div>

                        {isSelected && (
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                                <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
