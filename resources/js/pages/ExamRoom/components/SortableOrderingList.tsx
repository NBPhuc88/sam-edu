import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';

export interface OrderingItem {
    id: string | number;
    text: string;
}

interface SortableItemProps {
    id: string | number;
    text: string;
    index: number;
    total: number;
    onMoveUp: () => void;
    onMoveDown: () => void;
}

function SortableItem({ id, text, index, total, onMoveUp, onMoveDown }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: String(id) });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-3.5 rounded-xl border bg-white transition-shadow select-none ${
                isDragging
                    ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-400/40 bg-emerald-50/80 opacity-95'
                    : 'border-gray-200 shadow-2xs hover:border-gray-300'
            }`}
        >
            {/* Drag Handle */}
            <button
                type="button"
                {...attributes}
                {...listeners}
                aria-label="Kéo để sắp xếp"
                className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            >
                <GripVertical className="h-5 w-5" />
            </button>

            {/* Position Badge */}
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 font-mono text-xs font-bold text-emerald-800 border border-emerald-200">
                {index + 1}
            </span>

            {/* Text content */}
            <span className="flex-1 text-sm font-medium text-gray-800 leading-relaxed">
                {text}
            </span>

            {/* Up / Down button fallbacks for quick mobile sorting */}
            <div className="flex items-center gap-1 shrink-0">
                <button
                    type="button"
                    onClick={onMoveUp}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 rounded-md transition-colors"
                    title="Chuyển lên trên"
                >
                    <ArrowUp className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={onMoveDown}
                    disabled={index === total - 1}
                    className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 rounded-md transition-colors"
                    title="Chuyển xuống dưới"
                >
                    <ArrowDown className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

interface Props {
    options: any; // [{ id: '1', text: '...' }, ...] or array of strings
    value: (string | number)[];
    onChange: (sortedIds: (string | number)[]) => void;
}

export default function SortableOrderingList({ options, value, onChange }: Props) {
    // Normalize raw options into OrderingItem[]
    const rawList: OrderingItem[] = React.useMemo(() => {
        if (!options) return [];
        const arr = Array.isArray(options) ? options : (options.items || options.options || []);
        return arr.map((item: any, idx: number) => {
            if (typeof item === 'string') {
                return { id: String(idx + 1), text: item };
            }
            return {
                id: String(item.id ?? item.key ?? item.value ?? (idx + 1)),
                text: String(item.text ?? item.label ?? item.content ?? ''),
            };
        });
    }, [options]);

    // Current ordered list derived from user value or initial list
    const currentOrderedItems: OrderingItem[] = React.useMemo(() => {
        if (Array.isArray(value) && value.length === rawList.length && value.length > 0) {
            const map = new Map(rawList.map((item) => [String(item.id), item]));
            const ordered: OrderingItem[] = [];
            value.forEach((v) => {
                const found = map.get(String(v));
                if (found) ordered.push(found);
            });
            // Append any missing items
            rawList.forEach((item) => {
                if (!ordered.some((o) => String(o.id) === String(item.id))) {
                    ordered.push(item);
                }
            });
            return ordered;
        }
        return rawList;
    }, [rawList, value]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = currentOrderedItems.findIndex((item) => String(item.id) === String(active.id));
            const newIndex = currentOrderedItems.findIndex((item) => String(item.id) === String(over.id));
            if (oldIndex !== -1 && newIndex !== -1) {
                const newItems = arrayMove(currentOrderedItems, oldIndex, newIndex);
                onChange(newItems.map((item) => item.id));
            }
        }
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= currentOrderedItems.length) return;
        const newItems = arrayMove(currentOrderedItems, index, targetIndex);
        onChange(newItems.map((item) => item.id));
    };

    if (rawList.length === 0) {
        return (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-gray-500">
                Không có dữ liệu các mục để sắp xếp.
            </div>
        );
    }

    return (
        <div className="space-y-3 rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Kéo thả hoặc bấm mũi tên để sắp xếp theo đúng thứ tự:
                </span>
                <span className="text-2xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {rawList.length} mục
                </span>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={currentOrderedItems.map((item) => String(item.id))}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2.5">
                        {currentOrderedItems.map((item, idx) => (
                            <SortableItem
                                key={String(item.id)}
                                id={String(item.id)}
                                text={item.text}
                                index={idx}
                                total={currentOrderedItems.length}
                                onMoveUp={() => handleMove(idx, 'up')}
                                onMoveDown={() => handleMove(idx, 'down')}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
