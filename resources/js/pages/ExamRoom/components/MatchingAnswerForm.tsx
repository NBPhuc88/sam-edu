import { CheckCircle2,HelpCircle,ListChecks,RotateCcw,Sparkles,X } from 'lucide-react';
import React,{ useCallback,useEffect,useMemo,useRef,useState } from 'react';

interface Props {
    options: any;
    userAnswers: Record<string, string>;
    onChange: (ans: Record<string, string>) => void;
}

interface Item {
    id: string;
    text: string;
}

interface LineCoord {
    leftId: string;
    rightId: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
}

const LINE_COLORS = [
    '#10b981', // emerald
    '#6366f1', // indigo
    '#f59e0b', // amber
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#8b5cf6', // violet
    '#ef4444', // rose
    '#3b82f6', // blue
];

export default function MatchingAnswerForm({ options, userAnswers = {}, onChange }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const leftAnchorRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const rightAnchorRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    // Dragging / Drawing state (Desktop)
    const [draggingSource, setDraggingSource] = useState<{
        side: 'left' | 'right';
        id: string;
        startX: number;
        startY: number;
    } | null>(null);
    const [currentPointer, setCurrentPointer] = useState<{ x: number; y: number } | null>(null);
    const [hoveredTarget, setHoveredTarget] = useState<{ side: 'left' | 'right'; id: string } | null>(null);

    // Parse options
    const { leftItems, rightItems } = useMemo<{
        leftItems: Item[];
        rightItems: Item[];
    }>(() => {
        if (!options) return { leftItems: [], rightItems: [] };

        const rawLeft = options.left_items || options.left || options.leftItems;
        const rawRight = options.right_items || options.right || options.rightItems;

        if (Array.isArray(rawLeft) && Array.isArray(rawRight)) {
            return {
                leftItems: rawLeft.map((item: any, idx: number) => ({
                    id: String(item.id ?? item.key ?? idx + 1),
                    text: String(item.text ?? item.label ?? item.content ?? (typeof item === 'string' ? item : '')),
                })),
                rightItems: rawRight.map((item: any, idx: number) => ({
                    id: String(item.id ?? item.key ?? String.fromCharCode(65 + idx)),
                    text: String(item.text ?? item.label ?? item.content ?? (typeof item === 'string' ? item : '')),
                })),
            };
        }

        if (Array.isArray(options)) {
            const lList: Item[] = [];
            const rList: Item[] = [];

            options.forEach((item: any, idx: number) => {
                const lText = item.left ?? item.left_text ?? item.text ?? item.label ?? (typeof item === 'string' ? item : '');
                const rText = item.right ?? item.right_text ?? item.match ?? '';
                const lId = String(item.left_id ?? item.id ?? item.key ?? idx + 1);
                const rId = String(item.right_id ?? String.fromCharCode(65 + idx));

                if (lText) lList.push({ id: lId, text: lText });
                if (rText) rList.push({ id: rId, text: rText });
            });

            return { leftItems: lList, rightItems: rList };
        }

        return { leftItems: [], rightItems: [] };
    }, [options]);

    // Computed coordinates for connected SVG lines (Desktop)
    const [lines, setLines] = useState<LineCoord[]>([]);

    const calculateLines = useCallback(() => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newLines: LineCoord[] = [];

        Object.entries(userAnswers).forEach(([leftId, rightId], index) => {
            if (!rightId) return;
            const leftAnchor = leftAnchorRefs.current[leftId];
            const rightAnchor = rightAnchorRefs.current[rightId];

            if (leftAnchor && rightAnchor) {
                const lRect = leftAnchor.getBoundingClientRect();
                const rRect = rightAnchor.getBoundingClientRect();

                newLines.push({
                    leftId,
                    rightId,
                    x1: lRect.left + lRect.width / 2 - containerRect.left,
                    y1: lRect.top + lRect.height / 2 - containerRect.top,
                    x2: rRect.left + rRect.width / 2 - containerRect.left,
                    y2: rRect.top + rRect.height / 2 - containerRect.top,
                    color: LINE_COLORS[index % LINE_COLORS.length],
                });
            }
        });

        setLines(newLines);
    }, [userAnswers]);

    // Update lines on render, window resize or DOM mutation
    useEffect(() => {
        calculateLines();
        const handleResize = () => calculateLines();
        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleResize, true);

        const resizeObserver = new ResizeObserver(() => {
            calculateLines();
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleResize, true);
            resizeObserver.disconnect();
        };
    }, [calculateLines, leftItems, rightItems]);

    // -------------------------------------------------------------
    // Desktop Pointer Drag to Connect Handlers
    // -------------------------------------------------------------
    const handlePointerDown = (side: 'left' | 'right', id: string, e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();

        const anchorEl = side === 'left' ? leftAnchorRefs.current[id] : rightAnchorRefs.current[id];
        if (!anchorEl) return;

        const anchorRect = anchorEl.getBoundingClientRect();
        const startX = anchorRect.left + anchorRect.width / 2 - containerRect.left;
        const startY = anchorRect.top + anchorRect.height / 2 - containerRect.top;

        setDraggingSource({ side, id, startX, startY });
        setCurrentPointer({
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top,
        });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!draggingSource || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        setCurrentPointer({
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top,
        });
    };

    const handlePointerUp = () => {
        if (!draggingSource) return;

        if (hoveredTarget && hoveredTarget.side !== draggingSource.side) {
            const leftId = draggingSource.side === 'left' ? draggingSource.id : hoveredTarget.id;
            const rightId = draggingSource.side === 'right' ? draggingSource.id : hoveredTarget.id;

            onChange({
                ...userAnswers,
                [leftId]: rightId,
            });
        }

        setDraggingSource(null);
        setCurrentPointer(null);
        setHoveredTarget(null);
    };

    const handleAnchorClick = (side: 'left' | 'right', id: string) => {
        if (draggingSource) {
            if (draggingSource.side !== side) {
                const leftId = draggingSource.side === 'left' ? draggingSource.id : id;
                const rightId = draggingSource.side === 'right' ? draggingSource.id : id;

                onChange({
                    ...userAnswers,
                    [leftId]: rightId,
                });
                setDraggingSource(null);
                setCurrentPointer(null);
            } else {
                setDraggingSource(null);
                setCurrentPointer(null);
            }
        }
    };

    const handleRemovePair = (leftId: string) => {
        const next = { ...userAnswers };
        delete next[leftId];
        onChange(next);
    };

    const handleSelectMatch = (leftId: string, rightId: string) => {
        if (!rightId) {
            handleRemovePair(leftId);
        } else {
            onChange({
                ...userAnswers,
                [leftId]: rightId,
            });
        }
    };

    const handleClearAll = () => {
        onChange({});
        setDraggingSource(null);
        setCurrentPointer(null);
    };

    if (leftItems.length === 0) {
        return (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-gray-500">
                Không có dữ liệu các cặp để ghép nối.
            </div>
        );
    }

    const matchedCount = Object.keys(userAnswers).filter((k) => userAnswers[k]).length;

    return (
        <div className="space-y-4">
            {/* ========================================================================= */}
            {/* MOBILE VIEW (Dưới màn hình MD): Dạng danh sách Dropdown thân thiện       */}
            {/* ========================================================================= */}
            <div className="block md:hidden space-y-4 rounded-2xl bg-slate-50/90 p-4 border border-slate-200 select-none">
                {/* Header & Quick stats */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                            <ListChecks className="h-4 w-4" />
                        </span>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-900 block">
                                Ghép nối câu hỏi (Cột A & Cột B)
                            </span>
                            <span className="text-2xs text-gray-500 font-medium">
                                Chọn đáp án tương ứng ở Cột B cho từng mục
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-2xs font-extrabold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs">
                            Đã ghép: {matchedCount}/{leftItems.length}
                        </span>

                        {matchedCount > 0 && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="inline-flex items-center gap-1 text-2xs font-bold text-rose-600 hover:text-rose-700 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-2xs"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Xóa hết
                            </button>
                        )}
                    </div>
                </div>

                {/* Danh sách mục Cột A kèm ô Dropdown chọn Cột B */}
                <div className="space-y-3">
                    <span className="text-2xs font-bold uppercase tracking-wider text-emerald-900 block pl-1">
                        Cột A: Danh sách câu hỏi / đoạn văn ({leftItems.length} mục)
                    </span>

                    {leftItems.map((lItem, idx) => {
                        const selectedRightId = userAnswers[lItem.id] || '';
                        const matchedRightItem = rightItems.find((r) => r.id === selectedRightId);
                        const isConnected = Boolean(selectedRightId);

                        return (
                            <div
                                key={lItem.id}
                                className={`p-3.5 rounded-2xl border transition-all ${
                                    isConnected
                                        ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-400/30'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                {/* Cột A Item Text */}
                                <div className="flex items-start gap-2.5 mb-2.5">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-600 font-mono text-xs font-bold text-white shadow-2xs">
                                        {idx + 1}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-900 leading-relaxed break-words flex-1">
                                        {lItem.text}
                                    </span>
                                    {isConnected && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePair(lItem.id)}
                                            className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                            title="Gỡ lựa chọn"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Select Dropdown to Pick Right Column Item */}
                                <div className="space-y-1.5 pt-1 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor={`mobile-select-${lItem.id}`}
                                            className="text-3xs font-bold uppercase tracking-wider text-gray-500"
                                        >
                                            Ghép với vế Cột B:
                                        </label>
                                        {isConnected && matchedRightItem && (
                                            <span className="inline-flex items-center gap-1 text-3xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                {matchedRightItem.id}
                                            </span>
                                        )}
                                    </div>

                                    <select
                                        id={`mobile-select-${lItem.id}`}
                                        value={selectedRightId}
                                        onChange={(e) => handleSelectMatch(lItem.id, e.target.value)}
                                        className={`w-full rounded-xl border py-2.5 pl-3 pr-8 text-xs font-medium focus:outline-none transition-all ${
                                            isConnected
                                                ? 'border-emerald-400 bg-white text-emerald-950 font-bold focus:ring-2 focus:ring-emerald-400/30'
                                                : 'border-gray-300 bg-slate-50 text-gray-800 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20'
                                        }`}
                                    >
                                        <option value="">-- Nhấp chọn đáp án Cột B --</option>
                                        {rightItems.map((rItem) => {
                                            const isSelectedElsewhere = Object.entries(userAnswers).some(
                                                ([lId, rId]) => lId !== lItem.id && rId === rItem.id
                                            );
                                            return (
                                                <option key={rItem.id} value={rItem.id}>
                                                    [{rItem.id}] {rItem.text} {isSelectedElsewhere ? ' (Đã ghép ở câu khác)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bảng tra cứu nội dung Cột B để xem nhanh trên mobile */}
                <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 space-y-2">
                    <span className="text-2xs font-bold uppercase tracking-wider text-purple-900 block flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-purple-600" />
                        Danh sách nội dung Cột B ({rightItems.length} mục)
                    </span>
                    <div className="space-y-2">
                        {rightItems.map((rItem) => (
                            <div
                                key={rItem.id}
                                className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-purple-100 text-xs text-gray-800"
                            >
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-purple-100 font-mono text-2xs font-bold text-purple-800 border border-purple-200">
                                    {rItem.id}
                                </span>
                                <span className="font-medium text-gray-900 leading-snug break-words">
                                    {rItem.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* DESKTOP VIEW (Từ màn hình MD trở lên): Kéo dây nối SVG trực quan          */}
            {/* ========================================================================= */}
            <div
                ref={containerRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="hidden md:block relative space-y-4 rounded-3xl bg-slate-50/90 p-6 border border-slate-200 select-none overflow-hidden"
            >
                {/* Header & Quick stats */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/80 pb-3">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                            <Sparkles className="h-4 w-4" />
                        </span>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-900 block">
                                Kéo dây nối 2 cột tương ứng
                            </span>
                            <span className="text-2xs text-gray-500 font-medium">
                                Nhấn giữ nút tròn ở một vế và kéo dây sang vế đối diện để nối
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-2xs font-extrabold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs">
                            Đã nối: {matchedCount}/{leftItems.length} cặp
                        </span>

                        {matchedCount > 0 && (
                            <button
                                type="button"
                                onClick={handleClearAll}
                                className="inline-flex items-center gap-1 text-2xs font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 px-2.5 py-1 rounded-full border border-gray-200 transition-all shadow-2xs"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Xóa dây nối
                            </button>
                        )}
                    </div>
                </div>

                {/* Connecting SVG Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                    <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.25" />
                        </filter>
                    </defs>

                    {/* Permanent Connected Wires */}
                    {lines.map((line) => {
                        const dx = Math.max(Math.abs(line.x2 - line.x1) * 0.5, 40);
                        const pathD = `M ${line.x1} ${line.y1} C ${line.x1 + dx} ${line.y1}, ${line.x2 - dx} ${line.y2}, ${line.x2} ${line.y2}`;
                        const midX = (line.x1 + line.x2) / 2;
                        const midY = (line.y1 + line.y2) / 2;

                        return (
                            <g key={`${line.leftId}-${line.rightId}`} className="group cursor-pointer pointer-events-auto">
                                {/* Outer Glow Path */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke={line.color}
                                    strokeWidth={7}
                                    strokeOpacity={0.2}
                                    strokeLinecap="round"
                                />
                                {/* Main Wire Path */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke={line.color}
                                    strokeWidth={3.5}
                                    strokeLinecap="round"
                                    filter="url(#glow)"
                                    className="transition-all"
                                />
                                {/* Wire Start & End Pins */}
                                <circle cx={line.x1} cy={line.y1} r={4.5} fill="#ffffff" stroke={line.color} strokeWidth={3} />
                                <circle cx={line.x2} cy={line.y2} r={4.5} fill="#ffffff" stroke={line.color} strokeWidth={3} />

                                {/* Midpoint Unwire Badge Button */}
                                <g
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePair(line.leftId);
                                    }}
                                    className="cursor-pointer transition-transform hover:scale-125"
                                >
                                    <circle cx={midX} cy={midY} r={10} fill="#ffffff" stroke={line.color} strokeWidth={2} />
                                    <text
                                        x={midX}
                                        y={midY + 3.5}
                                        textAnchor="middle"
                                        fontSize={10}
                                        fontWeight="bold"
                                        fill="#ef4444"
                                    >
                                        ✕
                                    </text>
                                </g>
                            </g>
                        );
                    })}

                    {/* Real-time Dynamic Wire when Dragging */}
                    {draggingSource && currentPointer && (
                        <g>
                            {(() => {
                                const isLeft = draggingSource.side === 'left';
                                const x1 = draggingSource.startX;
                                const y1 = draggingSource.startY;
                                const x2 = currentPointer.x;
                                const y2 = currentPointer.y;
                                const dx = Math.max(Math.abs(x2 - x1) * 0.5, 30);
                                const pathD = isLeft
                                    ? `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
                                    : `M ${x1} ${y1} C ${x1 - dx} ${y1}, ${x2 + dx} ${y2}, ${x2} ${y2}`;

                                return (
                                    <>
                                        <path
                                            d={pathD}
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth={6}
                                            strokeOpacity={0.25}
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d={pathD}
                                            fill="none"
                                            stroke="#10b981"
                                            strokeWidth={3.5}
                                            strokeDasharray="6 4"
                                            strokeLinecap="round"
                                            className="animate-pulse"
                                        />
                                        <circle cx={x1} cy={y1} r={5} fill="#10b981" />
                                        <circle cx={x2} cy={y2} r={6} fill="#10b981" stroke="#ffffff" strokeWidth={2} />
                                    </>
                                );
                            })()}
                        </g>
                    )}
                </svg>

                {/* Columns Grid Layout */}
                <div className="grid grid-cols-2 gap-8 md:gap-16 items-start relative z-0">
                    {/* ----------------- LEFT COLUMN ----------------- */}
                    <div className="space-y-3.5">
                        <span className="text-2xs font-bold uppercase tracking-wider text-emerald-900 block pl-1">
                            Cột A: Câu hỏi / Đoạn văn ({leftItems.length} mục)
                        </span>

                        <div className="space-y-3">
                            {leftItems.map((item, idx) => {
                                const isConnected = Boolean(userAnswers[item.id]);
                                const isDraggingThis = draggingSource?.side === 'left' && draggingSource?.id === item.id;
                                const isHovered = hoveredTarget?.side === 'left' && hoveredTarget?.id === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        className={`relative flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                                            isConnected
                                                ? 'border-emerald-300 bg-white shadow-2xs ring-1 ring-emerald-400/30'
                                                : isDraggingThis
                                                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400'
                                                : isHovered
                                                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-400'
                                                : 'border-gray-200 bg-white hover:border-gray-300 shadow-2xs'
                                        }`}
                                    >
                                        {/* Left Content */}
                                        <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-600 font-mono text-xs font-bold text-white shadow-2xs">
                                                {idx + 1}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-900 leading-relaxed break-words">
                                                {item.text}
                                            </span>
                                        </div>

                                        {/* Right Side Wire Anchor Dot */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {isConnected && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePair(item.id)}
                                                    className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                    title="Gỡ dây nối"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                ref={(el) => {
                                                    leftAnchorRefs.current[item.id] = el;
                                                }}
                                                onPointerDown={(e) => handlePointerDown('left', item.id, e)}
                                                onClick={() => handleAnchorClick('left', item.id)}
                                                onPointerEnter={() => setHoveredTarget({ side: 'left', id: item.id })}
                                                onPointerLeave={() => setHoveredTarget(null)}
                                                title="Kéo dây nối sang Cột B"
                                                className={`relative h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all cursor-crosshair active:scale-125 hover:scale-110 z-20 ${
                                                    isConnected
                                                        ? 'border-emerald-500 bg-emerald-500 text-white ring-4 ring-emerald-100'
                                                        : isDraggingThis
                                                        ? 'border-emerald-600 bg-emerald-600 text-white ring-4 ring-emerald-200'
                                                        : 'border-emerald-400 bg-white hover:border-emerald-600 hover:bg-emerald-50'
                                                }`}
                                            >
                                                <div className="h-2 w-2 rounded-full bg-current" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ----------------- RIGHT COLUMN ----------------- */}
                    <div className="space-y-3.5">
                        <span className="text-2xs font-bold uppercase tracking-wider text-purple-900 block pl-1">
                            Cột B: Tiêu đề / Vế ghép ({rightItems.length} mục)
                        </span>

                        <div className="space-y-3">
                            {rightItems.map((item) => {
                                const isConnected = Object.values(userAnswers).includes(item.id);
                                const isDraggingThis = draggingSource?.side === 'right' && draggingSource?.id === item.id;
                                const isHovered = hoveredTarget?.side === 'right' && hoveredTarget?.id === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        className={`relative flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                                            isConnected
                                                ? 'border-purple-300 bg-white shadow-2xs ring-1 ring-purple-400/30'
                                                : isDraggingThis
                                                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-400'
                                                : isHovered
                                                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400'
                                                : 'border-gray-200 bg-white hover:border-gray-300 shadow-2xs'
                                        }`}
                                    >
                                        {/* Left Side Wire Anchor Dot */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                ref={(el) => {
                                                    rightAnchorRefs.current[item.id] = el;
                                                }}
                                                onPointerDown={(e) => handlePointerDown('right', item.id, e)}
                                                onClick={() => handleAnchorClick('right', item.id)}
                                                onPointerEnter={() => setHoveredTarget({ side: 'right', id: item.id })}
                                                onPointerLeave={() => setHoveredTarget(null)}
                                                title="Kéo dây nối sang Cột A"
                                                className={`relative h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all cursor-crosshair active:scale-125 hover:scale-110 z-20 ${
                                                    isConnected
                                                        ? 'border-purple-500 bg-purple-500 text-white ring-4 ring-purple-100'
                                                        : isDraggingThis
                                                        ? 'border-purple-600 bg-purple-600 text-white ring-4 ring-purple-200'
                                                        : 'border-purple-400 bg-white hover:border-purple-600 hover:bg-purple-50'
                                                }`}
                                            >
                                                <div className="h-2 w-2 rounded-full bg-current" />
                                            </button>
                                        </div>

                                        {/* Right Content */}
                                        <div className="flex items-start gap-3 flex-1 min-w-0 pl-2 justify-between">
                                            <span className="text-xs font-semibold text-gray-900 leading-relaxed break-words">
                                                {item.text}
                                            </span>
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-100 font-mono text-xs font-bold text-purple-800 border border-purple-200">
                                                {item.id}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

