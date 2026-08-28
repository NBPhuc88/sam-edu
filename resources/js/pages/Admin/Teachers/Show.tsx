import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Edit2,
    GraduationCap,
    Mail,
    MapPin,
    Phone,
    User,
    XCircle,
    CalendarDays,
    BookOpen,
    DoorOpen,
    RefreshCw,
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
import { toISODateString } from '@/lib/date';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface Teacher {
    id: number;
    teacher_code: string;
    username: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    specialization: string | null;
    gender: number | null;
    date_of_birth: string | null;
    hire_date: string | null;
    status: number;
    note: string | null;
    center_id: number;
    center?: Center;
}

interface TeacherSessionItem {
    id: number | string;
    session_date: string;
    start_time: string;
    end_time: string;
    status: string;
    topic: string | null;
    note: string | null;
    class_name?: string | null;
    class_code?: string | null;
    subject_name?: string | null;
    subject_code?: string | null;
    room_name?: string | null;
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
    completed: number;
    scheduled: number;
    cancelled: number;
    rescheduled: number;
}

interface PaginatedSessions {
    data: TeacherSessionItem[];
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
    teacher: Teacher;
    sessions: PaginatedSessions;
    stats: StatsData;
    filters: FilterData;
}

export default function TeacherShow({
    teacher,
    sessions,
    stats,
    filters,
}: Props) {
    const currentYear = new Date().getFullYear();
    const { can } = usePermission();
    const canEdit = can('teachers.edit');
    const canExportPermission = can('teachers.export-sessions');
    const canExportPlan = useCanExportCsv();
    const canExport = canExportPermission && canExportPlan;

    const [filterType, setFilterType] = useState<'month' | 'all' | 'select_month'>(filters.type || 'month');
    const [selectedMonth, setSelectedMonth] = useState<number>(filters.month || new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(filters.year || currentYear);

    const handleFilterChange = (type: 'month' | 'all' | 'select_month', m = selectedMonth, y = selectedYear) => {
        setFilterType(type);
        router.get(
            `/teachers/${teacher.id}/show`,
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
        window.location.href = `/teachers/${teacher.id}/export-sessions?${params.toString()}`;
    };

    const getSessionStatusBadge = (status: string, sessionDate?: string, startTime?: string) => {
        const todayIso = new Date().toISOString().split('T')[0];
        const isPast = sessionDate && toISODateString(sessionDate) < todayIso;

        switch (status) {
            case 'completed':
                return <Badge variant="active">Đã hoàn thành</Badge>;
            case 'in_progress':
                return (
                    <span className="inline-flex items-center rounded-md bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800 border border-purple-200">
                        Đang diễn ra
                    </span>
                );
            case 'unattended':
                return <Badge variant="danger">Chưa điểm danh</Badge>;
            case 'cancelled':
                return <Badge variant="danger">Đã hủy</Badge>;
            case 'rescheduled':
                return <Badge variant="expired">Đã đổi lịch</Badge>;
            case 'scheduled':
            default:
                if (isPast) {
                    return <Badge variant="danger">Chưa điểm danh</Badge>;
                }
                if (sessionDate && toISODateString(sessionDate) === todayIso && startTime) {
                    const now = new Date();
                    const [h, m] = startTime.split(':').map(Number);
                    const sessionStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
                    const diffMin = (sessionStart.getTime() - now.getTime()) / (1000 * 60);
                    if (diffMin >= 0 && diffMin <= 10) {
                        return (
                            <span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                                Sắp diễn ra
                            </span>
                        );
                    }
                }
                return <Badge variant="pending">Dự kiến</Badge>;
        }
    };

    const formatGender = (gender: number | null) => {
        if (!gender) return '—';
        if (gender === 1) return 'Nam';
        if (gender === 2) return 'Nữ';
        if (gender === 3) return 'Khác';
        return '—';
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

    return (
        <AppLayout>
            <Head title={`Chi tiết Giáo viên - ${teacher.full_name}`} />

            <PageHeader
                title={teacher.full_name}
                subtitle={`Mã giáo viên: ${teacher.teacher_code || '—'}`}
                breadcrumbs={[
                    { label: 'Trang chủ', href: '/' },
                    { label: 'Giáo viên', href: '/teachers' },
                    { label: 'Chi tiết' },
                ]}
                badge={<StatusBadge status={teacher.status} entityType="teacher" />}
                actions={
                    <>
                        <Link href="/teachers">
                            <Button variant="secondary" className="gap-1.5">
                                <ArrowLeft className="h-4 w-4" />
                                Quay lại
                            </Button>
                        </Link>
                        {canEdit && (
                            <Link href={`/teachers/${teacher.id}/edit`}>
                                <Button variant="edit" className="gap-1.5">
                                    <Edit2 className="h-4 w-4" />
                                    Chỉnh sửa
                                </Button>
                            </Link>
                        )}
                    </>
                }
            />

            {/* Thông tin cá nhân */}
            <Card className="p-6 mb-6 border border-gray-200">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                    <User className="h-5 w-5 text-emerald-600" />
                    <h2 className="text-base font-bold text-gray-900">Thông tin cá nhân & Công tác</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                    <div>
                        <span className="text-gray-500 block text-xs font-medium">Mã giáo viên</span>
                        <span className="font-semibold text-gray-900">{teacher.teacher_code || '—'}</span>
                    </div>

                    <div>
                        <span className="text-gray-500 block text-xs font-medium">Họ và tên</span>
                        <span className="font-semibold text-gray-900">{teacher.full_name}</span>
                    </div>

                    <div>
                        <span className="text-gray-500 block text-xs font-medium">Tên đăng nhập</span>
                        <span className="font-semibold text-gray-900">{teacher.username}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                        <div>
                            <span className="text-gray-500 block text-xs font-medium">Email</span>
                            <span className="font-semibold text-gray-900">{teacher.email || '—'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                        <div>
                            <span className="text-gray-500 block text-xs font-medium">Số điện thoại</span>
                            <span className="font-semibold text-gray-900">{teacher.phone || '—'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                        <div>
                            <span className="text-gray-500 block text-xs font-medium">Trung tâm</span>
                            <span className="font-semibold text-gray-900">{teacher.center?.name || '—'}</span>
                        </div>
                    </div>

                    <div>
                        <span className="text-gray-500 block text-xs font-medium">Chuyên môn</span>
                        <span className="font-semibold text-gray-900">{teacher.specialization || '—'}</span>
                    </div>

                    <div>
                        <span className="text-gray-500 block text-xs font-medium">Giới tính</span>
                        <span className="font-semibold text-gray-900">{formatGender(teacher.gender)}</span>
                    </div>

                    <div>
                        <span className="text-gray-500 block text-xs font-medium">Ngày sinh</span>
                        <span className="font-semibold text-gray-900">{teacher.date_of_birth || '—'}</span>
                    </div>

                    <div>
                        <span className="text-gray-500 block text-xs font-medium">Ngày bắt đầu làm việc</span>
                        <span className="font-semibold text-gray-900">{teacher.hire_date || '—'}</span>
                    </div>

                    <div className="md:col-span-2">
                        <span className="text-gray-500 block text-xs font-medium">Ghi chú</span>
                        <span className="text-gray-900">{teacher.note || '—'}</span>
                    </div>
                </div>
            </Card>

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

            {/* Thống kê chỉ số ca dạy */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
                <StatMetricCard
                    title="Tổng số ca dạy"
                    value={stats.total}
                    subtitle={getFilterLabel()}
                    icon={<CalendarDays className="h-6 w-6" />}
                    iconBgColor="bg-slate-100"
                    iconTextColor="text-slate-700"
                />
                <StatMetricCard
                    title="Đã hoàn thành"
                    value={stats.completed}
                    subtitle={stats.total > 0 ? `${Math.round((stats.completed / stats.total) * 100)}% tổng số` : '0%'}
                    icon={<CheckCircle className="h-6 w-6" />}
                    iconBgColor="bg-emerald-50"
                    iconTextColor="text-emerald-700"
                />
                <StatMetricCard
                    title="Đã lên lịch"
                    value={stats.scheduled}
                    subtitle="Ca học sắp tới"
                    icon={<Clock className="h-6 w-6" />}
                    iconBgColor="bg-blue-50"
                    iconTextColor="text-blue-700"
                />
                <StatMetricCard
                    title="Đã dời lịch"
                    value={stats.rescheduled}
                    subtitle="Thay đổi thời gian"
                    icon={<RefreshCw className="h-6 w-6" />}
                    iconBgColor="bg-amber-50"
                    iconTextColor="text-amber-700"
                />
                <StatMetricCard
                    title="Đã hủy"
                    value={stats.cancelled}
                    subtitle="Báo nghỉ / hủy"
                    icon={<XCircle className="h-6 w-6" />}
                    iconBgColor="bg-rose-50"
                    iconTextColor="text-rose-700"
                />
            </div>

            {/* Danh sách chi tiết các ca dạy */}
            <Card className="overflow-hidden border border-gray-200 shadow-2xs">
                <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-emerald-600" />
                        <h2 className="text-base font-bold text-gray-900">
                            Danh sách ca dạy ({sessions.total})
                        </h2>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                        Khoảng thời gian: <span className="text-gray-900 font-semibold">{getFilterLabel()}</span>
                    </span>
                </div>

                {!sessions.data || sessions.data.length === 0 ? (
                    <div className="py-12 text-center text-gray-500">
                        <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="font-semibold text-gray-700 text-sm">Không có ca dạy nào trong khoảng thời gian này</p>
                        <p className="text-xs text-gray-400 mt-1">Hãy thử chọn mốc thời gian khác</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-2xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4">Ngày dạy</th>
                                    <th className="py-3 px-4">Thời gian</th>
                                    <th className="py-3 px-4">Lớp học</th>
                                    <th className="py-3 px-4">Môn học</th>
                                    <th className="py-3 px-4">Phòng học</th>
                                    <th className="py-3 px-4">Chủ đề bài học</th>
                                    <th className="py-3 px-4 text-center">Trạng thái</th>
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
                                        <td className="py-3.5 px-4 text-gray-700 max-w-xs truncate">
                                            {session.topic || <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            {getSessionStatusBadge(session.status, session.session_date, session.start_time)}
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
