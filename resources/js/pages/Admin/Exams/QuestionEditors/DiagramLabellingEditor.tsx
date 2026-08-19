import React from 'react';
import { Plus, Trash2, MapPin, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';

interface LabelItem {
    id: string;
    text: string;
}

interface DiagramOptions {
    labels: LabelItem[];
    map_pins: string[];
}

interface Props {
    imageUrl: string | null;
    options: DiagramOptions;
    correctAnswer: Record<string, string>;
    onChangeImageUrl: (url: string) => void;
    onChangeOptions: (options: DiagramOptions) => void;
    onChangeCorrectAnswer: (answer: Record<string, string>) => void;
}

export default function DiagramLabellingEditor({
    imageUrl = '',
    options = { labels: [], map_pins: [] },
    correctAnswer = {},
    onChangeImageUrl,
    onChangeOptions,
    onChangeCorrectAnswer,
}: Props) {
    const labels: LabelItem[] = options?.labels?.length > 0
        ? options.labels
        : [
            { id: 'loc_1', text: 'Computer Laboratory' },
            { id: 'loc_2', text: 'Main Auditorium' },
            { id: 'loc_3', text: 'Periodicals Room' },
        ];

    const mapPins: string[] = options?.map_pins?.length > 0
        ? options.map_pins
        : ['A', 'B', 'C', 'D', 'E', 'F'];

    const handleAddLabel = () => {
        const nextId = `loc_${labels.length + 1}`;
        const updated = [...labels, { id: nextId, text: '' }];
        onChangeOptions({ ...options, labels: updated, map_pins: mapPins });
    };

    const handleRemoveLabel = (index: number) => {
        if (labels.length <= 1) return;
        const removed = labels[index];
        const updated = labels.filter((_, i) => i !== index);
        onChangeOptions({ ...options, labels: updated, map_pins: mapPins });

        const newAns = { ...correctAnswer };
        delete newAns[removed.id];
        onChangeCorrectAnswer(newAns);
    };

    const handleLabelTextChange = (index: number, text: string) => {
        const updated = [...labels];
        updated[index] = { ...updated[index], text };
        onChangeOptions({ ...options, labels: updated, map_pins: mapPins });
    };

    const handlePinsChange = (text: string) => {
        const pins = text.split(',').map((p) => p.trim().toUpperCase()).filter(Boolean);
        onChangeOptions({ ...options, labels, map_pins: pins });
    };

    const handleMatchPin = (labelId: string, pin: string) => {
        onChangeCorrectAnswer({
            ...correctAnswer,
            [labelId]: pin,
        });
    };

    return (
        <div className="space-y-5">
            {/* Image URL Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                    <ImageIcon className="h-4 w-4 text-teal-600" />
                    Đường Dẫn Hình Ảnh Sơ Đồ / Bản Đồ (Image URL)
                </label>
                <input
                    type="text"
                    value={imageUrl || ''}
                    onChange={(e) => onChangeImageUrl(e.target.value)}
                    placeholder="VD: /storage/exams/maps/building_map.png hoặc link URL ảnh online..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-hidden"
                />
                {imageUrl && (
                    <div className="mt-2 rounded-lg border border-gray-200 p-2 bg-slate-50 max-h-48 overflow-hidden flex items-center justify-center">
                        <img
                            src={imageUrl}
                            alt="Preview sơ đồ"
                            className="max-h-44 object-contain rounded"
                            onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Pins Configuration */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-900">
                    <MapPin className="h-4 w-4 text-teal-600" />
                    Danh Sách Vị Trí Ghim Trên Sơ Đồ (Map Pins - Phân cách bằng dấu phẩy)
                </label>
                <input
                    type="text"
                    value={mapPins.join(', ')}
                    onChange={(e) => handlePinsChange(e.target.value)}
                    placeholder="VD: A, B, C, D, E, F, G"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-teal-900 focus:border-teal-500 focus:outline-hidden uppercase"
                />
            </div>

            {/* Labels and Pin Assignment Table */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Danh Sách Địa Danh / Nhãn Cần Gán & Vị Trí Ghim Đúng
                    </span>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={<Plus className="h-3.5 w-3.5 text-teal-600" />}
                        onClick={handleAddLabel}
                    >
                        Thêm Địa Danh
                    </Button>
                </div>

                <div className="space-y-2.5">
                    {labels.map((item, idx) => {
                        const currentPin = correctAnswer?.[item.id] || '';
                        return (
                            <div
                                key={item.id || idx}
                                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-gray-200 bg-slate-50 p-2.5"
                            >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-100 font-mono text-2xs font-bold text-teal-900">
                                    {idx + 1}
                                </span>

                                <input
                                    type="text"
                                    value={item.text}
                                    onChange={(e) => handleLabelTextChange(idx, e.target.value)}
                                    placeholder="Tên địa danh / bộ phận cần gán (VD: Computer Laboratory)..."
                                    className="flex-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-teal-500 focus:outline-hidden"
                                    required
                                />

                                <div className="flex items-center gap-2">
                                    <span className="text-2xs font-semibold text-gray-500">Vị trí đúng:</span>
                                    <select
                                        value={currentPin}
                                        onChange={(e) => handleMatchPin(item.id, e.target.value)}
                                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-teal-800 focus:border-teal-500 focus:outline-hidden"
                                    >
                                        <option value="">-- Chọn Pin --</option>
                                        {mapPins.map((pin) => (
                                            <option key={pin} value={pin}>
                                                Vị trí {pin}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {labels.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveLabel(idx)}
                                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
