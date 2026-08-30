import Button from '@/components/ui/Button';
import { CheckSquare,Plus,Trash2 } from 'lucide-react';

interface Option {
    id: string;
    text: string;
}

interface Props {
    options: Option[];
    correctAnswer: string[];
    metadata: { max_select?: number };
    onChangeOptions: (options: Option[]) => void;
    onChangeCorrectAnswer: (answer: string[]) => void;
    onChangeMetadata: (metadata: any) => void;
}

const DEFAULT_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export default function MultipleChoiceEditor({
    options = [],
    correctAnswer = [],
    metadata = {},
    onChangeOptions,
    onChangeCorrectAnswer,
    onChangeMetadata,
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

    const safeOptions: Option[] = rawOptionsList.length > 0
        ? rawOptionsList.map((opt: any, idx: number) => {
            if (typeof opt === 'string') {
                const defaultId = DEFAULT_LABELS[idx] || `OPT_${idx + 1}`;
                return { id: defaultId, text: opt };
            }
            const id = String(opt?.id ?? opt?.key ?? opt?.value ?? DEFAULT_LABELS[idx] ?? `OPT_${idx + 1}`);
            const text = String(opt?.text ?? opt?.label ?? opt?.content ?? opt?.value ?? '');
            return { id, text };
        })
        : [
            { id: 'A', text: '' },
            { id: 'B', text: '' },
            { id: 'C', text: '' },
            { id: 'D', text: '' },
            { id: 'E', text: '' },
        ];

    const safeCorrectAnswer: string[] = Array.isArray(correctAnswer)
        ? correctAnswer.map(String)
        : (correctAnswer ? [String(correctAnswer)] : []);

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

        if (safeCorrectAnswer.includes(removed.id)) {
            onChangeCorrectAnswer(safeCorrectAnswer.filter((id) => id !== removed.id));
        }
    };

    const handleTextChange = (index: number, text: string) => {
        const newOptions = [...safeOptions];
        newOptions[index] = { ...newOptions[index], text };
        onChangeOptions(newOptions);
    };

    const handleToggleCorrect = (id: string) => {
        if (safeCorrectAnswer.includes(id)) {
            onChangeCorrectAnswer(safeCorrectAnswer.filter((item) => item !== id));
        } else {
            onChangeCorrectAnswer([...safeCorrectAnswer, id]);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3">
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Danh Sách Phương Án (Chọn 2 hoặc nhiều đáp án đúng)
                    </label>
                    <p className="text-xs text-gray-500">
                        Đang chọn: <span className="font-bold text-indigo-700">{safeCorrectAnswer.join(', ') || 'Chưa chọn'}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span>Số lượng chọn tối đa:</span>
                        <input
                            type="number"
                            min={1}
                            max={safeOptions.length}
                            value={metadata.max_select || safeCorrectAnswer.length || 2}
                            onChange={(e) =>
                                onChangeMetadata({
                                    ...metadata,
                                    max_select: Number(e.target.value) || 2,
                                })
                            }
                            className="w-14 rounded-md border border-gray-300 px-2 py-1 text-center font-bold text-xs"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<Plus className="h-3.5 w-3.5 text-indigo-600" />}
                        onClick={handleAddOption}
                    >
                        Thêm Phương Án
                    </Button>
                </div>
            </div>

            <div className="space-y-2.5">
                {safeOptions.map((opt, idx) => {
                    const isCorrect = safeCorrectAnswer.includes(opt.id);
                    return (
                        <div
                            key={opt.id || idx}
                            className={`flex items-center gap-2.5 sm:gap-3 rounded-xl border p-2.5 transition-all ${
                                isCorrect
                                    ? 'border-indigo-500 bg-indigo-50/60 shadow-2xs'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            {/* Checkbox for Multiple Correct Answers */}
                            <label className="flex cursor-pointer items-center gap-2 select-none shrink-0" title="Đặt làm đáp án đúng">
                                <input
                                    type="checkbox"
                                    checked={isCorrect}
                                    onChange={() => handleToggleCorrect(opt.id)}
                                    className="h-4 w-4 shrink-0 rounded-sm text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                                        isCorrect
                                            ? 'bg-indigo-600 text-white shadow-2xs'
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
                                className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                                required
                            />

                            {/* Correct Indicator Badge / Click button */}
                            {isCorrect ? (
                                <span className="hidden sm:inline-flex shrink-0 items-center gap-1 text-2xs font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md whitespace-nowrap">
                                    <CheckSquare className="h-3 w-3 text-indigo-600" />
                                    Đáp Án Đúng
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleToggleCorrect(opt.id)}
                                    className="hidden sm:inline-flex shrink-0 items-center gap-1 text-2xs font-medium text-gray-400 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-0.5 rounded-md transition-colors whitespace-nowrap"
                                    title="Chọn phương án này làm đáp án đúng"
                                >
                                    Chọn đáp án
                                </button>
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

            {safeCorrectAnswer.length === 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs font-bold text-red-700 border border-red-200">
                    <span className="text-sm">⚠️</span>
                    <span>Vui lòng chọn ít nhất 1 phương án làm đáp án đúng cho câu hỏi này.</span>
                </div>
            )}
        </div>
    );
}
