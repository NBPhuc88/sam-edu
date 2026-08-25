import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    Award,
    FileCheck,
    Play,
    AlertCircle,
    CheckCircle2,
    Users,
    BookOpen,
    HelpCircle,
    Info,
    ArrowRight,
} from 'lucide-react';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import AppLayout from '@/layouts/AppLayout';
import { formatDate, formatDateTime } from '@/lib/date';
import { ClassExam, ClassExamSubmission } from './types';

interface Props {
    classExam: ClassExam;
    submission?: ClassExamSubmission | null;
    isBeforeStart: boolean;
    isAfterEnd: boolean;
    isValidTime: boolean;
    serverTime: string;
    isStudent: boolean;
    isTeacher: boolean;
    isAdmin: boolean;
}

export default function Lobby({
    classExam,
    submission = null,
    isBeforeStart = false,
    isAfterEnd = false,
    isValidTime = true,
    isStudent = false,
    isTeacher = false,
    isAdmin = false,
}: Props) {
    const [isStarting, setIsStarting] = useState(false);

    const cls = classExam.schoolClass || classExam.school_class;
    const ex = classExam.exam;

    const hasSubmitted = submission && in_array(submission.status, ['submitted', 'timeout_submitted']);
    const isMissed = submission && submission.status === 'missed';
    const isInProgress = submission && submission.status === 'in_progress';

    function in_array(val: any, arr: any[]) {
        return arr.includes(val);
    }

    const handleStart = () => {
        setIsStarting(true);
        router.post(`/class-exams/${classExam.id}/start`, {}, {
            onFinish: () => setIsStarting(false),
        });
    };

    return (
        <AppLayout title={`Phòng Thi: ${classExam.title} - SAM Digital`}>
            <Head title={`Phòng Thi: ${classExam.title}`} />

            <div className="mx-auto max-w-4xl space-y-6 py-6 px-4">
                {/* Header Banner */}
                <div className="rounded-3xl bg-linear-to-r from-emerald-800 to-teal-900 p-8 text-white shadow-md relative overflow-hidden">
                    <div className="relative z-10 space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-2xs font-extrabold uppercase tracking-wider backdrop-blur-xs">
                            <FileCheck className="h-3.5 w-3.5 text-emerald-300" />
                            <span>Mã Kỳ Thi: {classExam.code || `CE${classExam.id}`}</span>
                            <span className="opacity-60">•</span>
                            <span>Mã Vào Phòng: {classExam.access_code}</span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                            {classExam.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-emerald-100">
                            <span className="flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-emerald-300" />
                                Lớp: {cls?.name}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4 text-emerald-300" />
                                Môn: {ex?.subject?.name || 'Tổng hợp'}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-emerald-300" />
                                Thời lượng: {classExam.duration_minutes || ex?.duration_minutes || 45} phút
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Award className="h-4 w-4 text-emerald-300" />
                                Điểm tối đa: {classExam.max_score} điểm
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status Banners */}
                {isBeforeStart && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs">
                        <Calendar className="h-5 w-5 shrink-0 text-blue-600" />
                        <div>
                            <p className="font-bold">Bài thi chưa đến giờ mở làm bài</p>
                            <p className="mt-0.5 text-2xs opacity-80">
                                Thời gian mở thi dự kiến: {classExam.valid_from ? formatDateTime(classExam.valid_from) : formatDate(classExam.exam_date)}. Vui lòng quay lại đúng giờ!
                            </p>
                        </div>
                    </div>
                )}

                {isAfterEnd && !hasSubmitted && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs">
                        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                        <div>
                            <p className="font-bold">Đã quá thời hạn hiệu lực của bài thi</p>
                            <p className="mt-0.5 text-2xs opacity-80">
                                Bài thi đã kết thúc thời gian cho phép bắt đầu.
                            </p>
                        </div>
                    </div>
                )}

                {isMissed && (
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                            <div>
                                <p className="font-bold text-sm">Bạn đã bỏ lỡ bài thi này</p>
                                <p className="text-2xs text-amber-700 mt-0.5">
                                    Đã quá thời hạn hiệu lực làm bài thi trực tuyến.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {hasSubmitted && (
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                            <div>
                                <p className="font-bold text-sm">Bạn đã hoàn thành bài thi này</p>
                                <p className="text-2xs text-emerald-700 mt-0.5">
                                    Điểm số: <strong className="text-base text-emerald-800">{submission?.score} / {classExam.max_score}</strong> ({submission?.total_correct} câu đúng)
                                </p>
                            </div>
                        </div>
                        <Link href={`/class-exams/${classExam.id}/results/${submission?.id}`}>
                            <Button variant="success" size="md" icon={<ArrowRight className="h-4 w-4" />}>
                                Xem Kết Quả & Đáp Án
                            </Button>
                        </Link>
                    </div>
                )}

                {/* Exam Rules & Instructions Card */}
                <Card className="border-gray-200 bg-white p-6 shadow-xs space-y-5">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-800 border-b border-gray-100 pb-3">
                        <Info className="h-4.5 w-4.5 text-emerald-600" />
                        Quy Chế & Hướng Dẫn Làm Bài Thi Trực Tuyến
                    </div>

                    <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
                        <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-2xs">
                                1
                            </span>
                            <p>
                                <strong>Đồng hồ đếm ngược:</strong> Thời gian làm bài sẽ đếm ngược chính xác <span className="font-bold text-emerald-700">{classExam.duration_minutes || 45} phút</span> ngay khi bạn bấm nút &quot;Bắt Đầu Làm Bài&quot;.
                            </p>
                        </div>

                        <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-2xs">
                                2
                            </span>
                            <p>
                                <strong>Tự động nộp bài khi hết giờ:</strong> Khi đồng hồ về 00:00:00, hệ thống sẽ tự động lưu lại toàn bộ các câu trả lời bạn đã chọn và tính điểm.
                            </p>
                        </div>

                        <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-2xs">
                                3
                            </span>
                            <p>
                                <strong>Kỹ năng Nói (Speaking):</strong> Đối với các câu hỏi có thu âm, bạn hãy cấp quyền Microphone cho trình duyệt và bấm &quot;Bắt đầu ghi âm&quot;. Bản ghi âm sẽ được lưu tự động.
                            </p>
                        </div>

                        <div className="flex items-start gap-2.5">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-2xs">
                                4
                            </span>
                            <p>
                                <strong>Nộp bài chủ động:</strong> Bạn có thể chủ động bấm nút &quot;Nộp Bài Thi&quot; khi đã hoàn tất tất cả câu hỏi trước khi hết giờ.
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-5">
                        <Link href="/dashboard">
                            <Button variant="secondary" size="md">
                                Quay Lại Trang Chủ
                            </Button>
                        </Link>

                        {isStudent && !hasSubmitted && !isMissed && (
                            <div>
                                {isInProgress ? (
                                    <Link href={`/class-exams/${classExam.id}/take/${submission?.id}`}>
                                        <Button
                                            variant="success"
                                            size="lg"
                                            className="font-bold px-8 py-3 text-sm shadow-md animate-bounce"
                                            icon={<Play className="h-5 w-5 fill-current" />}
                                        >
                                            Tiếp Tục Làm Bài Đang Dở
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button
                                        variant="success"
                                        size="lg"
                                        className="font-bold px-8 py-3 text-sm shadow-md"
                                        disabled={!isValidTime || isStarting}
                                        isLoading={isStarting}
                                        icon={<Play className="h-5 w-5 fill-current" />}
                                        onClick={handleStart}
                                    >
                                        Bắt Đầu Làm Bài Ngay
                                    </Button>
                                )}
                            </div>
                        )}

                        {(isTeacher || isAdmin) && (
                            <Link href={`/exams/${classExam.exam_id}/edit`}>
                                <Button variant="secondary" size="md" icon={<HelpCircle className="h-4 w-4" />}>
                                    Chế Độ Giáo Viên: Xem Đề Mẫu
                                </Button>
                            </Link>
                        )}
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
