import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import {
EXAM_SKILL_LABELS,
EXAM_STATUS_CANCELLED,
EXAM_STATUS_COMPLETED,
EXAM_STATUS_DRAFT,
EXAM_STATUS_LABELS,
EXAM_STATUS_PUBLISHED,
SKILL_READING,
} from '@/constants/enums';
import { usePermission } from '@/hooks/usePermission';
import AppLayout from '@/layouts/AppLayout';
import { uploadPendingMediaInObject } from '@/lib/uploadTracker';
import { Head,Link,router,usePage } from '@inertiajs/react';
import {
AlertCircle,
ArrowLeft,
Award,
Calculator,
Clock,
FileCheck,
RotateCcw,
Save,
Shuffle,
} from 'lucide-react';
import React,{ useState } from 'react';
import QuestionBuilder from './QuestionBuilder';
import { Center,Exam,ExamQuestionData,ExamSectionData,Subject } from './types';

interface Props {
    exam: Exam;
    centers: Center[];
    subjects: Subject[];
    errors?: Record<string, string>;
}

export default function ExamEdit({
    exam,
    centers = [],
    subjects = [],
    errors = {},
}: Props) {
    const { isSuperAdmin } = usePermission();

    // Exam Metadata State
    const [centerId, setCenterId] = useState<string>(String(exam.center_id || ''));
    const [subjectId, setSubjectId] = useState<string>(exam.subject_id ? String(exam.subject_id) : '');
    const [name, setName] = useState(exam.name || '');
    const [code, setCode] = useState(exam.code || '');
    const [durationMinutes, setDurationMinutes] = useState<number | string>(exam.duration_minutes || 45);
    const [passScore, setPassScore] = useState<number | string>(exam.pass_score || '');
    const [shuffleQuestions, setShuffleQuestions] = useState(Boolean(exam.shuffle_questions));
    const [shuffleOptions, setShuffleOptions] = useState(Boolean(exam.shuffle_options));
    const [maxAttempts, setMaxAttempts] = useState<number | string>(exam.max_attempts || 1);
    const [isPractice, setIsPractice] = useState(Boolean(exam.is_practice));
    const [description, setDescription] = useState(exam.description || '');
    const [status, setStatus] = useState<number>(exam.status ?? EXAM_STATUS_DRAFT);

    // Sections State (Initialize from exam.sections or fallback to grouping exam.questions)
    const [sections, setSections] = useState<ExamSectionData[]>(() => {
        if (exam.sections && exam.sections.length > 0) {
            return exam.sections;
        }

        // Fallback backward-compatible: Group raw questions by skill into sections
        if (exam.questions && exam.questions.length > 0) {
            const skillMap: Record<string, ExamQuestionData[]> = {};
            exam.questions.forEach((q) => {
                const sk = q.skill ?? SKILL_READING;
                if (!skillMap[sk]) skillMap[sk] = [];
                skillMap[sk].push(q);
            });

            return Object.entries(skillMap).map(([sk, qs], idx) => ({
                tempId: `sec_legacy_${idx}`,
                title: `Phần ${idx + 1}: ${EXAM_SKILL_LABELS[Number(sk)] || 'Kỹ Năng Đọc'}`,
                description: null,
                skill: Number(sk),
                order_index: idx,
                questions: qs,
            }));
        }

        return [];
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);

    const filteredSubjects = centerId
        ? subjects.filter((s) => !s.center_id || String(s.center_id) === String(centerId))
        : subjects;

    // Total score across sections
    const totalScore = sections.reduce(
        (sum, sec) => sum + (sec.questions || []).reduce((qSum, q) => qSum + (Number(q.score) || 0), 0),
        0,
    );

    const calculatedMaxScore = totalScore > 0 ? totalScore : (Number(exam.max_score) || 10);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setUploadProgressText(null);

        try {
            // Upload all pending local images only when saving
            const cleanSections = await uploadPendingMediaInObject(
                sections,
                (completed, total) => {
                    setUploadProgressText(`Đang tải tệp lên máy chủ (${completed}/${total})...`);
                },
            );
            setUploadProgressText(null);

            const payload = {
                center_id: centerId ? Number(centerId) : null,
                subject_id: subjectId ? Number(subjectId) : null,
                name: name.trim(),
                code: code.trim() || null,
                duration_minutes: durationMinutes ? Number(durationMinutes) : null,
                max_score: calculatedMaxScore,
                pass_score: passScore ? Number(passScore) : null,
                shuffle_questions: shuffleQuestions,
                shuffle_options: shuffleOptions,
                max_attempts: maxAttempts ? Number(maxAttempts) : 1,
                is_practice: isPractice,
                description: description.trim() || null,
                status,
                sections: cleanSections.map((sec, sIdx) => ({
                    id: sec.id || undefined,
                    title: (sec.title || '').trim(),
                    description: (sec.description || '').trim() || null,
                    skill: sec.skill ?? SKILL_READING,
                    order_index: sIdx,
                    questions: (sec.questions || []).map((q, qIdx) => ({
                        id: q.id || undefined,
                        code: (q.code || '').trim() || null,
                        title: (q.title || '').trim() || null,
                        question_type: q.question_type,
                        skill: sec.skill ?? SKILL_READING,
                        content: q.content || '',
                        image_url: q.image_url || null,
                        audio_url: q.audio_url || null,
                        score: Number(q.score) || 1,
                        options: q.options ?? null,
                        correct_answer: q.correct_answer ?? null,
                        explanation: q.explanation || null,
                        metadata: q.metadata ?? null,
                        order_index: qIdx,
                    })),
                })),
            };

            router.patch(
                `/exams/${exam.id}`,
                payload as any,
                {
                    onFinish: () => {
                        setIsSubmitting(false);
                        setUploadProgressText(null);
                    },
                },
            );
        } catch (err: any) {
            setIsSubmitting(false);
            setUploadProgressText(null);
        }
    };

    const formatValidationError = (key: string, msg: string): string => {
        // If message is already clean Vietnamese without dot notation and english keywords
        if (
            !msg.includes('sections.') &&
            !msg.includes('questions.') &&
            !msg.toLowerCase().includes('the selected') &&
            !msg.toLowerCase().includes('is invalid') &&
            !msg.toLowerCase().includes('field is required')
        ) {
            return msg;
        }

        const qMatch = key.match(/^sections\.(\d+)\.questions\.(\d+)\.(.+)$/);
        if (qMatch) {
            const secNum = parseInt(qMatch[1], 10) + 1;
            const qNum = parseInt(qMatch[2], 10) + 1;
            const field = qMatch[3];
            const fieldMap: Record<string, string> = {
                question_type: 'Kiểu câu hỏi',
                content: 'Nội dung câu hỏi',
                score: 'Điểm',
                options: 'Đáp án lựa chọn',
                correct_answer: 'Đáp án đúng',
                code: 'Mã câu hỏi',
                skill: 'Kỹ năng',
            };
            const fieldLabel = fieldMap[field] || field;
            return `${fieldLabel} của câu số ${qNum} phần ${secNum} không hợp lệ.`;
        }

        const sMatch = key.match(/^sections\.(\d+)\.(.+)$/);
        if (sMatch) {
            const secNum = parseInt(sMatch[1], 10) + 1;
            const field = sMatch[2];
            const fieldMap: Record<string, string> = {
                title: 'Tiêu đề',
                skill: 'Kỹ năng',
                description: 'Mô tả',
            };
            const fieldLabel = fieldMap[field] || field;
            return `${fieldLabel} của phần ${secNum} không hợp lệ.`;
        }

        if (key === 'center_id') {
            return 'Vui lòng chọn Trung tâm đào tạo.';
        }
        if (key === 'name') {
            return 'Vui lòng nhập tên bài kiểm tra.';
        }
        if (key === 'code') {
            return 'Mã bài kiểm tra không hợp lệ hoặc đã tồn tại.';
        }

        return msg;
    };

    return (
        <AppLayout title={`Chỉnh Sửa Đề Thi: ${exam.name} - Kho Đề Thi - SAM Digital`}>
            <Head title={`Chỉnh Sửa: ${exam.name} - Kho Đề Thi`} />

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
                                Chỉnh Sửa Đề Thi (Kho Đề Thi)
                            </h1>
                            <p className="text-sm text-gray-500">
                                Cập nhật nội dung câu hỏi và cấu hình của đề thi <strong className="text-gray-800">{exam.name}</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Alert Banner */}
                    {Object.keys(errors).length > 0 && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-xs">
                            <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-semibold">Vui lòng kiểm tra các thông tin chưa hợp lệ:</p>
                                <ul className="list-inside list-disc text-xs space-y-1">
                                    {Object.entries(errors).map(([key, msg]) => (
                                        <li key={key}>{formatValidationError(key, msg)}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                    {/* Card 1: Exam Metadata */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <FileCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    1. Thông Tin & Cấu Hình Đề Thi
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Xác định phạm vi trung tâm, môn học, thang điểm và các quy chế làm bài
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
                            {/* Center Selection (Super Admin only) */}
                            {isSuperAdmin && (
                                <div>
                                    <label className="mb-2 flex h-6 items-center text-sm font-semibold text-gray-800">
                                        Trung Tâm Đào Tạo <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <select
                                        value={centerId}
                                        onChange={(e) => {
                                            setCenterId(e.target.value);
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

                            {/* Subject Selection */}
                            <div>
                                <label className="mb-2 flex h-6 items-center text-sm font-semibold text-gray-800">
                                    Môn Học (Tùy chọn)
                                </label>
                                <select
                                    value={subjectId}
                                    onChange={(e) => setSubjectId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">-- Chọn Môn Học (Tùy chọn) --</option>
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
                                <label className="mb-2 flex h-6 items-center text-sm font-semibold text-gray-800">
                                    Tên Đề Thi <span className="text-red-500 ml-1">*</span>
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ví dụ: Đề thi thử IELTS Academic Test 01..."
                                    className="!py-2.5 !text-sm font-medium"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Exam Code */}
                            <div>
                                <label className="mb-2 flex h-6 items-center text-sm font-semibold text-gray-800">
                                    Mã Đề Thi
                                </label>
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Để trống tự sinh mã (VD: EXM000000001)"
                                    className="!py-2.5 !text-sm uppercase font-mono"
                                />
                                {errors.code && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.code}</p>
                                )}
                            </div>

                            {/* Duration Minutes */}
                            <div>
                                <label className="mb-2 flex h-6 items-center text-sm font-semibold text-gray-800">
                                    Thời Gian Làm Bài (Phút) <span className="text-red-500 ml-1">*</span>
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={600}
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(e.target.value)}
                                    placeholder="45"
                                    icon={<Clock className="h-4 w-4 text-gray-400" />}
                                    className="!py-2.5 !text-sm"
                                    required
                                />
                                {errors.duration_minutes && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.duration_minutes}</p>
                                )}
                            </div>

                            {/* Auto-calculated Max Score */}
                            <div>
                                <div className="mb-2 flex h-6 items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-800">
                                        Điểm Tối Đa <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <span className="inline-flex items-center gap-1 text-3xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <Calculator className="h-3 w-3" />
                                        Tự động tính
                                    </span>
                                </div>
                                <div className="relative flex items-center w-full">
                                    <input
                                        type="number"
                                        value={calculatedMaxScore}
                                        readOnly
                                        disabled
                                        className="ui-input !py-2.5 !text-sm !bg-slate-100 font-extrabold !text-gray-900 !cursor-not-allowed font-mono !pr-14"
                                        title="Tổng điểm tự động tính toán từ tổng điểm các câu hỏi trong đề"
                                    />
                                    <span className="absolute right-3 text-xs text-gray-400 font-bold pointer-events-none">
                                        điểm
                                    </span>
                                </div>
                            </div>

                            {/* Pass Score */}
                            <div>
                                <label className="mb-2 flex h-6 items-center text-sm font-semibold text-gray-800">
                                    Điểm Đạt (Pass Score)
                                </label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    min={0}
                                    value={passScore}
                                    onChange={(e) => setPassScore(e.target.value)}
                                    placeholder="5.0"
                                    className="!py-2.5 !text-sm"
                                />
                            </div>

                            {/* Max Attempts */}
                            <div>
                                <label className="mb-2 flex h-6 items-center text-sm font-semibold text-gray-800">
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
                                <label className="mb-2 flex h-6 items-center text-sm font-semibold text-gray-800">
                                    Trạng Thái Đề Thi <span className="text-red-500 ml-1">*</span>
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    <option value={EXAM_STATUS_DRAFT}>{EXAM_STATUS_LABELS[EXAM_STATUS_DRAFT]}</option>
                                    <option value={EXAM_STATUS_PUBLISHED}>{EXAM_STATUS_LABELS[EXAM_STATUS_PUBLISHED]}</option>
                                    <option value={EXAM_STATUS_COMPLETED}>{EXAM_STATUS_LABELS[EXAM_STATUS_COMPLETED]}</option>
                                    <option value={EXAM_STATUS_CANCELLED}>{EXAM_STATUS_LABELS[EXAM_STATUS_CANCELLED]}</option>
                                </select>
                            </div>

                            {/* Shuffle & Practice Toggles */}
                            <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200 md:col-span-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                                    Cấu Hình Đề Thi & Chế Độ Thi Thử
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

                                    <label className="flex cursor-pointer items-center gap-2.5 select-none sm:col-span-2 pt-2 border-t border-slate-200">
                                        <input
                                            type="checkbox"
                                            checked={isPractice}
                                            onChange={(e) => setIsPractice(e.target.checked)}
                                            className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <Award className="h-4 w-4 text-blue-600" />
                                        <span className="text-xs font-bold text-blue-900">
                                            Cho phép Thi Thử / Luyện Tập Tự Do (Đề thi này sẽ xuất hiện trong danh sách Thi Thử)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="md:col-span-3">
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mô Tả & Hướng Dẫn Chung Cho Đề Thi
                                </label>
                                <textarea
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Hướng dẫn chung cho học sinh trước khi bắt đầu làm đề thi này..."
                                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Card 2: Interactive Question Builder */}
                    <QuestionBuilder
                        sections={sections}
                        onChangeSections={setSections}
                        examMaxScore={calculatedMaxScore}
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
                            disabled={isSubmitting || Boolean(uploadProgressText)}
                            isLoading={isSubmitting || Boolean(uploadProgressText)}
                            icon={<Save className="h-5 w-5" />}
                        >
                            {uploadProgressText || 'Cập Nhật Đề Thi'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
