import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { registerPendingUpload, unregisterPendingUpload, isPendingBlobUrl } from '@/lib/uploadTracker';

interface MediaUploaderProps {
    value?: string | null;
    onChange: (url: string) => void;
    onUploadingChange?: (isUploading: boolean) => void;
    objectType?: string;
    objectId?: string | number | null;
    subId?: string | null;
    folder?: string;
    accept?: string;
    label?: string;
    placeholder?: string;
    className?: string;
    compact?: boolean;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
    value = '',
    onChange,
    objectType = 'exam_question',
    objectId = 'general',
    subId = null,
    folder = 'exams/media',
    accept = 'image/*',
    label = 'Hình ảnh minh họa',
    placeholder = 'Dán đường dẫn URL ảnh hoặc chọn tải lên từ máy...',
    className = '',
    compact = false,
}) => {
    const [mode, setMode] = useState<'upload' | 'url'>('upload');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File) => {
        if (!file) return;

        setErrorMsg(null);

        // Clean up old blob preview URL if existing
        if (isPendingBlobUrl(value)) {
            unregisterPendingUpload(value!);
        }

        try {
            const previewUrl = URL.createObjectURL(file);
            registerPendingUpload(previewUrl, file, {
                objectType,
                objectId,
                subId,
                folder,
            });
            onChange(previewUrl);
        } catch (err: any) {
            setErrorMsg('Không thể đọc file đã chọn. Vui lòng thử lại!');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleClear = () => {
        if (isPendingBlobUrl(value)) {
            unregisterPendingUpload(value!);
        }
        onChange('');
        setErrorMsg(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const isBlob = isPendingBlobUrl(value);

    const getDisplayFileName = (url: string | null | undefined): string => {
        if (!url) return '';
        if (isBlob) return 'Ảnh đã chọn (sẽ tải lên khi lưu)';
        const clean = url.split('?')[0].split('#')[0];
        const parts = clean.split('/');
        return parts[parts.length - 1] || url;
    };

    if (compact) {
        return (
            <div className={`flex items-center gap-1.5 min-w-0 ${className}`}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={accept}
                    className="hidden"
                />

                {value ? (
                    <div className="flex-1 flex items-center justify-between gap-2 rounded-lg border border-teal-200 bg-teal-50/50 px-2.5 py-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <img
                                src={value}
                                alt="Preview"
                                className="h-6 w-6 rounded object-cover border border-teal-200 bg-white shrink-0"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                }}
                            />
                            <span className="text-2xs font-mono text-teal-900 truncate" title={value}>
                                {getDisplayFileName(value)}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="flex h-5 w-5 shrink-0 items-center justify-center text-teal-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Xóa ảnh này"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <>
                        <input
                            type="text"
                            value=""
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className="flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-teal-500 focus:outline-hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            title="Chọn file ảnh từ máy tính"
                        >
                            <Upload className="h-3.5 w-3.5 text-gray-600" />
                            <span>Chọn ảnh</span>
                        </button>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className={`rounded-xl border border-gray-200 bg-white p-3.5 space-y-3 ${className}`}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={accept}
                className="hidden"
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                    <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{label}</span>
                </label>

                {!value && (
                    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 text-2xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setMode('upload')}
                            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                mode === 'upload'
                                    ? 'bg-white text-emerald-700 font-bold shadow-xs'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Chọn file từ máy
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('url')}
                            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                                mode === 'url'
                                    ? 'bg-white text-emerald-700 font-bold shadow-xs'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            Nhập link URL
                        </button>
                    </div>
                )}
            </div>

            {/* When NO image attached: Show Upload Dropzone or URL Input */}
            {!value && (
                <>
                    {mode === 'upload' ? (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-xl p-4 text-center transition-all group"
                        >
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="p-2 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                    <Upload className="h-5 w-5" />
                                </div>
                                <p className="text-xs font-semibold text-gray-700">
                                    Nhấp để chọn file hoặc kéo thả ảnh vào đây
                                </p>
                                <p className="text-2xs text-gray-400">
                                    File sẽ được tự động tải lên máy chủ khi bạn bấm Lưu đề thi
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative flex items-center">
                            <LinkIcon className="absolute left-3 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value=""
                                onChange={(e) => onChange(e.target.value)}
                                placeholder={placeholder}
                                className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                            />
                        </div>
                    )}
                </>
            )}

            {/* Error message */}
            {errorMsg && (
                <p className="text-2xs font-semibold text-red-600">{errorMsg}</p>
            )}

            {/* Preview Box with Single Delete Icon */}
            {value && (
                <div className="relative rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <img
                            src={value}
                            alt="Preview"
                            className="h-14 w-14 rounded-lg object-cover border border-emerald-200 bg-white shrink-0"
                            onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span className="text-xs font-bold text-gray-800 truncate">
                                    {isBlob ? 'Ảnh đã chọn (chờ lưu)' : 'Đã đính kèm ảnh'}
                                </span>
                            </div>
                            <span className="text-2xs text-gray-500 truncate block max-w-sm font-mono mt-0.5" title={value}>
                                {getDisplayFileName(value)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-2xs font-semibold text-emerald-700 hover:text-emerald-900 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 hover:bg-emerald-50 cursor-pointer transition-colors"
                        >
                            Đổi ảnh
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-2xs font-semibold text-red-600 hover:text-red-800 px-2.5 py-1 rounded-lg bg-white border border-red-200 hover:bg-red-50 cursor-pointer transition-colors"
                        >
                            Xóa
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaUploader;
