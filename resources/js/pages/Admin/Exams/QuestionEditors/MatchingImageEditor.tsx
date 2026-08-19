import React from 'react';
import { Plus, Trash2, ArrowRight, Image as ImageIcon } from 'lucide-react';
import Button from '@/components/ui/Button';

interface LeftItem {
    id: string;
    text: string;
}

interface ImageItem {
    id: string;
    image_url: string;
    label?: string;
}

interface MatchingImageOptions {
    sentences: LeftItem[];
    images: ImageItem[];
}

interface Props {
    options: MatchingImageOptions;
    correctAnswer: Record<string, string>;
    onChangeOptions: (options: MatchingImageOptions) => void;
    onChangeCorrectAnswer: (answer: Record<string, string>) => void;
}

export default function MatchingImageEditor({
    options = { sentences: [], images: [] },
    correctAnswer = {},
    onChangeOptions,
    onChangeCorrectAnswer,
}: Props) {
    const sentences: LeftItem[] = options?.sentences?.length > 0
        ? options.sentences
        : [
            { id: 'S1', text: 'The cat is sleeping under the tree.' },
            { id: 'S2', text: 'A boy is riding a bicycle in the park.' },
            { id: 'S3', text: 'They are having a picnic near the lake.' },
        ];

    const images: ImageItem[] = options?.images?.length > 0
        ? options.images
        : [
            { id: 'IMG_A', image_url: '', label: 'Hình A' },
            { id: 'IMG_B', image_url: '', label: 'Hình B' },
            { id: 'IMG_C', image_url: '', label: 'Hình C' },
            { id: 'IMG_D', image_url: '', label: 'Hình D (tùy chọn thừa)' },
        ];

    const handleAddSentence = () => {
        const nextId = `S${sentences.length + 1}`;
        const updated = [...sentences, { id: nextId, text: '' }];
        onChangeOptions({ ...options, sentences: updated, images });
    };

    const handleRemoveSentence = (index: number) => {
        if (sentences.length <= 1) return;
        const removed = sentences[index];
        const updated = sentences.filter((_, i) => i !== index);
        onChangeOptions({ ...options, sentences: updated, images });

        const newAns = { ...correctAnswer };
        delete newAns[removed.id];
        onChangeCorrectAnswer(newAns);
    };

    const handleSentenceTextChange = (index: number, text: string) => {
        const updated = [...sentences];
        updated[index] = { ...updated[index], text };
        onChangeOptions({ ...options, sentences: updated, images });
    };

    const handleAddImage = () => {
        const char = String.fromCharCode(65 + images.length);
        const nextId = `IMG_${char}`;
        const updated = [...images, { id: nextId, image_url: '', label: `Hình ${char}` }];
        onChangeOptions({ ...options, sentences, images: updated });
    };

    const handleRemoveImage = (index: number) => {
        if (images.length <= 1) return;
        const removed = images[index];
        const updated = images.filter((_, i) => i !== index);
        onChangeOptions({ ...options, sentences, images: updated });

        const newAns = { ...correctAnswer };
        Object.keys(newAns).forEach((k) => {
            if (newAns[k] === removed.id) {
                delete newAns[k];
            }
        });
        onChangeCorrectAnswer(newAns);
    };

    const handleImageChange = (index: number, fields: Partial<ImageItem>) => {
        const updated = [...images];
        updated[index] = { ...updated[index], ...fields };
        onChangeOptions({ ...options, sentences, images: updated });
    };

    const handlePairChange = (sentenceId: string, imageId: string) => {
        onChangeCorrectAnswer({
            ...correctAnswer,
            [sentenceId]: imageId,
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left Column: Sentences */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-2xs font-extrabold">
                                L
                            </span>
                            Cột Trái: Danh Sách Câu Mô Tả / Từ Vựng
                        </label>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<Plus className="h-3 w-3" />}
                            onClick={handleAddSentence}
                        >
                            Thêm câu
                        </Button>
                    </div>

                    <div className="space-y-2.5">
                        {sentences.map((item, idx) => (
                            <div key={item.id} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-gray-200">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-mono text-xs font-bold border border-emerald-200 mt-0.5">
                                    {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <input
                                        type="text"
                                        value={item.text}
                                        onChange={(e) => handleSentenceTextChange(idx, e.target.value)}
                                        placeholder={`Nhập câu mô tả số ${idx + 1}...`}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSentence(idx)}
                                    disabled={sentences.length <= 1}
                                    className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-20 mt-0.5"
                                    title="Xóa câu này"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Images */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 text-teal-800 text-2xs font-extrabold">
                                R
                            </span>
                            Cột Phải: Danh Sách Hình Ảnh Minh Họa
                        </label>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<Plus className="h-3 w-3" />}
                            onClick={handleAddImage}
                        >
                            Thêm ảnh
                        </Button>
                    </div>

                    <div className="space-y-2.5">
                        {images.map((item, idx) => (
                            <div key={item.id} className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-mono text-xs font-bold border border-teal-200">
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <input
                                        type="text"
                                        value={item.label || ''}
                                        onChange={(e) => handleImageChange(idx, { label: e.target.value })}
                                        placeholder={`Tên / Nhãn (VD: Hình ${String.fromCharCode(65 + idx)})`}
                                        className="w-1/3 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                    />
                                    <input
                                        type="text"
                                        value={item.image_url}
                                        onChange={(e) => handleImageChange(idx, { image_url: e.target.value })}
                                        placeholder="Đường dẫn URL hình ảnh (VD: /storage/exams/img1.png)..."
                                        className="flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(idx)}
                                        disabled={images.length <= 1}
                                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-20"
                                        title="Xóa hình này"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {item.image_url && (
                                    <div className="h-20 w-full rounded-lg bg-slate-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={item.image_url}
                                            alt={item.label || 'Preview'}
                                            className="max-h-20 max-w-full object-contain"
                                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Matching Answer Mapping */}
            <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-900 uppercase tracking-wider">
                    <ImageIcon className="h-4 w-4 text-teal-600" />
                    Thiết Lập Đáp Án Ghép Nối Đúng (Correct Pairs)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {sentences.map((sent, idx) => {
                        const currentMatchedImgId = correctAnswer[sent.id] || '';
                        return (
                            <div key={sent.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-teal-200 shadow-2xs">
                                <span className="font-mono font-bold text-xs text-emerald-800 shrink-0">
                                    Câu {idx + 1}:
                                </span>
                                <span className="text-gray-400"><ArrowRight className="h-3.5 w-3.5" /></span>
                                <select
                                    value={currentMatchedImgId}
                                    onChange={(e) => handlePairChange(sent.id, e.target.value)}
                                    className="flex-1 rounded-lg border border-teal-300 bg-white px-2 py-1 text-xs font-bold text-teal-900 focus:outline-hidden"
                                >
                                    <option value="">-- Chọn hình ghép đúng --</option>
                                    {images.map((img, imgIdx) => (
                                        <option key={img.id} value={img.id}>
                                            {img.label || `Hình ${String.fromCharCode(65 + imgIdx)}`} ({img.id})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
