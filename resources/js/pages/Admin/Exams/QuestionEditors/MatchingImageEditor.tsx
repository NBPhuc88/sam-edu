import Button from '@/components/ui/Button';
import MediaUploader from '@/components/ui/MediaUploader';
import { ArrowRight,Image as ImageIcon,Plus,Trash2 } from 'lucide-react';

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
    onChangeOptions?: (options: MatchingImageOptions) => void;
    onChangeCorrectAnswer?: (answer: Record<string, string>) => void;
    onChangeQuestion?: (fields: { options?: MatchingImageOptions; correct_answer?: Record<string, string> }) => void;
}

export default function MatchingImageEditor({
    options = { sentences: [], images: [] },
    correctAnswer = {},
    onChangeOptions,
    onChangeCorrectAnswer,
    onChangeQuestion,
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

    const updateAll = (newOptions: MatchingImageOptions, newAns: Record<string, string>) => {
        if (onChangeQuestion) {
            onChangeQuestion({ options: newOptions, correct_answer: newAns });
        } else {
            onChangeOptions?.(newOptions);
            onChangeCorrectAnswer?.(newAns);
        }
    };

    const handleAddSentence = () => {
        const numbers = sentences.map((s) => {
            const m = String(s.id).match(/^S(\d+)$/i);
            return m ? parseInt(m[1], 10) : 0;
        });
        const maxNum = numbers.length > 0 ? Math.max(...numbers, 0) : 0;
        const nextId = `S${maxNum + 1}`;
        const updated = [...sentences, { id: nextId, text: '' }];
        updateAll({ ...options, sentences: updated, images }, correctAnswer);
    };

    const handleRemoveSentence = (index: number) => {
        if (sentences.length <= 1) return;
        const removed = sentences[index];
        const updated = sentences.filter((_, i) => i !== index);
        const newAns = { ...correctAnswer };
        delete newAns[removed.id];
        updateAll({ ...options, sentences: updated, images }, newAns);
    };

    const handleSentenceTextChange = (index: number, text: string) => {
        const updated = [...sentences];
        updated[index] = { ...updated[index], text };
        updateAll({ ...options, sentences: updated, images }, correctAnswer);
    };

    const handleAddImage = () => {
        const usedLetters = new Set(
            images.map((img) => {
                const m = String(img.id).match(/^IMG_([A-Z])$/i);
                return m ? m[1].toUpperCase() : '';
            }).filter(Boolean)
        );
        let char = 'A';
        for (let i = 0; i < 26; i++) {
            const candidate = String.fromCharCode(65 + i);
            if (!usedLetters.has(candidate)) {
                char = candidate;
                break;
            }
        }
        const nextId = `IMG_${char}`;
        const updated = [...images, { id: nextId, image_url: '', label: `Hình ${char}` }];
        updateAll({ ...options, sentences, images: updated }, correctAnswer);
    };

    const handleRemoveImage = (index: number) => {
        if (images.length <= 1) return;
        const removed = images[index];
        const updated = images.filter((_, i) => i !== index);
        const newAns = { ...correctAnswer };
        Object.keys(newAns).forEach((k) => {
            if (newAns[k] === removed.id) {
                delete newAns[k];
            }
        });
        updateAll({ ...options, sentences, images: updated }, newAns);
    };

    const handleImageChange = (index: number, fields: Partial<ImageItem>) => {
        const baseImages = options?.images && options.images.length > 0 ? options.images : images;
        const updated = baseImages.map((img, i) => (i === index ? { ...img, ...fields } : img));
        const baseSentences = options?.sentences && options.sentences.length > 0 ? options.sentences : sentences;
        updateAll({ ...options, sentences: baseSentences, images: updated }, correctAnswer);
    };

    const handlePairChange = (sentenceId: string, imageId: string) => {
        const baseImages = options?.images && options.images.length > 0 ? options.images : images;
        const baseSentences = options?.sentences && options.sentences.length > 0 ? options.sentences : sentences;
        const newAns = {
            ...correctAnswer,
            [sentenceId]: imageId,
        };
        if (!imageId) {
            delete newAns[sentenceId];
        }
        updateAll({ ...options, sentences: baseSentences, images: baseImages }, newAns);
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
                        {images.map((item, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            return (
                                <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs space-y-2.5">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 font-mono text-xs font-bold border border-teal-200">
                                            {letter}
                                        </span>
                                        <input
                                            type="text"
                                            value={item.label || ''}
                                            onChange={(e) => handleImageChange(idx, { label: e.target.value })}
                                            placeholder={`Hình ${letter}`}
                                            className="w-24 sm:w-28 shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-900 focus:border-teal-500 focus:outline-hidden"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <MediaUploader
                                                compact={true}
                                                value={item.image_url}
                                                onChange={(url) => handleImageChange(idx, { image_url: url })}
                                                objectType="matching"
                                                objectId={`img_${letter}`}
                                                subId={item.id}
                                                placeholder="URL ảnh hoặc chọn tải lên..."
                                            />
                                        </div>
                                        {images.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(idx)}
                                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                                title="Xóa hình này"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    {item.image_url && (
                                        <div className="h-28 w-full rounded-lg bg-slate-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={item.image_url}
                                                alt={item.label || `Hình ${letter}`}
                                                className="max-h-28 max-w-full object-contain"
                                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
