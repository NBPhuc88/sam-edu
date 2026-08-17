import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    Calendar,
    Clock,
    GraduationCap,
    BookOpen,
    UserCheck,
    DoorOpen,
    Plus,
    Trash2,
    CheckSquare,
    Square,
    AlertCircle,
    Coffee,
    CalendarPlus,
} from 'lucide-react';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import AppLayout from '@/layouts/AppLayout';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface SchoolClass {
    id: number;
    name: string;
    code: string;
    center_id: number;
}

interface Subject {
    id: number;
    name: string;
    code: string;
    center_id: number;
}

interface Teacher {
    id: number;
    full_name: string;
    teacher_code: string;
    center_id: number;
}

interface Room {
    id: number;
    name: string;
    center_id: number;
}

interface ClassSchedule {
    id: number;
    class_subject_id: number;
    weekday: number;
    start_time: string;
    end_time: string;
    room_id: number | null;
    effective_from: string;
    effective_to: string | null;
    status: string;
    class_subject?: {
        id: number;
        class_id: number;
        subject_id: number;
        teacher_id: number;
        school_class?: {
            id: number;
            name: string;
            code: string;
            center_id: number;
            center?: Center;
        };
        subject?: {
            id: number;
            name: string;
            code: string;
        };
        teacher?: {
            id: number;
            full_name: string;
            teacher_code: string;
        };
    };
}

interface EditProps {
    schedule: ClassSchedule;
    centers: Center[];
    classes: SchoolClass[];
    subjects: Subject[];
    teachers: Teacher[];
    rooms: Room[];
    errors?: Record<string, string>;
}

interface SpecificSession {
    [key: string]: any;
    date: string;
    start_time: string;
    end_time: string;
    topic: string;
}

interface OffSession {
    [key: string]: any;
    date: string;
    reason: string;
}

const WEEKDAYS = [
    { id: 1, label: 'Thứ 2' },
    { id: 2, label: 'Thứ 3' },
    { id: 3, label: 'Thứ 4' },
    { id: 4, label: 'Thứ 5' },
    { id: 5, label: 'Thứ 6' },
    { id: 6, label: 'Thứ 7' },
    { id: 7, label: 'Chủ Nhật' },
];

export default function ScheduleEdit({
    schedule,
    centers = [],
    classes = [],
    subjects = [],
    teachers = [],
    rooms = [],
    errors = {},
}: EditProps) {
    const classSubject = schedule.class_subject;
    const centerId = classSubject?.school_class?.center_id;

    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
        String(classSubject?.teacher_id || ''),
    );
    const [selectedRoomId, setSelectedRoomId] = useState<string>(
        schedule.room_id ? String(schedule.room_id) : '',
    );
    const [startDate, setStartDate] = useState<string>(schedule.effective_from || '');
    const [endDate, setEndDate] = useState<string>(schedule.effective_to || '');
    const [status, setStatus] = useState<string>(schedule.status || 'active');

    // Setup initial weekday
    const [weeklyTimes, setWeeklyTimes] = useState<
        Record<number, { enabled: boolean; start_time: string; end_time: string }>
    >({
        1: { enabled: schedule.weekday === 1, start_time: schedule.start_time.slice(0, 5) || '18:00', end_time: schedule.end_time.slice(0, 5) || '20:00' },
        2: { enabled: schedule.weekday === 2, start_time: '18:00', end_time: '20:00' },
        3: { enabled: schedule.weekday === 3, start_time: '18:00', end_time: '20:00' },
        4: { enabled: schedule.weekday === 4, start_time: '18:00', end_time: '20:00' },
        5: { enabled: schedule.weekday === 5, start_time: '18:00', end_time: '20:00' },
        6: { enabled: schedule.weekday === 6, start_time: '08:00', end_time: '10:00' },
        7: { enabled: schedule.weekday === 7, start_time: '08:00', end_time: '10:00' },
    });

    const [specificSessions, setSpecificSessions] = useState<SpecificSession[]>([]);
    const [offSessions, setOffSessions] = useState<OffSession[]>([]);
    const [excludeHolidays, setExcludeHolidays] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Available items for this center
    const availableTeachers = teachers.filter((t) => !centerId || t.center_id === centerId);
    const availableRooms = rooms.filter((r) => !centerId || r.center_id === centerId);

    const toggleWeekday = (day: number) => {
        setWeeklyTimes({
            ...weeklyTimes,
            [day]: {
                ...weeklyTimes[day],
                enabled: !weeklyTimes[day].enabled,
            },
        });
    };

    const handleWeekdayTimeChange = (day: number, field: 'start_time' | 'end_time', val: string) => {
        setWeeklyTimes({
            ...weeklyTimes,
            [day]: {
                ...weeklyTimes[day],
                [field]: val,
            },
        });
    };

    // Specific session handlers
    const handleAddSpecificSession = () => {
        setSpecificSessions([
            ...specificSessions,
            {
                date: new Date().toISOString().split('T')[0],
                start_time: '10:00',
                end_time: '12:00',
                topic: '',
            },
        ]);
    };

    const handleRemoveSpecificSession = (index: number) => {
        setSpecificSessions(specificSessions.filter((_, idx) => idx !== index));
    };

    const handleSpecificSessionChange = (index: number, field: keyof SpecificSession, val: string) => {
        const updated = [...specificSessions];
        updated[index][field] = val;
        setSpecificSessions(updated);
    };

    // Off session handlers
    const handleAddOffSession = () => {
        setOffSessions([
            ...offSessions,
            {
                date: new Date().toISOString().split('T')[0],
                reason: 'Nghỉ đột xuất',
            },
        ]);
    };

    const handleRemoveOffSession = (index: number) => {
        setOffSessions(offSessions.filter((_, idx) => idx !== index));
    };

    const handleOffSessionChange = (index: number, field: keyof OffSession, val: string) => {
        const updated = [...offSessions];
        updated[index][field] = val;
        setOffSessions(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const weeklySchedulesPayload = Object.entries(weeklyTimes)
            .filter(([_, conf]) => conf.enabled)
            .map(([dayStr, conf]) => ({
                weekday: Number(dayStr),
                start_time: conf.start_time,
                end_time: conf.end_time,
            }));

        router.patch(
            `/schedules/${schedule.id}`,
            {
                teacher_id: Number(selectedTeacherId),
                room_id: selectedRoomId ? Number(selectedRoomId) : null,
                start_date: startDate,
                end_date: endDate || null,
                weekly_schedules: weeklySchedulesPayload,
                specific_sessions: specificSessions,
                off_sessions: offSessions,
                exclude_vietnam_holidays: excludeHolidays,
                status,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title="Chỉnh Sửa Lịch Học - Hệ Thống Giáo Dục Sam">
            <Head title="Chỉnh Sửa Lịch Học" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/schedules">
                            <Button variant="secondary" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Chỉnh Sửa Lịch Học: {classSubject?.school_class?.name} - {classSubject?.subject?.name}
                            </h1>
                            <p className="text-xs text-gray-500">
                                Cập nhật giờ học, đổi giáo viên phụ trách, thêm ngày nghỉ và đồng bộ lại danh sách ca học.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Thông tin Lớp & Môn Học */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                            <GraduationCap className="h-4 w-4 text-emerald-600" />
                            1. Thông Tin Lớp Học & Môn Học
                        </h2>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Class Display */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Lớp Học
                                </label>
                                <div className="rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-gray-800">
                                    {classSubject?.school_class?.name} ({classSubject?.school_class?.code})
                                </div>
                            </div>

                            {/* Subject Display */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Môn Học
                                </label>
                                <div className="rounded-lg border border-gray-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-emerald-800">
                                    {classSubject?.subject?.name} ({classSubject?.subject?.code})
                                </div>
                            </div>

                            {/* Teacher Selection */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Giáo Viên Giảng Dạy (*)
                                </label>
                                <select
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    {availableTeachers.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.full_name} ({t.teacher_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Room Selection */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Phòng Học (Tùy chọn)
                                </label>
                                <select
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">-- Chưa Chọn Phòng --</option>
                                    {availableRooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Ngày Bắt Đầu (*)
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Ngày Kết Thúc (Dự kiến)
                                </label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Section 2: Lịch Học Định Kỳ Hàng Tuần (T2 .. CN) */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                            <Clock className="h-4 w-4 text-blue-600" />
                            2. Lịch Học Định Kỳ Trong Tuần (T2, T3, T4, T5, T6, T7, CN)
                        </h2>
                        <p className="mb-5 text-xs text-gray-500">
                            Chọn các thứ trong tuần và cập nhật khung giờ học.
                        </p>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {WEEKDAYS.map((day) => {
                                const conf = weeklyTimes[day.id];
                                return (
                                    <div
                                        key={day.id}
                                        onClick={() => toggleWeekday(day.id)}
                                        className={`cursor-pointer rounded-lg border p-3.5 transition-all ${
                                            conf.enabled
                                                ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                                                : 'border-gray-200 bg-white opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-900">
                                                {day.label}
                                            </span>
                                            {conf.enabled ? (
                                                <CheckSquare className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <Square className="h-4 w-4 text-gray-400" />
                                            )}
                                        </div>

                                        {conf.enabled && (
                                            <div
                                                className="mt-3 flex items-center gap-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="time"
                                                    value={conf.start_time}
                                                    onChange={(e) =>
                                                        handleWeekdayTimeChange(day.id, 'start_time', e.target.value)
                                                    }
                                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-mono font-medium text-gray-900"
                                                />
                                                <span className="text-xs text-gray-400">-</span>
                                                <input
                                                    type="time"
                                                    value={conf.end_time}
                                                    onChange={(e) =>
                                                        handleWeekdayTimeChange(day.id, 'end_time', e.target.value)
                                                    }
                                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-mono font-medium text-gray-900"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Section 3: Ngày Nghỉ Cố Định & Nghỉ Lễ Việt Nam */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                                    <Coffee className="h-4 w-4 text-amber-600" />
                                    3. Cấu Hình Ngày Nghỉ & Nghỉ Lễ Việt Nam
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    Hệ thống sẽ tự động bỏ qua các ngày nghỉ này khi tái sinh danh sách ca học.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                icon={<Plus className="h-4 w-4 text-amber-600" />}
                                onClick={handleAddOffSession}
                            >
                                Thêm Ngày Nghỉ
                            </Button>
                        </div>

                        {/* Holiday Toggle */}
                        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
                            <label className="flex cursor-pointer items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={excludeHolidays}
                                    onChange={(e) => setExcludeHolidays(e.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded-sm border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div>
                                    <span className="text-xs font-bold text-gray-900">
                                        Tự động nghỉ các ngày lễ theo lịch Việt Nam
                                    </span>
                                    <p className="mt-0.5 text-[11px] text-gray-600">
                                        Bao gồm: Tết Nguyên Đán, Tết Dương Lịch (1/1), Giỗ Tổ Hùng Vương (10/3 ÂL), 30/4, 1/5 và Quốc Khánh 2/9.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Custom Off Dates */}
                        {offSessions.length > 0 && (
                            <div className="space-y-2.5">
                                {offSessions.map((off, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-slate-50 p-3 sm:flex-row sm:items-center"
                                    >
                                        <div className="w-full sm:w-48">
                                            <input
                                                type="date"
                                                value={off.date}
                                                onChange={(e) =>
                                                    handleOffSessionChange(idx, 'date', e.target.value)
                                                }
                                                className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900"
                                                required
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={off.reason}
                                                onChange={(e) =>
                                                    handleOffSessionChange(idx, 'reason', e.target.value)
                                                }
                                                placeholder="Lý do nghỉ"
                                                className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            icon={<Trash2 className="h-3.5 w-3.5" />}
                                            onClick={() => handleRemoveOffSession(idx)}
                                        >
                                            Xóa
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Section 4: Ngày Giờ Học Cố Định Bổ Sung */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                                    <CalendarPlus className="h-4 w-4 text-purple-600" />
                                    4. Thêm Ngày Giờ Học Cố Định Bổ Sung (Tùy chọn)
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    Học bù, học tăng cường vào ngày cụ thể.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                icon={<Plus className="h-4 w-4 text-purple-600" />}
                                onClick={handleAddSpecificSession}
                            >
                                Thêm Buổi Học
                            </Button>
                        </div>

                        {specificSessions.length > 0 && (
                            <div className="space-y-2.5">
                                {specificSessions.map((spec, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-purple-50/30 p-3 sm:flex-row sm:items-center"
                                    >
                                        <div className="w-full sm:w-40">
                                            <input
                                                type="date"
                                                value={spec.date}
                                                onChange={(e) =>
                                                    handleSpecificSessionChange(idx, 'date', e.target.value)
                                                }
                                                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 font-mono"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="time"
                                                value={spec.start_time}
                                                onChange={(e) =>
                                                    handleSpecificSessionChange(idx, 'start_time', e.target.value)
                                                }
                                                className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 font-mono"
                                                required
                                            />
                                            <span className="text-xs text-gray-400">-</span>
                                            <input
                                                type="time"
                                                value={spec.end_time}
                                                onChange={(e) =>
                                                    handleSpecificSessionChange(idx, 'end_time', e.target.value)
                                                }
                                                className="w-24 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 font-mono"
                                                required
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={spec.topic}
                                                onChange={(e) =>
                                                    handleSpecificSessionChange(idx, 'topic', e.target.value)
                                                }
                                                placeholder="Nội dung / Chủ đề buổi học"
                                                className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            icon={<Trash2 className="h-3.5 w-3.5" />}
                                            onClick={() => handleRemoveSpecificSession(idx)}
                                        >
                                            Xóa
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href="/schedules">
                            <Button variant="secondary" size="md">
                                Hủy Bỏ
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            variant="edit"
                            size="md"
                            isLoading={isSubmitting}
                            icon={<Save className="h-4 w-4" />}
                        >
                            Cập Nhật & Đồng Bộ Ca Học
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
