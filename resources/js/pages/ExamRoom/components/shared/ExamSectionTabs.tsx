import React from 'react';

export interface ExamSectionTabItem {
    id?: number;
    title: string;
    skill?: string;
    totalQuestions?: number;
    correctCount?: number;
    answeredCount?: number;
}

interface Props {
    sections: ExamSectionTabItem[];
    activeSectionIndex: number;
    onSelectSection: (index: number) => void;
    isReviewMode?: boolean;
}

export default function ExamSectionTabs({
    sections,
    activeSectionIndex,
    onSelectSection,
    isReviewMode = false,
}: Props) {
    if (!sections || sections.length <= 1) return null;

    return (
        <div className="rounded-2xl bg-white p-3 border border-gray-200 shadow-2xs space-y-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 block px-1">
                {isReviewMode ? 'Chọn phần thi cần xem chi tiết:' : 'Danh sách phần thi:'}
            </span>
            <div className="flex flex-wrap gap-2">
                {sections.map((sec, sIdx) => {
                    const isActive = sIdx === activeSectionIndex;
                    return (
                        <button
                            key={sec.id || sIdx}
                            type="button"
                            onClick={() => onSelectSection(sIdx)}
                            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                                isActive
                                    ? 'bg-slate-900 text-white shadow-xs scale-[1.02]'
                                    : 'bg-slate-50 text-gray-700 border border-gray-200 hover:bg-slate-100'
                            }`}
                        >
                            <span
                                className={`flex h-5 w-5 items-center justify-center rounded-lg font-mono text-2xs font-bold ${
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gray-200 text-gray-800'
                                }`}
                            >
                                {sIdx + 1}
                            </span>
                            <span>{sec.title}</span>

                            {isReviewMode && sec.totalQuestions !== undefined && sec.correctCount !== undefined && (
                                <span
                                    className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                                        isActive
                                            ? 'bg-emerald-500/30 text-emerald-300'
                                            : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                >
                                    ✓ {sec.correctCount}/{sec.totalQuestions}
                                </span>
                            )}

                            {!isReviewMode && sec.totalQuestions !== undefined && sec.answeredCount !== undefined && (
                                <span
                                    className={`px-2 py-0.5 rounded-full text-2xs font-bold ${
                                        isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-200 text-slate-800'
                                    }`}
                                >
                                    {sec.answeredCount}/{sec.totalQuestions}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
