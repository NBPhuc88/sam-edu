import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    DoorOpen,
    Save,
    Users,
    RotateCcw,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import AppLayout from '@/layouts/AppLayout';

import { usePermission } from '@/hooks/usePermission';
interface StudentAttendanceItem {
    id: number;
    full_name: string;
    student_code: string;
    phone: string | null;
    email: string | null;
    parent_phone: string | null;
    gender: string | null;
    status: 'present' | 'absent' | 'late' | 'excused' | 'leave';
    note: string;
    check_in_at: string | null;
    marked_at: string | null;
}

interface SchoolClass {
    id: number;
    name: string;
    code: string;
}

interface Subject {
    id: number;
    name: string;
    code: string;
    total_sessions?: number;
}

interface Teacher {
    id: number;
    full_name: string;
    teacher_code: string;
}

interface Room {
    id: number;
    name: string;
    code: string;
    capacity: number;
}

interface ClassSession {
    id: number;
    session_date: string;
    start_time: string;
    end_time: string;
    status: string;
    topic: string | null;
    note: string | null;
}

interface Props {
    session: ClassSession;
    schoolClass: SchoolClass;
    subject: Subject;
    teacher: Teacher;
    room: Room | null;
    sessionOrder: number;
    totalSessions: number | null;
    students: StudentAttendanceItem[];
    totalStudents: number;
}

export default function AttendanceShowPage({
    session,
    schoolClass,
    subject,
    teacher,
    room,
    sessionOrder,
    totalSessions,
    students: initialStudents = [],
    totalStudents,
}: Props) {
    const { can } = usePermission();
    const [students, setStudents] = useState<StudentAttendanceItem[]>(initialStudents);
    const [isSaving, setIsSaving] = useState(false);
    const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleStatusChange = (studentId: number, status: 'present' | 'absent' | 'late' | 'excused') => {
        setStudents((prev) =>
            prev.map((s) => (s.id === studentId ? { ...s, status } : s)),
        );
    };

    const handleNoteChange = (studentId: number, note: string) => {
        setStudents((prev) =>
            prev.map((s) => (s.id === studentId ? { ...s, note } : s)),
        );
    };

    const handleMarkAllPresent = () => {
        setStudents((prev) => prev.map((s) => ({ ...s, status: 'present' })));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const payload = students.map((s) => ({
            student_id: s.id,
            status: s.status,
            note: s.note || null,
        }));

        router.post(
            `/attendance/session/${session.id}`,
            { attendances: payload },
            {
                onFinish: () => setIsSaving(false),
            },
        );
    };

    const handleResetAttendance = () => {
        setIsResetting(true);
        router.post(
            `/attendance/session/${session.id}/reset`,
            {},
            {
                onFinish: () => {
                    setIsResetting(false);
                    setIsResetConfirmOpen(false);
                    setStudents((prev) =>
                        prev.map((s) => ({
                            ...s,
                            status: 'present',
                            note: '',
                            check_in_at: null,
                            marked_at: null,
                        })),
                    );
                },
            },
        );
    };

    const getSessionStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="active">Đã Dạy (Hoàn Thành)</Badge>;
            case 'cancelled':
                return <Badge variant="danger">Đã Hủy</Badge>;
            case 'rescheduled':
                return <Badge variant="expired">Đã Đổi Lịch</Badge>;
            case 'scheduled':
            default:
                return <Badge variant="pending">Chưa Dạy (Lên Lịch)</Badge>;
        }
    };

    const presentCount = students.filter((s) => s.status === 'present').length;
    const lateCount = students.filter((s) => s.status === 'late').length;
    const excusedCount = students.filter((s) => s.status === 'excused').length;
    const absentCount = students.filter((s) => s.status === 'absent').length;

    return (
        <AppLayout title={`Điểm Danh: ${subject?.name || 'Môn học'} - ${schoolClass?.name || 'Lớp học'}`}>
            <Head title={`Điểm Danh: ${subject?.name} - ${schoolClass?.name}`} />

            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header Top Card (Full-width text & info) */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<ArrowLeft className="h-4 w-4" />}
                            onClick={() => window.history.back()}
                            className="shrink-0 mt-0.5 sm:mt-0"
                        >
                            Quay Lại
                        </Button>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                                    Điểm Danh: {subject?.name}
                                </h1>
                                <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-700 border border-emerald-200">
                                    {schoolClass?.name} ({schoolClass?.code})
                                </span>
                                {getSessionStatusBadge(session.status)}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500">
                                <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50/80 px-2.5 py-0.5 rounded-md border border-emerald-200">
                                    <Clock className="h-3.5 w-3.5" />
                                    {session.session_date} ({session.start_time?.substring(0, 5)} - {session.end_time?.substring(0, 5)})
                                </span>
                                <span className="flex items-center gap-1.5">
                                    Buổi học: <strong className="text-gray-900 font-semibold">Buổi {sessionOrder}{totalSessions ? ` / ${totalSessions} buổi` : ''}</strong>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                    GV: <strong className="text-gray-900 font-semibold">{teacher?.full_name || 'N/A'}</strong>
                                </span>
                                {room && (
                                    <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1 text-gray-600">
                                            <DoorOpen className="h-3.5 w-3.5 text-gray-400" />
                                            Phòng: <strong className="text-gray-800">{room.name}</strong>
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Counters Card */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-xs">
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Sĩ Số Lớp
                        </div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">
                            {totalStudents}
                        </div>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center shadow-xs">
                        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                            Có Mặt
                        </div>
                        <div className="mt-1 text-2xl font-bold text-emerald-700">
                            {presentCount}
                        </div>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-center shadow-xs">
                        <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                            Đi Muộn
                        </div>
                        <div className="mt-1 text-2xl font-bold text-amber-700">
                            {lateCount}
                        </div>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-center shadow-xs">
                        <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                            Vắng Có Phép
                        </div>
                        <div className="mt-1 text-2xl font-bold text-blue-700">
                            {excusedCount}
                        </div>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 text-center shadow-xs">
                        <div className="text-xs font-semibold uppercase tracking-wider text-red-700">
                            Vắng Không Phép
                        </div>
                        <div className="mt-1 text-2xl font-bold text-red-700">
                            {absentCount}
                        </div>
                    </div>
                </div>

                {/* Student Attendance Form / Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <form onSubmit={handleSubmit}>
                        {/* Action Toolbar Header above table */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-200 bg-slate-50/90 px-6 py-3.5">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-emerald-600" />
                                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                                    Danh Sách Học Sinh Điểm Danh
                                </h3>
                                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-bold text-gray-700 font-mono">
                                    {students.length}
                                </span>
                            </div>

                            {can('attendance.save') && (
                                <div className="flex items-center justify-end gap-2.5">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        icon={<RotateCcw className="h-4 w-4 text-rose-500" />}
                                        isLoading={isResetting}
                                        onClick={() => setIsResetConfirmOpen(true)}
                                        title="Xóa dữ liệu điểm danh và chuyển trạng thái về Chưa dạy"
                                        className="!border-rose-200 !text-rose-600 hover:!bg-rose-50 hover:!border-rose-300"
                                    >
                                        Reset Điểm Danh
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                                        onClick={handleMarkAllPresent}
                                    >
                                        Tất Cả Có Mặt
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="success"
                                        size="sm"
                                        icon={<Save className="h-4 w-4" />}
                                        isLoading={isSaving}
                                    >
                                        Lưu Điểm Danh
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="border-b border-gray-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-700">
                                    <tr>
                                        <th className="w-12 px-4 py-3.5 text-center">STT</th>
                                        <th className="px-4 py-3.5">Học Sinh</th>
                                        <th className="px-4 py-3.5">Liên Hệ</th>
                                        <th className="px-4 py-3.5 text-center">Trạng Thái Điểm Danh</th>
                                        <th className="px-4 py-3.5">Ghi Chú</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {students && students.length > 0 ? (
                                        students.map((student, idx) => (
                                            <tr
                                                key={student.id}
                                                className={`transition-colors hover:bg-slate-50 ${
                                                    student.status === 'absent'
                                                        ? 'bg-red-50/20'
                                                        : student.status === 'late'
                                                          ? 'bg-amber-50/20'
                                                          : ''
                                                }`}
                                            >
                                                <td className="px-4 py-3.5 text-center font-bold text-gray-400">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="font-bold text-gray-900">
                                                        {student.full_name}
                                                    </div>
                                                    <div className="font-mono text-xs text-gray-400">
                                                        Mã: {student.student_code}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-gray-600">
                                                    {student.phone && <div>SĐT: {student.phone}</div>}
                                                    {student.parent_phone && (
                                                        <div className="text-gray-500">
                                                            PH: {student.parent_phone}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {/* Có mặt */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusChange(student.id, 'present')}
                                                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                                                                student.status === 'present'
                                                                    ? 'bg-emerald-600 text-white shadow-xs'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            Có mặt
                                                        </button>

                                                        {/* Đi muộn */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusChange(student.id, 'late')}
                                                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                                                                student.status === 'late'
                                                                    ? 'bg-amber-500 text-white shadow-xs'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            Đi muộn
                                                        </button>

                                                        {/* Có phép */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusChange(student.id, 'excused')}
                                                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                                                                student.status === 'excused'
                                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            Có phép
                                                        </button>

                                                        {/* Vắng */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStatusChange(student.id, 'absent')}
                                                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${
                                                                student.status === 'absent'
                                                                    ? 'bg-red-600 text-white shadow-xs'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                            }`}
                                                        >
                                                            Vắng
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <input
                                                        type="text"
                                                        value={student.note || ''}
                                                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                                                        placeholder="Ghi chú (nếu có)..."
                                                        className="w-full rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-800 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <Users className="h-8 w-8 text-gray-300" />
                                                    <p className="font-semibold text-gray-700">
                                                        Lớp học này chưa có học sinh nào được ghi danh
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        Thêm học sinh vào lớp học trước khi tiến hành điểm danh.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {students && students.length > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-100 bg-slate-50/80 px-6 py-4">
                                <div className="text-xs text-gray-500 font-medium">
                                    Đang xem <span className="font-bold text-gray-800">{students.length}</span> học sinh trong ca học
                                </div>
                                {can('attendance.save') && (
                                    <div className="flex items-center justify-end gap-2.5">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            icon={<RotateCcw className="h-4 w-4 text-rose-500" />}
                                            isLoading={isResetting}
                                            onClick={() => setIsResetConfirmOpen(true)}
                                            title="Xóa dữ liệu điểm danh và chuyển trạng thái về Chưa dạy"
                                            className="!border-rose-200 !text-rose-600 hover:!bg-rose-50 hover:!border-rose-300"
                                        >
                                            Reset Điểm Danh
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                                            onClick={handleMarkAllPresent}
                                        >
                                            Tất Cả Có Mặt
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="success"
                                            size="sm"
                                            icon={<Save className="h-4 w-4" />}
                                            isLoading={isSaving}
                                        >
                                            Lưu Điểm Danh
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </Card>

                {/* Confirm Dialog for Reset Attendance */}
                <ConfirmDialog
                    isOpen={isResetConfirmOpen}
                    onClose={() => setIsResetConfirmOpen(false)}
                    onConfirm={handleResetAttendance}
                    title="Xác Nhận Đặt Lại Điểm Danh"
                    message="Bạn có chắc chắn muốn xóa toàn bộ kết quả điểm danh của buổi học này và đặt lại trạng thái ca học thành 'Chưa dạy'? Thao tác này phù hợp khi điểm danh nhầm buổi."
                    confirmText="Đặt Lại Điểm Danh"
                    cancelText="Hủy"
                    variant="danger"
                    isLoading={isResetting}
                />
            </div>
        </AppLayout>
    );
}
