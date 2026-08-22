import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';

interface Props {
    imageUrl?: string | null;
    options: any; // { pins?: { id: string; label: string }[]; labels?: { id: string; text: string }[] }
    value: Record<string, string>;
    onChange: (ans: Record<string, string>) => void;
}

export default function DiagramLabellingQuestion({ imageUrl, options, value = {}, onChange }: Props) {
    const pins: { id: string; label: string }[] = React.useMemo(() => {
        if (!options) return [];
        if (Array.isArray(options.pins) && options.pins.length > 0) {
            return options.pins;
        }
        if (Array.isArray(options.locations) && options.locations.length > 0) {
            return options.locations;
        }
        if (Array.isArray(options) && options.length > 0) {
            return options.map((item: any, idx: number) => ({
                id: String(item.id ?? item.key ?? String.fromCharCode(65 + idx)),
                label: String(item.label ?? item.text ?? `Vị trí ${String.fromCharCode(65 + idx)}`),
            }));
        }
        return ['A', 'B', 'C', 'D'].map((char) => ({ id: char, label: `Vị trí ${char}` }));
    }, [options]);

    const labels: { id: string; text: string }[] = React.useMemo(() => {
        if (!options) return [];
        if (Array.isArray(options.labels) && options.labels.length > 0) {
            return options.labels;
        }
        if (Array.isArray(options.items) && options.items.length > 0) {
            return options.items;
        }
        return [];
    }, [options]);

    const handlePinChange = (pinId: string, labelVal: string) => {
        onChange({
            ...value,
            [pinId]: labelVal,
        });
    };

    return (
        <div className="space-y-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
            {/* Diagram Image */}
            {imageUrl ? (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-2 flex justify-center max-h-80">
                    <img
                        src={imageUrl}
                        alt="Sơ đồ / Bản đồ"
                        className="max-h-72 w-auto object-contain rounded-lg shadow-2xs"
                    />
                </div>
            ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Quan sát sơ đồ / bản đồ để gán nhãn cho các vị trí:</span>
                </div>
            )}

            {/* Label Options Reference if available */}
            {labels.length > 0 && (
                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1.5">
                    <span className="text-2xs font-bold uppercase tracking-wider text-gray-500">
                        Danh sách các nhãn cần gán (Word / Label List):
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {labels.map((lbl) => (
                            <span
                                key={lbl.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 border border-teal-200"
                            >
                                <span className="font-mono text-2xs font-bold text-teal-900 bg-teal-200/60 px-1 rounded">
                                    {lbl.id}
                                </span>
                                <span>{lbl.text}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Pin Inputs Grid */}
            <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                    Chọn hoặc nhập nhãn tương ứng cho từng vị trí trên sơ đồ:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {pins.map((pin) => {
                        const selectedVal = value[pin.id] || '';

                        return (
                            <div
                                key={pin.id}
                                className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-600 font-mono text-xs font-bold text-white shadow-2xs">
                                        {pin.id}
                                    </span>
                                    <span className="text-xs font-bold text-gray-800 truncate">
                                        {pin.label}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
                                    <ArrowRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                    {labels.length > 0 ? (
                                        <select
                                            value={selectedVal}
                                            onChange={(e) => handlePinChange(pin.id, e.target.value)}
                                            className="w-full rounded-lg border border-gray-300 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-gray-900 focus:bg-white focus:outline-hidden"
                                        >
                                            <option value="">-- Chọn nhãn --</option>
                                            {labels.map((lbl) => (
                                                <option key={lbl.id} value={lbl.id}>
                                                    {lbl.id}. {lbl.text}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={selectedVal}
                                            onChange={(e) => handlePinChange(pin.id, e.target.value)}
                                            placeholder="Nhập nhãn..."
                                            className="w-full rounded-lg border border-gray-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-gray-900 focus:bg-white focus:outline-hidden"
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
