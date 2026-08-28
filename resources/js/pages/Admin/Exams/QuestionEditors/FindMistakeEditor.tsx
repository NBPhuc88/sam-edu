import Button from '@/components/ui/Button';
import { AlertTriangle,Plus,Trash2 } from 'lucide-react';
import { useId } from 'react';

interface SentenceSegment {
    id: string;
    text: string;
    underlined?: boolean;
}

interface Props {
    options: { sentence_segments?: SentenceSegment[] };
    correctAnswer: string | null;
    onChangeOptions: (options: { sentence_segments: SentenceSegment[] }) => void;
    onChangeCorrectAnswer: (answer: string) => void;
}

export default function FindMistakeEditor({
    options = { sentence_segments: [] },
    correctAnswer,
    onChangeOptions,
    onChangeCorrectAnswer,
}: Props) {
    const radioGroupName = useId();

    const segments: SentenceSegment[] = options?.sentence_segments && options.sentence_segments.length > 0
        ? options.sentence_segments.map((seg: any, idx: number) => ({
            id: String(seg.id || `s${idx + 1}`),
            text: String(seg.text ?? ''),
            underlined: Boolean(seg.underlined),
        }))
        : [
            { id: 's1', text: 'Although he ', underlined: false },
            { id: 'A', text: 'was exhausted', underlined: true },
            { id: 's2', text: ', but he ', underlined: false },
            { id: 'B', text: 'continued', underlined: true },
            { id: 's3', text: ' to work ', underlined: false },
            { id: 'C', text: 'until', underlined: true },
            { id: 's4', text: ' late at ', underlined: false },
            { id: 'D', text: 'midnight', underlined: true },
            { id: 's5', text: '.', underlined: false },
        ];

    const underlinedSegments = segments.filter((s) => s.underlined);
    const safeCorrectAnswer = correctAnswer ? String(correctAnswer).trim() : '';

    const handleAddSegment = () => {
        const nextId = `s${segments.length + 1}`;
        const updated = [...segments, { id: nextId, text: '', underlined: false }];
        onChangeOptions({ sentence_segments: updated });
    };

    const handleRemoveSegment = (index: number) => {
        if (segments.length <= 1) return;
        const removed = segments[index];
        const updated = segments.filter((_, i) => i !== index);
        onChangeOptions({ sentence_segments: updated });

        if (safeCorrectAnswer === removed.id) {
            onChangeCorrectAnswer(updated.find((s) => s.underlined)?.id || '');
        }
    };

    const handleTextChange = (index: number, text: string) => {
        const updated = [...segments];
        updated[index] = { ...updated[index], text };
        onChangeOptions({ sentence_segments: updated });
    };

    const handleToggleUnderline = (index: number) => {
        const updated = [...segments];
        const isNowUnderlined = !updated[index].underlined;
        updated[index] = {
            ...updated[index],
            underlined: isNowUnderlined,
        };

        // Reassign A, B, C, D ids to underlined segments
        let letterIdx = 0;
        const alphabet = ['A', 'B', 'C', 'D', 'E', 'F'];
        updated.forEach((s) => {
            if (s.underlined) {
                s.id = alphabet[letterIdx] || `OPT_${letterIdx + 1}`;
                letterIdx++;
            }
        });

        onChangeOptions({ sentence_segments: updated });
    };

    return (
        <div className="space-y-5">
            {/* Live Sentence Preview */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-900">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    Xem Trước Câu Hoàn Chỉnh & Các Phần Gạch Chân A, B, C, D
                </div>

                <div className="rounded-lg bg-white p-3.5 border border-rose-200/70 text-sm font-medium text-gray-900 leading-relaxed shadow-2xs">
                    {segments.map((seg, i) => {
                        if (seg.underlined) {
                            const isSelectedWrong = safeCorrectAnswer === seg.id;
                            return (
                                <span
                                    key={i}
                                    className={`inline-flex flex-col items-center mx-1 px-1.5 py-0.5 rounded border transition-all ${
                                        isSelectedWrong
                                            ? 'border-rose-500 bg-rose-100/70 text-rose-900 font-bold'
                                            : 'border-gray-300 bg-gray-50 text-gray-900 underline underline-offset-4 decoration-rose-500 decoration-2'
                                    }`}
                                >
                                    <span>{seg.text || `[${seg.id}]`}</span>
                                    <span className="text-2xs font-extrabold font-mono text-rose-600">
                                        ({seg.id})
                                    </span>
                                </span>
                            );
                        }
                        return <span key={i}>{seg.text}</span>;
                    })}
                </div>
            </div>

            {/* Segments Editor Table */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                            Các Đoạn Trong Câu (Đánh dấu gạch chân cho 4 phương án A, B, C, D)
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<Plus className="h-3.5 w-3.5 text-rose-600" />}
                        onClick={handleAddSegment}
                    >
                        Thêm Đoạn Câu
                    </Button>
                </div>

                <div className="space-y-2">
                    {segments.map((seg, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center gap-3 rounded-lg border p-2 transition-all ${
                                seg.underlined
                                    ? 'border-rose-300 bg-rose-50/50 shadow-2xs'
                                    : 'border-gray-200 bg-slate-50'
                            }`}
                        >
                            <span className="text-2xs font-mono text-gray-400 w-5 text-center">
                                #{idx + 1}
                            </span>

                            <input
                                type="text"
                                value={seg.text}
                                onChange={(e) => handleTextChange(idx, e.target.value)}
                                placeholder="Nhập văn bản của đoạn này..."
                                className="flex-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-rose-500 focus:outline-hidden"
                            />

                            {/* Underline toggle */}
                            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-gray-700 select-none">
                                <input
                                    type="checkbox"
                                    checked={seg.underlined || false}
                                    onChange={() => handleToggleUnderline(idx)}
                                    className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
                                />
                                <span className={seg.underlined ? 'text-rose-700 font-bold' : 'text-gray-500'}>
                                    Gạch chân ({seg.id})
                                </span>
                            </label>

                            {segments.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSegment(idx)}
                                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pick which segment is the error (correct answer) */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Chọn Phần Gạch Chân Bị Sai Ngữ Pháp (Đáp án chuẩn):
                </label>
                <div className="flex flex-wrap items-center gap-3">
                    {underlinedSegments.map((s) => {
                        const isCorrect = safeCorrectAnswer === s.id;
                        return (
                            <label
                                key={s.id}
                                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                                    isCorrect
                                        ? 'border-rose-600 bg-rose-50 ring-1 ring-rose-600 text-rose-900 font-bold'
                                        : 'border-gray-200 bg-slate-50 text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name={radioGroupName}
                                    value={s.id}
                                    checked={isCorrect}
                                    onChange={() => onChangeCorrectAnswer(s.id)}
                                    className="h-4 w-4 text-rose-600 focus:ring-rose-500"
                                />
                                <span className="font-mono text-xs">Phần ({s.id})</span>
                                <span className="text-xs font-normal truncate max-w-[120px]">
                                    &quot;{s.text}&quot;
                                </span>
                            </label>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
