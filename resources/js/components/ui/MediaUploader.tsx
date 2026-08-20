import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, X, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import apiClient from '@/lib/axios';

interface MediaUploaderProps {
    value?: string | null;
    onChange: (url: string) => void;
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
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState<number>(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (file: File) => {
        if (!file) return;

        setErrorMsg(null);
        setUploading(true);
        setProgress(10);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('object_type', objectType);
        formData.append('object_id', String(objectId || 'general'));
        if (subId) {
            formData.append('sub_id', subId);
        }
        formData.append('folder', folder);

        try {
            const response = await apiClient.post('/api/uploads/media', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percent);
                    }
                },
            });

            if (response.data?.url) {
                onChange(response.data.url);
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Tải file thất bại. Vui lòng thử lại!');
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const handleClear = () => {
        onChange('');
        setErrorMsg(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (compact) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={accept}
                    className="hidden"
                />
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-gray-50 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    title="Tải file từ máy tính"
                >
                    {uploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                    ) : (
                        <Upload className="h-3.5 w-3.5 text-gray-600" />
                    )}
                    <span>{uploading ? `${progress}%` : 'Tải lên'}</span>
                </button>
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                        title="Xóa ảnh"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`rounded-xl border border-gray-200 bg-white p-3.5 space-y-3 ${className}`}>
            {/* Header with Mode Switch */}
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                    <ImageIcon className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{label}</span>
                </label>
                <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 text-2xs font-semibold">
                    <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className={`px-2 py-1 rounded-md transition-all ${
                            mode === 'upload'
                                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Tải file lên
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('url')}
                        className={`px-2 py-1 rounded-md transition-all ${
                            mode === 'url'
                                ? 'bg-white text-emerald-700 font-bold shadow-xs'
                                : 'text-gray-500 hover:text-gray-900'
                        }`}
                    >
                        Nhập link URL
                    </button>
                </div>
            </div>

            {/* Upload Area */}
            {mode === 'upload' ? (
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept={accept}
                        className="hidden"
                    />

                    {!value ? (
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/40 rounded-xl p-4 text-center transition-all group"
                        >
                            {uploading ? (
                                <div className="flex flex-col items-center gap-2 py-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                                    <span className="text-xs font-semibold text-emerald-700">
                                        Đang tải lên ({progress}%)...
                                    </span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1.5">
                                    <div className="p-2 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    <p className="text-xs font-semibold text-gray-700">
                                        Nhấp để chọn file hoặc kéo thả ảnh vào đây
                                    </p>
                                    <p className="text-2xs text-gray-400">
                                        Định dạng PNG, JPG, WEBP, GIF tối đa 10MB
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            ) : (
                <div>
                    <div className="relative flex items-center">
                        <LinkIcon className="absolute left-3 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder={placeholder}
                            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-8 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                        />
                        {value && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="absolute right-2.5 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Error message */}
            {errorMsg && (
                <p className="text-2xs font-semibold text-red-600">{errorMsg}</p>
            )}

            {/* Preview Box */}
            {value && (
                <div className="relative rounded-xl border border-gray-200 bg-slate-50 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <img
                            src={value}
                            alt="Preview"
                            className="h-14 w-14 rounded-lg object-cover border border-gray-200 bg-white"
                            onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                            }}
                        />
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span className="text-xs font-bold text-gray-800 truncate">
                                    Đã gắn ảnh
                                </span>
                            </div>
                            <span className="text-2xs text-gray-500 truncate block max-w-xs font-mono">
                                {value}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-2xs font-semibold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded bg-white border border-gray-200 hover:bg-gray-50"
                        >
                            Đổi ảnh
                        </button>
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-2xs font-semibold text-red-600 hover:text-red-800 px-2 py-1 rounded bg-white border border-gray-200 hover:bg-red-50"
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
