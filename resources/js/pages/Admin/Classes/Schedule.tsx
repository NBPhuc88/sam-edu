import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    DoorOpen,
    GraduationCap,
    ArrowLeft,
    Users,
    MessageSquare,
    Printer,
    Plus,
    UserCheck,
    AlertCircle,
    Info,
    CalendarDays,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import AppLayout from '@/layouts/AppLayout';
import { toISODateString, formatTime } from '@/lib/date';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface Subject {
    id: number;
    name: string;
    code: string;
    total_sessions?: number;
    duration_minutes?: number;
    tuition_fee?: number;
}

interface Teacher {
    id: number;
    full_name: string;
    teacher_code: string;
    phone?: string | null;
}

interface Room {
    id: number;
    name: string;
}

interface ClassSubject {
    id: number;
    class_id: number;
    subject_id: number;
    teacher_id: number;
    subject?: Subject;
    teacher?: Teacher;
}

interface SchoolClass {
    id: number;
    name: string;
    code: string;
    description: string | null;
    max_students: number | null;
    start_date: string | null;
    end_date: string | null;
    status: string | number;
    center?: Center;
    class_subjects?: ClassSubject[];
}

interface WeekDay {
    weekday_number: number; // 1 (Mon) to 7 (Sun)
    weekday_label: string;  // Thứ 2 ... Chủ Nhật
    date_formatted: string; // 17/08/2026
    date_raw: string;       // 2026-08-17
    is_today: boolean;
}

interface TimeSlot {
    start_time: string; // 08:00
    end_time: string;   // 09:30
    label: string;      // 08:00 - 09:30
}

interface RescheduleInfo {
    new_date?: string;
    new_start_time?: string;
    new_end_time?: string;
    old_date?: string;
    old_start_time?: string;
    old_end_time?: string;
    reason?: string | null;
}

interface ClassSession {
    id: number | string;
    class_subject_id: number;
    class_schedule_id: number | null;
    teacher_id: number;
    room_id: number | null;
    session_date: string;
    start_time: string;
    end_time: string;
    status: string;
    topic: string | null;
    note: string | null;
    is_rescheduled_old_slot?: boolean;
    is_rescheduled_new_slot?: boolean;
    reschedule_info?: RescheduleInfo;
    reschedule_from_info?: RescheduleInfo;
    class_subject?: ClassSubject;
    teacher?: Teacher;
    room?: Room;
}

interface RecurringSchedule {
    id: number;
    class_subject_id: number;
    weekday: number;
    start_time: string;
    end_time: string;
    room_id: number | null;
    status: string;
    class_subject?: ClassSubject;
    room?: Room;
}

interface Props {
    schoolClass: SchoolClass;
    weekDays: WeekDay[];
    startOfWeek: string;
    endOfWeek: string;
    prevWeek: string;
    nextWeek: string;
    currentWeek: string;
    selectedDate: string;
    timeSlots: TimeSlot[];
    sessions: ClassSession[];
    recurringSchedules: RecurringSchedule[];
    isTeacher?: boolean;
}

export default function ClassSchedulePage({
    schoolClass,
    weekDays = [],
    startOfWeek,
    endOfWeek,
    prevWeek,
    nextWeek,
    currentWeek,
    selectedDate,
    timeSlots = [],
    sessions = [],
    recurringSchedules = [],
    isTeacher = false,
}: Props) {
    const [viewMode, setViewMode] = useState<'sessions' | 'recurring'>('sessions');

    const handleNavigateWeek = (targetDate: string) => {
        router.get(
            `/classes/${schoolClass.id}/schedule`,
            { date: targetDate },
            { preserveState: true },
        );
    };

    const handleDateChange = (dateStr: string) => {
        if (dateStr) {
            handleNavigateWeek(dateStr);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusBadge = (status: string | number) => {
        const s = String(status);

        switch (s) {
            case '1':
            case 'active':
            case 'completed':
                return <Badge variant="active">Đang mở lớp</Badge>;
            case '2':
                return <Badge variant="pending">Đã hoàn thành</Badge>;
            case '0':
            case 'inactive':
                return <Badge variant="expired">Tạm dừng / Đóng</Badge>;
            default:
                return <Badge variant="info">{s}</Badge>;
        }
    };

    const getSessionStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                        Đã học
                    </span>
                );
            case 'planned':
            case 'active':
            case 'scheduled':
                return (
                    <span className="inline-flex items-center rounded-sm bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 border border-blue-200">
                        Dự kiến
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center rounded-sm bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800 border border-red-200">
                        Nghỉ học
                    </span>
                );
            case 'rescheduled':
                return (
                    <span className="inline-flex items-center rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                        Đã đổi lịch
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700 border border-gray-200">
                        {status}
                    </span>
                );
        }
    };

    const getSessionCardStyle = (status: string, isOldSlot?: boolean) => {
        if (isOldSlot) {
            return {
                container: 'border-amber-300 bg-amber-50/80 hover:border-amber-400 hover:bg-amber-100/70 shadow-2xs',
                teacherText: 'text-amber-900',
                teacherIcon: 'text-amber-600',
            };
        }

        switch (status) {
            case 'completed':
                return {
                    container: 'border-emerald-200 bg-emerald-50/80 hover:border-emerald-400 hover:bg-emerald-100/70 shadow-2xs',
                    teacherText: 'text-emerald-900',
                    teacherIcon: 'text-emerald-600',
                };
            case 'planned':
            case 'active':
            case 'scheduled':
                return {
                    container: 'border-blue-200 bg-blue-50/80 hover:border-blue-400 hover:bg-blue-100/70 shadow-2xs',
                    teacherText: 'text-blue-900',
                    teacherIcon: 'text-blue-600',
                };
            case 'cancelled':
                return {
                    container: 'border-red-200 bg-red-50/80 hover:border-red-400 hover:bg-red-100/70 shadow-2xs',
                    teacherText: 'text-red-900',
                    teacherIcon: 'text-red-600',
                };
            case 'rescheduled':
                return {
                    container: 'border-amber-300 bg-amber-50/80 hover:border-amber-400 hover:bg-amber-100/70 shadow-2xs',
                    teacherText: 'text-amber-900',
                    teacherIcon: 'text-amber-600',
                };
            default:
                return {
                    container: 'border-gray-200 bg-gray-50/80 hover:border-gray-300 hover:bg-gray-100/70 shadow-2xs',
                    teacherText: 'text-gray-800',
                    teacherIcon: 'text-gray-500',
                };
        }
    };

    // Format time helpers (e.g. "08:00:00" -> "08:00")
    const formatTime = (t: string) => {
        if (!t) {
            return '';
        }

        return t.substring(0, 5);
    };

    // Helper: Find sessions for a given timeSlot and date
    const getSessionsForCell = (slot: TimeSlot, dateRaw: string) => {
        return sessions.filter((s) => {
            const sStart = formatTime(s.start_time);
            const sEnd = formatTime(s.end_time);
            const sDate = toISODateString(s.session_date);

            return sDate === dateRaw && sStart === slot.start_time && sEnd === slot.end_time;
        });
    };

    // Helper: Find recurring schedule for a given timeSlot and weekday
    const getRecurringForCell = (slot: TimeSlot, weekdayNumber: number) => {
        return recurringSchedules.filter((rs) => {
            const rStart = formatTime(rs.start_time);
            const rEnd = formatTime(rs.end_time);

            return (
                Number(rs.weekday) === weekdayNumber &&
                rStart === slot.start_time &&
                rEnd === slot.end_time
            );
        });
    };

    return (
        <AppLayout title={`Lịch Học ${schoolClass.name} - SAM Digital`}>
            <Head title={`Lịch Học: ${schoolClass.name}`} />

            <div className="space-y-6">
                {/* Top Action & Navigation Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div className="flex items-center gap-3">
                        <Link href="/classes">
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<ArrowLeft className="h-4 w-4" />}
                            >
                                Danh Sách Lớp
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                    Thời Khóa Biểu: {schoolClass.name}
                                </h1>
                                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {schoolClass.code}
                                </span>
                                {getStatusBadge(schoolClass.status)}
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Trung tâm: <strong className="text-gray-700">{schoolClass.center?.name || 'N/A'}</strong>
                                {schoolClass.start_date && ` • Khai giảng: ${schoolClass.start_date}`}
                                {schoolClass.end_date && ` • Kết thúc: ${schoolClass.end_date}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/classes/${schoolClass.id}/students`}>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<Users className="h-4 w-4" />}
                                title="Danh sách học sinh của lớp"
                            >
                                Học Sinh
                            </Button>
                        </Link>
                        <Link href={`/classes/${schoolClass.id}/chat`}>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
                                title="Nhóm chat lớp"
                            >
                                Chat
                            </Button>
                        </Link>
                        {!isTeacher && (
                            <Link href={`/schedules/create`}>
                                <Button
                                    variant="success"
                                    size="sm"
                                    icon={<Plus className="h-4 w-4" />}
                                    title="Thêm lịch học hoặc ca học mới"
                                >
                                    Thêm Lịch Học
                                </Button>
                            </Link>
                        )}
                        {/* <Button
                            variant="secondary"
                            size="sm"
                            icon={<Printer className="h-4 w-4" />}
                            onClick={handlePrint}
                            title="In thời khóa biểu"
                        >
                            In Lịch
                        </Button> */}
                    </div>
                </div>

                {/* Print Title Header (Visible only when printing) */}
                <div className="hidden print:block text-center border-b pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        THỜI KHÓA BIỂU LỚP HỌC: {schoolClass.name.toUpperCase()}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Mã lớp: {schoolClass.code} | Trung tâm: {schoolClass.center?.name || 'Hệ thống'} | Tuần: {startOfWeek} đến {endOfWeek}
                    </p>
                </div>

                {/* Week Control & View Mode Toolbar */}
                <Card className="border-gray-200 bg-white p-4 shadow-xs print:hidden">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Week Navigator */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<ChevronLeft className="h-4 w-4" />}
                                onClick={() => handleNavigateWeek(prevWeek)}
                            >
                                Tuần Trước
                            </Button>
                            <Button
                                variant={selectedDate === currentWeek ? 'success' : 'secondary'}
                                size="sm"
                                icon={<Calendar className="h-4 w-4" />}
                                onClick={() => handleNavigateWeek(currentWeek)}
                            >
                                Tuần Này
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<ChevronRight className="h-4 w-4" />}
                                onClick={() => handleNavigateWeek(nextWeek)}
                            >
                                Tuần Sau
                            </Button>

                            <div className="ml-2 flex items-center gap-2 border-l border-gray-200 pl-3">
                                <span className="text-xs font-semibold text-gray-500">
                                    Chọn ngày:
                                </span>
                                <DatePicker
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                />
                            </div>
                        </div>

                        {/* Middle: Week Range text */}
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                            <CalendarDays className="h-5 w-5 text-emerald-600" />
                            <span>
                                Tuần từ {weekDays[0]?.date_formatted || startOfWeek} đến {weekDays[6]?.date_formatted || endOfWeek}
                            </span>
                        </div>

                        {/* Right: View mode switch */}
                        <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('sessions')}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === 'sessions'
                                    ? 'bg-white text-emerald-700 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Ca học trong tuần
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('recurring')}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${viewMode === 'recurring'
                                    ? 'bg-white text-emerald-700 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Lịch cố định hàng tuần
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Main Schedule Timetable Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                {/* ROW 1: THỨ (Top Row: Weekday) */}
                                <tr className="border-b border-gray-200 bg-slate-800 text-white">
                                    <th
                                        rowSpan={2}
                                        className="w-36 border-r border-slate-700 px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-200 bg-slate-900"
                                    >
                                        <div className="flex flex-col items-center justify-center gap-1">
                                            <Clock className="h-4 w-4 text-emerald-400" />
                                            <span>Thời Gian</span>
                                            <span className="text-[10px] font-normal text-slate-400">
                                                (Bắt đầu - Kết thúc)
                                            </span>
                                        </div>
                                    </th>
                                    {weekDays.map((day) => (
                                        <th
                                            key={day.weekday_number}
                                            className={`border-r border-slate-700 px-3 py-2 text-center text-sm font-bold tracking-wide transition-colors ${day.is_today
                                                ? 'bg-emerald-700 text-white'
                                                : 'text-slate-100'
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span>{day.weekday_label}</span>
                                                {day.is_today && (
                                                    <span className="rounded-full bg-emerald-500 px-1.5 py-0.2 text-[10px] font-bold uppercase text-white shadow-xs">
                                                        Hôm nay
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>

                                {/* ROW 2: NGÀY THÁNG (Second Row: Dates) */}
                                <tr className="border-b-2 border-gray-300 bg-slate-100 text-gray-700">
                                    {weekDays.map((day) => (
                                        <th
                                            key={`date-${day.weekday_number}`}
                                            className={`border-r border-gray-200 px-3 py-2 text-center text-xs font-mono font-bold ${day.is_today
                                                ? 'bg-emerald-50 text-emerald-800'
                                                : 'text-gray-600'
                                                }`}
                                        >
                                            {day.date_formatted}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200 bg-white">
                                {timeSlots && timeSlots.length > 0 ? (
                                    timeSlots.map((slot, slotIdx) => (
                                        <tr
                                            key={slot.label}
                                            className={`transition-colors ${slotIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                                }`}
                                        >
                                            {/* LEFT COLUMN: THỜI GIAN BẮT ĐẦU VÀ KẾT THÚC */}
                                            <td className="border-r border-gray-200 bg-slate-50/80 px-4 py-4 text-center font-mono text-xs font-bold text-gray-900 shadow-inner">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                                                        {slot.start_time} - {slot.end_time}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* RIGHT COLUMNS: MÔN HỌC THEO TỪNG THỨ / NGÀY */}
                                            {weekDays.map((day) => {
                                                const cellSessions = getSessionsForCell(slot, day.date_raw);
                                                const cellRecurring = getRecurringForCell(slot, day.weekday_number);

                                                return (
                                                    <td
                                                        key={`${slot.label}-${day.weekday_number}`}
                                                        className={`min-w-[170px] max-w-[220px] border-r border-gray-200 p-2.5 align-top ${day.is_today ? 'bg-emerald-50/20' : ''
                                                            }`}
                                                    >
                                                        {viewMode === 'sessions' ? (
                                                            /* Sessions View (Ca học thực tế có ngày tháng) */
                                                            cellSessions && cellSessions.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {cellSessions.map((session) => {
                                                                        const cardStyle = getSessionCardStyle(session.status, session.is_rescheduled_old_slot);

                                                                        return (
                                                                            <div
                                                                                key={session.id}
                                                                                className={`group relative rounded-lg border p-2.5 transition-all ${cardStyle.container}`}
                                                                            >
                                                                                <div className="flex items-start justify-between gap-1">
                                                                                    <div className="font-bold text-gray-900 leading-tight">
                                                                                        {session.class_subject?.subject?.name || 'Môn học'}
                                                                                    </div>
                                                                                    {getSessionStatusBadge(session.status)}
                                                                                </div>

                                                                                {session.class_subject?.subject?.code && (
                                                                                    <div className="mt-0.5 font-mono text-[10px] text-gray-400">
                                                                                        Mã: {session.class_subject.subject.code}
                                                                                    </div>
                                                                                )}

                                                                                <div className="mt-2 space-y-1 text-xs text-gray-700">
                                                                                    <div className={`flex items-center gap-1.5 font-medium ${cardStyle.teacherText}`}>
                                                                                        <UserCheck className={`h-3.5 w-3.5 shrink-0 ${cardStyle.teacherIcon}`} />
                                                                                        <span className="truncate">
                                                                                            GV: {session.teacher?.full_name || session.class_subject?.teacher?.full_name || 'Chưa gán'}
                                                                                        </span>
                                                                                    </div>

                                                                                    {session.room && (
                                                                                        <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                                                                                            <DoorOpen className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                                                            <span>{session.room.name}</span>
                                                                                        </div>
                                                                                    )}

                                                                                    {session.is_rescheduled_old_slot && session.reschedule_info && (
                                                                                        <div className="mt-1.5 rounded-sm bg-amber-100/90 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200">
                                                                                            ↗ Dời sang: {session.reschedule_info.new_date} ({formatTime(session.reschedule_info.new_start_time || '')})
                                                                                        </div>
                                                                                    )}

                                                                                    {session.reschedule_from_info && (
                                                                                        <div className="mt-1.5 rounded-sm bg-amber-100/90 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200">
                                                                                            ↩ Dời từ: {session.reschedule_from_info.old_date} ({formatTime(session.reschedule_from_info.old_start_time || '')})
                                                                                        </div>
                                                                                    )}

                                                                                    {session.topic && (
                                                                                        <div className="mt-1 rounded-sm bg-white/80 px-1.5 py-0.5 text-[11px] text-gray-600 italic border border-gray-100">
                                                                                            Bài: {session.topic}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="flex h-full min-h-[70px] items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/50 p-2 text-center text-xs text-gray-300">
                                                                    -
                                                                </div>
                                                            )
                                                        ) : (
                                                            /* Recurring Weekly Template View */
                                                            cellRecurring && cellRecurring.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {cellRecurring.map((item) => (
                                                                        <div
                                                                            key={item.id}
                                                                            className="rounded-lg border border-blue-200 bg-blue-50/60 p-2.5 shadow-xs transition-all hover:border-blue-400 hover:bg-blue-50"
                                                                        >
                                                                            <div className="font-bold text-gray-900 leading-tight">
                                                                                {item.class_subject?.subject?.name || 'Môn học'}
                                                                            </div>
                                                                            {item.class_subject?.subject?.code && (
                                                                                <div className="font-mono text-[10px] text-gray-400">
                                                                                    Mã: {item.class_subject.subject.code}
                                                                                </div>
                                                                            )}
                                                                            <div className="mt-2 space-y-1 text-xs text-gray-700">
                                                                                <div className="flex items-center gap-1.5 font-medium text-blue-800">
                                                                                    <UserCheck className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                                                                                    <span className="truncate">
                                                                                        GV: {item.class_subject?.teacher?.full_name || 'Chưa gán'}
                                                                                    </span>
                                                                                </div>
                                                                                {item.room && (
                                                                                    <div className="flex items-center gap-1.5 text-gray-600 font-medium">
                                                                                        <DoorOpen className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                                                        <span>{item.room.name}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="flex h-full min-h-[70px] items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/50 p-2 text-center text-xs text-gray-300">
                                                                    -
                                                                </div>
                                                            )
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-6 py-16 text-center text-sm text-gray-500"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <Calendar className="h-12 w-12 text-gray-300" />
                                                <p className="text-base font-semibold text-gray-700">
                                                    Chưa có lịch học nào được thiết lập cho lớp này
                                                </p>
                                                <p className="max-w-md text-xs text-gray-400">
                                                    Tạo lịch học định kỳ theo thứ và thời gian để hệ thống tự động sinh thời khóa biểu và các ca học cụ thể.
                                                </p>
                                                <div className="pt-2">
                                                    <Link href="/schedules/create">
                                                        <Button
                                                            variant="success"
                                                            size="md"
                                                            icon={<Plus className="h-4.5 w-4.5" />}
                                                        >
                                                            Tạo Lịch Học Ngay
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Class Subjects & Information Summary Card */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 print:hidden">
                    {/* Left: Assigned Subjects & Teachers */}
                    <Card className="border-gray-200 bg-white p-5 shadow-xs lg:col-span-2">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 font-bold text-gray-900">
                            <GraduationCap className="h-5 w-5 text-emerald-600" />
                            <span>Môn Học & Giáo Viên Phụ Trách ({schoolClass.class_subjects?.length || 0} môn)</span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {schoolClass.class_subjects && schoolClass.class_subjects.length > 0 ? (
                                schoolClass.class_subjects.map((cs) => (
                                    <div
                                        key={cs.id}
                                        className="rounded-lg border border-gray-200 bg-slate-50 p-3.5 transition-colors hover:bg-slate-100/70"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="font-bold text-gray-900">
                                                {cs.subject?.name || 'Môn học'}
                                            </div>
                                            <span className="font-mono text-xs text-gray-400">
                                                {cs.subject?.code}
                                            </span>
                                        </div>

                                        <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                                            <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                            <span>
                                                GV: {cs.teacher?.full_name || 'Chưa phân công'}
                                                {cs.teacher?.teacher_code && ` (${cs.teacher.teacher_code})`}
                                            </span>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-200/60 pt-2">
                                            <span>Số buổi: {cs.subject?.total_sessions || '-'} buổi</span>
                                            <span>Thời lượng: {cs.subject?.duration_minutes || 90} phút</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400 italic">
                                    Lớp chưa được phân công môn học hoặc giáo viên.
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* Right: Legend & Guidance */}
                    <Card className="border-gray-200 bg-white p-5 shadow-xs">
                        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 font-bold text-gray-900">
                            <Info className="h-5 w-5 text-blue-600" />
                            <span>Chú Thích & Trạng Thái</span>
                        </div>

                        <div className="mt-4 space-y-3 text-xs text-gray-600">
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
                                <span><strong>Đã học:</strong> Ca học đã diễn ra và hoàn thành điểm danh.</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex h-3 w-3 rounded-full bg-blue-500 shrink-0" />
                                <span><strong>Dự kiến:</strong> Ca học trong tương lai theo đúng lịch.</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex h-3 w-3 rounded-full bg-amber-500 shrink-0" />
                                <span><strong>Đã đổi lịch:</strong> Ca học đã được dời sang ngày hoặc giờ khác.</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className="inline-flex h-3 w-3 rounded-full bg-red-500 shrink-0" />
                                <span><strong>Nghỉ học:</strong> Ca học bị hủy hoặc nghỉ lễ theo quy định.</span>
                            </div>

                            <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-emerald-900 border border-emerald-200/60">
                                <div className="flex items-center gap-1.5 font-bold mb-1">
                                    <AlertCircle className="h-4 w-4 text-emerald-700" />
                                    <span>Quy Chuẩn Bảng Lịch Học</span>
                                </div>
                                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                                    <li><strong>Hàng 1:</strong> Thứ trong tuần (Thứ 2 - Chủ Nhật)</li>
                                    <li><strong>Hàng 2:</strong> Ngày tháng tương ứng (dd/mm/yyyy)</li>
                                    <li><strong>Cột trái:</strong> Thời gian bắt đầu và kết thúc</li>
                                    <li><strong>Ô bảng:</strong> Môn học, giáo viên phụ trách và phòng học</li>
                                </ul>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
