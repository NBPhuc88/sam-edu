import { Check,X } from 'lucide-react';
import React from 'react';
import { QuestionReviewItem } from '../QuestionReviewDetail';

interface Props {
    question: QuestionReviewItem;
}

export default function DiagramLabellingReview({ question }: Props) {
    const { options, correct_answer, user_answer, image_url } = question;

    const pins: Array<{ id: string; label: string }> = React.useMemo(() => {
        if (!options) return [];
        if (Array.isArray(options.pins) && options.pins.length > 0) {
            return options.pins.map((p: any, idx: number) => ({
                id: String(p.id ?? String.fromCharCode(65 + idx)),
                label: String(p.label ?? `Vị trí ${String.fromCharCode(65 + idx)}`),
            }));
        }
        if (Array.isArray(options.locations) && options.locations.length > 0) {
            return options.locations.map((p: any, idx: number) => ({
                id: String(p.id ?? String.fromCharCode(65 + idx)),
                label: String(p.label ?? `Vị trí ${String.fromCharCode(65 + idx)}`),
            }));
        }
        if (Array.isArray(options) && options.length > 0) {
            return options.map((item: any, idx: number) => ({
                id: String(item.id ?? item.key ?? String.fromCharCode(65 + idx)),
                label: String(item.label ?? item.text ?? `Vị trí ${String.fromCharCode(65 + idx)}`),
            }));
        }
        return ['A', 'B', 'C', 'D'].map((char) => ({ id: char, label: `Vị trí ${char}` }));
    }, [options]);

    const labels: Array<{ id: string; text: string }> = React.useMemo(() => {
        if (!options) return [];
        if (Array.isArray(options.labels) && options.labels.length > 0) {
            return options.labels.map((lbl: any, idx: number) => ({
                id: String(lbl.id ?? idx + 1),
                text: String(lbl.text ?? lbl.label ?? ''),
            }));
        }
        if (Array.isArray(options.items) && options.items.length > 0) {
            return options.items.map((lbl: any, idx: number) => ({
                id: String(lbl.id ?? idx + 1),
                text: String(lbl.text ?? lbl.label ?? ''),
            }));
        }
        return [];
    }, [options]);

    const userMap: Record<string, string> = React.useMemo(() => {
        if (typeof user_answer === 'object' && user_answer !== null) {
            return user_answer;
        }
        return {};
    }, [user_answer]);

    const correctMap: Record<string, string> = React.useMemo(() => {
        if (typeof correct_answer === 'object' && correct_answer !== null) {
            return correct_answer;
        }
        return {};
    }, [correct_answer]);

    const getLabelText = (labelId: string | null | undefined) => {
        if (!labelId) return '';
        const found = labels.find((l) => String(l.id) === String(labelId));
        return found ? found.text : `Nhãn ${labelId}`;
    };

    // Resolve user and correct answers for each pin
    const evaluatedPins = React.useMemo(() => {
        return pins.map((pin) => {
            // Direct lookup: userMap['A'] -> '1'
            let uLabelId: string | undefined = userMap[pin.id];
            // Inverted lookup: userMap['1'] -> 'A'
            if (!uLabelId) {
                const invertedKey = Object.keys(userMap).find((k) => String(userMap[k]) === String(pin.id));
                if (invertedKey) uLabelId = invertedKey;
            }

            // Direct correct lookup: correctMap['A'] -> '1'
            let cLabelId: string | undefined = correctMap[pin.id];
            // Inverted correct lookup: correctMap['1'] -> 'A'
            if (!cLabelId) {
                const invertedKey = Object.keys(correctMap).find((k) => String(correctMap[k]) === String(pin.id));
                if (invertedKey) cLabelId = invertedKey;
            }

            const isCorrect = uLabelId !== undefined && cLabelId !== undefined && String(uLabelId) === String(cLabelId);

            return {
                pinId: pin.id,
                pinLabel: pin.label,
                userLabelId: uLabelId,
                userLabelText: uLabelId ? getLabelText(uLabelId) : '',
                correctLabelId: cLabelId,
                correctLabelText: cLabelId ? getLabelText(cLabelId) : '',
                isCorrect,
            };
        });
    }, [pins, labels, userMap, correctMap]);

    return (
        <div className="space-y-4 pt-2">
            {/* Diagram Image */}
            {image_url && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-2.5 flex justify-center shadow-2xs">
                    <img
                        src={image_url}
                        alt="Sơ đồ / Bản đồ"
                        className="max-h-72 w-auto object-contain rounded-xl"
                    />
                </div>
            )}

            {/* Labels Bank Reference if available */}
            {labels.length > 0 && (
                <div className="bg-white p-3.5 rounded-2xl border border-gray-200 space-y-1.5 shadow-2xs">
                    <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 block">
                        Danh sách các nhãn trên sơ đồ (Label List):
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {labels.map((lbl) => (
                            <span
                                key={lbl.id}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-900 border border-teal-200"
                            >
                                <span className="font-mono text-2xs bg-teal-200/80 text-teal-950 px-1 py-0.5 rounded">
                                    [{lbl.id}]
                                </span>
                                <span>{lbl.text}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Pin Review Cards */}
            <div className="space-y-2">
                <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 block">
                    Chi tiết vị trí gán nhãn trên sơ đồ:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {evaluatedPins.map((item) => (
                        <div
                            key={item.pinId}
                            className={`flex flex-col justify-between p-3.5 rounded-2xl border transition-all ${
                                item.isCorrect
                                    ? 'border-2 border-emerald-500 bg-emerald-50/80 shadow-xs'
                                    : 'border-2 border-rose-400 bg-rose-50/80 shadow-xs'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`flex h-7 w-7 items-center justify-center rounded-xl font-mono text-xs font-bold ${
                                            item.isCorrect
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-rose-600 text-white'
                                        }`}
                                    >
                                        {item.pinId}
                                    </span>
                                    <span className="text-xs font-bold text-gray-900">
                                        {item.pinLabel}
                                    </span>
                                </div>

                                <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-2xs font-bold ${
                                        item.isCorrect
                                            ? 'bg-emerald-200 text-emerald-950'
                                            : 'bg-rose-200 text-rose-950'
                                    }`}
                                >
                                    {item.isCorrect ? (
                                        <>
                                            <Check className="h-3 w-3 stroke-[3]" /> Chính xác
                                        </>
                                    ) : (
                                        <>
                                            <X className="h-3 w-3 stroke-[3]" /> Chưa chính xác
                                        </>
                                    )}
                                </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                                <div className="flex items-start gap-1.5">
                                    <span className="text-gray-500 shrink-0 font-medium">Bạn đã chọn:</span>
                                    {item.userLabelId ? (
                                        <span className={`font-bold ${item.isCorrect ? 'text-emerald-950' : 'text-rose-950'}`}>
                                            [{item.userLabelId}] {item.userLabelText}
                                        </span>
                                    ) : (
                                        <span className="italic text-gray-400 font-normal">
                                            (Chưa chọn nhãn)
                                        </span>
                                    )}
                                </div>

                                {!item.isCorrect && item.correctLabelId && (
                                    <div className="flex items-start gap-1.5 text-emerald-900 font-bold bg-emerald-100/70 p-2 rounded-xl border border-emerald-200">
                                        <span className="text-emerald-700 shrink-0">✓ Đáp án đúng:</span>
                                        <span>
                                            [{item.correctLabelId}] {item.correctLabelText}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
