import Button from '@/components/ui/Button';
import { AlertCircle,CheckCircle2,Loader2,Mic,RotateCcw,Square } from 'lucide-react';
import { useEffect,useRef,useState } from 'react';

interface Props {
    classExamId: number;
    questionId: number;
    savedAudioPath?: string | null;
    onAudioUploaded: (path: string) => void;
    maxDurationSeconds?: number;
    disabled?: boolean;
}

export default function AudioRecorder({
    classExamId,
    questionId,
    savedAudioPath = null,
    onAudioUploaded,
    maxDurationSeconds = 120,
    disabled = false,
}: Props) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [uploadedPath, setUploadedPath] = useState<string | null>(savedAudioPath);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerIntervalRef = useRef<number | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    useEffect(() => {
        if (savedAudioPath) {
            setUploadedPath(savedAudioPath);
            setAudioUrl(`/class-exams/audio-stream?path=${encodeURIComponent(savedAudioPath)}`);
        }
    }, [savedAudioPath]);

    const startRecording = async () => {
        setErrorMessage(null);
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                // Stop all mic tracks
                stream.getTracks().forEach((track) => track.stop());

                // Auto upload
                handleUpload(blob);
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Timer
            timerIntervalRef.current = window.setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev + 1 >= maxDurationSeconds) {
                        stopRecording();
                        return maxDurationSeconds;
                    }
                    return prev + 1;
                });
            }, 1000);
        } catch (err: any) {
            setErrorMessage('Không thể truy cập Microphone. Vui lòng cấp quyền micro cho trình duyệt.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }
    };

    const handleUpload = async (blobToUpload: Blob) => {
        setIsUploading(true);
        setErrorMessage(null);

        const formData = new FormData();
        formData.append('question_id', String(questionId));
        formData.append('audio', blobToUpload, `speaking_${questionId}.webm`);

        try {
            const res = await fetch(`/class-exams/${classExamId}/upload-audio`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    'Accept': 'application/json',
                },
                body: formData,
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setUploadedPath(data.path);
                onAudioUploaded(data.path);
            } else {
                setErrorMessage(data.error || 'Lỗi khi lưu file ghi âm. Vui lòng thử lại.');
            }
        } catch (err) {
            setErrorMessage('Lỗi mạng khi tải file ghi âm lên hệ thống.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleReRecord = () => {
        setAudioUrl(null);
        setUploadedPath(null);
        setRecordingTime(0);
        setErrorMessage(null);
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="rounded-xl border border-pink-200 bg-pink-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-pink-900 uppercase tracking-wider">
                    <Mic className="h-4 w-4 text-pink-600" />
                    Thu Âm Câu Trả Lời (Speaking Audio Recording)
                </div>
                <span className="text-2xs font-semibold text-pink-700">
                    Thời lượng tối đa: {maxDurationSeconds}s
                </span>
            </div>

            {errorMessage && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
                {!isRecording && !audioUrl && (
                    <Button
                        type="button"
                        variant="success"
                        size="sm"
                        disabled={disabled || isUploading}
                        icon={<Mic className="h-4 w-4" />}
                        onClick={startRecording}
                    >
                        Bắt Đầu Ghi Âm
                    </Button>
                )}

                {isRecording && (
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            icon={<Square className="h-4 w-4 fill-current" />}
                            onClick={stopRecording}
                        >
                            Dừng Ghi Âm
                        </Button>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-mono text-xs font-bold animate-pulse">
                            <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                            Đang thu âm: {formatTime(recordingTime)} / {formatTime(maxDurationSeconds)}
                        </div>
                    </div>
                )}

                {audioUrl && !isRecording && (
                    <div className="flex flex-wrap items-center gap-3 w-full">
                        <audio src={audioUrl} controls className="h-9 max-w-xs rounded-lg" />

                        {!disabled && (
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                icon={<RotateCcw className="h-3.5 w-3.5" />}
                                onClick={handleReRecord}
                                disabled={isUploading}
                            >
                                Ghi Âm Lại
                            </Button>
                        )}

                        {isUploading && (
                            <span className="flex items-center gap-1 text-2xs font-semibold text-pink-700">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Đang lưu bản ghi...
                            </span>
                        )}

                        {uploadedPath && !isUploading && (
                            <span className="flex items-center gap-1 text-2xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Đã lưu bản ghi âm
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
