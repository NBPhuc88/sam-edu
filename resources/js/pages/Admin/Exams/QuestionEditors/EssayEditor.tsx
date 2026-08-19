import React from 'react';
import { Plus, Trash2, PenTool, Award } from 'lucide-react';
import Button from '@/components/ui/Button';

interface RubricCriteria {
    criteria: string;
    max_score: number | string;
}

interface Props {
    metadata: {
        min_words?: number | string;
        max_words?: number | string;
        rubrics?: RubricCriteria[];
        sample_answer?: string;
    };
    onChangeMetadata: (metadata: any) => void;
}

const DEFAULT_RUBRICS: RubricCriteria[] = [
    { criteria: 'Task Achievement (Hoàn thành yêu cầu đề bài)', max_score: 2.5 },
    { criteria: 'Coherence and Cohesion (Tính mạch lạc & liên kết)', max_score: 2.5 },
    { criteria: 'Lexical Resource (Vốn từ vựng phong phú)', max_score: 2.5 },
    { criteria: 'Grammatical Range & Accuracy (Ngữ pháp & độ chuẩn xác)', max_score: 2.5 },
];

export default function EssayEditor({
    metadata = {},
    onChangeMetadata,
}: Props) {
    const rubrics: RubricCriteria[] = metadata?.rubrics && metadata.rubrics.length > 0
        ? metadata.rubrics
        : DEFAULT_RUBRICS;

    const handleAddRubric = () => {
        const updated = [...rubrics, { criteria: '', max_score: 2.5 }];
        onChangeMetadata({ ...metadata, rubrics: updated });
    };

    const handleRemoveRubric = (index: number) => {
        if (rubrics.length <= 1) return;
        const updated = rubrics.filter((_, i) => i !== index);
        onChangeMetadata({ ...metadata, rubrics: updated });
    };

    const handleRubricChange = (index: number, field: keyof RubricCriteria, value: any) => {
        const updated = [...rubrics];
        updated[index] = { ...updated[index], [field]: value };
        onChangeMetadata({ ...metadata, rubrics: updated });
    };

    return (
        <div className="space-y-5">
            {/* Word count limits */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl bg-orange-50/40 p-4 border border-orange-200">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-orange-900">
                        Số từ tối thiểu (Minimum words)
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={metadata.min_words || 250}
                        onChange={(e) => onChangeMetadata({ ...metadata, min_words: Number(e.target.value) || 0 })}
                        placeholder="VD: 150 hoặc 250 từ..."
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-orange-500 focus:outline-hidden"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-orange-900">
                        Số từ tối đa (Maximum words - tùy chọn)
                    </label>
                    <input
                        type="number"
                        min={0}
                        value={metadata.max_words || ''}
                        onChange={(e) => onChangeMetadata({ ...metadata, max_words: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="VD: 500 từ hoặc để trống nếu không giới hạn..."
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-orange-500 focus:outline-hidden"
                    />
                </div>
            </div>

            {/* Sample answer */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                    <PenTool className="h-4 w-4 text-orange-600" />
                    Bài Mẫu Tham Khảo / Gợi Ý Đáp Án (Sample Answer)
                </label>
                <textarea
                    rows={4}
                    value={metadata.sample_answer || ''}
                    onChange={(e) => onChangeMetadata({ ...metadata, sample_answer: e.target.value })}
                    placeholder="Nhập bài văn mẫu chuẩn Band điểm cao hoặc dàn ý gợi ý trả lời..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-orange-500 focus:outline-hidden"
                />
            </div>

            {/* Rubrics table */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-orange-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            Bảng Tiêu Chí Chấm Điểm (Evaluation Rubrics)
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<Plus className="h-3.5 w-3.5 text-orange-600" />}
                        onClick={handleAddRubric}
                    >
                        Thêm Tiêu Chí
                    </Button>
                </div>

                <div className="space-y-2">
                    {rubrics.map((r, idx) => (
                        <div key={idx} className="flex items-center gap-3 rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                            <span className="text-2xs font-mono font-bold text-gray-500 w-6 text-center">
                                #{idx + 1}
                            </span>
                            <input
                                type="text"
                                value={r.criteria}
                                onChange={(e) => handleRubricChange(idx, 'criteria', e.target.value)}
                                placeholder="Tên tiêu chí (VD: Ngữ pháp & Từ vựng, Độ mạch lạc...)"
                                className="flex-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-orange-500 focus:outline-hidden"
                                required
                            />
                            <div className="flex items-center gap-1.5">
                                <span className="text-2xs text-gray-500 font-semibold">Điểm tối đa:</span>
                                <input
                                    type="number"
                                    step="0.5"
                                    min={0}
                                    value={r.max_score}
                                    onChange={(e) => handleRubricChange(idx, 'max_score', e.target.value)}
                                    className="w-16 rounded-md border border-gray-300 bg-white px-2 py-1 text-center text-xs font-bold text-orange-900 focus:border-orange-500 focus:outline-hidden"
                                />
                            </div>
                            {rubrics.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveRubric(idx)}
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
    );
}
