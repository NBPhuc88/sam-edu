import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    Clock,
    GraduationCap,
    Plus,
    Trash2,
    CheckSquare,
    Square,
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
    total_sessions?: number | null;
    duration_minutes?: number | null;
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
            total_sessions?: number | null;
            duration_minutes?: number | null;
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

function calculateEstimatedEndDate(
    startDateStr: string,
    weeklyTimes: Record<number, { enabled: boolean; start_time: string; end_time: string }>,
    totalSessions: number,
    offSessions: OffSession[]
): string | null {
    if (!startDateStr || !totalSessions || totalSessions <= 0) return null;

    const enabledDays = Object.entries(weeklyTimes)
        .filter(([, conf]) => conf.enabled)
        .map(([day]) => Number(day));

    if (enabledDays.length === 0) return null;

    const offDatesSet = new Set(offSessions.filter((s) => s.date).map((s) => s.date));

    let createdCount = 0;
    const curr = new Date(startDateStr);
    let lastDate: string | null = null;
    let loopGuard = 0;

    while (createdCount < totalSessions && loopGuard < 1500) {
        loopGuard++;
        const ymd = curr.toISOString().split('T')[0];
        const jsDay = curr.getDay();
        const isoDay = jsDay === 0 ? 7 : jsDay;

        if (enabledDays.includes(isoDay)) {
            if (!offDatesSet.has(ymd)) {
                createdCount++;
                lastDate = ymd;
            }
        }

        if (createdCount >= totalSessions) break;
        curr.setDate(curr.getDate() + 1);
    }

    return lastDate;
}

export default function ScheduleEdit({
    schedule,
    teachers = [],
    rooms = [],
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
    const [status] = useState<string>(schedule.status || 'active');

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

    const totalSessions = classSubject?.subject?.total_sessions;
    const activeDaysCount = Object.values(weeklyTimes).filter((w) => w.enabled).length;

    const estimatedEndDate = React.useMemo(() => {
        if (!totalSessions || !startDate) return null;
        return calculateEstimatedEndDate(startDate, weeklyTimes, totalSessions, offSessions);
    }, [startDate, weeklyTimes, totalSessions, offSessions]);

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
            .filter(([, conf]) => conf.enabled)
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
                            <Button variant="secondary" size="md" icon={<ArrowLeft className="h-5 w-5" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Chỉnh Sửa Lịch Học: {classSubject?.school_class?.name} - {classSubject?.subject?.name}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Cập nhật giờ học, đổi giáo viên phụ trách, thêm ngày nghỉ và đồng bộ lại danh sách ca học.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Thông tin Lớp & Môn Học */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-5 flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                            <GraduationCap className="h-5 w-5 text-emerald-600" />
                            1. Thông Tin Lớp Học & Môn Học
                        </h2>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Class Display */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Lớp Học
                                </label>
                                <div className="rounded-lg border border-gray-200 bg-slate-50 px-4 py-3 text-sm font-bold text-gray-800">
                                    {classSubject?.school_class?.name} ({classSubject?.school_class?.code})
                                </div>
                            </div>

                            {/* Subject Display */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Môn Học
                                </label>
                                <div className="rounded-lg border border-gray-200 bg-slate-50 px-4 py-3 text-sm font-bold text-emerald-800">
                                    {classSubject?.subject?.name} ({classSubject?.subject?.code})
                                </div>
                            </div>

                            {/* Teacher Selection */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Giáo Viên Giảng Dạy <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedTeacherId}
                                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Phòng Học (Tùy chọn)
                                </label>
                                <select
                                    value={selectedRoomId}
                                    onChange={(e) => setSelectedRoomId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">-- Chưa Chọn Phòng (Online / Linh hoạt) --</option>
                                    {availableRooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Ngày Bắt Đầu <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="!py-3 !text-sm"
                                    required
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-800">
                                        Ngày Kết Thúc (Dự kiến)
                                    </label>
                                    {totalSessions && totalSessions > 0 && !endDate && (
                                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                            ✨ Tự động theo {totalSessions} buổi
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="!py-3 !text-sm"
                                    />
                                    {endDate && (
                                        <button
                                            type="button"
                                            onClick={() => setEndDate('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                                            title="Xóa ngày cố định để hệ thống tự động tính theo số buổi môn học"
                                        >
                                            Xóa (Tự động tính)
                                        </button>
                                    )}
                                </div>
                                {totalSessions && totalSessions > 0 ? (
                                    <div className="mt-1.5 text-xs">
                                        {endDate ? (
                                            <span className="text-gray-500">
                                                Đang đặt ngày kết thúc cố định. (Nếu để trống, hệ thống sẽ sinh đúng <strong>{totalSessions} buổi</strong> dự kiến đến <strong>{estimatedEndDate || '...'}</strong>).
                                            </span>
                                        ) : (
                                            <span className="font-medium text-emerald-700">
                                                Môn học đã thiết lập <strong>{totalSessions} buổi</strong>. Để trống ô này để hệ thống tự động tính ngày kết thúc dự kiến là <strong>{estimatedEndDate || '...'}</strong>.
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <p className="mt-1.5 text-xs text-gray-400">
                                        (Tùy chọn) Để trống sẽ tự động tạo lịch trong 12 tuần.
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Section 2: Lịch Học Định Kỳ Hàng Tuần (T2 .. CN) */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-2 flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                            <Clock className="h-5 w-5 text-blue-600" />
                            2. Lịch Học Định Kỳ Trong Tuần (T2, T3, T4, T5, T6, T7, CN)
                        </h2>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
                            <p>
                                Chọn các thứ trong tuần và cập nhật khung giờ học.
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                    Đã chọn: <strong className="text-emerald-700">{activeDaysCount} buổi/tuần</strong>
                                </span>
                                {totalSessions && totalSessions > 0 && activeDaysCount > 0 && (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                        Môn học: <strong>{totalSessions} buổi</strong> (~<strong>{Math.ceil(totalSessions / activeDaysCount)} tuần</strong>)
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {WEEKDAYS.map((day) => {
                                const conf = weeklyTimes[day.id];

                                return (
                                    <div
                                        key={day.id}
                                        onClick={() => toggleWeekday(day.id)}
                                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                                            conf.enabled
                                                ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                                                : 'border-gray-200 bg-white opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-900">
                                                {day.label}
                                            </span>
                                            {conf.enabled ? (
                                                <CheckSquare className="h-5 w-5 text-emerald-600" />
                                            ) : (
                                                <Square className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>

                                        {conf.enabled && (
                                            <div
                                                className="mt-3.5 space-y-1.5"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="min-w-0">
                                                        <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                                                            Bắt đầu
                                                        </label>
                                                        <input
                                                            type="time"
                                                            value={conf.start_time}
                                                            onChange={(e) =>
                                                                handleWeekdayTimeChange(day.id, 'start_time', e.target.value)
                                                            }
                                                            className="w-full min-w-0 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-mono font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden"
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                                                            Kết thúc
                                                        </label>
                                                        <input
                                                            type="time"
                                                            value={conf.end_time}
                                                            onChange={(e) =>
                                                                handleWeekdayTimeChange(day.id, 'end_time', e.target.value)
                                                            }
                                                            className="w-full min-w-0 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs font-mono font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Section 3: Ngày Nghỉ Cố Định & Nghỉ Lễ Việt Nam */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                                    <Coffee className="h-5 w-5 text-amber-600" />
                                    3. Cấu Hình Ngày Nghỉ & Nghỉ Lễ Việt Nam
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Hệ thống sẽ tự động bỏ qua các ngày nghỉ này khi tái sinh danh sách ca học.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                icon={<Plus className="h-4 w-4 text-amber-600" />}
                                onClick={handleAddOffSession}
                            >
                                Thêm Ngày Nghỉ
                            </Button>
                        </div>

                        {/* Holiday Toggle */}
                        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
                            <label className="flex cursor-pointer items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={excludeHolidays}
                                    onChange={(e) => setExcludeHolidays(e.target.checked)}
                                    className="mt-0.5 h-5 w-5 rounded-sm border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div>
                                    <span className="text-sm font-bold text-gray-900">
                                        Tự động nghỉ các ngày lễ theo lịch Việt Nam
                                    </span>
                                    <p className="mt-0.5 text-xs text-gray-600">
                                        Bao gồm: Tết Nguyên Đán, Tết Dương Lịch (1/1), Giỗ Tổ Hùng Vương (10/3 ÂL), 30/4, 1/5 và Quốc Khánh 2/9.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Custom Off Dates */}
                        {offSessions.length > 0 && (
                            <div className="space-y-3">
                                {offSessions.map((off, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center"
                                    >
                                        <div className="w-full sm:w-52">
                                            <input
                                                type="date"
                                                value={off.date}
                                                onChange={(e) =>
                                                    handleOffSessionChange(idx, 'date', e.target.value)
                                                }
                                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
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
                                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            icon={<Trash2 className="h-4 w-4" />}
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
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-bold uppercase tracking-wider text-gray-900">
                                    <CalendarPlus className="h-5 w-5 text-purple-600" />
                                    4. Thêm Ngày Giờ Học Cố Định Bổ Sung (Tùy chọn)
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Học bù, học tăng cường vào ngày cụ thể.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                icon={<Plus className="h-4 w-4 text-purple-600" />}
                                onClick={handleAddSpecificSession}
                            >
                                Thêm Buổi Học
                            </Button>
                        </div>

                        {specificSessions.length > 0 && (
                            <div className="space-y-3">
                                {specificSessions.map((spec, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-purple-50/30 p-3.5 sm:flex-row sm:items-center"
                                    >
                                        <div className="w-full sm:w-44">
                                            <input
                                                type="date"
                                                value={spec.date}
                                                onChange={(e) =>
                                                    handleSpecificSessionChange(idx, 'date', e.target.value)
                                                }
                                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-mono text-gray-900"
                                                required
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="time"
                                                value={spec.start_time}
                                                onChange={(e) =>
                                                    handleSpecificSessionChange(idx, 'start_time', e.target.value)
                                                }
                                                className="w-28 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm font-mono text-gray-900"
                                                required
                                            />
                                            <span className="text-sm text-gray-400">-</span>
                                            <input
                                                type="time"
                                                value={spec.end_time}
                                                onChange={(e) =>
                                                    handleSpecificSessionChange(idx, 'end_time', e.target.value)
                                                }
                                                className="w-28 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm font-mono text-gray-900"
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
                                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            icon={<Trash2 className="h-4 w-4" />}
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
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href="/schedules">
                            <Button variant="secondary" size="lg">
                                Hủy Bỏ
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            variant="edit"
                            size="lg"
                            isLoading={isSubmitting}
                            icon={<Save className="h-5 w-5" />}
                        >
                            {totalSessions && totalSessions > 0 && !endDate
                                ? `Cập Nhật & Đồng Bộ ${totalSessions} Ca Học`
                                : 'Cập Nhật & Đồng Bộ Ca Học'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
