import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    DoorOpen,
    GraduationCap,
    Info,
    Printer,
    Users,
    CheckSquare,
    BookOpen,
    Layers,
} from 'lucide-react';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Modal from '@/components/ui/Modal';
import { usePermission } from '@/hooks/usePermission';
import AppLayout from '@/layouts/AppLayout';
import { toISODateString, formatTime } from '@/lib/date';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface Teacher {
    id: number;
    full_name: string;
    teacher_code: string;
    phone?: string | null;
    email?: string | null;
    specialization?: string | null;
    status?: string | number;
    center?: Center;
}

interface RoomEquipment {
    name: string;
    quantity: number;
    unit?: string | null;
    status: string;
}

interface RoomInfo {
    id: number;
    name: string;
    code: string;
    capacity: number;
    location?: string | null;
    equipments?: RoomEquipment[];
}

interface RescheduleInfo {
    change_type?: string;
    new_date?: string;
    new_start_time?: string;
    new_end_time?: string;
    old_date?: string;
    old_start_time?: string;
    old_end_time?: string;
    new_teacher?: string | null;
    old_teacher?: string | null;
    new_room?: string | null;
    old_room?: string | null;
    reason?: string | null;
}

interface TeacherSession {
    id: number | string;
    class_subject_id: number;
    class_schedule_id: number | null;
    teacher_id: number;
    room_id: number | null;
    session_date: string;
    start_time: string;
    end_time: string;
    status: string;
    change_type?: string;
    topic: string | null;
    note: string | null;
    session_order?: number;
    total_sessions?: number | null;
    student_count?: number;
    max_students?: number | null;
    class_name?: string;
    class_code?: string;
    subject_name?: string;
    subject_code?: string;
    room_info?: RoomInfo | null;
    is_rescheduled_old_slot?: boolean;
    is_rescheduled_new_slot?: boolean;
    reschedule_info?: RescheduleInfo;
    reschedule_from_info?: RescheduleInfo;
}

interface WeekDay {
    weekday_number: number;
    weekday_label: string;
    date_formatted: string;
    date_raw: string;
    is_today: boolean;
}

interface TimeSlot {
    start_time: string;
    end_time: string;
    label: string;
}

interface RecurringSchedule {
    id: number;
    class_subject_id: number;
    weekday: number;
    start_time: string;
    end_time: string;
    room_id: number | null;
    status: string;
    class_subject?: {
        school_class?: {
            id: number;
            name: string;
            code: string;
            students_count?: number;
        };
        subject?: {
            id: number;
            name: string;
            code: string;
        };
    };
    room?: {
        id: number;
        name: string;
        code: string;
        capacity: number;
        location?: string;
    };
}

interface Props {
    teacher: Teacher;
    weekDays: WeekDay[];
    startOfWeek: string;
    endOfWeek: string;
    prevWeek: string;
    nextWeek: string;
    currentWeek: string;
    selectedDate: string;
    timeSlots: TimeSlot[];
    sessions: TeacherSession[];
    recurringSchedules: RecurringSchedule[];
}

export default function TeacherSchedulePage({
    teacher,
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
}: Props) {
    const { auth } = usePage().props as any;
    const { can } = usePermission();
    const role = auth?.role;
    const isAdmin = role === 'admin' || !role;
    const canReschedule = isAdmin || can('sessions.edit') || can('schedules.edit');

    const [viewMode, setViewMode] = useState<'sessions' | 'recurring'>('sessions');
    const [selectedSession, setSelectedSession] = useState<TeacherSession | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handleNavigateWeek = (targetDate: string) => {
        router.get(
            `/teachers/${teacher.id}/schedule`,
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

    const handleOpenDetailModal = (session: TeacherSession) => {
        setSelectedSession(session);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedSession(null);
    };

    const getRealSessionId = (sessionId: number | string): number => {
        if (typeof sessionId === 'number') {
            return sessionId;
        }
        const match = String(sessionId).match(/rescheduled-old-(\d+)/);
        if (match) {
            return parseInt(match[1], 10);
        }

        return parseInt(String(sessionId), 10) || 0;
    };

    const handleGoToAttendance = (sessionId: number | string) => {
        const realId = getRealSessionId(sessionId);
        if (realId > 0) {
            router.get(`/attendance/session/${realId}`);
        }
    };

    const handleGoToReschedule = (sessionId: number | string) => {
        const realId = getRealSessionId(sessionId);
        if (realId > 0) {
            router.get(`/sessions/${realId}?action=reschedule`);
        }
    };

    const formatTime = (t: string) => {
        if (!t) {
            return '';
        }

        return t.substring(0, 5);
    };

    const getSessionsForCell = (slot: TimeSlot, dateRaw: string) => {
        return sessions.filter((s) => {
            const sStart = formatTime(s.start_time);
            const sEnd = formatTime(s.end_time);
            const sDate = toISODateString(s.session_date);

            return sDate === dateRaw && sStart === slot.start_time && sEnd === slot.end_time;
        });
    };

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

    const getSessionStatusBadge = (status: string, sessionDate?: string, startTime?: string, changeType?: string) => {
        if (changeType === 'teacher_only') {
            return (
                <span className="inline-flex items-center rounded-sm bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800 border border-purple-200">
                    Đã đổi GV
                </span>
            );
        }

        const todayIso = new Date().toISOString().split('T')[0];
        const isPast = sessionDate && toISODateString(sessionDate) < todayIso;

        switch (status) {
            case 'completed':
                return (
                    <span className="inline-flex items-center rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                        Đã dạy
                    </span>
                );
            case 'in_progress':
                return (
                    <span className="inline-flex items-center rounded-sm bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800 border border-purple-200">
                        Đang diễn ra
                    </span>
                );
            case 'unattended':
                return (
                    <span className="inline-flex items-center rounded-sm bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 border border-rose-200">
                        Chưa điểm danh
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center rounded-sm bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800 border border-red-200">
                        Nghỉ dạy
                    </span>
                );
            case 'rescheduled':
                return (
                    <span className="inline-flex items-center rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                        Đã đổi lịch
                    </span>
                );
            case 'scheduled':
            default:
                if (isPast) {
                    return (
                        <span className="inline-flex items-center rounded-sm bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 border border-rose-200">
                            Chưa điểm danh
                        </span>
                    );
                }
                if (sessionDate && toISODateString(sessionDate) === todayIso && startTime) {
                    const now = new Date();
                    const [h, m] = startTime.split(':').map(Number);
                    const sessionStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
                    const diffMin = (sessionStart.getTime() - now.getTime()) / (1000 * 60);
                    if (diffMin >= 0 && diffMin <= 10) {
                        return (
                            <span className="inline-flex items-center rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                                Sắp diễn ra
                            </span>
                        );
                    }
                }
                return (
                    <span className="inline-flex items-center rounded-sm bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 border border-blue-200">
                        Dự kiến
                    </span>
                );
        }
    };

    const getSessionCardStyle = (status: string, sessionDate?: string, isOldSlot?: boolean, changeType?: string) => {
        if (changeType === 'teacher_only') {
            return {
                container: 'border-purple-200 bg-purple-50/80 hover:border-purple-400 hover:bg-purple-100/70 shadow-2xs',
                subjectText: 'text-purple-900',
                subjectIcon: 'text-purple-600',
                orderText: 'text-purple-800',
            };
        }

        if (isOldSlot) {
            return {
                container: 'border-amber-300 bg-amber-50/80 hover:border-amber-400 hover:bg-amber-100/70 shadow-2xs',
                subjectText: 'text-amber-900',
                subjectIcon: 'text-amber-600',
                orderText: 'text-amber-800',
            };
        }

        const todayIso = new Date().toISOString().split('T')[0];
        const isPast = sessionDate && toISODateString(sessionDate) < todayIso;

        switch (status) {
            case 'completed':
                return {
                    container: 'border-emerald-200 bg-emerald-50/80 hover:border-emerald-400 hover:bg-emerald-100/70 shadow-2xs',
                    subjectText: 'text-emerald-900',
                    subjectIcon: 'text-emerald-600',
                    orderText: 'text-emerald-800',
                };
            case 'in_progress':
                return {
                    container: 'border-purple-300 bg-purple-50/80 hover:border-purple-400 hover:bg-purple-100/70 shadow-2xs ring-1 ring-purple-300',
                    subjectText: 'text-purple-900',
                    subjectIcon: 'text-purple-600',
                    orderText: 'text-purple-800',
                };
            case 'unattended':
                return {
                    container: 'border-rose-200 bg-rose-50/80 hover:border-rose-300 hover:bg-rose-100/70 shadow-2xs',
                    subjectText: 'text-rose-900',
                    subjectIcon: 'text-rose-600',
                    orderText: 'text-rose-800',
                };
            case 'cancelled':
                return {
                    container: 'border-red-200 bg-red-50/80 hover:border-red-400 hover:bg-red-100/70 shadow-2xs',
                    subjectText: 'text-red-900',
                    subjectIcon: 'text-red-600',
                    orderText: 'text-red-800',
                };
            case 'rescheduled':
                return {
                    container: 'border-amber-300 bg-amber-50/80 hover:border-amber-400 hover:bg-amber-100/70 shadow-2xs',
                    subjectText: 'text-amber-900',
                    subjectIcon: 'text-amber-600',
                    orderText: 'text-amber-800',
                };
            case 'scheduled':
            default:
                if (isPast) {
                    return {
                        container: 'border-rose-200 bg-rose-50/80 hover:border-rose-300 hover:bg-rose-100/70 shadow-2xs',
                        subjectText: 'text-rose-900',
                        subjectIcon: 'text-rose-600',
                        orderText: 'text-rose-800',
                    };
                }
                return {
                    container: 'border-blue-200 bg-blue-50/80 hover:border-blue-400 hover:bg-blue-100/70 shadow-2xs',
                    subjectText: 'text-blue-900',
                    subjectIcon: 'text-blue-600',
                    orderText: 'text-blue-800',
                };
        }
    };

    return (
        <AppLayout title={`Lịch Dạy Giáo Viên: ${teacher.full_name} - SAM Digital`}>
            <Head title={`Lịch Dạy: ${teacher.full_name}`} />

            <div className="space-y-6">
                {/* Top Header & Navigation */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div className="flex items-center gap-3">
                        <Link href="/teachers">
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<ArrowLeft className="h-4 w-4" />}
                            >
                                Danh Sách Giáo Viên
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                    Lịch Dạy: {teacher.full_name}
                                </h1>
                                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {teacher.teacher_code}
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Trung tâm: <strong className="text-gray-700">{teacher.center?.name || 'Hệ thống'}</strong>
                                {teacher.specialization && ` • Chuyên môn: ${teacher.specialization}`}
                                {teacher.phone && ` • SĐT: ${teacher.phone}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/teachers/${teacher.id}/edit`}>
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<GraduationCap className="h-4 w-4" />}
                                title="Chỉnh sửa thông tin giáo viên"
                            >
                                Hồ Sơ Giáo Viên
                            </Button>
                        </Link>
                        {/* <Button
                            variant="secondary"
                            size="sm"
                            icon={<Printer className="h-4 w-4" />}
                            onClick={handlePrint}
                            title="In lịch dạy tuần này"
                        >
                            In Lịch Dạy
                        </Button> */}
                    </div>
                </div>

                {/* Print Title Header (Visible only when printing) */}
                <div className="hidden print:block text-center border-b pb-4 mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        LỊCH GIẢNG DẠY GIÁO VIÊN: {teacher.full_name.toUpperCase()}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Mã GV: {teacher.teacher_code} | Trung tâm: {teacher.center?.name || 'Hệ thống'} | Tuần: {startOfWeek} đến {endOfWeek}
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
                                Ca dạy trong tuần
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

                                            {/* RIGHT COLUMNS: HIỂN THỊ LỚP HỌC (THAY VÌ MÔN HỌC) */}
                                            {weekDays.map((day) => {
                                                const cellSessions = getSessionsForCell(slot, day.date_raw);
                                                const cellRecurring = getRecurringForCell(slot, day.weekday_number);

                                                return (
                                                    <td
                                                        key={`${slot.label}-${day.weekday_number}`}
                                                        className={`min-w-[175px] max-w-[230px] border-r border-gray-200 p-2.5 align-top ${day.is_today ? 'bg-emerald-50/20' : ''
                                                            }`}
                                                    >
                                                        {viewMode === 'sessions' ? (
                                                            /* Sessions View (Ca dạy cụ thể - click mở popup) */
                                                            cellSessions && cellSessions.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {cellSessions.map((session) => {
                                                                        const cardStyle = getSessionCardStyle(session.status, session.session_date, session.is_rescheduled_old_slot, session.change_type);

                                                                        return (
                                                                            <div
                                                                                key={session.id}
                                                                                onClick={() => handleOpenDetailModal(session)}
                                                                                className={`group relative cursor-pointer rounded-lg border p-2.5 transition-all ${cardStyle.container}`}
                                                                                title="Click để xem thông tin lớp, đổi lịch hoặc điểm danh"
                                                                            >
                                                                                {/* CLASS NAME AS PRIMARY HEADER */}
                                                                                <div className="flex items-start justify-between gap-1">
                                                                                    <div className="font-bold text-gray-900 leading-tight">
                                                                                        {session.class_name}
                                                                                    </div>
                                                                                    {getSessionStatusBadge(session.status, session.session_date, session.start_time, session.change_type)}
                                                                                </div>

                                                                                {/* Subject name below class */}
                                                                                <div className={`mt-1 flex items-center gap-1 text-xs font-semibold ${cardStyle.subjectText}`}>
                                                                                    <BookOpen className={`h-3 w-3 shrink-0 ${cardStyle.subjectIcon}`} />
                                                                                    <span className="truncate">{session.subject_name}</span>
                                                                                </div>

                                                                                {/* Class code & Session info */}
                                                                                <div className="mt-2 space-y-1 text-xs text-gray-600">
                                                                                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                                                                                        <span className="flex items-center gap-1">
                                                                                            <Users className="h-3 w-3 text-gray-400" />
                                                                                            {session.student_count ?? 0} HS
                                                                                        </span>
                                                                                        {session.session_order && (
                                                                                            <span className={`font-medium ${cardStyle.orderText}`}>
                                                                                                Buổi {session.session_order}{session.total_sessions ? `/${session.total_sessions}` : ''}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    {session.room_info && (
                                                                                        <div className="flex items-center gap-1 text-[11px] font-medium text-gray-600">
                                                                                            <DoorOpen className="h-3 w-3 shrink-0 text-gray-400" />
                                                                                            <span className="truncate">{session.room_info.name}</span>
                                                                                        </div>
                                                                                    )}

                                                                                    {session.is_rescheduled_old_slot && session.reschedule_info && (
                                                                                        <div className={`mt-1.5 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold border ${session.reschedule_info.change_type === 'teacher_only'
                                                                                            ? 'bg-purple-100/90 text-purple-900 border-purple-200'
                                                                                            : 'bg-amber-100/90 text-amber-900 border-amber-200'
                                                                                            }`}>
                                                                                            {session.reschedule_info.change_type === 'teacher_only'
                                                                                                ? `↗ Chuyển giao cho GV: ${session.reschedule_info.new_teacher || 'GV mới'}`
                                                                                                : `↗ Dời sang: ${session.reschedule_info.new_date} (${formatTime(session.reschedule_info.new_start_time || '')})`
                                                                                            }
                                                                                        </div>
                                                                                    )}

                                                                                    {session.reschedule_from_info && (
                                                                                        <div className={`mt-1.5 rounded-sm px-1.5 py-0.5 text-[11px] font-semibold border ${session.reschedule_from_info.change_type === 'teacher_only'
                                                                                            ? 'bg-purple-100/90 text-purple-900 border-purple-200'
                                                                                            : 'bg-amber-100/90 text-amber-900 border-amber-200'
                                                                                            }`}>
                                                                                            {session.reschedule_from_info.change_type === 'teacher_only'
                                                                                                ? `↩ Nhận bàn giao từ GV: ${session.reschedule_from_info.old_teacher || 'GV cũ'}`
                                                                                                : `↩ Dời từ: ${session.reschedule_from_info.old_date} (${formatTime(session.reschedule_from_info.old_start_time || '')})`
                                                                                            }
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
                                                                                {item.class_subject?.school_class?.name || 'Lớp học'}
                                                                            </div>
                                                                            <div className="mt-0.5 text-xs text-blue-700 font-medium">
                                                                                {item.class_subject?.subject?.name}
                                                                            </div>
                                                                            {item.room && (
                                                                                <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-600 font-medium">
                                                                                    <DoorOpen className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                                                    <span>{item.room.name}</span>
                                                                                </div>
                                                                            )}
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
                                                    Giáo viên này chưa có lịch dạy nào trong tuần
                                                </p>
                                                <p className="max-w-md text-xs text-gray-400">
                                                    Lịch dạy được tự động hiển thị theo các lớp học và môn học mà giáo viên được phân công giảng dạy.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* POPUP MODAL: CHI TIẾT CA DẠY VÀ LỚP HỌC */}
            {selectedSession && (
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseDetailModal}
                    title="Thông Tin Ca Học & Lớp Học"
                >
                    <div className="space-y-5">
                        {/* Class and Subject Header Card */}
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                                        Lớp Học Giảng Dạy
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                                        {selectedSession.class_name}
                                    </h3>
                                    <span className="inline-block mt-1 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white text-emerald-800 border border-emerald-200">
                                        Mã lớp: {selectedSession.class_code || 'N/A'}
                                    </span>
                                </div>
                                {getSessionStatusBadge(selectedSession.status, selectedSession.session_date, selectedSession.start_time, selectedSession.change_type)}
                            </div>

                            <div className="mt-3 flex items-center gap-2 border-t border-emerald-200/70 pt-3 text-sm font-semibold text-emerald-900">
                                <BookOpen className="h-4 w-4 text-emerald-700 shrink-0" />
                                <span>Môn học: {selectedSession.subject_name}</span>
                                {selectedSession.subject_code && (
                                    <span className="font-mono text-xs font-normal text-emerald-700">
                                        ({selectedSession.subject_code})
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Detailed Metrics Grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Sĩ số học sinh */}
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    <Users className="h-4 w-4 text-emerald-600" />
                                    <span>Số Lượng Học Sinh</span>
                                </div>
                                <div className="mt-2 text-2xl font-bold text-gray-900">
                                    {selectedSession.student_count}{' '}
                                    <span className="text-sm font-normal text-gray-500">
                                        học sinh {selectedSession.max_students ? `/ tối đa ${selectedSession.max_students}` : ''}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Sĩ số học sinh hiện đang ghi danh trong lớp học này.
                                </p>
                            </div>

                            {/* Buổi thứ mấy của môn học */}
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs">
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    <Layers className="h-4 w-4 text-blue-600" />
                                    <span>Tiến Độ Buổi Học</span>
                                </div>
                                <div className="mt-2 text-2xl font-bold text-blue-700">
                                    Buổi thứ {selectedSession.session_order}{' '}
                                    {selectedSession.total_sessions ? (
                                        <span className="text-sm font-normal text-gray-500">
                                            / {selectedSession.total_sessions} buổi
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Thứ tự buổi học của môn này do giáo viên phụ trách.
                                </p>
                            </div>
                        </div>

                        {/* Room Info Section */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                                <DoorOpen className="h-4 w-4 text-amber-600" />
                                <span>Thông Tin Phòng Học</span>
                            </div>

                            {selectedSession.room_info ? (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                                        <div>
                                            <div className="text-base font-bold text-gray-900">
                                                {selectedSession.room_info.name}
                                            </div>
                                            <div className="font-mono text-xs text-gray-400">
                                                Mã phòng: {selectedSession.room_info.code}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">Sức chứa</div>
                                            <div className="font-bold text-gray-900">
                                                {selectedSession.room_info.capacity} chỗ ngồi
                                            </div>
                                        </div>
                                    </div>

                                    {selectedSession.room_info.location && (
                                        <div className="text-xs text-gray-600">
                                            <strong>Vị trí:</strong> {selectedSession.room_info.location}
                                        </div>
                                    )}

                                    {/* Equipments list */}
                                    {selectedSession.room_info.equipments && selectedSession.room_info.equipments.length > 0 ? (
                                        <div>
                                            <div className="text-xs font-semibold text-gray-700 mb-1.5">
                                                Trang thiết bị phòng:
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectedSession.room_info.equipments.map((eq, eqIdx) => (
                                                    <span
                                                        key={eqIdx}
                                                        className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                                                    >
                                                        <strong>{eq.name}</strong> ({eq.quantity} {eq.unit || 'cái'})
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">
                                            Chưa ghi nhận thông tin trang thiết bị phòng.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
                                    Chưa xếp phòng học cho ca dạy này.
                                </div>
                            )}
                        </div>

                        {/* Reschedule Info Alerts if applicable */}
                        {selectedSession.is_rescheduled_old_slot && selectedSession.reschedule_info && (
                            <div className="rounded-lg border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-900 space-y-1">
                                <div className="font-bold flex items-center gap-1.5">
                                    <span>⚠️ Ca học này đã được dời sang lịch khác:</span>
                                </div>
                                <div>
                                    {selectedSession.reschedule_info.change_type === 'teacher_only'
                                        ? `Chuyển giao cho GV: ${selectedSession.reschedule_info.new_teacher || 'GV mới'}`
                                        : `Đã dời sang ngày: ${selectedSession.reschedule_info.new_date} (${formatTime(selectedSession.reschedule_info.new_start_time || '')} - ${formatTime(selectedSession.reschedule_info.new_end_time || '')})`
                                    }
                                </div>
                                {selectedSession.reschedule_info.reason && (
                                    <div className="text-amber-800">
                                        <em>Lý do:</em> {selectedSession.reschedule_info.reason}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedSession.reschedule_from_info && (
                            <div className="rounded-lg border border-purple-200 bg-purple-50/90 p-3.5 text-xs text-purple-900 space-y-1">
                                <div className="font-bold flex items-center gap-1.5">
                                    <span>ℹ️ Thông tin tiếp nhận ca học:</span>
                                </div>
                                <div>
                                    {selectedSession.reschedule_from_info.change_type === 'teacher_only'
                                        ? `Nhận bàn giao từ GV: ${selectedSession.reschedule_from_info.old_teacher || 'GV cũ'}`
                                        : `Dời từ ngày cũ: ${selectedSession.reschedule_from_info.old_date} (${formatTime(selectedSession.reschedule_from_info.old_start_time || '')} - ${formatTime(selectedSession.reschedule_from_info.old_end_time || '')})`
                                    }
                                </div>
                                {selectedSession.reschedule_from_info.reason && (
                                    <div className="text-purple-800">
                                        <em>Lý do:</em> {selectedSession.reschedule_from_info.reason}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Session Time & Notes */}
                        <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 text-xs text-gray-700 space-y-2">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span>
                                    <strong>Thời gian:</strong> {selectedSession.session_date} ({formatTime(selectedSession.start_time)} - {formatTime(selectedSession.end_time)})
                                </span>
                            </div>
                            {selectedSession.topic && (
                                <div className="flex items-start gap-2">
                                    <BookOpen className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Chủ đề bài học:</strong> {selectedSession.topic}
                                    </span>
                                </div>
                            )}
                            {selectedSession.note && (
                                <div className="flex items-start gap-2">
                                    <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                                    <span>
                                        <strong>Ghi chú:</strong> {selectedSession.note}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Modal Actions */}
                        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                onClick={handleCloseDetailModal}
                            >
                                Đóng
                            </Button>
                            {canReschedule && (
                                <Button
                                    type="button"
                                    variant="edit"
                                    size="md"
                                    icon={<Calendar className="h-4 w-4" />}
                                    onClick={() => handleGoToReschedule(selectedSession.id)}
                                >
                                    Đổi Lịch Dạy
                                </Button>
                            )}
                            {['in_progress', 'completed', 'unattended'].includes(selectedSession.status) ? (
                                <Button
                                    type="button"
                                    variant="success"
                                    size="md"
                                    icon={<CheckSquare className="h-4 w-4" />}
                                    onClick={() => handleGoToAttendance(selectedSession.id)}
                                >
                                    Điểm Danh Ca Học
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="md"
                                    disabled
                                    title="Chỉ có thể điểm danh khi buổi học đang diễn ra hoặc đã kết thúc"
                                    icon={<CheckSquare className="h-4 w-4 text-gray-400" />}
                                    className="opacity-60 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-400"
                                >
                                    Điểm Danh Ca Học
                                </Button>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </AppLayout>
    );
}
