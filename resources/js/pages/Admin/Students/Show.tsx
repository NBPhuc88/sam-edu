import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CalendarDays,
    CheckCircle,
    Clock,
    Download,
    Edit2,
    GraduationCap,
    Mail,
    MapPin,
    Phone,
    User,
    Users,
    XCircle,
    BookOpen,
    DoorOpen,
    HelpCircle,
    AlertCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import StatMetricCard from '@/components/common/StatMetricCard';
import StatusBadge from '@/components/common/StatusBadge';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import { usePermission } from '@/hooks/usePermission';
import { useCanExportCsv } from '@/hooks/usePlanFeature';
import AppLayout from '@/layouts/AppLayout';
import {
    ATTENDANCE_STATUS_PRESENT,
    ATTENDANCE_STATUS_ABSENT,
    ATTENDANCE_STATUS_LATE,
    ATTENDANCE_STATUS_EXCUSED,
    GENDER_MALE,
    GENDER_FEMALE,
    GENDER_OTHER,
    GENDER_LABELS,
} from '@/constants/enums';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface Student {
    id: number;
    student_code: string;
    username: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    gender: number | null;
    date_of_birth: string | null;
    address: string | null;
    admission_date: string | null;
    parent_name: string | null;
    parent_phone: string | null;
    parent_relationship: string | null;
    status: number;
    note: string | null;
    center_id: number;
    center?: Center;
}

interface StudentSessionItem {
    id: number;
    session_date: string;
    start_time: string;
    end_time: string;
    class_name?: string | null;
    class_code?: string | null;
    subject_name?: string | null;
    subject_code?: string | null;
    teacher_name?: string | null;
    room_name?: string | null;
    attendance_status: number;
    attendance_note?: string | null;
    check_in_at?: string | null;
}

interface FilterData {
    type: 'month' | 'all' | 'select_month';
    month: number;
    year: number;
    start_date: string | null;
    end_date: string | null;
    per_page?: number;
    page?: number;
}

interface StatsData {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    unmarked: number;
}

interface PaginatedSessions {
    data: StudentSessionItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface Props {
    student: Student;
    sessions: PaginatedSessions;
    stats: StatsData;
    filters: FilterData;
    isTeacher?: boolean;
}

export default function StudentShow({
    student,
    sessions,
    stats,
    filters,
    isTeacher = false,
}: Props) {
    const currentYear = new Date().getFullYear();
    const { can } = usePermission();
    const canEdit = !isTeacher && can('students.edit');
    const canExportPermission = !isTeacher && can('students.export-attendances');
    const canExportPlan = useCanExportCsv();
    const canExport = canExportPermission && canExportPlan;

    const [filterType, setFilterType] = useState<'month' | 'all' | 'select_month'>(filters.type || 'month');
    const [selectedMonth, setSelectedMonth] = useState<number>(filters.month || new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(filters.year || currentYear);

    const handleFilterChange = (type: 'month' | 'all' | 'select_month', m = selectedMonth, y = selectedYear) => {
        setFilterType(type);
        router.get(
            `/students/${student.id}/show`,
            {
                type,
                month: type === 'select_month' ? m : undefined,
                year: type === 'select_month' ? y : undefined,
                per_page: sessions.per_page !== 20 ? sessions.per_page : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        params.set('type', filterType);
        if (filterType === 'select_month') {
            params.set('month', String(selectedMonth));
            params.set('year', String(selectedYear));
        }
        window.location.href = `/students/${student.id}/export-attendances?${params.toString()}`;
    };

    const getAttendanceBadge = (status: number) => {
        switch (status) {
            case ATTENDANCE_STATUS_PRESENT:
                return <Badge variant="active">Có mặt</Badge>;
            case ATTENDANCE_STATUS_ABSENT:
                return <Badge variant="danger">Vắng</Badge>;
            case ATTENDANCE_STATUS_LATE:
                return <Badge variant="pending">Đi trễ</Badge>;
            case ATTENDANCE_STATUS_EXCUSED:
                return <Badge variant="expired">Có phép</Badge>;
            default:
                return <Badge variant="info">Chưa điểm danh</Badge>;
        }
    };

    const formatGender = (gender: number | null) => {
        if (!gender) return '—';
        return GENDER_LABELS[gender] || '—';
    };

    const formatRelationship = (rel: string | null) => {
        if (!rel) return '—';
        const map: Record<string, string> = {
            father: 'Bố / Cha',
            mother: 'Mẹ',
            guardian: 'Người giám hộ',
            other: 'Khác',
        };
        return map[rel] || rel;
    };

    const yearOptions = [];
    for (let y = currentYear + 1; y >= 2024; y--) {
        yearOptions.push(y);
    }

    const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

    const getFilterLabel = () => {
        if (filters.type === 'all') return 'Từ trước đến nay';
        if (filters.type === 'select_month') return `Tháng ${filters.month}/${filters.year}`;
        return `Tháng ${filters.month}/${filters.year} (Tháng này)`;
    };

    const attendanceRate =
        stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

    return (
        <AppLayout>
            <Head title={`Chi tiết Học sinh - ${student.full_name}`} />

            <PageHeader
                title={student.full_name}
                subtitle={`Mã học sinh: ${student.student_code || '—'}`}
                breadcrumbs={[
                    { label: 'Trang chủ', href: '/' },
                    { label: 'Học sinh', href: '/students' },
                    { label: 'Chi tiết' },
                ]}
                badge={<StatusBadge status={student.status} entityType="student" />}
                actions={
                    <>
                        <Link href="/students">
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Quay lại
                            </Button>
                        </Link>
                        {canEdit && (
                            <Link href={`/students/${student.id}/edit`}>
                                <Button variant="edit" className="gap-1.5">
                                    <Edit2 className="h-4 w-4" />
                                    Chỉnh sửa
                                </Button>
                            </Link>
                        )}
                    </>
                }
            />

            {/* Thông tin học sinh & Phụ huynh */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Cột 1 & 2: Thông tin cá nhân */}
                <Card className="lg:col-span-2 p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                        <User className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-base font-bold text-gray-900">Thông tin học sinh</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                        <div>
                            <span className="text-gray-500 block text-xs font-medium">Mã học sinh</span>
                            <span className="font-semibold text-gray-900">{student.student_code || '—'}</span>
                        </div>

                        <div>
                            <span className="text-gray-500 block text-xs font-medium">Họ và tên</span>
                            <span className="font-semibold text-gray-900">{student.full_name}</span>
                        </div>

                        <div>
                            <span className="text-gray-500 block text-xs font-medium">Tên đăng nhập</span>
                            <span className="font-semibold text-gray-900">{student.username}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                            <div>
                                <span className="text-gray-500 block text-xs font-medium">Email</span>
                                <span className="font-semibold text-gray-900">{student.email || '—'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                            <div>
                                <span className="text-gray-500 block text-xs font-medium">Số điện thoại</span>
                                <span className="font-semibold text-gray-900">{student.phone || '—'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                            <div>
                                <span className="text-gray-500 block text-xs font-medium">Trung tâm</span>
                                <span className="font-semibold text-gray-900">{student.center?.name || '—'}</span>
                            </div>
                        </div>

                        <div>
                            <span className="text-gray-500 block text-xs font-medium">Giới tính</span>
                            <span className="font-semibold text-gray-900">{formatGender(student.gender)}</span>
                        </div>

                        <div>
                            <span className="text-gray-500 block text-xs font-medium">Ngày sinh</span>
                            <span className="font-semibold text-gray-900">{student.date_of_birth || '—'}</span>
                        </div>

                        <div>
                            <span className="text-gray-500 block text-xs font-medium">Ngày nhập học</span>
                            <span className="font-semibold text-gray-900">{student.admission_date || '—'}</span>
                        </div>

                        <div>
                            <span className="text-gray-500 block text-xs font-medium">Địa chỉ</span>
                            <span className="font-semibold text-gray-900">{student.address || '—'}</span>
                        </div>

                        {student.note && (
                            <div className="sm:col-span-2">
                                <span className="text-gray-500 block text-xs font-medium">Ghi chú</span>
                                <span className="text-gray-900">{student.note}</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Cột 3: Thông tin phụ huynh */}
                <Card className="p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                        <Users className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-base font-bold text-gray-900">Thông tin Phụ huynh</h2>
                    </div>

                    <div className="space-y-4 text-sm">
                        <div>
                            <span className="text-gray-500 block text-xs font-medium">Họ tên phụ huynh</span>
                            <span className="font-semibold text-gray-900">{student.parent_name || '—'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                            <div>
                                <span className="text-gray-500 block text-xs font-medium">Số điện thoại liên hệ</span>
                                <span className="font-semibold text-gray-900">{student.parent_phone || '—'}</span>
                            </div>
                        </div>

                        <div>
                            <span className="text-gray-500 block text-xs font-medium">Mối quan hệ</span>
                            <span className="font-semibold text-gray-900">{formatRelationship(student.parent_relationship)}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Thanh Filter thời gian & Export */}
            <Card className="p-4 mb-6 border border-gray-200 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider mr-1 flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            Kỳ báo cáo:
                        </span>

                        <button
                            type="button"
                            onClick={() => handleFilterChange('month')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterType === 'month'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            Tháng này
                        </button>

                        <button
                            type="button"
                            onClick={() => handleFilterChange('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterType === 'all'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            Tất cả
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setFilterType('select_month');
                                handleFilterChange('select_month', selectedMonth, selectedYear);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterType === 'select_month'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            Chọn tháng
                        </button>

                        {filterType === 'select_month' && (
                            <div className="flex items-center gap-2 ml-1">
                                <select
                                    aria-label="Chọn tháng"
                                    value={selectedMonth}
                                    onChange={(e) => {
                                        const m = Number(e.target.value);
                                        setSelectedMonth(m);
                                        handleFilterChange('select_month', m, selectedYear);
                                    }}
                                    className="px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg shadow-2xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                                >
                                    {monthOptions.map((m) => (
                                        <option key={m} value={m}>
                                            Tháng {m}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    aria-label="Chọn năm"
                                    value={selectedYear}
                                    onChange={(e) => {
                                        const y = Number(e.target.value);
                                        setSelectedYear(y);
                                        handleFilterChange('select_month', selectedMonth, y);
                                    }}
                                    className="px-2.5 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg shadow-2xs text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                                >
                                    {yearOptions.map((y) => (
                                        <option key={y} value={y}>
                                            Năm {y}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {canExport && (
                        <Button
                            variant="secondary"
                            onClick={handleExport}
                            className="gap-1.5 shrink-0 text-xs"
                        >
                            <Download className="h-4 w-4 text-gray-600" />
                            Xuất CSV ({getFilterLabel()})
                        </Button>
                    )}
                </div>
            </Card>

            {/* Thống kê chỉ số điểm danh */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
                <StatMetricCard
                    title="Tổng số buổi học"
                    value={stats.total}
                    subtitle={getFilterLabel()}
                    icon={<CalendarDays className="h-6 w-6" />}
                    iconBgColor="bg-slate-100"
                    iconTextColor="text-slate-700"
                />
                <StatMetricCard
                    title="Có mặt"
                    value={stats.present}
                    subtitle={`Tỉ lệ: ${attendanceRate}%`}
                    icon={<CheckCircle className="h-6 w-6" />}
                    iconBgColor="bg-emerald-50"
                    iconTextColor="text-emerald-700"
                />
                <StatMetricCard
                    title="Vắng"
                    value={stats.absent}
                    subtitle="Vắng không phép"
                    icon={<XCircle className="h-6 w-6" />}
                    iconBgColor="bg-rose-50"
                    iconTextColor="text-rose-700"
                />
                <StatMetricCard
                    title="Đi trễ"
                    value={stats.late}
                    subtitle="Đến muộn"
                    icon={<Clock className="h-6 w-6" />}
                    iconBgColor="bg-amber-50"
                    iconTextColor="text-amber-700"
                />
                <StatMetricCard
                    title="Có phép"
                    value={stats.excused}
                    subtitle="Nghỉ có phép"
                    icon={<AlertCircle className="h-6 w-6" />}
                    iconBgColor="bg-indigo-50"
                    iconTextColor="text-indigo-700"
                />
                <StatMetricCard
                    title="Chưa điểm danh"
                    value={stats.unmarked}
                    subtitle="Buổi học sắp tới"
                    icon={<HelpCircle className="h-6 w-6" />}
                    iconBgColor="bg-gray-100"
                    iconTextColor="text-gray-600"
                />
            </div>

            {/* Danh sách chi tiết các buổi học */}
            <Card className="overflow-hidden border border-gray-200 shadow-2xs">
                <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-base font-bold text-gray-900">
                            Danh sách buổi học ({sessions.total})
                        </h2>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                        Khoảng thời gian: <span className="text-gray-900 font-semibold">{getFilterLabel()}</span>
                    </span>
                </div>

                {!sessions.data || sessions.data.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-gray-700 text-sm">Không có buổi học nào trong khoảng thời gian này</p>
                        <p className="text-xs text-gray-400 mt-1">Hãy thử chọn mốc thời gian khác</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-2xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4">Ngày học</th>
                                    <th className="py-3 px-4">Thời gian</th>
                                    <th className="py-3 px-4">Lớp học</th>
                                    <th className="py-3 px-4">Môn học</th>
                                    <th className="py-3 px-4">Giáo viên</th>
                                    <th className="py-3 px-4">Phòng học</th>
                                    <th className="py-3 px-4 text-center">Điểm danh</th>
                                    <th className="py-3 px-4">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-900">
                                {sessions.data.map((session, idx) => (
                                    <tr key={session.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="py-3.5 px-4 font-semibold whitespace-nowrap">
                                            {session.session_date}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-700">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                <span>
                                                    {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="font-semibold text-gray-900">
                                                {session.class_name || '—'}
                                            </div>
                                            {session.class_code && (
                                                <span className="text-2xs text-gray-400 font-mono">
                                                    {session.class_code}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5">
                                                <BookOpen className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                <span className="font-medium text-gray-900">
                                                    {session.subject_name || '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap text-gray-700">
                                            {session.teacher_name || <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            {session.room_name ? (
                                                <div className="flex items-center gap-1.5 text-gray-700">
                                                    <DoorOpen className="h-3.5 w-3.5 text-gray-400" />
                                                    <span>{session.room_name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            {getAttendanceBadge(session.attendance_status)}
                                        </td>
                                        <td className="py-3.5 px-4 text-gray-500 text-xs max-w-xs truncate">
                                            {session.attendance_note || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {sessions.total > 0 && (
                    <div className="border-t border-gray-100 px-4 pb-4 bg-white">
                        <Pagination
                            links={sessions.links}
                            from={sessions.from}
                            to={sessions.to}
                            total={sessions.total}
                            perPage={sessions.per_page}
                            currentParams={{
                                type: filters.type,
                                ...(filters.type === 'select_month'
                                    ? { month: filters.month, year: filters.year }
                                    : {}),
                                ...(sessions.per_page !== 20
                                    ? { per_page: sessions.per_page }
                                    : {}),
                            }}
                        />
                    </div>
                )}
            </Card>
        </AppLayout>
    );
}
