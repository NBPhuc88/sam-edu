import { Bookmark } from 'lucide-react';

export interface PaletteQuestionItem {
    id: number;
    index: number;
    code?: string;
    isAnswered: boolean;
    isFlagged?: boolean;
    isCorrect?: boolean;
}

interface Props {
    questions: PaletteQuestionItem[];
    activeQuestionId?: number | null;
    onSelectQuestion: (id: number) => void;
    isReviewMode?: boolean;
}

export default function ExamQuestionPalette({
    questions,
    activeQuestionId,
    onSelectQuestion,
    isReviewMode = false,
}: Props) {
    if (!questions || questions.length === 0) return null;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                    Bảng danh sách câu hỏi ({questions.length})
                </span>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {questions.map((q) => {
                    const isActive = q.id === activeQuestionId;

                    let buttonClass = 'bg-slate-100 text-gray-700 border-gray-200 hover:bg-slate-200';

                    if (isReviewMode) {
                        if (q.isCorrect) {
                            buttonClass = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold';
                        } else {
                            buttonClass = 'bg-rose-100 text-rose-900 border-rose-300 font-extrabold';
                        }
                    } else {
                        if (q.isAnswered) {
                            buttonClass = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                        }
                    }

                    if (isActive) {
                        buttonClass += ' ring-2 ring-indigo-500 ring-offset-1 scale-105';
                    }

                    return (
                        <button
                            key={q.id}
                            type="button"
                            onClick={() => onSelectQuestion(q.id)}
                            className={`relative flex h-8 w-full items-center justify-center rounded-xl border font-mono text-xs font-bold transition-all shadow-2xs ${buttonClass}`}
                            title={`Câu ${q.index}`}
                        >
                            {q.index}
                            {q.isFlagged && (
                                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                                    <Bookmark className="h-2 w-2 fill-current" />
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
