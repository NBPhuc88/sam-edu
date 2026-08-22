import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Image as ImageIcon, Check, X } from 'lucide-react';
import { QuestionReviewItem } from '../QuestionReviewDetail';

interface Props {
    question: QuestionReviewItem;
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

interface ReviewLine {
    id: string;
    sentenceId: string;
    imageId: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    isDashed?: boolean;
    type: 'correct' | 'wrong' | 'target';
}

export default function MatchingImageReview({ question }: Props) {
    const { options, correct_answer, user_answer } = question;
    const containerRef = useRef<HTMLDivElement>(null);
    const sentenceAnchorRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const imageAnchorRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const userAnsMap: Record<string, string> = useMemo(() => {
        if (typeof user_answer === 'object' && user_answer !== null) {
            return user_answer;
        }
        return {};
    }, [user_answer]);

    const correctAnsMap: Record<string, string> = useMemo(() => {
        if (typeof correct_answer === 'object' && correct_answer !== null) {
            return correct_answer;
        }
        return {};
    }, [correct_answer]);

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
                const sText = item.sentence ?? item.text ?? '';
                const imgUrl = item.image_url ?? item.url ?? null;
                const sId = String(item.sentence_id ?? item.id ?? idx + 1);
                const imgId = String(item.image_id ?? String.fromCharCode(65 + idx));

                if (sText) sList.push({ id: sId, text: sText });
                if (imgUrl) {
                    imgList.push({
                        id: imgId,
                        label: `Hình ${imgId}`,
                        image_url: imgUrl,
                    });
                }
            });

            return { sentences: sList, images: imgList };
        }

        return { sentences: [], images: [] };
    }, [options]);

    const [lines, setLines] = useState<ReviewLine[]>([]);

    const calculateLines = useCallback(() => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newLines: ReviewLine[] = [];

        sentences.forEach((sItem) => {
            const sEl = sentenceAnchorRefs.current[sItem.id];
            if (!sEl) return;
            const sRect = sEl.getBoundingClientRect();
            const x1 = sRect.right - containerRect.left;
            const y1 = sRect.top + sRect.height / 2 - containerRect.top;

            const uImgId = userAnsMap[sItem.id];
            const cImgId = correctAnsMap[sItem.id];

            if (uImgId) {
                const isCorrect = cImgId && String(uImgId) === String(cImgId);
                const userImgEl = imageAnchorRefs.current[uImgId];

                if (userImgEl) {
                    const uImgRect = userImgEl.getBoundingClientRect();
                    const x2 = uImgRect.left - containerRect.left;
                    const y2 = uImgRect.top + uImgRect.height / 2 - containerRect.top;

                    newLines.push({
                        id: `user-${sItem.id}-${uImgId}`,
                        sentenceId: sItem.id,
                        imageId: uImgId,
                        x1,
                        y1,
                        x2,
                        y2,
                        color: isCorrect ? '#10b981' : '#ef4444',
                        isDashed: false,
                        type: isCorrect ? 'correct' : 'wrong',
                    });
                }

                if (!isCorrect && cImgId) {
                    const correctImgEl = imageAnchorRefs.current[cImgId];
                    if (correctImgEl) {
                        const cImgRect = correctImgEl.getBoundingClientRect();
                        const x2 = cImgRect.left - containerRect.left;
                        const y2 = cImgRect.top + cImgRect.height / 2 - containerRect.top;

                        newLines.push({
                            id: `target-${sItem.id}-${cImgId}`,
                            sentenceId: sItem.id,
                            imageId: cImgId,
                            x1,
                            y1,
                            x2,
                            y2,
                            color: '#10b981',
                            isDashed: true,
                            type: 'target',
                        });
                    }
                }
            } else if (cImgId) {
                const correctImgEl = imageAnchorRefs.current[cImgId];
                if (correctImgEl) {
                    const cImgRect = correctImgEl.getBoundingClientRect();
                    const x2 = cImgRect.left - containerRect.left;
                    const y2 = cImgRect.top + cImgRect.height / 2 - containerRect.top;

                    newLines.push({
                        id: `target-${sItem.id}-${cImgId}`,
                        sentenceId: sItem.id,
                        imageId: cImgId,
                        x1,
                        y1,
                        x2,
                        y2,
                        color: '#10b981',
                        isDashed: true,
                        type: 'target',
                    });
                }
            }
        });

        setLines(newLines);
    }, [sentences, userAnsMap, correctAnsMap]);

    useEffect(() => {
        calculateLines();
        window.addEventListener('resize', calculateLines);
        return () => window.removeEventListener('resize', calculateLines);
    }, [calculateLines]);

    return (
        <div className="space-y-3 pt-2">
            {/* Guide Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold px-1">
                <div className="flex items-center gap-1.5 text-emerald-800">
                    <span className="h-2.5 w-6 rounded-full bg-emerald-500 inline-block" />
                    <span>Dây Xanh liền: Nối hình chính xác (✓)</span>
                </div>
                <div className="flex items-center gap-1.5 text-rose-800">
                    <span className="h-2.5 w-6 rounded-full bg-rose-500 inline-block" />
                    <span>Dây Đỏ liền: Bạn đã nối sai (✗)</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800">
                    <span className="h-2.5 w-6 border-b-2 border-dashed border-emerald-600 inline-block" />
                    <span>Dây Xanh đứt: Đáp án đúng chuẩn của đề</span>
                </div>
            </div>

            <div
                ref={containerRef}
                className="relative rounded-2xl border border-gray-200 bg-slate-50/50 p-4 select-none min-h-[320px]"
            >
                {/* SVG Canvas */}
                <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible z-10">
                    {lines.map((line) => {
                        const dx = Math.max(40, Math.abs(line.x2 - line.x1) * 0.45);
                        const pathD = `M ${line.x1} ${line.y1} C ${line.x1 + dx} ${line.y1}, ${line.x2 - dx} ${line.y2}, ${line.x2} ${line.y2}`;

                        return (
                            <g key={line.id}>
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke={line.color}
                                    strokeWidth={line.isDashed ? 2.5 : 3.5}
                                    strokeDasharray={line.isDashed ? '6,6' : 'none'}
                                    strokeLinecap="round"
                                    className="transition-all duration-300 opacity-90"
                                />
                                <circle cx={line.x1} cy={line.y1} r={4.5} fill={line.color} />
                                <circle cx={line.x2} cy={line.y2} r={4.5} fill={line.color} />
                            </g>
                        );
                    })}
                </svg>

                {/* Columns Grid */}
                <div className="grid grid-cols-2 gap-8 sm:gap-16 relative z-20">
                    {/* Left: Sentences */}
                    <div className="space-y-3">
                        <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                            Cột Mô tả / Câu hỏi:
                        </span>
                        {sentences.map((s) => {
                            const uImg = userAnsMap[s.id];
                            const cImg = correctAnsMap[s.id];
                            const isPairCorrect = uImg && cImg && String(uImg) === String(cImg);

                            return (
                                <div
                                    key={s.id}
                                    ref={(el) => {
                                        sentenceAnchorRefs.current[s.id] = el;
                                    }}
                                    className={`relative flex items-center justify-between rounded-xl border p-3 bg-white text-xs sm:text-sm font-semibold shadow-2xs transition-all ${
                                        isPairCorrect
                                            ? 'border-2 border-emerald-500 text-emerald-950 bg-emerald-50/40'
                                            : uImg
                                            ? 'border-2 border-rose-400 text-rose-950 bg-rose-50/40'
                                            : 'border-gray-200 text-gray-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                        <span
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                                                isPairCorrect
                                                    ? 'bg-emerald-600 text-white'
                                                    : uImg
                                                    ? 'bg-rose-600 text-white'
                                                    : 'bg-slate-200 text-slate-800'
                                            }`}
                                        >
                                            {s.id}
                                        </span>
                                        <span className="truncate">{s.text}</span>
                                    </div>
                                    <div className="h-3 w-3 rounded-full border-2 border-teal-600 bg-white shrink-0" />
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: Images */}
                    <div className="space-y-3">
                        <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                            Cột Hình ảnh tương ứng:
                        </span>
                        {images.map((img) => (
                            <div
                                key={img.id}
                                ref={(el) => {
                                    imageAnchorRefs.current[img.id] = el;
                                }}
                                className="relative flex items-center justify-between rounded-xl border border-gray-200 p-2.5 bg-white shadow-2xs transition-all"
                            >
                                <div className="h-3 w-3 rounded-full border-2 border-indigo-600 bg-white shrink-0" />
                                <div className="flex items-center gap-2.5 min-w-0 pl-2 text-right justify-end w-full">
                                    {img.image_url ? (
                                        <img
                                            src={img.image_url}
                                            alt={img.label}
                                            className="h-16 w-24 object-cover rounded-lg border border-gray-200 shadow-2xs"
                                        />
                                    ) : (
                                        <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-gray-100 border border-dashed border-gray-300">
                                            <ImageIcon className="h-6 w-6 text-gray-400" />
                                        </div>
                                    )}
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 font-mono text-xs font-bold text-indigo-900 border border-indigo-200">
                                        {img.id}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
