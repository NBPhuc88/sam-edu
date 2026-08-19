import React from 'react';
import { Mic, Clock, Volume2 } from 'lucide-react';

interface Props {
    metadata: {
        prep_time_seconds?: number | string;
        max_record_duration_seconds?: number | string;
        speaking_notes?: string;
    };
    audioUrl?: string | null;
    onChangeMetadata: (metadata: any) => void;
    onChangeAudioUrl: (url: string) => void;
}

export default function AudioRecordEditor({
    metadata = {},
    audioUrl = '',
    onChangeMetadata,
    onChangeAudioUrl,
}: Props) {
    return (
        <div className="space-y-5">
            {/* Audio Prompt URL (Teacher's Audio Question) */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                    <Volume2 className="h-4 w-4 text-pink-600" />
                    File Âm Thanh Đọc Đề Bài / Giọng Đọc Mẫu (Audio Prompt URL - Tùy chọn)
                </label>
                <input
                    type="text"
                    value={audioUrl || ''}
                    onChange={(e) => onChangeAudioUrl(e.target.value)}
                    placeholder="VD: /storage/exams/audio/speaking_part2_prompt.mp3..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-pink-500 focus:outline-hidden"
                />
                {audioUrl && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-lg">
                        <audio controls src={audioUrl} className="w-full h-8" />
                    </div>
                )}
            </div>

            {/* Speaking Time Limits */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl bg-pink-50/40 p-4 border border-pink-200">
                <div>
                    <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-pink-900">
                        <Clock className="h-3.5 w-3.5 text-pink-600" />
                        Thời gian chuẩn bị (Giây)
                    </label>
                    <input
                        type="number"
                        min={0}
                        max={600}
                        value={metadata.prep_time_seconds || 60}
                        onChange={(e) => onChangeMetadata({ ...metadata, prep_time_seconds: Number(e.target.value) || 0 })}
                        placeholder="VD: 60 giây..."
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-pink-500 focus:outline-hidden"
                    />
                    <p className="mt-1 text-2xs text-pink-700">
                        Thời gian đồng hồ đếm ngược trước khi tự động kích hoạt micro
                    </p>
                </div>

                <div>
                    <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-pink-900">
                        <Mic className="h-3.5 w-3.5 text-pink-600" />
                        Thời lượng ghi âm tối đa (Giây)
                    </label>
                    <input
                        type="number"
                        min={10}
                        max={1800}
                        value={metadata.max_record_duration_seconds || 120}
                        onChange={(e) => onChangeMetadata({ ...metadata, max_record_duration_seconds: Number(e.target.value) || 120 })}
                        placeholder="VD: 120 giây (2 phút)..."
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 focus:border-pink-500 focus:outline-hidden"
                    />
                    <p className="mt-1 text-2xs text-pink-700">
                        Hệ thống sẽ tự động dừng ghi âm khi đạt đến thời gian này
                    </p>
                </div>
            </div>

            {/* Speaking Cue Notes / Guidelines */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Gợi Ý Trả Lời & Hướng Dẫn Phát Âm / Giao Tiếp
                </label>
                <textarea
                    rows={3}
                    value={metadata.speaking_notes || ''}
                    onChange={(e) => onChangeMetadata({ ...metadata, speaking_notes: e.target.value })}
                    placeholder="Gợi ý cấu trúc trả lời: 1. Introduction, 2. Key story/reasons, 3. Personal reflection..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-pink-500 focus:outline-hidden"
                />
            </div>
        </div>
    );
}
