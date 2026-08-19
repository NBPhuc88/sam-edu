import React from 'react';
import { Plus, Trash2, Tag, Info } from 'lucide-react';
import Button from '@/components/ui/Button';

interface BlankConfig {
    accepted_answers: string[];
    case_sensitive?: boolean;
}

interface Props {
    content: string;
    correctAnswer: Record<string, BlankConfig>;
    metadata: {
        word_limit?: string;
        word_bank?: string[];
    };
    onInsertBlank: () => void;
    onChangeCorrectAnswer: (answer: Record<string, BlankConfig>) => void;
    onChangeMetadata: (metadata: any) => void;
}

export default function FillInBlankEditor({
    content = '',
    correctAnswer = {},
    metadata = {},
    onInsertBlank,
    onChangeCorrectAnswer,
    onChangeMetadata,
}: Props) {
    // Extract blanks from content: [blank_1], [blank_2]...
    const matches = content.match(/\[blank_\d+\]/g) || [];
    const blankKeysFromContent = Array.from(new Set(matches.map((m) => m.replace(/[\[\]]/g, ''))));

    // Also include any keys in correctAnswer
    const allBlankKeys = Array.from(new Set([...blankKeysFromContent, ...Object.keys(correctAnswer || {})]));
    const displayKeys = allBlankKeys.length > 0 ? allBlankKeys : ['blank_1'];

    const handleAddBlankConfig = (blankKey: string) => {
        const current = { ...(correctAnswer || {}) };
        if (!current[blankKey]) {
            current[blankKey] = {
                accepted_answers: [''],
                case_sensitive: false,
            };
            onChangeCorrectAnswer(current);
        }
    };

    const handleAnswersTextChange = (blankKey: string, text: string) => {
        const current = { ...(correctAnswer || {}) };
        const answers = text.split('|').map((s) => s.trim()).filter(Boolean);

        current[blankKey] = {
            ...(current[blankKey] || {}),
            accepted_answers: answers.length > 0 ? answers : [text],
            case_sensitive: current[blankKey]?.case_sensitive || false,
        };
        onChangeCorrectAnswer(current);
    };

    const handleToggleCaseSensitive = (blankKey: string) => {
        const current = { ...(correctAnswer || {}) };
        current[blankKey] = {
            ...(current[blankKey] || { accepted_answers: [] }),
            case_sensitive: !current[blankKey]?.case_sensitive,
        };
        onChangeCorrectAnswer(current);
    };

    const handleRemoveBlank = (blankKey: string) => {
        const current = { ...(correctAnswer || {}) };
        delete current[blankKey];
        onChangeCorrectAnswer(current);
    };

    const handleWordBankChange = (text: string) => {
        const words = text.split(',').map((w) => w.trim()).filter(Boolean);
        onChangeMetadata({
            ...metadata,
            word_bank: words,
        });
    };

    return (
        <div className="space-y-4">
            {/* Guide banner */}
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50/70 p-3 text-xs text-amber-900 border border-amber-200/80">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-semibold">Cách tạo câu hỏi điền chỗ trống:</p>
                    <p>
                        Nhập cú pháp <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">[blank_1]</code>, <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold">[blank_2]</code> vào ô nội dung câu hỏi phía trên. Hệ thống sẽ tự động tạo các ô đáp án tương ứng.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="h-3.5 w-3.5 text-amber-700" />}
                    onClick={onInsertBlank}
                    className="shrink-0 ml-auto"
                >
                    Chèn [blank_n]
                </Button>
            </div>

            {/* Config for Word Limit & Word Bank */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                        Giới hạn số từ (Word limit)
                    </label>
                    <input
                        type="text"
                        value={metadata.word_limit || ''}
                        onChange={(e) => onChangeMetadata({ ...metadata, word_limit: e.target.value })}
                        placeholder="VD: NO MORE THAN TWO WORDS AND/OR A NUMBER"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-amber-500 focus:outline-hidden"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                        Ngân hàng từ gợi ý (Word Bank - cách nhau bằng dấu phẩy)
                    </label>
                    <input
                        type="text"
                        value={(metadata.word_bank || []).join(', ')}
                        onChange={(e) => handleWordBankChange(e.target.value)}
                        placeholder="VD: apple, banana, orange, grape..."
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-amber-500 focus:outline-hidden"
                    />
                </div>
            </div>

            {/* List of Blank Answers */}
            <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Cấu Hình Đáp Án Cho Từng Chỗ Trống
                </label>

                {displayKeys.map((blankKey, idx) => {
                    const config = correctAnswer?.[blankKey] || { accepted_answers: [], case_sensitive: false };
                    const answersString = (config.accepted_answers || []).join(' | ');

                    return (
                        <div
                            key={blankKey || idx}
                            className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs space-y-2"
                        >
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-0.5 font-mono text-xs font-bold text-amber-900">
                                    <Tag className="h-3 w-3 text-amber-700" />
                                    [{blankKey}]
                                </span>

                                <div className="flex items-center gap-3">
                                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600 select-none">
                                        <input
                                            type="checkbox"
                                            checked={config.case_sensitive || false}
                                            onChange={() => handleToggleCaseSensitive(blankKey)}
                                            className="h-3.5 w-3.5 rounded-sm text-amber-600 focus:ring-amber-500"
                                        />
                                        <span>Phân biệt HOA / thường</span>
                                    </label>

                                    {displayKeys.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveBlank(blankKey)}
                                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                            title="Xóa cấu hình này"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={answersString}
                                    onChange={(e) => handleAnswersTextChange(blankKey, e.target.value)}
                                    placeholder="Nhập các đáp án đúng chấp nhận, cách nhau bằng dấu gạch đứng | (VD: London | Central London)"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                                    required
                                />
                                <p className="mt-1 text-2xs text-gray-400 italic">
                                    Hỗ trợ nhiều từ đồng nghĩa bằng cách ngăn cách với dấu <code className="font-bold text-gray-600">|</code>
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
