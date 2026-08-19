import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    FileCheck,
    Calendar,
    Clock,
    Shuffle,
    RotateCcw,
} from 'lucide-react';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import AppLayout from '@/layouts/AppLayout';
import QuestionBuilder from './QuestionBuilder';
import { Center, Exam, ExamQuestionData, SchoolClass, Subject } from './types';

interface Props {
    exam: Exam;
    centers: Center[];
    classes: SchoolClass[];
    subjects: Subject[];
    errors?: Record<string, string>;
}

export default function ExamEdit({
    exam,
    centers = [],
    classes = [],
    subjects = [],
    errors = {},
}: Props) {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';

    // Exam Metadata State
    const [centerId, setCenterId] = useState<string>(String(exam.center_id || ''));
    const [classId, setClassId] = useState<string>(exam.class_id ? String(exam.class_id) : '');
    const [subjectId, setSubjectId] = useState<string>(exam.subject_id ? String(exam.subject_id) : '');
    const [name, setName] = useState(exam.name || '');
    const [code, setCode] = useState(exam.code || '');
    const [examType, setExamType] = useState<'general' | 'ielts' | 'hsk' | 'toeic' | 'custom'>(exam.exam_type || 'general');
    const [durationMinutes, setDurationMinutes] = useState<number | string>(exam.duration_minutes || 45);
    const [maxScore, setMaxScore] = useState<number | string>(exam.max_score || 10);
    const [passScore, setPassScore] = useState<number | string>(exam.pass_score || '');
    const [shuffleQuestions, setShuffleQuestions] = useState(Boolean(exam.shuffle_questions));
    const [shuffleOptions, setShuffleOptions] = useState(Boolean(exam.shuffle_options));
    const [maxAttempts, setMaxAttempts] = useState<number | string>(exam.max_attempts || 1);
    const [description, setDescription] = useState(exam.description || '');
    const [examDate, setExamDate] = useState(exam.exam_date ? String(exam.exam_date).substring(0, 10) : '');
    const [startTime, setStartTime] = useState(exam.start_time ? String(exam.start_time).substring(0, 5) : '');
    const [endTime, setEndTime] = useState(exam.end_time ? String(exam.end_time).substring(0, 5) : '');
    const [status, setStatus] = useState<'draft' | 'published' | 'completed' | 'cancelled'>(exam.status || 'draft');

    // Questions State
    const [questions, setQuestions] = useState<ExamQuestionData[]>(
        exam.questions && exam.questions.length > 0 ? exam.questions : [],
    );

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter classes and subjects by center
    const filteredClasses = centerId
        ? classes.filter((c) => String(c.center_id) === String(centerId))
        : classes;

    const filteredSubjects = centerId
        ? subjects.filter((s) => String(s.center_id) === String(centerId))
        : subjects;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.patch(
            `/exams/${exam.id}`,
            {
                center_id: centerId ? Number(centerId) : null,
                class_id: classId ? Number(classId) : null,
                subject_id: subjectId ? Number(subjectId) : null,
                name: name.trim(),
                code: code.trim(),
                exam_type: examType,
                duration_minutes: durationMinutes ? Number(durationMinutes) : null,
                max_score: maxScore ? Number(maxScore) : 10,
                pass_score: passScore ? Number(passScore) : null,
                shuffle_questions: shuffleQuestions,
                shuffle_options: shuffleOptions,
                max_attempts: maxAttempts ? Number(maxAttempts) : 1,
                description: description.trim() || null,
                exam_date: examDate || null,
                start_time: startTime || null,
                end_time: endTime || null,
                status,
                questions: questions.map((q, idx) => ({
                    ...q,
                    order_index: idx,
                    score: Number(q.score) || 1,
                })),
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title={`Chỉnh Sửa Bài Kiểm Tra: ${exam.name} - Hệ Thống Giáo Dục Sam`}>
            <Head title={`Chỉnh Sửa: ${exam.name}`} />

            <div className="mx-auto max-w-6xl space-y-6">
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/exams">
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<ArrowLeft className="h-4 w-4" />}
                            >
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Chỉnh Sửa Bài Kiểm Tra
                            </h1>
                            <p className="text-sm text-gray-500">
                                Cập nhật thông tin bài thi <span className="font-semibold text-gray-800 font-mono">({exam.code})</span> và soạn thảo ngân hàng câu hỏi.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Card 1: Exam Settings */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
                            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                                <FileCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    1. Thông Tin & Cấu Hình Bài Kiểm Tra
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Xác định phạm vi trung tâm, lớp học, môn học và các quy chế làm bài
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
                            {/* Center Selection (Super Admin only) */}
                            {isSuperAdmin && (
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                                        Trung Tâm Đào Tạo <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={centerId}
                                        onChange={(e) => {
                                            setCenterId(e.target.value);
                                            setClassId('');
                                            setSubjectId('');
                                        }}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                        required
                                        disabled={centers.length === 0}
                                    >
                                        <option value="">-- Chọn Trung tâm --</option>
                                        {centers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.code})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.center_id && (
                                        <p className="mt-1.5 text-sm text-red-600">{errors.center_id}</p>
                                    )}
                                </div>
                            )}

                            {/* Class Selection */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Gán Cho Lớp Học (Tùy chọn)
                                </label>
                                <select
                                    value={classId}
                                    onChange={(e) => setClassId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">-- Dành cho toàn trung tâm / Thi tự do --</option>
                                    {filteredClasses.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.class_id && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.class_id}</p>
                                )}
                            </div>

                            {/* Subject Selection */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Môn Học (Tùy chọn)
                                </label>
                                <select
                                    value={subjectId}
                                    onChange={(e) => setSubjectId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">-- Chọn Môn học --</option>
                                    {filteredSubjects.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.subject_id && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.subject_id}</p>
                                )}
                            </div>

                            {/* Exam Name */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Tên Bài Kiểm Tra / Kỳ Thi <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ví dụ: Kiểm tra giữa kỳ 1 Tiếng Anh, IELTS Mock Test 01..."
                                    className="!py-2.5 !text-sm font-medium"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Exam Code */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mã Đề Thi
                                </label>
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="VD: EXM000000001"
                                    className="!py-2.5 !text-sm uppercase font-mono"
                                />
                                {errors.code && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.code}</p>
                                )}
                            </div>

                            {/* Exam Type */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Loại Bài Thi <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={examType}
                                    onChange={(e) => setExamType(e.target.value as any)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="general">Chung (General Test)</option>
                                    <option value="ielts">IELTS Mock Test (Listening / Reading / Writing / Speaking)</option>
                                    <option value="hsk">HSK Đề Thi Chuẩn Hóa (Tiếng Trung)</option>
                                    <option value="toeic">TOEIC Practice Test</option>
                                    <option value="custom">Tuỳ Chỉnh Khác</option>
                                </select>
                                {errors.exam_type && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.exam_type}</p>
                                )}
                            </div>

                            {/* Duration Minutes */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Thời Gian Làm Bài (Phút) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={600}
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(e.target.value)}
                                    icon={<Clock className="h-4 w-4 text-gray-400" />}
                                    className="!py-2.5 !text-sm"
                                    required
                                />
                                {errors.duration_minutes && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.duration_minutes}</p>
                                )}
                            </div>

                            {/* Max Score */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Điểm Tối Đa <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    min={0.5}
                                    value={maxScore}
                                    onChange={(e) => setMaxScore(e.target.value)}
                                    className="!py-2.5 !text-sm font-bold"
                                    required
                                />
                                {errors.max_score && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.max_score}</p>
                                )}
                            </div>

                            {/* Pass Score */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Điểm Đạt (Pass Score)
                                </label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    min={0}
                                    value={passScore}
                                    onChange={(e) => setPassScore(e.target.value)}
                                    className="!py-2.5 !text-sm"
                                />
                            </div>

                            {/* Max Attempts */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Số Lần Làm Bài Tối Đa
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={maxAttempts}
                                    onChange={(e) => setMaxAttempts(e.target.value)}
                                    icon={<RotateCcw className="h-4 w-4 text-gray-400" />}
                                    className="!py-2.5 !text-sm"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Trạng Thái Bài Thi <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as any)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="draft">Bản nháp (Draft - Chưa công bố)</option>
                                    <option value="published">Đã công bố (Published - Học sinh có thể thấy)</option>
                                    <option value="completed">Đã kết thúc (Completed)</option>
                                    <option value="cancelled">Đã hủy (Cancelled)</option>
                                </select>
                            </div>

                            {/* Exam Date */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ngày Thi
                                </label>
                                <Input
                                    type="date"
                                    value={examDate}
                                    onChange={(e) => setExamDate(e.target.value)}
                                    icon={<Calendar className="h-4 w-4 text-gray-400" />}
                                    className="!py-2.5 !text-sm"
                                />
                            </div>

                            {/* Start Time & End Time */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Khung Giờ Mở Thi (Start - End Time)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="!py-2.5 !text-sm"
                                    />
                                    <Input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="!py-2.5 !text-sm"
                                    />
                                </div>
                            </div>

                            {/* Shuffle Toggles */}
                            <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200 md:col-span-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Tùy Chọn Chống Gian Lận & Xáo Trộn Đề Thi
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label className="flex cursor-pointer items-center gap-2.5 select-none">
                                        <input
                                            type="checkbox"
                                            checked={shuffleQuestions}
                                            onChange={(e) => setShuffleQuestions(e.target.checked)}
                                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <Shuffle className="h-4 w-4 text-emerald-600" />
                                        <span className="text-xs font-semibold text-gray-800">
                                            Đảo thứ tự các câu hỏi (Shuffle Questions)
                                        </span>
                                    </label>

                                    <label className="flex cursor-pointer items-center gap-2.5 select-none">
                                        <input
                                            type="checkbox"
                                            checked={shuffleOptions}
                                            onChange={(e) => setShuffleOptions(e.target.checked)}
                                            className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <Shuffle className="h-4 w-4 text-emerald-600" />
                                        <span className="text-xs font-semibold text-gray-800">
                                            Đảo thứ tự các phương án A, B, C, D (Shuffle Options)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="md:col-span-3">
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mô Tả & Hướng Dẫn Làm Bài
                                </label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Hướng dẫn học sinh trước khi bắt đầu làm bài kiểm tra..."
                                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Card 2: Interactive Question Builder */}
                    <QuestionBuilder
                        questions={questions}
                        onChangeQuestions={setQuestions}
                        examMaxScore={maxScore}
                    />

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                        <Link href="/exams">
                            <Button
                                variant="secondary"
                                size="lg"
                                icon={<ArrowLeft className="h-5 w-5" />}
                            >
                                Quay Lại
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            variant="success"
                            size="lg"
                            isLoading={isSubmitting}
                            icon={<Save className="h-5 w-5" />}
                        >
                            Cập Nhật Bài Kiểm Tra ({questions.length} câu hỏi)
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
