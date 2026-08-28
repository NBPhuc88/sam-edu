import { CheckCircle2,Image as ImageIcon,ListChecks,RotateCcw,Sparkles,X } from 'lucide-react';
import React,{ useCallback,useEffect,useMemo,useRef,useState } from 'react';

interface Props {
    options: any;
    userAnswers: Record<string, string>;
    onChange: (ans: Record<string, string>) => void;
}

interface ImageItem {
    id: string;
    label: string;
    image_url: string | null;
}

interface SentenceItem {
    id: string;
    text: string;
}

interface LineCoord {
    sentenceId: string;
    imageId: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
}

const LINE_COLORS = [
    '#0d9488', // teal
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#f59e0b', // amber
    '#ec4899', // pink
    '#10b981', // emerald
    '#ef4444', // rose
    '#6366f1', // indigo
];

export default function MatchingImageAnswerForm({ options, userAnswers = {}, onChange }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sentenceAnchorRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const imageAnchorRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    // Dragging / Drawing state (Desktop)
    const [draggingSource, setDraggingSource] = useState<{
        side: 'sentence' | 'image';
        id: string;
        startX: number;
        startY: number;
    } | null>(null);
    const [currentPointer, setCurrentPointer] = useState<{ x: number; y: number } | null>(null);
    const [hoveredTarget, setHoveredTarget] = useState<{ side: 'sentence' | 'image'; id: string } | null>(null);

    const { sentences, images } = useMemo<{
        sentences: SentenceItem[];
        images: ImageItem[];
    }>(() => {
        if (!options) return { sentences: [], images: [] };

        if (Array.isArray(options.sentences) && Array.isArray(options.images)) {
            return {
                sentences: options.sentences.map((s: any, idx: number) => ({
                    id: String(s.id ?? idx + 1),
                    text: String(s.text ?? s.content ?? ''),
                })),
                images: options.images.map((img: any, idx: number) => ({
                    id: String(img.id ?? String.fromCharCode(65 + idx)),
                    label: String(img.label ?? `Hình ${String.fromCharCode(65 + idx)}`),
                    image_url: img.image_url ?? img.url ?? null,
                })),
            };
        }

        if (Array.isArray(options)) {
            const sList: SentenceItem[] = [];
            const imgList: ImageItem[] = [];

            options.forEach((item: any, idx: number) => {
                const sId = String(item.id ?? idx + 1);
                const imgId = String(item.id ?? String.fromCharCode(65 + idx));
                const sText = String(item.text ?? item.content ?? '');
                const imgUrl = item.image_url ?? item.url ?? null;
                const label = item.label ?? `Hình ${String.fromCharCode(65 + idx)}`;

                if (sText) sList.push({ id: sId, text: sText });
                if (imgUrl) imgList.push({ id: imgId, label, image_url: imgUrl });
            });

            return { sentences: sList, images: imgList };
        }

        return { sentences: [], images: [] };
    }, [options]);

    // Computed coordinates for connected SVG lines (Desktop)
    const [lines, setLines] = useState<LineCoord[]>([]);

    const calculateLines = useCallback(() => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newLines: LineCoord[] = [];

        Object.entries(userAnswers).forEach(([sentenceId, imageId], index) => {
            if (!imageId) return;
            const sentAnchor = sentenceAnchorRefs.current[sentenceId];
            const imgAnchor = imageAnchorRefs.current[imageId];

            if (sentAnchor && imgAnchor) {
                const sRect = sentAnchor.getBoundingClientRect();
                const iRect = imgAnchor.getBoundingClientRect();

                newLines.push({
                    sentenceId,
                    imageId,
                    x1: sRect.left + sRect.width / 2 - containerRect.left,
                    y1: sRect.top + sRect.height / 2 - containerRect.top,
                    x2: iRect.left + iRect.width / 2 - containerRect.left,
                    y2: iRect.top + iRect.height / 2 - containerRect.top,
                    color: LINE_COLORS[index % LINE_COLORS.length],
                });
            }
        });

        setLines(newLines);
    }, [userAnswers]);

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
    }, [calculateLines, sentences, images]);

    // -------------------------------------------------------------
    // Desktop Pointer Drag Handlers
    // -------------------------------------------------------------
    const handlePointerDown = (side: 'sentence' | 'image', id: string, e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();

        const anchorEl = side === 'sentence' ? sentenceAnchorRefs.current[id] : imageAnchorRefs.current[id];
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
            const sentenceId = draggingSource.side === 'sentence' ? draggingSource.id : hoveredTarget.id;
            const imageId = draggingSource.side === 'image' ? draggingSource.id : hoveredTarget.id;

            onChange({
                ...userAnswers,
                [sentenceId]: imageId,
            });
        }

        setDraggingSource(null);
        setCurrentPointer(null);
        setHoveredTarget(null);
    };

    const handleAnchorClick = (side: 'sentence' | 'image', id: string) => {
        if (draggingSource) {
            if (draggingSource.side !== side) {
                const sentenceId = draggingSource.side === 'sentence' ? draggingSource.id : id;
                const imageId = draggingSource.side === 'image' ? draggingSource.id : id;

                onChange({
                    ...userAnswers,
                    [sentenceId]: imageId,
                });
                setDraggingSource(null);
                setCurrentPointer(null);
            } else {
                setDraggingSource(null);
                setCurrentPointer(null);
            }
        }
    };

    const handleRemovePair = (sentenceId: string) => {
        const next = { ...userAnswers };
        delete next[sentenceId];
        onChange(next);
    };

    const handleSelectMatch = (sentenceId: string, imageId: string) => {
        if (!imageId) {
            handleRemovePair(sentenceId);
        } else {
            onChange({
                ...userAnswers,
                [sentenceId]: imageId,
            });
        }
    };

    const handleClearAll = () => {
        onChange({});
        setDraggingSource(null);
        setCurrentPointer(null);
    };

    if (sentences.length === 0 && images.length === 0) {
        return (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-gray-500">
                Không có dữ liệu các hình ảnh để ghép nối.
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
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-600 text-white shadow-2xs">
                            <ListChecks className="h-4 w-4" />
                        </span>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-gray-900 block">
                                Ghép nối câu với hình ảnh
                            </span>
                            <span className="text-2xs text-gray-500 font-medium">
                                Chọn hình ảnh tương ứng cho từng câu mô tả
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-2xs font-extrabold text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-full border border-teal-300 shadow-2xs">
                            Đã ghép: {matchedCount}/{sentences.length}
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

                {/* Danh sách câu hỏi kèm Dropdown chọn ảnh */}
                <div className="space-y-3">
                    <span className="text-2xs font-bold uppercase tracking-wider text-teal-900 block pl-1">
                        Danh sách câu mô tả ({sentences.length} câu)
                    </span>

                    {sentences.map((sent, idx) => {
                        const selectedImageId = userAnswers[sent.id] || '';
                        const matchedImg = images.find((img) => img.id === selectedImageId);
                        const isConnected = Boolean(selectedImageId);

                        return (
                            <div
                                key={sent.id}
                                className={`p-3.5 rounded-2xl border transition-all ${
                                    isConnected
                                        ? 'border-teal-300 bg-teal-50/40 ring-1 ring-teal-400/30'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                <div className="flex items-start gap-2.5 mb-2.5">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-600 font-mono text-xs font-bold text-white shadow-2xs">
                                        {idx + 1}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-900 leading-relaxed break-words flex-1">
                                        {sent.text}
                                    </span>
                                    {isConnected && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePair(sent.id)}
                                            className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                            title="Gỡ lựa chọn"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Select Dropdown to Pick Image */}
                                <div className="space-y-2 pt-1 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor={`mobile-img-select-${sent.id}`}
                                            className="text-3xs font-bold uppercase tracking-wider text-gray-500"
                                        >
                                            Ghép với hình ảnh:
                                        </label>
                                        {isConnected && matchedImg && (
                                            <span className="inline-flex items-center gap-1 text-3xs font-extrabold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">
                                                <CheckCircle2 className="h-3 w-3 text-teal-600" />
                                                {matchedImg.label}
                                            </span>
                                        )}
                                    </div>

                                    <select
                                        id={`mobile-img-select-${sent.id}`}
                                        value={selectedImageId}
                                        onChange={(e) => handleSelectMatch(sent.id, e.target.value)}
                                        className={`w-full rounded-xl border py-2.5 pl-3 pr-8 text-xs font-medium focus:outline-none transition-all ${
                                            isConnected
                                                ? 'border-teal-400 bg-white text-teal-950 font-bold focus:ring-2 focus:ring-teal-400/30'
                                                : 'border-gray-300 bg-slate-50 text-gray-800 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20'
                                        }`}
                                    >
                                        <option value="">-- Nhấp chọn hình ảnh --</option>
                                        {images.map((img) => {
                                            const isSelectedElsewhere = Object.entries(userAnswers).some(
                                                ([sId, iId]) => sId !== sent.id && iId === img.id
                                            );
                                            return (
                                                <option key={img.id} value={img.id}>
                                                    [{img.label}] {isSelectedElsewhere ? ' (Đã ghép ở câu khác)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>

                                    {/* Preview selected image thumbnail on mobile */}
                                    {isConnected && matchedImg && matchedImg.image_url && (
                                        <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-teal-200 mt-2">
                                            <img
                                                src={matchedImg.image_url}
                                                alt={matchedImg.label}
                                                className="h-14 w-20 object-contain rounded-lg bg-slate-50 border border-slate-100"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-teal-900 flex items-center gap-1">
                                                    <ImageIcon className="h-3.5 w-3.5 text-teal-600" />
                                                    {matchedImg.label}
                                                </span>
                                                <span className="text-3xs text-gray-500 font-medium">Hình ảnh đã chọn</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Danh sách các hình ảnh để học sinh tra cứu trên mobile */}
                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 space-y-3">
                    <span className="text-2xs font-bold uppercase tracking-wider text-blue-900 block flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                        Danh sách hình ảnh ({images.length} hình)
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                        {images.map((img) => (
                            <div
                                key={img.id}
                                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white border border-blue-100 text-center"
                            >
                                {img.image_url ? (
                                    <div className="h-20 w-full rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={img.image_url}
                                            alt={img.label}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-20 w-full rounded-lg bg-slate-100 flex items-center justify-center text-3xs text-gray-400">
                                        Không có ảnh
                                    </div>
                                )}
                                <span className="font-mono text-2xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 w-full">
                                    {img.label}
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
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/80 pb-3">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-600 text-white shadow-2xs">
                            <Sparkles className="h-4 w-4" />
                        </span>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-900 block">
                                Kéo dây nối câu mô tả với hình ảnh tương ứng
                            </span>
                            <span className="text-2xs text-gray-500 font-medium">
                                Nhấn giữ nút tròn ở một câu và kéo dây sang hình tương ứng ở cột đối diện
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-2xs font-extrabold text-teal-800 bg-teal-100/70 px-2.5 py-1 rounded-full border border-teal-300 shadow-2xs">
                            Đã nối: {matchedCount}/{sentences.length} hình
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
                        <filter id="img-glow" x="-20%" y="-20%" width="140%" height="140%">
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
                            <g key={`${line.sentenceId}-${line.imageId}`} className="group cursor-pointer pointer-events-auto">
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke={line.color}
                                    strokeWidth={7}
                                    strokeOpacity={0.2}
                                    strokeLinecap="round"
                                />
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke={line.color}
                                    strokeWidth={3.5}
                                    strokeLinecap="round"
                                    filter="url(#img-glow)"
                                    className="transition-all"
                                />
                                <circle cx={line.x1} cy={line.y1} r={4.5} fill="#ffffff" stroke={line.color} strokeWidth={3} />
                                <circle cx={line.x2} cy={line.y2} r={4.5} fill="#ffffff" stroke={line.color} strokeWidth={3} />

                                {/* Midpoint Unwire Button */}
                                <g
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemovePair(line.sentenceId);
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

                    {/* Dynamic Dragging Wire */}
                    {draggingSource && currentPointer && (
                        <g>
                            {(() => {
                                const isSentence = draggingSource.side === 'sentence';
                                const x1 = draggingSource.startX;
                                const y1 = draggingSource.startY;
                                const x2 = currentPointer.x;
                                const y2 = currentPointer.y;
                                const dx = Math.max(Math.abs(x2 - x1) * 0.5, 30);
                                const pathD = isSentence
                                    ? `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
                                    : `M ${x1} ${y1} C ${x1 - dx} ${y1}, ${x2 + dx} ${y2}, ${x2} ${y2}`;

                                return (
                                    <>
                                        <path
                                            d={pathD}
                                            fill="none"
                                            stroke="#0d9488"
                                            strokeWidth={6}
                                            strokeOpacity={0.25}
                                            strokeLinecap="round"
                                        />
                                        <path
                                            d={pathD}
                                            fill="none"
                                            stroke="#0d9488"
                                            strokeWidth={3.5}
                                            strokeDasharray="6 4"
                                            strokeLinecap="round"
                                            className="animate-pulse"
                                        />
                                        <circle cx={x1} cy={y1} r={5} fill="#0d9488" />
                                        <circle cx={x2} cy={y2} r={6} fill="#0d9488" stroke="#ffffff" strokeWidth={2} />
                                    </>
                                );
                            })()}
                        </g>
                    )}
                </svg>

                {/* Dual Column Layout */}
                <div className="grid grid-cols-2 gap-8 md:gap-16 items-start relative z-0">
                    {/* Sentences Column */}
                    <div className="space-y-3.5">
                        <span className="text-2xs font-bold uppercase tracking-wider text-teal-900 block pl-1">
                            Cột câu mô tả ({sentences.length} câu)
                        </span>

                        <div className="space-y-3">
                            {sentences.map((sent, idx) => {
                                const isConnected = Boolean(userAnswers[sent.id]);
                                const isDraggingThis = draggingSource?.side === 'sentence' && draggingSource?.id === sent.id;
                                const isHovered = hoveredTarget?.side === 'sentence' && hoveredTarget?.id === sent.id;

                                return (
                                    <div
                                        key={sent.id}
                                        className={`relative flex items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                                            isConnected
                                                ? 'border-teal-300 bg-white shadow-2xs ring-1 ring-teal-400/30'
                                                : isDraggingThis
                                                ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-400'
                                                : isHovered
                                                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400'
                                                : 'border-gray-200 bg-white hover:border-gray-300 shadow-2xs'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-700 font-mono text-xs font-bold text-white shadow-2xs">
                                                {idx + 1}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-900 leading-relaxed break-words">
                                                {sent.text}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {isConnected && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePair(sent.id)}
                                                    className="p-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                    title="Gỡ dây nối"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                ref={(el) => {
                                                    sentenceAnchorRefs.current[sent.id] = el;
                                                }}
                                                onPointerDown={(e) => handlePointerDown('sentence', sent.id, e)}
                                                onClick={() => handleAnchorClick('sentence', sent.id)}
                                                onPointerEnter={() => setHoveredTarget({ side: 'sentence', id: sent.id })}
                                                onPointerLeave={() => setHoveredTarget(null)}
                                                title="Kéo dây nối sang hình ảnh"
                                                className={`relative h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all cursor-crosshair active:scale-125 hover:scale-110 z-20 ${
                                                    isConnected
                                                        ? 'border-teal-500 bg-teal-500 text-white ring-4 ring-teal-100'
                                                        : isDraggingThis
                                                        ? 'border-teal-600 bg-teal-600 text-white ring-4 ring-teal-200'
                                                        : 'border-teal-400 bg-white hover:border-teal-600 hover:bg-teal-50'
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

                    {/* Images Column */}
                    <div className="space-y-3.5">
                        <span className="text-2xs font-bold uppercase tracking-wider text-blue-900 block pl-1">
                            Cột hình ảnh ({images.length} hình)
                        </span>

                        <div className="space-y-3">
                            {images.map((img) => {
                                const isConnected = Object.values(userAnswers).includes(img.id);
                                const isDraggingThis = draggingSource?.side === 'image' && draggingSource?.id === img.id;
                                const isHovered = hoveredTarget?.side === 'image' && hoveredTarget?.id === img.id;

                                return (
                                    <div
                                        key={img.id}
                                        className={`relative flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                                            isConnected
                                                ? 'border-blue-300 bg-white shadow-2xs ring-1 ring-blue-400/30'
                                                : isDraggingThis
                                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400'
                                                : isHovered
                                                ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-400'
                                                : 'border-gray-200 bg-white hover:border-gray-300 shadow-2xs'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <button
                                                type="button"
                                                ref={(el) => {
                                                    imageAnchorRefs.current[img.id] = el;
                                                }}
                                                onPointerDown={(e) => handlePointerDown('image', img.id, e)}
                                                onClick={() => handleAnchorClick('image', img.id)}
                                                onPointerEnter={() => setHoveredTarget({ side: 'image', id: img.id })}
                                                onPointerLeave={() => setHoveredTarget(null)}
                                                title="Kéo dây nối sang câu mô tả"
                                                className={`relative h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all cursor-crosshair active:scale-125 hover:scale-110 z-20 ${
                                                    isConnected
                                                        ? 'border-blue-500 bg-blue-500 text-white ring-4 ring-blue-100'
                                                        : isDraggingThis
                                                        ? 'border-blue-600 bg-blue-600 text-white ring-4 ring-purple-200'
                                                        : 'border-blue-400 bg-white hover:border-blue-600 hover:bg-blue-50'
                                                }`}
                                            >
                                                <div className="h-2 w-2 rounded-full bg-current" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3 flex-1 min-w-0 pl-2">
                                            {img.image_url ? (
                                                <div className="h-16 w-20 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                                    <img
                                                        src={img.image_url}
                                                        alt={img.label}
                                                        className="max-h-full max-w-full object-contain pointer-events-none"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-16 w-20 rounded-xl bg-slate-100 flex items-center justify-center text-3xs text-gray-400 shrink-0">
                                                    Không có ảnh
                                                </div>
                                            )}

                                            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1">
                                                <ImageIcon className="h-3 w-3 text-blue-600" />
                                                {img.label}
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
