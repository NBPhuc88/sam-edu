import React, { useMemo } from 'react';
import { Plus, Trash2, Info, Sparkles, Check, HelpCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ExamQuestionData } from '../types';

interface WordItem {
    id: string;
    text: string;
}

interface Props {
    content: string;
    options: any;
    correctAnswer: Record<string, string>;
    onInsertBlank: () => void;
    onChangeOptions: (options: any) => void;
    onChangeCorrectAnswer: (answer: Record<string, string>) => void;
    onChangeQuestion?: (fields: Partial<ExamQuestionData>) => void;
}

export default function DragDropClozeEditor({
    content = '',
    options = {},
    correctAnswer = {},
    onInsertBlank,
    onChangeOptions,
    onChangeCorrectAnswer,
    onChangeQuestion,
}: Props) {
    // Parse word bank from options
    const wordsList: WordItem[] = useMemo(() => {
        if (!options) return [];
        if (Array.isArray(options.words)) {
            return options.words.map((w: any, idx: number) => ({
                id: String(w.id ?? `w${idx + 1}`),
                text: String(w.text ?? w.word ?? w.label ?? ''),
            }));
        }
        if (Array.isArray(options)) {
            return options.map((w: any, idx: number) => ({
                id: String(w.id ?? `w${idx + 1}`),
                text: String(w.text ?? w.word ?? (typeof w === 'string' ? w : '')),
            }));
        }
        return [];
    }, [options]);

    // Extract blanks from content: [blank_1], [blank_2]...
    const matches = content.match(/\[blank_\d+\]/g) || [];
    const detectedBlankKeys = Array.from(new Set(matches.map((m) => m.replace(/[\[\]]/g, ''))));

    // Handle adding a new word to the Word Bank
    const handleAddWord = (suggestedText = '') => {
        // Calculate max index from existing IDs
        let maxNum = 0;
        wordsList.forEach((w) => {
            const num = parseInt(w.id.replace(/\D/g, ''), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
        });

        const newId = `w${maxNum + 1}`;
        const newWords = [...wordsList, { id: newId, text: suggestedText }];

        if (onChangeQuestion) {
            onChangeQuestion({
                options: { words: newWords },
            });
        } else {
            onChangeOptions({ words: newWords });
        }
    };

    // Handle changing word text
    const handleWordTextChange = (id: string, text: string) => {
        const newWords = wordsList.map((w) => (w.id === id ? { ...w, text } : w));
        if (onChangeQuestion) {
            onChangeQuestion({
                options: { words: newWords },
            });
        } else {
            onChangeOptions({ words: newWords });
        }
    };

    // Handle deleting a word from the Word Bank
    const handleDeleteWord = (id: string) => {
        const newWords = wordsList.filter((w) => w.id !== id);
        const newCorrect = { ...(correctAnswer || {}) };

        // Remove any reference to this word in correct_answer
        Object.keys(newCorrect).forEach((k) => {
            if (newCorrect[k] === id) {
                delete newCorrect[k];
            }
        });

        if (onChangeQuestion) {
            onChangeQuestion({
                options: { words: newWords },
                correct_answer: newCorrect,
            });
        } else {
            onChangeOptions({ words: newWords });
            onChangeCorrectAnswer(newCorrect);
        }
    };

    // Handle assigning correct word for a blank slot
    const handleAssignBlankAnswer = (blankKey: string, wordId: string) => {
        const newCorrect = { ...(correctAnswer || {}) };
        if (wordId) {
            newCorrect[blankKey] = wordId;
        } else {
            delete newCorrect[blankKey];
        }

        if (onChangeQuestion) {
            onChangeQuestion({
                correct_answer: newCorrect,
            });
        } else {
            onChangeCorrectAnswer(newCorrect);
        }
    };

    return (
        <div className="space-y-6">
            {/* Guide banner */}
            <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-50/80 p-4 text-xs text-emerald-950 border border-emerald-200">
                <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                    <p className="font-bold text-emerald-900">Cách tạo câu hỏi Kéo - Thả từ vào chỗ trống:</p>
                    <p className="leading-relaxed text-emerald-800">
                        1. Nhập cú pháp <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-900">[blank_1]</code>, <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold">[blank_2]</code> vào ô <strong>Nội Dung Câu Hỏi / Đề Bài</strong> phía trên.<br />
                        2. Thêm các từ khóa vào <strong>Ngân hàng từ khóa</strong> bên dưới (có thể thêm các từ gây nhiễu).<br />
                        3. Chọn từ đúng tương ứng cho từng vị trí ô trống.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Plus className="h-3.5 w-3.5 text-emerald-700" />}
                    onClick={onInsertBlank}
                    className="shrink-0 font-bold text-emerald-800 border-emerald-300 bg-white hover:bg-emerald-50 shadow-2xs"
                >
                    Chèn ô trống [blank]
                </Button>
            </div>

            {/* Section 1: Detected Blanks & Correct Answers Configuration */}
            <div className="space-y-3 rounded-2xl bg-white p-4 sm:p-5 border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
                        <Check className="h-4 w-4 text-emerald-600" />
                        Thiết lập đáp án đúng cho các ô trống ({detectedBlankKeys.length} ô)
                    </span>
                    {detectedBlankKeys.length === 0 && (
                        <span className="text-2xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Chưa chèn ô trống [blank_X] vào đề bài
                        </span>
                    )}
                </div>

                {detectedBlankKeys.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-500 bg-slate-50 rounded-xl border border-dashed border-gray-300">
                        Vui lòng nhấp nút <strong>"Chèn ô trống [blank]"</strong> phía trên hoặc gõ <code>[blank_1]</code> vào ô nội dung đề bài.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {detectedBlankKeys.map((blankKey, idx) => {
                            const selectedWordId = correctAnswer[blankKey] || '';
                            const selectedWord = wordsList.find((w) => w.id === selectedWordId);

                            return (
                                <div
                                    key={blankKey}
                                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-200 bg-slate-50/70 hover:border-emerald-300 transition-all text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-600 font-mono text-xs font-bold text-white shadow-2xs">
                                            {idx + 1}
                                        </span>
                                        <span className="font-mono font-bold text-gray-800">
                                            [{blankKey}]
                                        </span>
                                    </div>

                                    <div className="flex-1 max-w-xs">
                                        <select
                                            value={selectedWordId}
                                            onChange={(e) => handleAssignBlankAnswer(blankKey, e.target.value)}
                                            className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-bold focus:outline-hidden transition-all ${
                                                selectedWordId
                                                    ? 'border-emerald-400 bg-emerald-50/80 text-emerald-900'
                                                    : 'border-amber-300 bg-amber-50/60 text-amber-900'
                                            }`}
                                        >
                                            <option value="">-- Chọn từ đáp án đúng --</option>
                                            {wordsList.map((w) => (
                                                <option key={w.id} value={w.id}>
                                                    {w.text ? `${w.text} (${w.id})` : `(${w.id} - chưa nhập chữ)`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Section 2: Word Bank Management */}
            <div className="space-y-3 rounded-2xl bg-white p-4 sm:p-5 border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-600" />
                            Ngân hàng từ khóa kéo thả (Word Bank) ({wordsList.length} từ)
                        </span>
                        <span className="text-3xs text-gray-500 font-normal">
                            Bao gồm các từ đáp án đúng và các từ gây nhiễu (distractors) nếu muốn
                        </span>
                    </div>

                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<Plus className="h-3.5 w-3.5 text-purple-600" />}
                        onClick={() => handleAddWord('')}
                        className="font-bold text-purple-800 border-purple-200 bg-purple-50/60 hover:bg-purple-100 shadow-2xs"
                    >
                        Thêm từ khóa
                    </Button>
                </div>

                {wordsList.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-500 bg-slate-50 rounded-xl border border-dashed border-gray-300">
                        Chưa có từ khóa nào. Nhấp <strong>"Thêm từ khóa"</strong> để tạo danh sách từ cho học sinh kéo thả.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {wordsList.map((word, idx) => {
                            const isAssigned = Object.values(correctAnswer).includes(word.id);

                            return (
                                <div
                                    key={word.id}
                                    className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 bg-slate-50/50 hover:bg-white transition-all text-xs"
                                >
                                    <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 font-mono text-xs font-bold text-purple-800 border border-purple-200">
                                        {word.id}
                                    </span>

                                    <input
                                        type="text"
                                        value={word.text}
                                        onChange={(e) => handleWordTextChange(word.id, e.target.value)}
                                        placeholder={`Nhập từ khóa / cụm từ ${idx + 1}...`}
                                        className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 focus:border-purple-500 focus:outline-hidden"
                                    />

                                    {isAssigned ? (
                                        <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 shrink-0">
                                            <Check className="h-3 w-3" /> Đáp án đúng
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-2xs font-medium text-gray-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 shrink-0">
                                            <HelpCircle className="h-3 w-3 text-gray-400" /> Từ gây nhiễu
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => handleDeleteWord(word.id)}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                                        title="Xóa từ này"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
