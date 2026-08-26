import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    Award,
    FileCheck,
    Save,
    X,
    BookOpen,
    Users,
    Sparkles,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DatePicker from '@/components/ui/DatePicker';
import ScrollableSelect from '@/components/ui/ScrollableSelect';
import { Center, ClassExam, Exam, SchoolClass } from './types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    centers: Center[];
    classes: SchoolClass[];
    exams: Exam[];
    editingClassExam?: ClassExam | null;
    initialExamId?: number | null;
    initialClassId?: number | null;
}

export default function AssignExamModal({
    isOpen,
    onClose,
    centers = [],
    classes = [],
    exams = [],
    editingClassExam = null,
    initialExamId = null,
    initialClassId = null,
}: Props) {
    const [centerId, setCenterId] = useState<string>('');
    const [classId, setClassId] = useState<string>('');
    const [examId, setExamId] = useState<string>('');
    const [title, setTitle] = useState('');
    const [examDate, setExamDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [durationMinutes, setDurationMinutes] = useState<number | string>(45);
    const [maxScore, setMaxScore] = useState<number | string>(10);
    const [passScore, setPassScore] = useState<number | string>(5);
    const [status, setStatus] = useState<'scheduled' | 'ongoing' | 'completed' | 'cancelled'>('scheduled');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset or populate on open/change
    useEffect(() => {
        if (!isOpen) return;

        if (editingClassExam) {
            const cls = editingClassExam.schoolClass || editingClassExam.school_class;
            setCenterId(cls?.center_id ? String(cls.center_id) : '');
            setClassId(String(editingClassExam.class_id));
            setExamId(String(editingClassExam.exam_id));
            setTitle(editingClassExam.title || '');
            setExamDate(editingClassExam.exam_date || '');
            setStartTime(editingClassExam.start_time ? editingClassExam.start_time.substring(0, 5) : '');
            setEndTime(editingClassExam.end_time ? editingClassExam.end_time.substring(0, 5) : '');
            setDurationMinutes(editingClassExam.duration_minutes || 45);
            setMaxScore(editingClassExam.max_score || 10);
            setPassScore(editingClassExam.pass_score || '');
            setStatus(editingClassExam.status || 'scheduled');
        } else {
            // New creation
            const defExam = initialExamId ? exams.find((e) => e.id === initialExamId) : null;
            const defClass = initialClassId ? classes.find((c) => c.id === initialClassId) : null;

            const prefillCenterId = defClass?.center_id
                ? String(defClass.center_id)
                : defExam?.center_id
                ? String(defExam.center_id)
                : (centers.length > 0 ? String(centers[0].id) : '');

            setCenterId(prefillCenterId);
            setClassId(initialClassId ? String(initialClassId) : '');
            setExamId(initialExamId ? String(initialExamId) : '');
            const now = new Date();
            const currentHour = String(now.getHours()).padStart(2, '0');
            const currentMin = String(now.getMinutes()).padStart(2, '0');

            setTitle(defExam ? `Bài kiểm tra - ${defExam.name}` : '');
            setExamDate(now.toISOString().split('T')[0]);
            setStartTime(`${currentHour}:${currentMin}`);
            setEndTime('23:59');
            setDurationMinutes(defExam?.duration_minutes || 45);
            setMaxScore(defExam?.max_score || 10);
            setPassScore(defExam?.pass_score || 5);
            setStatus('scheduled');
        }
        setErrors({});
    }, [isOpen, editingClassExam, initialExamId, initialClassId]);

    // When selecting exam, auto fill duration & max score
    const handleExamChange = (selectedId: string) => {
        setExamId(selectedId);
        const matched = exams.find((e) => String(e.id) === String(selectedId));
        if (matched) {
            if (!editingClassExam) {
                setTitle(`Bài kiểm tra - ${matched.name}`);
            }
            if (matched.duration_minutes) setDurationMinutes(matched.duration_minutes);
            if (matched.max_score) setMaxScore(matched.max_score);
            if (matched.pass_score) setPassScore(matched.pass_score);
        }
    };

    // Filter classes and exams by center
    const filteredClasses = centerId
        ? classes.filter((c) => String(c.center_id) === String(centerId))
        : classes;

    const filteredExams = centerId
        ? exams.filter((e) => !e.center_id || String(e.center_id) === String(centerId))
        : exams;

    const selectedExamObj = exams.find((e) => String(e.id) === String(examId));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        const payload = {
            class_id: Number(classId),
            exam_id: Number(examId),
            title: title.trim(),
            exam_date: examDate,
            start_time: startTime || null,
            end_time: endTime || null,
            duration_minutes: durationMinutes ? Number(durationMinutes) : null,
            max_score: maxScore ? Number(maxScore) : 10,
            pass_score: passScore ? Number(passScore) : null,
            status,
        };

        if (editingClassExam) {
            router.patch(`/class-exams/${editingClassExam.id}`, payload, {
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    setErrors(errs);
                },
            });
        } else {
            router.post('/class-exams', payload, {
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    setErrors(errs);
                },
            });
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingClassExam ? 'Chỉnh Sửa Lịch Thi Của Lớp' : 'Gán Đề Thi & Lên Lịch Thi Cho Lớp'}
            maxWidth="4xl"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Center Filter (if super admin) */}
                {centers.length > 1 && (
                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                            Trung Tâm Đào Tạo
                        </label>
                        <ScrollableSelect
                            value={centerId}
                            onChange={(val) => {
                                setCenterId(val);
                                setClassId('');
                            }}
                            options={[
                                { value: '', label: '-- Tất cả Trung Tâm --' },
                                ...centers.map((c) => ({
                                    value: String(c.id),
                                    label: c.name,
                                })),
                            ]}
                            placeholder="-- Tất cả Trung Tâm --"
                            searchable={true}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Class Select */}
                    <div>
                        <label className="mb-1.5 flex h-5 items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-700">
                            <Users className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Lớp Học Tổ Chức Thi (*)</span>
                        </label>
                        <ScrollableSelect
                            value={classId}
                            onChange={(val) => setClassId(val)}
                            options={filteredClasses.map((c) => ({
                                value: String(c.id),
                                label: c.name,
                            }))}
                            placeholder="-- Chọn Lớp Học --"
                            searchable={true}
                        />
                        {errors.class_id && <p className="mt-1 text-2xs text-red-600">{errors.class_id}</p>}
                    </div>

                    {/* Exam Select */}
                    <div>
                        <label className="mb-1.5 flex h-5 items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-700">
                            <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                            <span>Đề Thi Từ Kho Mẫu (*)</span>
                        </label>
                        <ScrollableSelect
                            value={examId}
                            onChange={(val) => handleExamChange(val)}
                            options={filteredExams.map((e) => ({
                                value: String(e.id),
                                label: `${e.name} · ${e.max_score}đ`,
                            }))}
                            placeholder="-- Chọn Đề Thi Trong Kho --"
                            searchable={true}
                        />
                        {errors.exam_id && <p className="mt-1 text-2xs text-red-600">{errors.exam_id}</p>}
                    </div>
                </div>

                {/* Selected Exam Highlight Card */}
                {selectedExamObj && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-blue-600" />
                            <div>
                                <span className="font-bold text-blue-900">{selectedExamObj.name}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 font-semibold text-blue-800">
                            <span>⏱️ {selectedExamObj.duration_minutes || 45} phút</span>
                            <span>🎯 {selectedExamObj.max_score} điểm</span>
                        </div>
                    </div>
                )}

                {/* Exam Title for Class */}
                <div>
                    <label className="mb-1.5 flex h-5 items-center text-xs font-bold uppercase tracking-wider text-gray-700">
                        Tiêu Đề Bài Thi Của Lớp (*)
                    </label>
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="VD: Bài kiểm tra 15 phút Unit 3, Thi giữa kỳ 1, Final Exam..."
                        required
                        className="!h-10 !text-xs font-semibold"
                    />
                    {errors.title && <p className="mt-1 text-2xs text-red-600">{errors.title}</p>}
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="mb-1.5 flex h-5 items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-700">
                            <Calendar className="h-3.5 w-3.5 text-gray-500" />
                            <span>Ngày Thi (*)</span>
                        </label>
                        <DatePicker
                            value={examDate}
                            onChange={(val) => setExamDate(val)}
                            required
                            className="!h-10 !text-xs font-semibold w-full"
                        />
                        {errors.exam_date && <p className="mt-1 text-2xs text-red-600">{errors.exam_date}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 flex h-5 items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-700">
                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                            <span>Giờ Bắt Đầu</span>
                        </label>
                        <Input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="!h-10 !text-xs font-semibold"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 flex h-5 items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-700">
                            <Clock className="h-3.5 w-3.5 text-gray-500" />
                            <span>Giờ Kết Thúc</span>
                        </label>
                        <Input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="!h-10 !text-xs font-semibold"
                        />
                    </div>
                </div>

                {/* Duration, Max Score, Pass Score, Status */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                        <label className="mb-1.5 flex h-5 items-center text-xs font-bold uppercase tracking-wider text-gray-700 whitespace-nowrap">
                            Thời Lượng (Phút)
                        </label>
                        <Input
                            type="number"
                            min={1}
                            max={600}
                            value={durationMinutes}
                            onChange={(e) => setDurationMinutes(e.target.value)}
                            className="!h-10 !text-xs font-semibold"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 flex h-5 items-center text-xs font-bold uppercase tracking-wider text-gray-700 whitespace-nowrap">
                            Điểm Tối Đa
                        </label>
                        <Input
                            type="number"
                            step="0.5"
                            value={maxScore}
                            onChange={(e) => setMaxScore(e.target.value)}
                            className="!h-10 !text-xs font-bold"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 flex h-5 items-center text-xs font-bold uppercase tracking-wider text-gray-700 whitespace-nowrap">
                            Điểm Đạt
                        </label>
                        <Input
                            type="number"
                            step="0.5"
                            value={passScore}
                            onChange={(e) => setPassScore(e.target.value)}
                            placeholder="5.0"
                            className="!h-10 !text-xs font-semibold"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 flex h-5 items-center text-xs font-bold uppercase tracking-wider text-gray-700 whitespace-nowrap">
                            Trạng Thái
                        </label>
                        <ScrollableSelect
                            value={status}
                            onChange={(val) => setStatus(val as any)}
                            options={[
                                { value: 'scheduled', label: 'Đã lên lịch' },
                                { value: 'ongoing', label: 'Đang diễn ra' },
                                { value: 'completed', label: 'Đã kết thúc' },
                                { value: 'cancelled', label: 'Đã hủy' },
                            ]}
                            searchable={false}
                        />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        variant="success"
                        size="sm"
                        isLoading={isSubmitting}
                        icon={<Save className="h-4 w-4" />}
                    >
                        {editingClassExam ? 'Lưu Thay Đổi' : 'Xác Nhận Gán Đề Thi'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
