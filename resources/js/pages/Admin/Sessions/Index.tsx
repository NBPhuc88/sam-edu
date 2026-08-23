import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    Search,
    Filter,
    DoorOpen,
    Eye,
    CheckSquare,
    UserCheck,
    Clock,
    BookOpen,
    GraduationCap,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import Tooltip, { TruncatedText } from '@/components/ui/Tooltip';
import AppLayout from '@/layouts/AppLayout';
import { formatDate, formatTime } from '@/lib/date';

import { usePermission } from '@/hooks/usePermission';
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

interface ClassSession {
    id: number;
    session_date: string;
    start_time: string;
    end_time: string;
    status: string;
    topic: string | null;
    note: string | null;
    attendances_count?: number;
    present_attendances_count?: number;
    teacher?: Teacher;
    room?: Room;
    class_subject?: {
        id: number;
        school_class?: {
            id: number;
            name: string;
            code: string;
            center?: Center;
        };
        subject?: {
            id: number;
            name: string;
            code: string;
        };
    };
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    per_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    sessions: PaginatedData<ClassSession>;
    centers: Center[];
    classes: SchoolClass[];
    subjects: Subject[];
    teachers: Teacher[];
    rooms: Room[];
    filters: {
        search?: string;
        center_id?: number | null;
        class_id?: number | null;
        subject_id?: number | null;
        teacher_id?: number | null;
        room_id?: number | null;
        session_date?: string;
        date_from?: string;
        date_to?: string;
        date_scope?: string;
        status?: string;
        per_page?: number;
    };
    isTeacher?: boolean;
}

export default function SessionIndex({
    sessions,
    centers = [],
    classes = [],
    subjects = [],
    teachers = [],
    rooms = [],
    filters,
    isTeacher: isTeacherProp,
}: Props) {
    const { can } = usePermission();
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';
    const isTeacher = Boolean(isTeacherProp || auth?.user?.role === 'teacher');

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCenterId, setSelectedCenterId] = useState<string>(
        filters.center_id ? String(filters.center_id) : '',
    );
    const [selectedClassId, setSelectedClassId] = useState<string>(
        filters.class_id ? String(filters.class_id) : '',
    );
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
        filters.subject_id ? String(filters.subject_id) : '',
    );
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
        filters.teacher_id ? String(filters.teacher_id) : '',
    );
    const [selectedRoomId, setSelectedRoomId] = useState<string>(
        filters.room_id ? String(filters.room_id) : '',
    );
    const [sessionDate, setSessionDate] = useState(filters.session_date || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [dateScope, setDateScope] = useState<string>(filters.date_scope || 'from_today');
    const [selectedStatus, setSelectedStatus] = useState<string>(
        filters.status || 'all',
    );

    // Dynamic filtering for classes/subjects/teachers based on center selection
    const filteredClasses = selectedCenterId
        ? classes.filter((c) => String(c.center_id) === selectedCenterId)
        : classes;
    const filteredSubjects = selectedCenterId
        ? subjects.filter((s) => String(s.center_id) === selectedCenterId)
        : subjects;
    const filteredTeachers = selectedCenterId
        ? teachers.filter((t) => String(t.center_id) === selectedCenterId)
        : teachers;
    const filteredRooms = selectedCenterId
        ? rooms.filter((r) => String(r.center_id) === selectedCenterId)
        : rooms;

    const cleanParams = (raw: Record<string, any>) => {
        const cleaned: Record<string, any> = {};
        Object.entries(raw).forEach(([key, val]) => {
            if (val !== undefined && val !== null && val !== '' && val !== 'all') {
                cleaned[key] = val;
            }
        });
        return cleaned;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = cleanParams({
            search,
            center_id: selectedCenterId,
            class_id: selectedClassId,
            subject_id: selectedSubjectId,
            teacher_id: !isTeacher ? selectedTeacherId : undefined,
            room_id: !isTeacher ? selectedRoomId : undefined,
            session_date: sessionDate,
            date_from: dateFrom,
            date_to: dateTo,
            date_scope: dateScope,
            status: selectedStatus,
            per_page: filters.per_page !== 20 ? filters.per_page : undefined,
        });
        router.get('/sessions', params, { preserveState: true });
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedCenterId('');
        setSelectedClassId('');
        setSelectedSubjectId('');
        setSelectedTeacherId('');
        setSelectedRoomId('');
        setSessionDate('');
        setDateFrom('');
        setDateTo('');
        setDateScope('from_today');
        setSelectedStatus('all');
        router.get('/sessions', { date_scope: 'from_today' }, { preserveState: true });
    };

    const handleQuickDateToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setSessionDate(today);
        setDateFrom('');
        setDateTo('');
        const params = cleanParams({
            session_date: today,
            center_id: selectedCenterId,
            class_id: selectedClassId,
            subject_id: selectedSubjectId,
            teacher_id: !isTeacher ? selectedTeacherId : undefined,
            status: selectedStatus,
            per_page: filters.per_page !== 20 ? filters.per_page : undefined,
        });
        router.get('/sessions', params, { preserveState: true });
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

    return (
        <AppLayout title="Quản Lý Buổi Học - Hệ Thống Giáo Dục Sam">
            <Head title="Quản Lý Buổi Học" />

            <div className="space-y-6">
                {/* Header Top Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
                            <Calendar className="h-7 w-7 text-emerald-600" />
                            Quản Lý Buổi Học / Ca Học
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Danh sách các ca học thực tế theo từng môn, lớp học, giáo viên và phòng học.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/schedules">
                            <Button
                                variant="secondary"
                                size="md"
                                icon={<Calendar className="h-4.5 w-4.5 text-gray-600" />}
                            >
                                Xem Thời Khóa Biểu
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filter Box */}
                <Card className="border border-gray-100 p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {/* Search by Text */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Tìm kiếm từ khóa
                                </label>
                                <Input
                                    placeholder="Tên lớp, môn, giáo viên, phòng..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    icon={<Search className="h-4 w-4 text-gray-400" />}
                                />
                            </div>

                            {/* Center filter */}
                            {isSuperAdmin && centers.length > 1 && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                        Trung tâm
                                    </label>
                                    <select
                                        value={selectedCenterId}
                                        onChange={(e) => {
                                            setSelectedCenterId(e.target.value);
                                            setSelectedClassId('');
                                            setSelectedSubjectId('');
                                            setSelectedTeacherId('');
                                            setSelectedRoomId('');
                                        }}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">-- Tất cả trung tâm --</option>
                                        {centers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Subject filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Môn học
                                </label>
                                <select
                                    value={selectedSubjectId}
                                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">-- Tất cả môn học --</option>
                                    {filteredSubjects.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Class filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Lớp học
                                </label>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">-- Tất cả lớp học --</option>
                                    {filteredClasses.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Teacher filter */}
                            {!isTeacher && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                        Giáo viên
                                    </label>
                                    <select
                                        value={selectedTeacherId}
                                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">-- Tất cả giáo viên --</option>
                                        {filteredTeachers.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.full_name} ({t.teacher_code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Room filter */}
                            {!isTeacher && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                        Phòng học
                                    </label>
                                    <select
                                        value={selectedRoomId}
                                        onChange={(e) => setSelectedRoomId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">-- Tất cả phòng học --</option>
                                        {filteredRooms.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Date scope filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Phạm vi ngày
                                </label>
                                <select
                                    value={dateScope}
                                    onChange={(e) => setDateScope(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="from_today">Từ hôm nay đến tương lai</option>
                                    <option value="all">Tất cả các buổi</option>
                                </select>
                            </div>

                            {/* Date filters */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Từ ngày
                                </label>
                                <DatePicker
                                    value={dateFrom}
                                    onChange={(val) => {
                                        setDateFrom(val);
                                        setSessionDate('');
                                    }}
                                    className="w-full"
                                    placeholder="dd-mm-yyyy"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Đến ngày
                                </label>
                                <DatePicker
                                    value={dateTo}
                                    onChange={(val) => {
                                        setDateTo(val);
                                        setSessionDate('');
                                    }}
                                    className="w-full"
                                    placeholder="dd-mm-yyyy"
                                />
                            </div>

                            {/* Status filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Trạng thái
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="all">-- Tất cả trạng thái --</option>
                                    <option value="scheduled">Sắp diễn ra</option>
                                    <option value="in_progress">Đang diễn ra</option>
                                    <option value="completed">Đã hoàn thành</option>
                                    <option value="cancelled">Đã hủy</option>
                                </select>
                            </div>
                        </div>

                        {/* Action buttons in filter */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleQuickDateToday}
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                >
                                    Hôm nay
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetFilter}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="submit"
                                    variant="success"
                                    size="sm"
                                    icon={<Filter className="h-4 w-4" />}
                                >
                                    Áp Dụng Lọc
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>

                {/* Data Table */}
                <Card className="overflow-hidden border border-gray-100 shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-bold uppercase tracking-wider text-gray-700">
                                <tr>
                                    <th scope="col" className="px-4 py-3.5">
                                        Thời Gian & Ngày Học
                                    </th>
                                    <th scope="col" className="px-4 py-3.5">
                                        Môn Học
                                    </th>
                                    <th scope="col" className="px-4 py-3.5">
                                        Lớp Học
                                    </th>
                                    <th scope="col" className="px-4 py-3.5">
                                        Giáo Viên & Phòng
                                    </th>
                                    <th scope="col" className="px-4 py-3.5 text-center">
                                        Trạng Thái
                                    </th>
                                    <th scope="col" className="px-4 py-3.5 text-center">
                                        Điểm Danh
                                    </th>
                                    <th scope="col" className="px-4 py-3.5 text-right">
                                        Thao Tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {sessions.data.length > 0 ? (
                                    sessions.data.map((session) => {
                                        const subject = session.class_subject?.subject;
                                        const schoolClass = session.class_subject?.school_class;
                                        const teacher = session.teacher;
                                        const room = session.room;

                                        return (
                                            <tr
                                                key={session.id}
                                                className="transition-colors hover:bg-gray-50/80"
                                            >
                                                {/* Date & Time */}
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <div className="font-bold text-gray-900">
                                                        {formatDate(session.session_date)}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span>
                                                            {formatTime(session.start_time)} - {formatTime(session.end_time)}
                                                        </span>
                                                    </div>
                                                    {session.topic && (
                                                        <div className="mt-1 max-w-xs">
                                                            <TruncatedText
                                                                text={`📝 ${session.topic}`}
                                                                maxLines={1}
                                                                className="text-xs text-gray-500"
                                                            />
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Subject */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2 max-w-[200px]">
                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                                                            <BookOpen className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <TruncatedText
                                                                text={subject?.name ?? '---'}
                                                                maxLines={1}
                                                                className="font-bold text-gray-900"
                                                            />
                                                            <div className="text-xs text-gray-400">
                                                                {subject?.code}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Class & Center */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2 max-w-[200px]">
                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                                            <GraduationCap className="h-4 w-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <TruncatedText
                                                                text={schoolClass?.name ?? '---'}
                                                                maxLines={1}
                                                                className="font-bold text-gray-900"
                                                            />
                                                            <TruncatedText
                                                                text={schoolClass?.center?.name}
                                                                maxLines={1}
                                                                className="text-xs text-gray-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Teacher & Room */}
                                                <td className="px-4 py-3.5">
                                                    <div className="max-w-[180px]">
                                                        <TruncatedText
                                                            text={teacher?.full_name ?? 'Chưa phân công'}
                                                            maxLines={1}
                                                            className="font-semibold text-gray-900"
                                                        />
                                                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                                                            <DoorOpen className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                            <TruncatedText
                                                                text={room?.name ?? 'Chưa gán phòng'}
                                                                maxLines={1}
                                                                className="truncate"
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                                    {getStatusBadge(session.status)}
                                                </td>

                                                {/* Attendance Count */}
                                                <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                                    {session.attendances_count && session.attendances_count > 0 ? (
                                                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                                            <UserCheck className="h-3.5 w-3.5" />
                                                            <span>
                                                                {session.present_attendances_count ?? 0}/{session.attendances_count} có mặt
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                            Chưa điểm danh
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Link href={`/attendance/session/${session.id}`}>
                                                            <button
                                                                type="button"
                                                                title="Điểm danh buổi học"
                                                                className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                                                            >
                                                                <CheckSquare className="h-3.5 w-3.5" />
                                                                <span>Điểm Danh</span>
                                                            </button>
                                                        </Link>

                                                        {can('sessions.edit') && (
                                                            <Link href={`/sessions/${session.id}`}>
                                                                <button
                                                                    type="button"
                                                                    title="Chi tiết & Đổi lịch"
                                                                    className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100"
                                                                >
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                    <span>Chi Tiết / Đổi Lịch</span>
                                                                </button>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-12 text-center text-gray-500"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <Calendar className="mb-3 h-10 w-10 text-gray-300" />
                                                <p className="text-base font-semibold text-gray-700">
                                                    Không tìm thấy buổi học nào phù hợp
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Thử thay đổi bộ lọc tìm kiếm hoặc tạo lịch học mới để tự động sinh ca học.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {sessions.total > 0 && (
                        <div className="border-t border-gray-100 px-4 pb-4">
                            <Pagination
                                links={sessions.links}
                                from={sessions.from}
                                to={sessions.to}
                                total={sessions.total}
                                perPage={sessions.per_page}
                                currentParams={filters}
                            />
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
