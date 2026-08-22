import React, { useState, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { X, Sparkles, Check, GripVertical, RotateCcw } from 'lucide-react';

interface WordItem {
    id: string;
    text: string;
}

interface Props {
    content: string;
    options: any;
    userAnswers: Record<string, string>;
    onChange: (ans: Record<string, string>) => void;
    disabled?: boolean;
}

// -------------------------------------------------------------
// Inline Droppable Slot for [blank_X]
// -------------------------------------------------------------
function InlineDroppableSlot({
    blankKey,
    blankNumber,
    matchedWord,
    isSelected,
    disabled,
    onClick,
    onRemove,
}: {
    blankKey: string;
    blankNumber: number;
    matchedWord?: WordItem;
    isSelected: boolean;
    disabled?: boolean;
    onClick: () => void;
    onRemove: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `slot-${blankKey}`,
        disabled,
    });

    if (matchedWord) {
        return (
            <span
                ref={setNodeRef}
                onClick={onClick}
                className="inline-flex items-center gap-1.5 mx-1.5 my-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-950 border-2 border-emerald-500 font-semibold text-xs sm:text-sm shadow-xs transition-all animate-in fade-in zoom-in-95 duration-150 align-middle"
            >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-emerald-600 font-mono text-3xs font-black text-white">
                    {blankNumber}
                </span>
                <span className="font-bold text-emerald-900">{matchedWord.text}</span>
                {!disabled && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="p-0.5 rounded-full text-emerald-700 hover:bg-emerald-200/70 hover:text-emerald-950 transition-colors ml-0.5"
                        title="Gỡ từ khỏi vị trí này"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </span>
        );
    }

    return (
        <span
            ref={setNodeRef}
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 mx-1.5 my-1 px-3 py-1 rounded-xl border-2 border-dashed font-mono text-xs sm:text-sm font-bold transition-all cursor-pointer select-none align-middle ${
                isOver
                    ? 'border-emerald-500 bg-emerald-100 text-emerald-900 ring-2 ring-emerald-400 scale-105 shadow-md'
                    : isSelected
                    ? 'border-purple-500 bg-purple-100/70 text-purple-900 ring-2 ring-purple-300'
                    : 'border-amber-400/90 bg-amber-50/70 text-amber-800 hover:border-amber-500 hover:bg-amber-100/60'
            }`}
        >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-amber-600 font-mono text-3xs font-black text-white">
                {blankNumber}
            </span>
            <span className="font-sans font-medium text-xs">
                {isOver ? 'Thả vào đây' : isSelected ? 'Nhấp từ để đặt' : '[ . . . . . ]'}
            </span>
        </span>
    );
}

// -------------------------------------------------------------
// Draggable Word Chip in Word Bank
// -------------------------------------------------------------
function DraggableWordChip({
    word,
    isUsed,
    isSelected,
    disabled,
    onClick,
}: {
    word: WordItem;
    isUsed: boolean;
    isSelected: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `word-${word.id}`,
        data: word,
        disabled,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border font-semibold text-xs sm:text-sm transition-all select-none ${
                disabled
                    ? 'opacity-60 cursor-not-allowed border-gray-200 bg-gray-100'
                    : isDragging
                    ? 'opacity-25 border-purple-400 bg-purple-50 scale-95'
                    : isSelected
                    ? 'border-purple-600 bg-purple-100/80 text-purple-950 ring-2 ring-purple-400 shadow-sm font-bold scale-105'
                    : isUsed
                    ? 'border-gray-200 bg-slate-100 text-gray-500 opacity-70 hover:opacity-100 hover:border-gray-300 cursor-grab active:cursor-grabbing'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-purple-300 hover:shadow-xs shadow-2xs cursor-grab active:cursor-grabbing'
            }`}
        >
            <GripVertical className="h-3.5 w-3.5 text-gray-400 group-hover:text-purple-600 shrink-0" />
            <span className="break-words">{word.text}</span>
            {isUsed && (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-2.5 w-2.5" />
                </span>
            )}
        </div>
    );
}

// -------------------------------------------------------------
// Main DragDropClozeQuestion Component
// -------------------------------------------------------------
export default function DragDropClozeQuestion({
    content = '',
    options = {},
    userAnswers = {},
    onChange,
    disabled = false,
}: Props) {
    const [activeDragWord, setActiveDragWord] = useState<WordItem | null>(null);
    const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
    const [selectedBlankKey, setSelectedBlankKey] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
    );

    // Parse words list from options
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

    // Parse paragraph segments
    const { segments, totalBlanks } = useMemo(() => {
        const parts = (content || '').split(/(\[blank_\d+\])/g);
        let blankCount = 0;

        const segs = parts.map((part) => {
            const match = part.match(/^\[(blank_\d+)\]$/);
            if (match) {
                blankCount++;
                return {
                    isSlot: true,
                    blankKey: match[1],
                    blankNumber: blankCount,
                };
            }
            return {
                isSlot: false,
                text: part,
            };
        });

        return { segments: segs, totalBlanks: blankCount };
    }, [content]);

    // Handle Drag Start
    const handleDragStart = (event: DragStartEvent) => {
        if (disabled) return;
        const { active } = event;
        const rawId = String(active.id).replace('word-', '');
        const found = wordsList.find((w) => w.id === rawId);
        if (found) {
            setActiveDragWord(found);
            setSelectedWordId(null);
            setSelectedBlankKey(null);
        }
    };

    // Handle Drag End
    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragWord(null);
        if (disabled) return;

        const { active, over } = event;
        if (!over) return;

        const wordId = String(active.id).replace('word-', '');
        const blankKey = String(over.id).replace('slot-', '');

        if (wordId && blankKey) {
            onChange({
                ...userAnswers,
                [blankKey]: wordId,
            });
            setSelectedWordId(null);
            setSelectedBlankKey(null);
        }
    };

    // Handle Click-to-Pair
    const handleWordClick = (wordId: string) => {
        if (disabled) return;

        if (selectedBlankKey) {
            // Already selected a blank slot -> Place word into it
            onChange({
                ...userAnswers,
                [selectedBlankKey]: wordId,
            });
            setSelectedBlankKey(null);
            setSelectedWordId(null);
        } else {
            // Toggle word selection
            setSelectedWordId((prev) => (prev === wordId ? null : wordId));
        }
    };

    const handleSlotClick = (blankKey: string) => {
        if (disabled) return;

        if (selectedWordId) {
            // Already selected a word -> Place it into this slot
            onChange({
                ...userAnswers,
                [blankKey]: selectedWordId,
            });
            setSelectedWordId(null);
            setSelectedBlankKey(null);
        } else {
            // Toggle slot selection
            setSelectedBlankKey((prev) => (prev === blankKey ? null : blankKey));
        }
    };

    const handleRemoveBlank = (blankKey: string) => {
        if (disabled) return;
        const next = { ...userAnswers };
        delete next[blankKey];
        onChange(next);
    };

    const handleClearAll = () => {
        if (disabled) return;
        onChange({});
        setSelectedWordId(null);
        setSelectedBlankKey(null);
    };

    const placedCount = Object.keys(userAnswers).filter((k) => userAnswers[k]).length;
    const usedWordIds = Object.values(userAnswers);

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                            <Sparkles className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs font-bold text-gray-800">
                            Kéo từ khóa ở Kho từ thả vào các ô trống tương ứng trong đoạn văn
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-2xs font-extrabold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Đã điền: {placedCount}/{totalBlanks} ô
                        </span>
                        {!disabled && placedCount > 0 && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="inline-flex items-center gap-1 text-2xs font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 px-2.5 py-0.5 rounded-full border border-gray-200 transition-all shadow-2xs"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Xóa tất cả
                            </button>
                        )}
                    </div>
                </div>

                {/* Paragraph Content with Droppable Slots */}
                <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-7 shadow-xs leading-loose sm:leading-loose text-sm sm:text-base font-medium text-gray-900">
                    {segments.map((seg, idx) => {
                        if (seg.isSlot && seg.blankKey) {
                            const matchedWordId = userAnswers[seg.blankKey];
                            const matchedWord = wordsList.find((w) => w.id === matchedWordId);

                            return (
                                <InlineDroppableSlot
                                    key={seg.blankKey}
                                    blankKey={seg.blankKey}
                                    blankNumber={seg.blankNumber || idx + 1}
                                    matchedWord={matchedWord}
                                    isSelected={selectedBlankKey === seg.blankKey}
                                    disabled={disabled}
                                    onClick={() => handleSlotClick(seg.blankKey!)}
                                    onRemove={() => handleRemoveBlank(seg.blankKey!)}
                                />
                            );
                        }

                        return (
                            <span key={idx} className="whitespace-pre-wrap">
                                {seg.text}
                            </span>
                        );
                    })}
                </div>

                {/* Word Bank Pool */}
                <div className="rounded-3xl border border-purple-200 bg-purple-50/50 p-4 sm:p-6 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-600 font-mono text-3xs font-bold text-white">
                                {wordsList.length}
                            </span>
                            Kho từ khóa kéo thả (Word Bank):
                        </span>
                        <span className="text-3xs text-purple-700 font-medium hidden sm:inline">
                            Kéo từ vào ô trống hoặc nhấp từ rồi nhấp ô trống
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2.5 items-center">
                        {wordsList.map((word) => {
                            const isUsed = usedWordIds.includes(word.id);
                            const isSelected = selectedWordId === word.id;

                            return (
                                <DraggableWordChip
                                    key={word.id}
                                    word={word}
                                    isUsed={isUsed}
                                    isSelected={isSelected}
                                    disabled={disabled}
                                    onClick={() => handleWordClick(word.id)}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeDragWord ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-500 bg-white text-purple-950 font-bold text-sm shadow-2xl ring-2 ring-purple-400 cursor-grabbing">
                        <GripVertical className="h-4 w-4 text-purple-600 shrink-0" />
                        <span>{activeDragWord.text}</span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
