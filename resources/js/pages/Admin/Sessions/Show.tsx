import { Head, Link, useForm } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    DoorOpen,
    User,
    BookOpen,
    ArrowLeft,
    ArrowRight,
    CheckSquare,
    Edit3,
    History,
    UserCheck,
    CheckCircle2,
    XCircle,
    HelpCircle,
    AlertTriangle,
    Save,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AppLayout from '@/layouts/AppLayout';
import { formatDate, formatTime, formatDateTime, toISODateString } from '@/lib/date';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface Student {
    id: number;
    student_code: string;
    full_name: string;
    gender?: string | null;
    phone?: string | null;
    parent_name?: string | null;
    parent_phone?: string | null;
}

interface Teacher {
    id: number;
    full_name: string;
    teacher_code: string;
    phone?: string | null;
    email?: string | null;
    center_id?: number;
}

interface Room {
    id: number;
    name: string;
    center_id?: number;
    capacity?: number;
}

interface Attendance {
    id: number;
    student_id: number;
    status: 'present' | 'absent' | 'late' | 'excused' | 'leave';
    note: string | null;
    student?: Student;
}

interface RescheduleLog {
    id: number;
    session_id: number;
    old_date: string | null;
    old_start_time: string | null;
    old_end_time: string | null;
    old_room_id: number | null;
    new_date: string | null;
    new_start_time: string | null;
    new_end_time: string | null;
    new_room_id: number | null;
    reason: string | null;
    changed_at: string;
    old_room?: Room;
    new_room?: Room;
    changed_by_admin?: {
        id: number;
        full_name: string;
        username: string;
    };
    changed_by_teacher?: {
        id: number;
        full_name: string;
        teacher_code: string;
    };
}

interface ClassSession {
    id: number;
    session_date: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    topic: string | null;
    note: string | null;
    teacher_id: number;
    room_id: number | null;
    teacher?: Teacher;
    room?: Room;
    class_subject?: {
        id: number;
        school_class?: {
            id: number;
            name: string;
            code: string;
            center?: Center;
            class_students?: {
                id: number;
                student?: Student;
            }[];
        };
        subject?: {
            id: number;
            name: string;
            code: string;
            total_sessions?: number | null;
            duration_minutes?: number | null;
        };
    };
    attendances?: Attendance[];
    reschedules?: RescheduleLog[];
}

interface Props {
    session: ClassSession;
    teachers: Teacher[];
    rooms: Room[];
}

export default function SessionShow({ session, teachers = [], rooms = [] }: Props) {
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [isContentModalOpen, setIsContentModalOpen] = useState(false);

    const subject = session.class_subject?.subject;
    const schoolClass = session.class_subject?.school_class;
    const currentTeacher = session.teacher;
    const currentRoom = session.room;

    // Filter teachers/rooms by current center
    const centerId = schoolClass?.center?.id;
    const availableTeachers = centerId
        ? teachers.filter((t) => !t.center_id || t.center_id === centerId)
        : teachers;
    const availableRooms = centerId
        ? rooms.filter((r) => !r.center_id || r.center_id === centerId)
        : rooms;

    // Reschedule form state
    const { data, setData, patch, processing, errors } = useForm({
        session_date: session.session_date ? toISODateString(String(session.session_date)) : '',
        start_time: session.start_time ? session.start_time.substring(0, 5) : '08:00',
        end_time: session.end_time ? session.end_time.substring(0, 5) : '09:30',
        teacher_id: session.teacher_id ? String(session.teacher_id) : '',
        room_id: session.room_id ? String(session.room_id) : '',
        status: session.status || 'scheduled',
        reason: '',
    });

    const openRescheduleModal = () => {
        setData({
            session_date: session.session_date ? toISODateString(String(session.session_date)) : '',
            start_time: session.start_time ? session.start_time.substring(0, 5) : '08:00',
            end_time: session.end_time ? session.end_time.substring(0, 5) : '09:30',
            teacher_id: session.teacher_id ? String(session.teacher_id) : '',
            room_id: session.room_id ? String(session.room_id) : '',
            status: session.status || 'scheduled',
            reason: '',
        });
        setIsRescheduleModalOpen(true);
    };

    const handleRescheduleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/sessions/${session.id}`, {
            onSuccess: () => {
                setIsRescheduleModalOpen(false);
            },
        });
    };

    // Topic & Note content form state
    const {
        data: contentData,
        setData: setContentData,
        patch: patchContent,
        processing: contentProcessing,
        errors: contentErrors,
    } = useForm({
        topic: session.topic || '',
        note: session.note || '',
    });

    const handleContentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patchContent(`/sessions/${session.id}`, {
            onSuccess: () => {
                setIsContentModalOpen(false);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <Badge variant="pending">Sắp diễn ra</Badge>;
            case 'in_progress':
                return <Badge variant="expired">Đang diễn ra</Badge>;
            case 'completed':
                return <Badge variant="active">Đã hoàn thành</Badge>;
            case 'cancelled':
                return <Badge variant="danger">Đã hủy</Badge>;
            default:
                return <Badge variant="info">{status}</Badge>;
        }
    };

    // Compile student attendance map
    const studentList: Student[] = (schoolClass?.class_students?.map((cs: { id: number; student?: Student }) => cs.student).filter(Boolean) as Student[]) || [];
    const attendanceMap = new Map<number, Attendance>();
    session.attendances?.forEach((att) => {
        attendanceMap.set(att.student_id, att);
    });

    const getAttendanceStatusBadge = (status?: string) => {
        switch (status) {
            case 'present':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Có mặt
                    </span>
                );
            case 'absent':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">
                        <XCircle className="h-3.5 w-3.5" /> Vắng mặt
                    </span>
                );
            case 'late':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                        <Clock className="h-3.5 w-3.5" /> Đi muộn
                    </span>
                );
            case 'excused':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> Có phép
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                        <HelpCircle className="h-3.5 w-3.5" /> Chưa điểm danh
                    </span>
                );
        }
    };

    return (
        <AppLayout title={`Chi Tiết Buổi Học #${session.id} - SAM Digital`}>
            <Head title={`Buổi Học #${session.id} - ${subject?.name || 'Môn Học'}`} />

            <div className="space-y-6">
                {/* Header Top Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/sessions">
                            <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                            >
                                <ArrowLeft className="h-4.5 w-4.5" />
                            </button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                    Buổi Học: {subject?.name ?? 'Môn Học'}
                                </h1>
                                {getStatusBadge(session.status)}
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">
                                Lớp: <span className="font-semibold text-gray-800">{schoolClass?.name}</span> ({schoolClass?.code}) · {schoolClass?.center?.name}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="secondary"
                            size="md"
                            icon={<BookOpen className="h-4.5 w-4.5 text-emerald-600" />}
                            onClick={() => setIsContentModalOpen(true)}
                        >
                            Chủ Đề & Ghi Chú
                        </Button>

                        <Button
                            variant="edit"
                            size="md"
                            icon={<Edit3 className="h-4.5 w-4.5" />}
                            onClick={openRescheduleModal}
                        >
                            Đổi Lịch / Phân Công Lại
                        </Button>

                        <Link href={`/attendance/session/${session.id}`}>
                            <Button
                                variant="success"
                                size="md"
                                icon={<CheckSquare className="h-4.5 w-4.5" />}
                            >
                                Điểm Danh Buổi Này
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Session Key Info Grid */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                    {/* Time & Date */}
                    <Card className="border border-gray-100 p-5 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-gray-400">
                                    Thời Gian Học
                                </div>
                                <div className="text-sm font-bold text-gray-900">
                                    {formatDate(session.session_date)}
                                </div>
                                <div className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>
                                        {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Teacher */}
                    <Card className="border border-gray-100 p-5 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                <User className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-gray-400">
                                    Giáo Viên Phụ Trách
                                </div>
                                <div className="text-sm font-bold text-gray-900">
                                    {currentTeacher?.full_name ?? 'Chưa phân công'}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Mã GV: {currentTeacher?.teacher_code ?? '---'}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Room */}
                    <Card className="border border-gray-100 p-5 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                <DoorOpen className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-gray-400">
                                    Phòng Học
                                </div>
                                <div className="text-sm font-bold text-gray-900">
                                    {currentRoom?.name ?? 'Chưa gán phòng'}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Sức chứa: {currentRoom?.capacity ? `${currentRoom.capacity} chỗ` : '---'}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Attendance Progress */}
                    <Card className="border border-gray-100 p-5 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                                <UserCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-gray-400">
                                    Tiến Độ Điểm Danh
                                </div>
                                <div className="text-sm font-bold text-gray-900">
                                    {session.attendances?.length ?? 0}/{studentList.length} Học Sinh
                                </div>
                                <div className="text-xs text-violet-700 font-medium">
                                    {studentList.length > 0 && session.attendances && session.attendances.length === studentList.length
                                        ? '✓ Đã điểm danh đủ'
                                        : 'Chưa hoàn tất điểm danh'}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Topic & Notes Box */}
                {session.topic || session.note ? (
                    <Card className="border border-gray-100 p-5 shadow-xs bg-slate-50/50">
                        <div className="flex items-center justify-between mb-2.5">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-emerald-600" />
                                Nội Dung & Ghi Chú Buổi Học
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsContentModalOpen(true)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                            >
                                <Edit3 className="h-3.5 w-3.5" /> Chỉnh sửa
                            </button>
                        </div>
                        {session.topic && (
                            <p className="text-sm text-gray-800 font-medium mb-2">
                                <span className="text-gray-500">Chủ đề / Bài học:</span> {session.topic}
                            </p>
                        )}
                        {session.note && (
                            <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-3.5 shadow-2xs">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-1">
                                    <span>📢 Ghi chú / Dặn dò buổi học:</span>
                                </div>
                                <p className="text-sm text-blue-950 font-medium whitespace-pre-line leading-relaxed">
                                    {session.note}
                                </p>
                            </div>
                        )}
                    </Card>
                ) : (
                    <Card className="border border-dashed border-gray-200 p-4 shadow-2xs bg-slate-50/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <BookOpen className="h-4.5 w-4.5" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-800">Chưa có chủ đề & ghi chú buổi học</h4>
                                <p className="text-[11px] text-gray-500">Thêm chủ đề bài giảng hoặc dặn dò để học sinh chuẩn bị bài trước khi đến lớp.</p>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<Edit3 className="h-3.5 w-3.5 text-emerald-600" />}
                            onClick={() => setIsContentModalOpen(true)}
                        >
                            Thêm Chủ Đề / Ghi Chú
                        </Button>
                    </Card>
                )}

                {/* Students & Attendance Table */}
                <Card className="overflow-hidden border border-gray-100 shadow-xs">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Danh Sách Học Sinh Trong Buổi ({studentList.length})
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Trạng thái điểm danh và ghi chú học tập trong buổi học này.
                            </p>
                        </div>

                        <Link href={`/attendance/session/${session.id}`}>
                            <button
                                type="button"
                                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                            >
                                <CheckSquare className="h-3.5 w-3.5" />
                                <span>Chỉnh Sửa Điểm Danh</span>
                            </button>
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-bold uppercase tracking-wider text-gray-700">
                                <tr>
                                    <th scope="col" className="px-4 py-3">
                                        STT
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        Mã & Họ Tên Học Sinh
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        Phụ Huynh & SĐT
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-center">
                                        Trạng Thái Điểm Danh
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        Ghi Chú Điểm Danh
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {studentList.length > 0 ? (
                                    studentList.map((student, idx) => {
                                        const att = attendanceMap.get(student.id);

                                        return (
                                            <tr
                                                key={student.id}
                                                className="transition-colors hover:bg-gray-50/80"
                                            >
                                                <td className="px-4 py-3 text-xs font-semibold text-gray-400">
                                                    {idx + 1}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="font-bold text-gray-900">
                                                        {student.full_name}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {student.student_code} {student.phone ? `· ${student.phone}` : ''}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-xs text-gray-600">
                                                    <div>{student.parent_name ?? '---'}</div>
                                                    <div className="text-gray-400">{student.parent_phone ?? ''}</div>
                                                </td>

                                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                                    {getAttendanceStatusBadge(att?.status)}
                                                </td>

                                                <td className="px-4 py-3 text-xs text-gray-600">
                                                    {att?.note ?? <span className="text-gray-300">Không có</span>}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-8 text-center text-gray-500"
                                        >
                                            Chưa có học sinh nào được ghi danh vào lớp học này.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Reschedule History Table */}
                {session.reschedules && session.reschedules.length > 0 && (
                    <Card className="overflow-hidden border border-gray-100 shadow-xs">
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                                <History className="h-5 w-5 text-amber-600" />
                                Lịch Sử Đổi Lịch / Thay Đổi Ca Học ({session.reschedules.length})
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Nhật ký chi tiết các lần dời ngày, đổi khung giờ, đổi phòng hoặc phân công lại giáo viên.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-bold uppercase tracking-wider text-gray-700">
                                    <tr>
                                        <th scope="col" className="px-4 py-3">
                                            Thời Gian Thay Đổi
                                        </th>
                                        <th scope="col" className="px-4 py-3">
                                            Người Thực Hiện
                                        </th>
                                        <th scope="col" className="px-4 py-3">
                                            Chi Tiết Thay Đổi
                                        </th>
                                        <th scope="col" className="px-4 py-3">
                                            Lý Do Thay Đổi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {session.reschedules.map((log) => {
                                        const changer = log.changed_by_admin?.full_name || log.changed_by_teacher?.full_name || 'Hệ thống';

                                        return (
                                            <tr key={log.id} className="hover:bg-gray-50/80">
                                                <td className="px-4 py-3 text-xs font-semibold text-gray-900 whitespace-nowrap">
                                                    {formatDateTime(log.changed_at)}
                                                </td>

                                                <td className="px-4 py-3 text-xs">
                                                    <span className="font-bold text-gray-800">{changer}</span>
                                                    {log.changed_by_admin && <span className="ml-1 text-emerald-600 font-semibold">(Admin)</span>}
                                                    {log.changed_by_teacher && <span className="ml-1 text-blue-600 font-semibold">(Giáo viên)</span>}
                                                </td>

                                                <td className="px-4 py-3 text-xs">
                                                    <div className="space-y-1">
                                                        {log.old_date !== log.new_date && (
                                                            <div>
                                                                <span className="text-gray-400">Ngày:</span>{' '}
                                                                <span className="line-through text-red-600">{formatDate(log.old_date)}</span>{' '}
                                                                <ArrowRight className="inline-block mx-1 h-3.5 w-3.5 text-gray-400 align-middle" />{' '}
                                                                <span className="font-bold text-emerald-700">{formatDate(log.new_date)}</span>
                                                            </div>
                                                        )}

                                                        {(log.old_start_time !== log.new_start_time || log.old_end_time !== log.new_end_time) && (
                                                            <div>
                                                                <span className="text-gray-400">Giờ:</span>{' '}
                                                                <span className="line-through text-red-600">
                                                                    {formatTime(log.old_start_time)} - {formatTime(log.old_end_time)}
                                                                </span>{' '}
                                                                <ArrowRight className="inline-block mx-1 h-3.5 w-3.5 text-gray-400 align-middle" />{' '}
                                                                <span className="font-bold text-emerald-700">
                                                                    {formatTime(log.new_start_time)} - {formatTime(log.new_end_time)}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {log.old_room_id !== log.new_room_id && (
                                                            <div>
                                                                <span className="text-gray-400">Phòng:</span>{' '}
                                                                <span className="line-through text-red-600">{log.old_room?.name ?? 'Chưa gán'}</span>{' '}
                                                                <ArrowRight className="inline-block mx-1 h-3.5 w-3.5 text-gray-400 align-middle" />{' '}
                                                                <span className="font-bold text-emerald-700">{log.new_room?.name ?? 'Chưa gán'}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-xs text-gray-700">
                                                    {log.reason ?? <span className="text-gray-300">Không có lý do</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* Modal: Reschedule / Edit Session */}
            <Modal
                isOpen={isRescheduleModalOpen}
                onClose={() => setIsRescheduleModalOpen(false)}
                title="Đổi Lịch Dạy & Phân Công Ca Học"
            >
                <form onSubmit={handleRescheduleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Session Date */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                Ngày học <span className="text-red-500">*</span>
                            </label>
                            <DatePicker
                                value={data.session_date}
                                onChange={(val) => setData('session_date', val)}
                                className="w-full"
                                placeholder="dd-mm-yyyy"
                                required
                            />
                            {errors.session_date && (
                                <p className="mt-1 text-xs text-red-600">{errors.session_date}</p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                Trạng thái buổi học <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value as any)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                required
                            >
                                <option value="scheduled">Sắp diễn ra</option>
                                <option value="in_progress">Đang diễn ra</option>
                                <option value="completed">Đã hoàn thành</option>
                                <option value="cancelled">Đã hủy</option>
                            </select>
                            {errors.status && (
                                <p className="mt-1 text-xs text-red-600">{errors.status}</p>
                            )}
                        </div>

                        {/* Start Time */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                Giờ bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={data.start_time}
                                onChange={(e) => setData('start_time', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                required
                            />
                            {errors.start_time && (
                                <p className="mt-1 text-xs text-red-600">{errors.start_time}</p>
                            )}
                        </div>

                        {/* End Time */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                Giờ kết thúc <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={data.end_time}
                                onChange={(e) => setData('end_time', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                required
                            />
                            {errors.end_time && (
                                <p className="mt-1 text-xs text-red-600">{errors.end_time}</p>
                            )}
                        </div>

                        {/* Teacher */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                Giáo viên đứng lớp <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={data.teacher_id}
                                onChange={(e) => setData('teacher_id', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                required
                            >
                                <option value="">-- Chọn giáo viên --</option>
                                {availableTeachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.full_name} ({t.teacher_code})
                                    </option>
                                ))}
                            </select>
                            {errors.teacher_id && (
                                <p className="mt-1 text-xs text-red-600">{errors.teacher_id}</p>
                            )}
                        </div>

                        {/* Room */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                Phòng học
                            </label>
                            <select
                                value={data.room_id}
                                onChange={(e) => setData('room_id', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="">-- Chưa chọn phòng học --</option>
                                {availableRooms.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name} {r.capacity ? `(${r.capacity} chỗ)` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.room_id && (
                                <p className="mt-1 text-xs text-red-600">{errors.room_id}</p>
                            )}
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                            Lý do đổi lịch
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Ví dụ: Giáo viên bận việc đột xuất, đổi sang dạy bù vào sáng Chủ Nhật..."
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                        {errors.reason && (
                            <p className="mt-1 text-xs text-red-600">{errors.reason}</p>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => setIsRescheduleModalOpen(false)}
                            disabled={processing}
                        >
                            Hủy Bỏ
                        </Button>

                        <Button
                            type="submit"
                            variant="success"
                            size="md"
                            isLoading={processing}
                            icon={<Save className="h-4 w-4" />}
                        >
                            Lưu Thay Đổi
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Update Topic & Notes */}
            <Modal
                isOpen={isContentModalOpen}
                onClose={() => setIsContentModalOpen(false)}
                title="Chủ Đề & Ghi Chú Buổi Học"
            >
                <form onSubmit={handleContentSubmit} className="space-y-4">
                    {/* Topic */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                            Chủ đề bài giảng / Bài học
                        </label>
                        <Input
                            placeholder="Ví dụ: Bài 3: Phép nhân phân số và luyện tập"
                            value={contentData.topic}
                            onChange={(e) => setContentData('topic', e.target.value)}
                        />
                        {contentErrors.topic && (
                            <p className="mt-1 text-xs text-red-600">{contentErrors.topic}</p>
                        )}
                    </div>

                    {/* Note */}
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                            Ghi chú / Dặn dò buổi học
                        </label>
                        <textarea
                            rows={4}
                            placeholder="Ví dụ: Nhớ mang sách bài tập tập 2, làm bài tập trước khi đến lớp, chuẩn bị bài thuyết trình..."
                            value={contentData.note}
                            onChange={(e) => setContentData('note', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                        {contentErrors.note && (
                            <p className="mt-1 text-xs text-red-600">{contentErrors.note}</p>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => setIsContentModalOpen(false)}
                            disabled={contentProcessing}
                        >
                            Hủy Bỏ
                        </Button>

                        <Button
                            type="submit"
                            variant="success"
                            size="md"
                            isLoading={contentProcessing}
                            icon={<Save className="h-4 w-4" />}
                        >
                            Lưu Ghi Chú
                        </Button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}
