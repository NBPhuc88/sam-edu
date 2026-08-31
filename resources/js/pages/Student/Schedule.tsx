import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Modal from '@/components/ui/Modal';
import {
    SESSION_STATUS_CANCELLED,
    SESSION_STATUS_COMPLETED,
    SESSION_STATUS_IN_PROGRESS,
    SESSION_STATUS_SCHEDULED,
    SESSION_STATUS_UNATTENDED,
} from '@/constants/enums';
import AppLayout from '@/layouts/AppLayout';
import { toISODateString } from '@/lib/date';
import { Head,router,usePage } from '@inertiajs/react';
import {
BookOpen,
Calendar,
CalendarDays,
ChevronLeft,
ChevronRight,
Clock,
DoorOpen,
GraduationCap,
Info,
Layers,
Users
} from 'lucide-react';
import { useState } from 'react';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface Student {
    id: number;
    full_name: string;
    student_code: string;
    phone?: string | null;
    email?: string | null;
    gender?: number | null;
    status?: number;
    center?: Center;
}

interface RoomInfo {
    id: number;
    name: string;
    code: string;
    capacity: number;
    location?: string | null;
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

interface StudentSession {
    id: number | string;
    original_session_id?: number | string;
    class_subject_id: number;
    teacher_id?: number | null;
    room_id?: number | null;
    session_date: string;
    start_time: string;
    end_time: string;
    status: number;
    change_type?: string;
    topic?: string | null;
    note?: string | null;
    session_order?: number;
    total_sessions?: number | null;
    student_count?: number;
    max_students?: number | null;
    class_name?: string;
    class_code?: string;
    subject_name?: string;
    subject_code?: string;
    teacher?: {
        id: number;
        full_name: string;
        teacher_code: string;
        phone?: string | null;
    } | null;
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
    status: number;
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
        teacher?: {
            id: number;
            full_name: string;
            teacher_code: string;
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
    student: Student;
    weekDays: WeekDay[];
    startOfWeek: string;
    endOfWeek: string;
    prevWeek: string;
    nextWeek: string;
    currentWeek: string;
    selectedDate: string;
    timeSlots: TimeSlot[];
    sessions: StudentSession[];
    recurringSchedules: RecurringSchedule[];
}

export default function StudentSchedulePage({
    student,
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
    const { auth } = usePage<any>().props;
    const isStudentUser = auth?.role === 'student';

    const [viewMode, setViewMode] = useState<'sessions' | 'recurring'>('sessions');
    const [selectedSession, setSelectedSession] = useState<StudentSession | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handleNavigateWeek = (targetDate: string) => {
        const url = isStudentUser ? '/student/schedule' : `/students/${student.id}/schedule`;
        router.get(
            url,
            { date: targetDate },
            { preserveState: true },
        );
    };

    const handleDateChange = (dateStr: string) => {
        if (dateStr) {
            handleNavigateWeek(dateStr);
        }
    };

    const handleOpenDetailModal = (session: StudentSession) => {
        setSelectedSession(session);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedSession(null);
    };

    const formatSlotTime = (t: string) => {
        if (!t) return '';
        return t.substring(0, 5);
    };

    const getSessionsForCell = (slot: TimeSlot, dateRaw: string) => {
        return sessions.filter((s) => {
            const sStart = formatSlotTime(s.start_time);
            const sEnd = formatSlotTime(s.end_time);
            const sDate = toISODateString(s.session_date);

            return sDate === dateRaw && sStart === slot.start_time && sEnd === slot.end_time;
        });
    };

    const getRecurringForCell = (slot: TimeSlot, weekdayNumber: number) => {
        return recurringSchedules.filter((rs) => {
            const rStart = formatSlotTime(rs.start_time);
            const rEnd = formatSlotTime(rs.end_time);

            return (
                Number(rs.weekday) === weekdayNumber &&
                rStart === slot.start_time &&
                rEnd === slot.end_time
            );
        });
    };

    const getSessionStatusBadge = (status: number, sessionDate?: string, startTime?: string, changeType?: string) => {
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
            case SESSION_STATUS_COMPLETED:
                return (
                    <span className="inline-flex items-center rounded-sm bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200">
                        Đã học
                    </span>
                );
            case SESSION_STATUS_IN_PROGRESS:
                return (
                    <span className="inline-flex items-center rounded-sm bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800 border border-purple-200">
                        Đang diễn ra
                    </span>
                );
            case SESSION_STATUS_UNATTENDED:
                return (
                    <span className="inline-flex items-center rounded-sm bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 border border-rose-200">
                        Chưa điểm danh
                    </span>
                );
            case SESSION_STATUS_CANCELLED:
                return (
                    <span className="inline-flex items-center rounded-sm bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800 border border-red-200">
                        Đã hủy
                    </span>
                );
            case SESSION_STATUS_SCHEDULED:
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

    return (
        <AppLayout title={`Thời Khóa Biểu - ${student.full_name}`}>
            <Head title={`Lịch học: ${student.full_name} | SAM-EDU`} />

            <div className="space-y-6 pb-12">
                {/* Top header navigation */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                            <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl flex items-center gap-2">
                                <span>Thời Khóa Biểu Học Tập</span>
                                {student.student_code && (
                                    <span className="text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                                        {student.student_code}
                                    </span>
                                )}
                            </h1>
                            <p className="text-xs text-gray-500 sm:text-sm">
                                Học sinh: <span className="font-semibold text-gray-700">{student.full_name}</span>
                                {student.center?.name && ` • ${student.center.name}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Tab Switcher */}
                        <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200">
                            <button
                                type="button"
                                onClick={() => setViewMode('sessions')}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${viewMode === 'sessions'
                                    ? 'bg-white text-emerald-800 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <CalendarDays className="h-3.5 w-3.5" />
                                <span>Lịch Học Thực Tế</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('recurring')}
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${viewMode === 'recurring'
                                    ? 'bg-white text-emerald-800 shadow-xs'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <Layers className="h-3.5 w-3.5" />
                                <span>Lịch Học Cố Định</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Week Control Bar */}
                <Card className="border-gray-200 bg-white p-4 shadow-xs">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Week Navigator */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<ChevronLeft className="h-4 w-4" />}
                                onClick={() => handleNavigateWeek(prevWeek)}
                            >
                                Tuần Trước
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleNavigateWeek(currentWeek)}
                                className={selectedDate === currentWeek ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' : ''}
                            >
                                Tuần Này
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleNavigateWeek(nextWeek)}
                            >
                                <span className="flex items-center gap-1">
                                    <span>Tuần Sau</span>
                                    <ChevronRight className="h-4 w-4" />
                                </span>
                            </Button>
                        </div>

                        {/* Date Picker Picker for Week Jump */}
                        <div className="flex items-center gap-3">
                            <div className="text-xs sm:text-sm font-semibold text-gray-700">
                                Tuần: <span className="font-mono text-emerald-700">{startOfWeek}</span> đến <span className="font-mono text-emerald-700">{endOfWeek}</span>
                            </div>
                            <div className="w-40">
                                <DatePicker
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    placeholder="Chọn ngày..."
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Main Schedule Grid Table */}
                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
                    <table className="min-w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="border-b border-gray-200 bg-slate-50/90 text-gray-700">
                                <th className="sticky left-0 z-10 w-28 bg-slate-100/95 px-3 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500 border-r border-gray-200">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                        <span>Khung Giờ</span>
                                    </div>
                                </th>
                                {weekDays.map((day) => (
                                    <th
                                        key={day.weekday_number}
                                        className={`px-3 py-3.5 font-bold text-center border-r border-gray-200 min-w-[170px] ${day.is_today
                                            ? 'bg-emerald-50 text-emerald-950 border-b-2 border-b-emerald-600'
                                            : 'text-gray-700'
                                            }`}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-extrabold">{day.weekday_label}</span>
                                            <span className={`text-2xs font-mono font-medium ${day.is_today ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                                                {day.date_formatted}
                                            </span>
                                            {day.is_today && (
                                                <span className="mt-0.5 rounded-full bg-emerald-600 px-2 py-0.2 text-[9px] font-black text-white">
                                                    Hôm Nay
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {timeSlots.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="py-12 text-center text-sm text-gray-400 italic"
                                    >
                                        Không có ca học nào trong tuần này.
                                    </td>
                                </tr>
                            ) : (
                                timeSlots.map((slot) => (
                                    <tr key={slot.label} className="hover:bg-slate-50/40 transition-colors">
                                        <td className="sticky left-0 z-10 bg-slate-50/95 px-3 py-3 font-mono font-bold text-gray-700 border-r border-gray-200 whitespace-nowrap text-2xs">
                                            <div className="flex items-center gap-1 text-emerald-700">
                                                <Clock className="h-3 w-3" />
                                                <span>{slot.start_time} - {slot.end_time}</span>
                                            </div>
                                        </td>
                                        {weekDays.map((day) => {
                                            const cellSessions = getSessionsForCell(slot, day.date_raw);
                                            const cellRecurring = getRecurringForCell(slot, day.weekday_number);

                                            return (
                                                <td
                                                    key={`${slot.label}-${day.weekday_number}`}
                                                    className={`p-1.5 align-top border-r border-gray-200 ${day.is_today ? 'bg-emerald-50/20' : ''
                                                        }`}
                                                >
                                                    {viewMode === 'sessions' ? (
                                                        <div className="space-y-1.5">
                                                            {cellSessions.map((sess) => {
                                                                const isOldRescheduled = sess.is_rescheduled_old_slot;
                                                                const isTeacherOnly = sess.change_type === 'teacher_only';

                                                                let cardBg = 'bg-emerald-50/70 border-emerald-200 text-emerald-950 hover:border-emerald-300 hover:bg-emerald-50';
                                                                if (isTeacherOnly) {
                                                                    cardBg = 'bg-purple-50/70 border-purple-200 text-purple-950 hover:border-purple-300';
                                                                } else if (isOldRescheduled) {
                                                                    cardBg = 'bg-amber-50/70 border-amber-200 text-amber-900 hover:border-amber-300';
                                                                }

                                                                return (
                                                                    <div
                                                                        key={sess.id}
                                                                        onClick={() => handleOpenDetailModal(sess)}
                                                                        className={`group cursor-pointer rounded-xl p-2.5 border transition-all duration-150 hover:shadow-md ${cardBg}`}
                                                                    >
                                                                        <div className="flex items-start justify-between gap-1 mb-1">
                                                                            <span className="font-extrabold text-xs text-gray-900 line-clamp-1">
                                                                                {sess.class_name}
                                                                            </span>
                                                                            {getSessionStatusBadge(sess.status, sess.session_date, sess.start_time, sess.change_type)}
                                                                        </div>

                                                                        <div className="text-2xs font-semibold text-emerald-800 line-clamp-1 flex items-center gap-1">
                                                                            <GraduationCap className="h-3 w-3 shrink-0 text-purple-600" />
                                                                            <span>{sess.subject_name}</span>
                                                                        </div>

                                                                        {sess.teacher && (
                                                                            <div className="text-2xs text-gray-600 line-clamp-1 flex items-center gap-1 mt-0.5">
                                                                                <Users className="h-3 w-3 shrink-0 text-blue-600" />
                                                                                <span>GV: {sess.teacher.full_name}</span>
                                                                            </div>
                                                                        )}

                                                                        {sess.room_info?.name && (
                                                                            <div className="text-2xs text-gray-500 line-clamp-1 flex items-center gap-1 mt-0.5">
                                                                                <DoorOpen className="h-3 w-3 shrink-0 text-amber-600" />
                                                                                <span>P: {sess.room_info.name}</span>
                                                                            </div>
                                                                        )}

                                                                        {sess.is_rescheduled_old_slot && sess.reschedule_info && (
                                                                            <div className="mt-1.5 rounded-sm bg-amber-100/90 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900 border border-amber-200">
                                                                                ↗ Dời sang: {sess.reschedule_info.new_date} ({sess.reschedule_info.new_start_time})
                                                                            </div>
                                                                        )}

                                                                        {sess.reschedule_from_info && (
                                                                            <div className={`mt-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold border ${sess.reschedule_from_info.change_type === 'teacher_only'
                                                                                ? 'bg-purple-100/90 text-purple-900 border-purple-200'
                                                                                : 'bg-amber-100/90 text-amber-900 border-amber-200'
                                                                                }`}>
                                                                                {sess.reschedule_from_info.change_type === 'teacher_only'
                                                                                    ? `↩ Đổi GV từ: ${sess.reschedule_from_info.old_teacher || 'GV cũ'}`
                                                                                    : `↩ Dời từ: ${sess.reschedule_from_info.old_date} (${sess.reschedule_from_info.old_start_time})`
                                                                                }
                                                                            </div>
                                                                        )}

                                                                        {sess.topic && (
                                                                            <div className="text-3xs text-gray-400 italic line-clamp-1 mt-1 border-t border-emerald-100 pt-0.5">
                                                                                {sess.topic}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1.5">
                                                            {cellRecurring.map((rs) => (
                                                                <div
                                                                    key={rs.id}
                                                                    className="rounded-xl p-2.5 bg-purple-50/70 border border-purple-200 text-purple-950"
                                                                >
                                                                    <div className="font-extrabold text-xs text-gray-900 line-clamp-1">
                                                                        {rs.class_subject?.school_class?.name || 'Lớp học'}
                                                                    </div>
                                                                    <div className="text-2xs font-semibold text-purple-800 line-clamp-1 mt-0.5">
                                                                        {rs.class_subject?.subject?.name || 'Môn học'}
                                                                    </div>
                                                                    {rs.class_subject?.teacher?.full_name && (
                                                                        <div className="text-2xs text-gray-600 line-clamp-1 mt-0.5">
                                                                            GV: {rs.class_subject.teacher.full_name}
                                                                        </div>
                                                                    )}
                                                                    {rs.room?.name && (
                                                                        <div className="text-2xs text-gray-500 line-clamp-1 mt-0.5">
                                                                            Phòng: {rs.room.name}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Session Details Modal */}
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={handleCloseDetailModal}
                    title="Thông Tin Chi Tiết Ca Học"
                    maxWidth="lg"
                    footer={
                        <div className="flex items-center justify-end gap-2 w-full">
                            <Button variant="secondary" size="sm" onClick={handleCloseDetailModal}>
                                Đóng
                            </Button>
                        </div>
                    }
                >
                    {selectedSession && (
                        <div className="space-y-4 text-sm text-gray-800">
                            {/* Header Info */}
                            <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-emerald-600 text-white rounded-lg">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-2xs font-bold uppercase text-emerald-800">Khung Giờ Học</div>
                                        <div className="text-base font-black text-emerald-950 font-mono">
                                            {formatSlotTime(selectedSession.start_time)} - {formatSlotTime(selectedSession.end_time)}
                                        </div>
                                    </div>
                                </div>
                                <div>{getSessionStatusBadge(selectedSession.status, selectedSession.session_date, selectedSession.start_time, selectedSession.change_type)}</div>
                            </div>

                            {/* Reschedule Alert if any */}
                            {selectedSession.change_type === 'teacher_only' && selectedSession.reschedule_from_info && (
                                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-1">
                                    <div className="font-bold flex items-center gap-1">
                                        <Info className="w-4 h-4 text-purple-600" />
                                        <span>Ca học này đã được đổi giáo viên phụ trách:</span>
                                    </div>
                                    <p>
                                        Giáo viên: <strong className="line-through text-red-600 font-semibold">{selectedSession.reschedule_from_info.old_teacher || 'GV cũ'}</strong>
                                        {' ➔ '}
                                        <strong className="text-emerald-700 font-bold">{selectedSession.reschedule_from_info.new_teacher || selectedSession.teacher?.full_name || 'GV mới'}</strong>
                                    </p>
                                    {selectedSession.reschedule_from_info.reason && (
                                        <p>Lý do: <em>{selectedSession.reschedule_from_info.reason}</em></p>
                                    )}
                                </div>
                            )}

                            {selectedSession.is_rescheduled_old_slot && selectedSession.reschedule_info && (
                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                                    <div className="font-bold flex items-center gap-1">
                                        <Info className="w-4 h-4 text-amber-600" />
                                        <span>Ca học này đã được dời lịch sang ngày mới:</span>
                                    </div>
                                    <p>
                                        Ngày mới: <strong className="font-mono">{selectedSession.reschedule_info.new_date}</strong> ({selectedSession.reschedule_info.new_start_time} - {selectedSession.reschedule_info.new_end_time})
                                    </p>
                                    {selectedSession.reschedule_info.new_teacher && selectedSession.reschedule_info.new_teacher !== selectedSession.reschedule_info.old_teacher && (
                                        <p>Giáo viên mới: <strong>{selectedSession.reschedule_info.new_teacher}</strong></p>
                                    )}
                                    {selectedSession.reschedule_info.reason && (
                                        <p>Lý do: <em>{selectedSession.reschedule_info.reason}</em></p>
                                    )}
                                </div>
                            )}

                            {(!selectedSession.is_rescheduled_old_slot) && selectedSession.reschedule_from_info && selectedSession.reschedule_from_info.change_type !== 'teacher_only' && (
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
                                    <div className="font-bold flex items-center gap-1">
                                        <Info className="w-4 h-4 text-blue-600" />
                                        <span>Ca học này được dời lịch từ ngày cũ sang:</span>
                                    </div>
                                    <p>
                                        Ngày cũ: <strong className="font-mono">{selectedSession.reschedule_from_info.old_date}</strong> ({selectedSession.reschedule_from_info.old_start_time} - {selectedSession.reschedule_from_info.old_end_time})
                                    </p>
                                    {selectedSession.reschedule_from_info.old_teacher && selectedSession.reschedule_from_info.old_teacher !== selectedSession.teacher?.full_name && (
                                        <p>Giáo viên trước đó: <strong>{selectedSession.reschedule_from_info.old_teacher}</strong></p>
                                    )}
                                    {selectedSession.reschedule_from_info.reason && (
                                        <p>Lý do: <em>{selectedSession.reschedule_from_info.reason}</em></p>
                                    )}
                                </div>
                            )}

                            {/* Grid Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                    <div className="text-2xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Lớp Học</span>
                                    </div>
                                    <div className="font-bold text-gray-900 text-sm">{selectedSession.class_name}</div>
                                    {selectedSession.class_code && (
                                        <div className="font-mono text-xs text-gray-500">Mã lớp: {selectedSession.class_code}</div>
                                    )}
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                    <div className="text-2xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                        <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Môn Học</span>
                                    </div>
                                    <div className="font-bold text-gray-900 text-sm">{selectedSession.subject_name}</div>
                                    {selectedSession.subject_code && (
                                        <div className="font-mono text-xs text-gray-500">Mã môn: {selectedSession.subject_code}</div>
                                    )}
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                    <div className="text-2xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Giáo Viên Giảng Dạy</span>
                                    </div>
                                    <div className="font-bold text-gray-900 text-sm">{selectedSession.teacher?.full_name || 'Chưa phân công'}</div>
                                    {selectedSession.teacher?.phone && (
                                        <div className="font-mono text-xs text-gray-500">SĐT: {selectedSession.teacher.phone}</div>
                                    )}
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                    <div className="text-2xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                        <DoorOpen className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Phòng Học</span>
                                    </div>
                                    <div className="font-bold text-gray-900 text-sm">{selectedSession.room_info?.name || 'Chưa xếp phòng'}</div>
                                    {selectedSession.room_info?.location && (
                                        <div className="text-xs text-gray-500">Vị trí: {selectedSession.room_info.location}</div>
                                    )}
                                </div>
                            </div>

                            {selectedSession.topic && (
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                    <div className="text-2xs font-semibold uppercase text-gray-500">Chủ đề bài học / Nội dung</div>
                                    <div className="text-sm font-medium text-gray-900">{selectedSession.topic}</div>
                                </div>
                            )}

                            {selectedSession.note && (
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                    <div className="text-2xs font-semibold uppercase text-gray-500">Ghi chú thêm</div>
                                    <div className="text-sm text-gray-700">{selectedSession.note}</div>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </AppLayout>
    );
}
