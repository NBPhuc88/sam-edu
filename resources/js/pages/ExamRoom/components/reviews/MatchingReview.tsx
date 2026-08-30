import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import { QuestionReviewItem } from '../QuestionReviewDetail';

interface Props {
    question: QuestionReviewItem;
}

interface Item {
    id: string;
    text: string;
}

interface ReviewLine {
    id: string;
    leftId: string;
    rightId: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    isDashed?: boolean;
    type: 'correct' | 'wrong' | 'target';
}

export default function MatchingReview({ question }: Props) {
    const { options, correct_answer, user_answer } = question;
    const containerRef = useRef<HTMLDivElement>(null);
    const leftAnchorRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const rightAnchorRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

    const [lines, setLines] = useState<ReviewLine[]>([]);

    const calculateLines = useCallback(() => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newLines: ReviewLine[] = [];

        leftItems.forEach((lItem) => {
            const leftEl = leftAnchorRefs.current[lItem.id];
            if (!leftEl) return;
            const leftRect = leftEl.getBoundingClientRect();
            const x1 = leftRect.right - containerRect.left;
            const y1 = leftRect.top + leftRect.height / 2 - containerRect.top;

            const uRightId = userAnsMap[lItem.id];
            const cRightId = correctAnsMap[lItem.id];

            if (uRightId) {
                const isCorrect = cRightId && String(uRightId) === String(cRightId);
                const userRightEl = rightAnchorRefs.current[uRightId];

                if (userRightEl) {
                    const uRightRect = userRightEl.getBoundingClientRect();
                    const x2 = uRightRect.left - containerRect.left;
                    const y2 = uRightRect.top + uRightRect.height / 2 - containerRect.top;

                    newLines.push({
                        id: `user-${lItem.id}-${uRightId}`,
                        leftId: lItem.id,
                        rightId: uRightId,
                        x1,
                        y1,
                        x2,
                        y2,
                        color: isCorrect ? '#10b981' : '#ef4444',
                        isDashed: false,
                        type: isCorrect ? 'correct' : 'wrong',
                    });
                }

                // If user answered incorrectly, also draw the correct target line
                if (!isCorrect && cRightId) {
                    const correctRightEl = rightAnchorRefs.current[cRightId];
                    if (correctRightEl) {
                        const cRightRect = correctRightEl.getBoundingClientRect();
                        const x2 = cRightRect.left - containerRect.left;
                        const y2 = cRightRect.top + cRightRect.height / 2 - containerRect.top;

                        newLines.push({
                            id: `target-${lItem.id}-${cRightId}`,
                            leftId: lItem.id,
                            rightId: cRightId,
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
            } else if (cRightId) {
                // User didn't answer -> draw correct line in green dashed
                const correctRightEl = rightAnchorRefs.current[cRightId];
                if (correctRightEl) {
                    const cRightRect = correctRightEl.getBoundingClientRect();
                    const x2 = cRightRect.left - containerRect.left;
                    const y2 = cRightRect.top + cRightRect.height / 2 - containerRect.top;

                    newLines.push({
                        id: `target-${lItem.id}-${cRightId}`,
                        leftId: lItem.id,
                        rightId: cRightId,
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
    }, [leftItems, userAnsMap, correctAnsMap]);

    useEffect(() => {
        calculateLines();
        window.addEventListener('resize', calculateLines);
        return () => window.removeEventListener('resize', calculateLines);
    }, [calculateLines]);

    return (
        <div className="space-y-3 pt-2">
            {/* Guide legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold px-1">
                <div className="flex items-center gap-1.5 text-emerald-800">
                    <span className="h-2.5 w-6 rounded-full bg-emerald-500 inline-block" />
                    <span>Dây Xanh liền: Nối chính xác (✓)</span>
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
                className="relative rounded-2xl border border-gray-200 bg-slate-50/50 p-4 select-none min-h-[300px]"
            >
                {/* SVG Canvas for Connecting Wires */}
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
                    {/* Left Column */}
                    <div className="space-y-3">
                        <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                            Cột A (Vấn đề / Từ khóa):
                        </span>
                        {leftItems.map((item) => {
                            const uRight = userAnsMap[item.id];
                            const cRight = correctAnsMap[item.id];
                            const isPairCorrect = uRight && cRight && String(uRight) === String(cRight);

                            return (
                                <div
                                    key={item.id}
                                    ref={(el) => {
                                        leftAnchorRefs.current[item.id] = el;
                                    }}
                                    className={`relative flex items-center justify-between rounded-xl border p-3 bg-white text-xs sm:text-sm font-semibold shadow-2xs transition-all ${
                                        isPairCorrect
                                            ? 'border-2 border-emerald-500 text-emerald-950 bg-emerald-50/40'
                                            : uRight
                                            ? 'border-2 border-rose-400 text-rose-950 bg-rose-50/40'
                                            : 'border-gray-200 text-gray-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                        <span
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                                                isPairCorrect
                                                    ? 'bg-emerald-600 text-white'
                                                    : uRight
                                                    ? 'bg-rose-600 text-white'
                                                    : 'bg-slate-200 text-slate-800'
                                            }`}
                                        >
                                            {item.id}
                                        </span>
                                        <span className="truncate">{item.text}</span>
                                    </div>
                                    <div className="h-3 w-3 rounded-full border-2 border-emerald-600 bg-white shrink-0" />
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                        <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 block mb-1">
                            Cột B (Nội dung ghép nối tương ứng):
                        </span>
                        {rightItems.map((item) => (
                            <div
                                key={item.id}
                                ref={(el) => {
                                    rightAnchorRefs.current[item.id] = el;
                                }}
                                className="relative flex items-center justify-between rounded-xl border border-gray-200 p-3 bg-white text-xs sm:text-sm font-semibold text-gray-800 shadow-2xs transition-all"
                            >
                                <div className="h-3 w-3 rounded-full border-2 border-indigo-600 bg-white shrink-0" />
                                <div className="flex items-center gap-2.5 min-w-0 pl-2 text-right justify-end w-full">
                                    <span className="truncate">{item.text}</span>
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 font-mono text-xs font-bold text-indigo-900 border border-indigo-200">
                                        {item.id}
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
