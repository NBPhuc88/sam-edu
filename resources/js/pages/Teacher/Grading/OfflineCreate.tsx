import { Head, Link, router } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    FileCheck,
    GraduationCap,
    HelpCircle,
    RotateCcw,
    Save,
    Users,
    X,
} from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import { ScrollableSelect } from '@/components/ui/ScrollableSelect';
import AppLayout from '@/layouts/AppLayout';
import { formatDate } from '@/lib/date';

interface SubjectItem {
    id: number;
    name: string;
    code?: string;
}

interface StudentItem {
    id: number;
    student_code?: string;
    full_name: string;
    phone?: string | null;
    gender?: string;
    avatar?: string | null;
}

interface SchoolClassItem {
    id: number;
    name: string;
    code?: string;
    center_id?: number;
    center?: {
        id: number;
        name: string;
        code?: string;
    } | null;
    subjects: SubjectItem[];
    students: StudentItem[];
}

interface Props {
    classes: SchoolClassItem[];
    isTeacher: boolean;
    isAdmin: boolean;
}

interface StudentScoreRecord {
    [key: string]: string | number;
    student_id: number;
    score: string; // string for input handling
    comment: string;
}

export default function OfflineCreate({ classes, isTeacher, isAdmin }: Props) {
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    const [selectedClassId, setSelectedClassId] = useState<string>(
        classes.length > 0 ? String(classes[0].id) : '',
    );

    const selectedClass = useMemo(() => {
        return classes.find((c) => String(c.id) === selectedClassId) || null;
    }, [classes, selectedClassId]);

    const availableSubjects = useMemo(() => {
        return selectedClass?.subjects || [];
    }, [selectedClass]);

    const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
        return classes[0]?.subjects[0]?.id ? String(classes[0].subjects[0].id) : '';
    });

    const [title, setTitle] = useState<string>('');
    const [examDate, setExamDate] = useState<string>(todayStr);
    const [maxScore, setMaxScore] = useState<number>(10);
    const [passScore, setPassScore] = useState<number>(5);
    const [description, setDescription] = useState<string>('');

    // Mapping student_id -> { score: string, comment: string }
    const [scoresMap, setScoresMap] = useState<Record<number, { score: string; comment: string }>>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // References to score inputs for fast keyboard navigation
    const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>(() => {
        return classes[0]?.students?.map((s) => s.id) || [];
    });

    // When class changes, reset subject if current is not in available subjects & update selectedStudentIds
    const handleClassChange = (newClassId: string) => {
        setSelectedClassId(newClassId);
        const newClass = classes.find((c) => String(c.id) === newClassId);
        if (newClass && newClass.subjects.length > 0) {
            setSelectedSubjectId(String(newClass.subjects[0].id));
        } else {
            setSelectedSubjectId('');
        }
        setSelectedStudentIds(newClass?.students?.map((s) => s.id) || []);
    };

    const handleToggleStudent = (studentId: number) => {
        setSelectedStudentIds((prev) =>
            prev.includes(studentId)
                ? prev.filter((id) => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAllStudents = () => {
        if (!selectedClass) return;
        setSelectedStudentIds(selectedClass.students.map((s) => s.id));
    };

    const handleDeselectAllStudents = () => {
        setSelectedStudentIds([]);
    };

    const handleScoreChange = (studentId: number, val: string) => {
        // Allow empty or valid number
        if (val !== '' && isNaN(Number(val))) {
            return;
        }

        const numVal = Number(val);
        if (val !== '' && (numVal < 0 || numVal > maxScore)) {
            return;
        }

        setScoresMap((prev) => ({
            ...prev,
            [studentId]: {
                score: val,
                comment: prev[studentId]?.comment || '',
            },
        }));
    };

    const handleCommentChange = (studentId: number, comment: string) => {
        setScoresMap((prev) => ({
            ...prev,
            [studentId]: {
                score: prev[studentId]?.score || '',
                comment,
            },
        }));
    };

    // Quick navigation via Enter or Arrow keys
    const handleScoreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
        if (!selectedClass) return;

        const students = selectedClass.students;
        if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            const nextStudent = students[currentIndex + 1];
            if (nextStudent && inputRefs.current[nextStudent.id]) {
                inputRefs.current[nextStudent.id]?.focus();
                inputRefs.current[nextStudent.id]?.select();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevStudent = students[currentIndex - 1];
            if (prevStudent && inputRefs.current[prevStudent.id]) {
                inputRefs.current[prevStudent.id]?.focus();
                inputRefs.current[prevStudent.id]?.select();
            }
        }
    };

    // Computed real-time statistics (only for selected students)
    const stats = useMemo(() => {
        if (!selectedClass) {
            return { total: 0, graded: 0, avg: 0, highest: 0, passed: 0, passRate: 0 };
        }

        const activeStudents = selectedClass.students.filter((s) => selectedStudentIds.includes(s.id));
        const total = activeStudents.length;
        let graded = 0;
        let sum = 0;
        let highest = 0;
        let passed = 0;

        activeStudents.forEach((s) => {
            const rawScore = scoresMap[s.id]?.score;
            if (rawScore !== undefined && rawScore !== '') {
                const num = Number(rawScore);
                if (!isNaN(num)) {
                    graded++;
                    sum += num;
                    if (num > highest) highest = num;
                    if (num >= passScore) passed++;
                }
            }
        });

        const avg = graded > 0 ? Number((sum / graded).toFixed(2)) : 0;
        const passRate = graded > 0 ? Number(((passed / graded) * 100).toFixed(1)) : 0;

        return { total, graded, avg, highest, passed, passRate };
    }, [selectedClass, selectedStudentIds, scoresMap, passScore]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!selectedClassId) {
            setErrors({ class_id: 'Vui lòng chọn lớp học.' });
            return;
        }

        if (!selectedSubjectId) {
            setErrors({ subject_id: 'Vui lòng chọn môn học cho bài thi.' });
            return;
        }

        if (!title.trim()) {
            setErrors({ title: 'Vui lòng nhập tên bài kiểm tra / kỳ thi.' });
            return;
        }

        if (selectedStudentIds.length === 0) {
            setErrors({ general: 'Vui lòng chọn ít nhất 1 học sinh tham gia kiểm tra.' });
            return;
        }

        const selectedStudents = (selectedClass?.students || []).filter((s) =>
            selectedStudentIds.includes(s.id)
        );

        const scoresPayload: StudentScoreRecord[] = selectedStudents.map((s) => {
            const entry = scoresMap[s.id];
            return {
                student_id: s.id,
                score: entry?.score ?? '',
                comment: entry?.comment ?? '',
            };
        });

        setIsSubmitting(true);

        router.post(
            '/grading/offline',
            {
                class_id: Number(selectedClassId),
                subject_id: Number(selectedSubjectId),
                title: title.trim(),
                exam_date: examDate,
                max_score: Number(maxScore),
                pass_score: Number(passScore),
                description: description.trim() || null,
                scores: scoresPayload,
            },
            {
                onError: (errs) => {
                    setErrors(errs);
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <AppLayout title="Chấm Bài Thi Giấy - SAM Digital">
            <Head title="Tạo Đợt Chấm Bài Thi Giấy" />

            <div className="space-y-6">
                {/* Header & Breadcrumb */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-2xs text-gray-500 font-semibold mb-1">
                            <Link href="/grading" className="hover:text-emerald-600 transition-colors">
                                Quản Lý Chấm Bài Thi
                            </Link>
                            <span>/</span>
                            <span className="text-gray-700">Chấm Bài Thi Giấy</span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
                            <FileCheck className="h-6 w-6 text-emerald-600" />
                            Tạo Đợt Chấm Bài Thi Giấy (Offline)
                        </h1>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Khởi tạo bài kiểm tra giấy cho lớp học, nhập trực tiếp điểm số và lời phê theo danh sách học sinh
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Card 1: Configuration Form */}
                    <Card className="border-gray-200 bg-white p-5 shadow-2xs">
                        <div className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-emerald-600" />
                                1. Cấu Hình Bài Kiểm Tra & Lớp Học
                            </h2>
                            <span className="text-2xs font-semibold text-gray-400">
                                Mã đề thi sẽ được hệ thống tự động sinh
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Class Selector */}
                            <div>
                                <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-700">
                                    Lớp Học <span className="text-red-500">*</span>
                                </label>
                                <ScrollableSelect
                                    value={selectedClassId}
                                    onChange={handleClassChange}
                                    options={classes.map((cls) => ({
                                        value: String(cls.id),
                                        label: cls.name,
                                    }))}
                                    placeholder="-- Chọn lớp học --"
                                    searchable={true}
                                />
                                {errors.class_id && (
                                    <p className="mt-1 text-2xs text-red-600">{errors.class_id}</p>
                                )}
                            </div>

                            {/* Subject Selector */}
                            <div>
                                <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-700">
                                    Môn Học <span className="text-red-500">*</span>
                                </label>
                                <ScrollableSelect
                                    value={selectedSubjectId}
                                    onChange={setSelectedSubjectId}
                                    options={availableSubjects.map((sub) => ({
                                        value: String(sub.id),
                                        label: sub.name,
                                    }))}
                                    placeholder={
                                        availableSubjects.length === 0
                                            ? '-- Lớp chưa có môn học --'
                                            : '-- Chọn môn học --'
                                    }
                                    searchable={true}
                                />
                                {errors.subject_id && (
                                    <p className="mt-1 text-2xs text-red-600">{errors.subject_id}</p>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-700">
                                    Tên Bài Thi / Kỳ Thi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="VD: Kiểm tra 15 phút - Bài số 1"
                                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                />
                                {errors.title && (
                                    <p className="mt-1 text-2xs text-red-600">{errors.title}</p>
                                )}
                            </div>

                            {/* Exam Date */}
                            <div>
                                <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-700">
                                    Ngày Thi <span className="text-red-500">*</span>
                                </label>
                                <DatePicker
                                    value={examDate}
                                    onChange={(val) => setExamDate(val || todayStr)}
                                    placeholder="Chọn ngày thi"
                                />
                                {errors.exam_date && (
                                    <p className="mt-1 text-2xs text-red-600">{errors.exam_date}</p>
                                )}
                            </div>

                            {/* Max Score & Pass Score */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-700">
                                        Điểm Tối Đa
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        step={0.5}
                                        value={maxScore}
                                        onChange={(e) => {
                                            const v = Number(e.target.value) || 10;
                                            setMaxScore(v);
                                            if (passScore > v) setPassScore(Number((v * 0.5).toFixed(1)));
                                        }}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-700">
                                        Điểm Đạt
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={maxScore}
                                        step={0.5}
                                        value={passScore}
                                        onChange={(e) => setPassScore(Number(e.target.value) || 0)}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            {/* Description / Note */}
                            <div>
                                <label className="mb-1 block text-2xs font-bold uppercase tracking-wider text-gray-700">
                                    Ghi Chú Đợt Thi
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ghi chú thêm về nội dung kiểm tra..."
                                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-emerald-500 focus:outline-hidden"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Live Stats Metric Bar */}
                    {selectedClass && selectedClass.students.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <Card className="border-gray-200 bg-white p-3.5 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">
                                            Sĩ Số Lớp
                                        </p>
                                        <p className="mt-0.5 text-xl font-black text-gray-900">
                                            {stats.total} <span className="text-2xs font-normal text-gray-400">học sinh</span>
                                        </p>
                                    </div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <Users className="h-4.5 w-4.5" />
                                    </div>
                                </div>
                            </Card>

                            <Card className="border-gray-200 bg-white p-3.5 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xs font-bold uppercase tracking-wider text-emerald-600">
                                            Đã Nhập Điểm
                                        </p>
                                        <p className="mt-0.5 text-xl font-black text-emerald-700">
                                            {stats.graded} <span className="text-2xs font-normal text-gray-400">/ {stats.total}</span>
                                        </p>
                                    </div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <CheckCircle2 className="h-4.5 w-4.5" />
                                    </div>
                                </div>
                            </Card>

                            <Card className="border-gray-200 bg-white p-3.5 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xs font-bold uppercase tracking-wider text-purple-600">
                                            Điểm Trung Bình
                                        </p>
                                        <p className="mt-0.5 text-xl font-black text-purple-700">
                                            {stats.avg} <span className="text-2xs font-normal text-gray-400">/ {maxScore}đ</span>
                                        </p>
                                    </div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                        <Award className="h-4.5 w-4.5" />
                                    </div>
                                </div>
                            </Card>

                            <Card className="border-gray-200 bg-white p-3.5 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-2xs font-bold uppercase tracking-wider text-amber-600">
                                            Tỷ Lệ Đạt (≥{passScore}đ)
                                        </p>
                                        <p className="mt-0.5 text-xl font-black text-amber-700">
                                            {stats.passRate}% <span className="text-2xs font-normal text-gray-400">({stats.passed} HS)</span>
                                        </p>
                                    </div>
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                        <BookOpen className="h-4.5 w-4.5" />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Card 2: Student Score Entry Table */}
                    <Card className="border-gray-200 bg-white shadow-2xs overflow-hidden">
                        <div className="border-b border-gray-100 p-4 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="h-4 w-4 text-emerald-600" />
                                    2. Danh Sách Học Sinh Tham Gia Kiểm Tra & Bảng Điểm
                                </h2>
                                <p className="text-2xs text-gray-500 mt-0.5">
                                    💡 Tick chọn các học sinh tham gia đợt kiểm tra này (áp dụng cho kiểm tra miệng, kiểm tra bù hoặc cả lớp).
                                </p>
                            </div>

                            {selectedClass && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-2xs font-bold text-emerald-800 border border-emerald-200">
                                        Đã chọn {selectedStudentIds.length} / {selectedClass.students.length} học sinh
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleSelectAllStudents}
                                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-2xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
                                    >
                                        Chọn tất cả
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDeselectAllStudents}
                                        className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-2xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs"
                                    >
                                        Bỏ chọn tất cả
                                    </button>
                                </div>
                            )}
                        </div>

                        {errors.general && (
                            <div className="bg-rose-50 border-b border-rose-100 px-4 py-2 text-xs font-bold text-rose-700">
                                {errors.general}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-700">
                                <thead className="border-b border-gray-200 bg-slate-50 font-bold uppercase tracking-wider text-2xs text-gray-600">
                                    <tr>
                                        <th className="px-3 py-3 text-center w-12">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    Boolean(
                                                        selectedClass &&
                                                        selectedClass.students.length > 0 &&
                                                        selectedStudentIds.length === selectedClass.students.length
                                                    )
                                                }
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        handleSelectAllStudents();
                                                    } else {
                                                        handleDeselectAllStudents();
                                                    }
                                                }}
                                                className="h-4 w-4 rounded-sm border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                title="Chọn / Bỏ chọn tất cả"
                                            />
                                        </th>
                                        <th className="px-3 py-3 text-center w-12">STT</th>
                                        <th className="px-4 py-3">Học Sinh</th>
                                        <th className="px-4 py-3 w-40 text-center">
                                            Điểm Số (/{maxScore})
                                        </th>
                                        <th className="px-4 py-3 w-28 text-center">Kết Quả</th>
                                        <th className="px-4 py-3">Lời Phê / Nhận Xét Của Giáo Viên</th>
                                        <th className="px-4 py-3 w-16 text-center">Xóa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {!selectedClass || selectedClass.students.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                                <HelpCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                                                <p className="font-semibold text-xs text-gray-600">
                                                    Lớp học chưa có học sinh nào
                                                </p>
                                                <p className="text-2xs text-gray-400 mt-1">
                                                    Vui lòng ghi danh học sinh vào lớp học trước khi tiến hành chấm bài.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        selectedClass.students.map((student, idx) => {
                                            const isSelected = selectedStudentIds.includes(student.id);
                                            const scoreVal = isSelected ? (scoresMap[student.id]?.score ?? '') : '';
                                            const commentVal = isSelected ? (scoresMap[student.id]?.comment ?? '') : '';
                                            const numScore = scoreVal !== '' ? Number(scoreVal) : null;
                                            const isPassed = numScore !== null && numScore >= passScore;

                                            return (
                                                <tr
                                                    key={student.id}
                                                    className={`transition-colors ${
                                                        !isSelected
                                                            ? 'bg-gray-50/40 opacity-50'
                                                            : scoreVal !== ''
                                                            ? 'bg-emerald-50/20 hover:bg-emerald-50/30'
                                                            : 'hover:bg-slate-50/70'
                                                    }`}
                                                >
                                                    {/* Checkbox select */}
                                                    <td className="px-3 py-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleToggleStudent(student.id)}
                                                            className="h-4 w-4 rounded-sm border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                        />
                                                    </td>

                                                    {/* STT */}
                                                    <td className="px-3 py-3 text-center font-bold text-gray-500">
                                                        {idx + 1}
                                                    </td>

                                                    {/* Student Info */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                                                                {student.avatar ? (
                                                                    <img
                                                                        src={student.avatar}
                                                                        alt=""
                                                                        className="h-8 w-8 rounded-full object-cover"
                                                                    />
                                                                ) : (
                                                                    student.full_name?.charAt(0) || 'U'
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900">
                                                                    {student.full_name}
                                                                </p>
                                                                <div className="flex items-center gap-2 text-2xs text-gray-400 font-mono">
                                                                    <span>{student.student_code || 'Mã #' + student.id}</span>
                                                                    {student.phone && <span>· {student.phone}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Score Input */}
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="relative flex items-center justify-center">
                                                            <input
                                                                ref={(el) => {
                                                                    inputRefs.current[student.id] = el;
                                                                }}
                                                                type="text"
                                                                inputMode="decimal"
                                                                disabled={!isSelected}
                                                                value={scoreVal}
                                                                onChange={(e) =>
                                                                    handleScoreChange(student.id, e.target.value)
                                                                }
                                                                onKeyDown={(e) => handleScoreKeyDown(e, idx)}
                                                                placeholder={!isSelected ? '—' : '—'}
                                                                className={`w-24 text-center rounded-lg border py-1.5 px-2 text-sm font-black transition-all focus:outline-hidden disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 ${
                                                                    scoreVal !== ''
                                                                        ? isPassed
                                                                            ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 focus:ring-2 focus:ring-emerald-500/20'
                                                                            : 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500/20'
                                                                        : 'border-gray-300 bg-white text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                                                                }`}
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* Result Badge */}
                                                    <td className="px-4 py-3 text-center">
                                                        {scoreVal !== '' ? (
                                                            isPassed ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-2xs font-bold text-emerald-800 border border-emerald-200">
                                                                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                                                    Đạt
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-2xs font-bold text-rose-800 border border-rose-200">
                                                                    Chưa đạt
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-2xs text-gray-400 italic">
                                                                Chưa nhập
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Comment Input */}
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            disabled={!isSelected}
                                                            value={commentVal}
                                                            onChange={(e) =>
                                                                handleCommentChange(student.id, e.target.value)
                                                            }
                                                            placeholder={
                                                                !isSelected
                                                                    ? 'Không tham gia kiểm tra'
                                                                    : 'Nhận xét bài làm (tùy chọn)...'
                                                            }
                                                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-emerald-500 focus:outline-hidden disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                                                        />
                                                    </td>

                                                    {/* Clear Button */}
                                                    <td className="px-4 py-3 text-center">
                                                        {scoreVal !== '' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleScoreChange(student.id, '')}
                                                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors"
                                                                title="Xóa điểm"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Form Actions */}
                        <div className="border-t border-gray-100 p-4 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-2xs text-gray-500 font-medium">
                                Đã chọn <strong>{selectedStudentIds.length}</strong> học sinh kiểm tra · Đã nhập điểm cho <strong>{stats.graded}</strong> / <strong>{stats.total}</strong> học sinh
                            </p>

                            <div className="flex items-center gap-2.5">
                                <Link href="/grading">
                                    <Button type="button" variant="secondary" size="md">
                                        Hủy Bỏ
                                    </Button>
                                </Link>

                                <Button
                                    type="submit"
                                    variant="success"
                                    size="md"
                                    isLoading={isSubmitting}
                                    icon={<Save className="h-4 w-4" />}
                                    disabled={!selectedClass || selectedStudentIds.length === 0}
                                >
                                    Lưu Bài Thi & Bảng Điểm ({selectedStudentIds.length} HS)
                                </Button>
                            </div>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
