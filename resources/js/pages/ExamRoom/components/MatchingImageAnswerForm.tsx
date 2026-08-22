import React from 'react';
import { ArrowRight, Image as ImageIcon } from 'lucide-react';

interface Props {
    options: any;
    userAnswers: Record<string, string>;
    onChange: (ans: Record<string, string>) => void;
}

export default function MatchingImageAnswerForm({ options, userAnswers = {}, onChange }: Props) {
    const { sentences, images } = React.useMemo<{
        sentences: { id: string; text: string }[];
        images: { id: string; label: string; image_url: string | null }[];
    }>(() => {
        if (!options) return { sentences: [], images: [] };

        // Format A: { sentences: [...], images: [...] }
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

        // Format B: Array of { id: '1', text: '...', image_url: '...' }
        if (Array.isArray(options)) {
            const sList: { id: string; text: string }[] = [];
            const imgList: { id: string; label: string; image_url: string | null }[] = [];

            options.forEach((item: any, idx: number) => {
                const sId = String(item.id ?? idx + 1);
                const imgId = String(item.id ?? idx + 1);
                const sText = String(item.text ?? item.content ?? '');
                const imgUrl = item.image_url ?? item.url ?? null;
                const label = item.label ?? `Hình ${idx + 1}`;

                if (sText) sList.push({ id: sId, text: sText });
                if (imgUrl) imgList.push({ id: imgId, label, image_url: imgUrl });
            });

            return { sentences: sList, images: imgList };
        }

        return { sentences: [], images: [] };
    }, [options]);

    const handlePairChange = (sId: string, imgId: string) => {
        onChange({
            ...userAnswers,
            [sId]: imgId,
        });
    };

    if (sentences.length === 0 && images.length === 0) {
        return (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-gray-500">
                Không có dữ liệu các hình ảnh để ghép nối.
            </div>
        );
    }

    return (
        <div className="space-y-4 rounded-2xl bg-slate-50 p-4 border border-slate-200">
            {/* Images Preview Grid */}
            {images.length > 0 && (
                <div>
                    <span className="text-2xs font-bold uppercase tracking-wider text-teal-800 block mb-2">
                        Danh sách các hình ảnh ({images.length} hình):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {images.map((img) => (
                            <div
                                key={img.id}
                                className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs text-center space-y-1.5 flex flex-col items-center"
                            >
                                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                    <ImageIcon className="h-3 w-3" />
                                    {img.label}
                                </span>
                                {img.image_url ? (
                                    <div className="h-28 w-full rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={img.image_url}
                                            alt={img.label}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-28 w-full rounded-lg bg-slate-100 flex items-center justify-center text-xs text-gray-400">
                                        Không có ảnh
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pairing Section */}
            <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                    Ghép từng câu mô tả với hình tương ứng:
                </span>
                <div className="space-y-2">
                    {sentences.map((sent, idx) => {
                        const selectedImg = userAnswers[sent.id] || '';

                        return (
                            <div
                                key={sent.id}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition-all text-xs"
                            >
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-100 font-mono text-xs font-bold text-teal-800 border border-teal-200">
                                        {idx + 1}
                                    </span>
                                    <span className="font-semibold text-gray-900 leading-relaxed">
                                        {sent.text}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-56 shrink-0">
                                    <ArrowRight className="h-4 w-4 text-teal-500 shrink-0 hidden sm:block" />
                                    <select
                                        value={selectedImg}
                                        onChange={(e) => handlePairChange(sent.id, e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:bg-white focus:outline-hidden"
                                    >
                                        <option value="">-- Chọn hình tương ứng --</option>
                                        {images.map((img) => (
                                            <option key={img.id} value={img.id}>
                                                {img.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
