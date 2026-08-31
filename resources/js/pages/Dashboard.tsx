import {
    CENTER_STATUS_ACTIVE,
    CENTER_STATUS_PAUSED,
    CENTER_STATUS_EXPIRED,
    CENTER_STATUS_LABELS,
    PLAN_TYPE_FREE,
    PLAN_TYPE_LABELS,
    PLAN_TYPE_PREMIUM,
    SESSION_STATUS_CANCELLED,
} from '@/constants/enums';
import { Link,router } from '@inertiajs/react';
import {
AlertCircle,
AlertTriangle,
ArrowRight,
BookOpen,
Building2,
Calendar,
CalendarCheck,
ChevronLeft,
ChevronRight,
Clock,
DollarSign,
DoorOpen,
GraduationCap,
Printer,
Search,
User,
UserCheck,
UserPlus,
Users,
Wallet,
} from 'lucide-react';
import React,{ useState } from 'react';
import {
Bar,
BarChart,
CartesianGrid,
ResponsiveContainer,
Tooltip,
XAxis,
YAxis,
} from 'recharts';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import CustomPieChart from '../components/ui/CustomPieChart';
import DataTable,{ Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import AppLayout from '../layouts/AppLayout';

export const Dashboard: React.FC<any> = (props) => {
    const role = props.role || 'super_admin';
    const stats = props.stats || {};

    const [examSearch, setExamSearch] = useState('');
    const [selectedSession, setSelectedSession] = useState<any | null>(null);

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(Number(amount) || 0);
    };

    // Render Super Admin Dashboard
    if (role === 'super_admin') {
        const regPieData = props.registration_pie_chart || [];
        const regBarData = props.monthly_registrations_bar_chart || [];
        const nonRenewedPieData = props.non_renewed_pie_chart || [];
        const recentCenters = props.recent_centers || [];

        const centerColumns: Column<any>[] = [
            {
                header: 'Mã Trung Tâm',
                accessorKey: 'code',
                cell: (row) => <span className="font-semibold text-gray-900 font-mono text-xs">{row.code}</span>,
            },
            {
                header: 'Tên Trung Tâm',
                accessorKey: 'name',
                cell: (row) => <span className="font-medium text-gray-800 text-sm">{row.name}</span>,
            },
            {
                header: 'Gói Dịch Vụ',
                cell: (row) => {
                    const planType = row.plan_type;
                    const isAdvanced = planType === PLAN_TYPE_PREMIUM;
                    const isTrial = planType === PLAN_TYPE_FREE;

                    return (
                        <Badge variant={isAdvanced ? 'active' : isTrial ? 'info' : 'pending'}>
                            {PLAN_TYPE_LABELS[planType] || (row.subscription_plan_id ? `Gói #${row.subscription_plan_id}` : 'Cơ Bản')}
                        </Badge>
                    );
                },
            },
            {
                header: 'Số Điện Thoại',
                accessorKey: 'phone',
                cell: (row) => <span className="text-sm text-gray-700">{row.phone || 'N/A'}</span>,
            },
            {
                header: 'Trạng Thái',
                cell: (row) => {
                    switch (row.status) {
                        case CENTER_STATUS_ACTIVE:
                            return <Badge variant="active">{CENTER_STATUS_LABELS[CENTER_STATUS_ACTIVE] || 'Đang hoạt động'}</Badge>;
                        case CENTER_STATUS_PAUSED:
                            return <Badge variant="pending">{CENTER_STATUS_LABELS[CENTER_STATUS_PAUSED] || 'Tạm dừng'}</Badge>;
                        case CENTER_STATUS_EXPIRED:
                            return <Badge variant="danger">{CENTER_STATUS_LABELS[CENTER_STATUS_EXPIRED] || 'Đã hết hạn'}</Badge>;
                        default:
                            return <Badge variant="expired">Tạm dừng</Badge>;
                    }
                },
            },
        ];

        return (
            <AppLayout title="Bảng Điều Khiển - Super Admin">
                <div className="space-y-8">
                    <Card className="border-gray-200 bg-white p-6">
                        <h2 className="text-2xl font-bold text-gray-900">Tổng Quan Hệ Thống (Super Admin)</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Thống kê toàn bộ các trung tâm đào tạo, tình hình đăng ký mới và gia hạn gói dịch vụ.
                        </p>
                    </Card>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-white p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">Tổng Trung Tâm</p>
                                    <h4 className="text-2xl font-bold text-gray-900 mt-1">{stats.centers ?? 0}</h4>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <Building2 className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-white p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">Tổng Học Sinh</p>
                                    <h4 className="text-2xl font-bold text-gray-900 mt-1">{stats.students ?? 0}</h4>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-white p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">Tổng Giáo Viên</p>
                                    <h4 className="text-2xl font-bold text-gray-900 mt-1">{stats.teachers ?? 0}</h4>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                    <Users className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-white p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">Tổng Lớp Học</p>
                                    <h4 className="text-2xl font-bold text-gray-900 mt-1">{stats.classes ?? 0}</h4>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Super Admin Charts Grid */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Biểu đồ tròn: Lượt đăng ký mới trong tháng theo gói */}
                        <Card title="Lượt Đăng Ký Mới Trong Tháng (Theo Gói Dịch Vụ)" className="lg:col-span-1">
                            <CustomPieChart data={regPieData} height={280} />
                        </Card>

                        {/* Biểu đồ cột: Thống kê số lượng trung tâm đăng ký mới 6 tháng gần nhất */}
                        <Card title="Trung Tâm Đăng Ký Mới (6 Tháng Gần Nhất)" className="lg:col-span-2">
                            <div className="h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={regBarData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 13, fill: '#4b5563', fontWeight: 600 }} />
                                        <YAxis tick={{ fontSize: 13, fill: '#4b5563' }} />
                                        <Tooltip />
                                        <Bar dataKey="centers" name="Số trung tâm" fill="#059669" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Biểu đồ tròn: Trung tâm đến kỳ gia hạn tháng này mà không gia hạn */}
                        <Card title="Tình Hình Gia Hạn Kỳ Tháng Này (Không Gia Hạn)" className="lg:col-span-1">
                            <CustomPieChart data={nonRenewedPieData} height={280} />
                        </Card>

                        {/* Danh sách các trung tâm mới đăng ký */}
                        <Card title="Danh Sách Trung Tâm Mới Đăng Ký Gần Đây" className="lg:col-span-2">
                            <DataTable columns={centerColumns} data={recentCenters} />
                        </Card>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Render Admin Center Dashboard
    if (role === 'admin') {
        const teachersBar = props.teachers_bar_chart || [];
        const studentsBar = props.students_bar_chart || [];
        const tuitionBar = props.tuition_bar_chart || [];
        const classStatusPie = props.class_status_pie || [];
        const todaySessions = props.today_sessions || [];
        const alertStats = props.alert_stats || {
            unattended_today_count: 0,
            upcoming_classes_count: 0,
            overdue_tuitions_count: 0,
            overdue_tuitions_amount: 0,
        };

        return (
            <AppLayout title="Bảng Điều Khiển - Quản Trị Trung Tâm">
                <div className="space-y-8">
                    {/* Top Header Card */}
                    <Card className="border-gray-200 bg-white p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Tổng Quan Hoạt Động Trung Tâm</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Theo dõi ca học hôm nay, tình hình giảng dạy, tăng trưởng học sinh và tình hình thu học phí.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Hôm nay: {new Date().toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Row 1 — 6 Metric Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <Card className="bg-white p-4 shadow-xs border-l-4 border-l-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Tổng Học Sinh</p>
                                    <h4 className="text-xl font-black text-gray-900 mt-1">{stats.students ?? 0}</h4>
                                </div>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                    <GraduationCap className="h-5 w-5" />
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-white p-4 shadow-xs border-l-4 border-l-teal-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xs font-bold uppercase tracking-wider text-teal-700">HS Mới Tháng Này</p>
                                    <h4 className="text-xl font-black text-teal-800 mt-1">{stats.new_students_this_month ?? 0}</h4>
                                </div>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                                    <UserPlus className="h-5 w-5" />
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-white p-4 shadow-xs border-l-4 border-l-purple-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Tổng Giáo Viên</p>
                                    <h4 className="text-xl font-black text-gray-900 mt-1">{stats.teachers ?? 0}</h4>
                                </div>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-white p-4 shadow-xs border-l-4 border-l-emerald-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xs font-bold uppercase tracking-wider text-gray-500">Lớp Hoạt Động</p>
                                    <h4 className="text-xl font-black text-gray-900 mt-1">{stats.active_classes ?? 0}</h4>
                                </div>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                    <BookOpen className="h-5 w-5" />
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-white p-4 shadow-xs border-l-4 border-l-indigo-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xs font-bold uppercase tracking-wider text-indigo-700">
                                        {stats?.last_month_name ? `Thu ${stats.last_month_name}` : 'Thu Tháng Trước'}
                                    </p>
                                    <h4 className="text-base font-extrabold text-indigo-700 mt-1 truncate" title={formatCurrency(stats?.last_month_paid_amount || 0)}>
                                        {formatCurrency(stats?.last_month_paid_amount || 0)}
                                    </h4>
                                </div>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                    <DollarSign className="h-5 w-5" />
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-white p-4 shadow-xs border-l-4 border-l-emerald-600">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-2xs font-bold uppercase tracking-wider text-emerald-700">
                                        {stats?.this_month_name ? `Thu ${stats.this_month_name}` : 'Thu Tháng Này'}
                                    </p>
                                    <h4 className="text-base font-extrabold text-emerald-700 mt-1 truncate" title={formatCurrency(stats?.this_month_paid_amount || 0)}>
                                        {formatCurrency(stats?.this_month_paid_amount || 0)}
                                    </h4>
                                </div>
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                    <Wallet className="h-5 w-5" />
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Row 2 — Ca Học Hôm Nay & Cảnh Báo Nhanh */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Ca Học Hôm Nay (2 Cols) */}
                        <Card
                            title={`Lịch Học Hôm Nay (${todaySessions.length} ca)`}
                            className="lg:col-span-2 flex flex-col justify-between"
                        >
                            {todaySessions.length === 0 ? (
                                <div className="py-12 text-center text-sm text-gray-400 italic">
                                    Hôm nay trung tâm không có ca học nào được xếp lịch.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-2xs font-bold uppercase text-gray-500 bg-slate-50/70">
                                                <th className="py-2.5 px-3">Giờ Học</th>
                                                <th className="py-2.5 px-3">Lớp & Môn Học</th>
                                                <th className="py-2.5 px-3">Giáo Viên & Phòng</th>
                                                <th className="py-2.5 px-3">Trạng Thái</th>
                                                <th className="py-2.5 px-3 text-right">Thao Tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                            {todaySessions.map((session: any) => (
                                                <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="py-3 px-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                                            <span>{session.time}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <div className="font-bold text-gray-900">{session.class_name}</div>
                                                        <div className="text-2xs text-gray-500">{session.subject_name}</div>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <div className="font-medium text-gray-900">{session.teacher_name}</div>
                                                        <div className="text-2xs text-gray-500">{session.room_name}</div>
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        {session.is_attended ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-100 text-emerald-800">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                                                Đã điểm danh ({session.attendance_count} HS)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-rose-100 text-rose-800">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                                                                Chưa điểm danh
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-3 text-right whitespace-nowrap">
                                                        <Link href={`/attendance/session/${session.session_id}`}>
                                                            <Button
                                                                variant={session.is_attended ? 'secondary' : 'success'}
                                                                size="sm"
                                                                icon={<UserCheck className="w-3.5 h-3.5" />}
                                                            >
                                                                {session.is_attended ? 'Xem Lại' : 'Điểm Danh'}
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>

                        {/* Cảnh Báo & Nhắc Nhở Nhanh (1 Col) */}
                        <Card title="Cảnh Báo & Nhắc Nhở" className="lg:col-span-1 space-y-3">
                            {/* Alert 1: Điểm danh */}
                            <div className={`p-3.5 rounded-xl border transition-all ${
                                alertStats.unattended_today_count > 0
                                    ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                            }`}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg shrink-0 ${
                                        alertStats.unattended_today_count > 0
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-emerald-600 text-white'
                                    }`}>
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold">
                                            {alertStats.unattended_today_count > 0
                                                ? `Có ${alertStats.unattended_today_count} ca học chưa điểm danh`
                                                : 'Điểm danh hôm nay đầy đủ'}
                                        </div>
                                        <p className="mt-0.5 text-2xs opacity-80 leading-relaxed">
                                            {alertStats.unattended_today_count > 0
                                                ? 'Hãy nhắc nhở giáo viên phụ trách hoàn tất điểm danh trước cuối ngày.'
                                                : 'Tất cả các ca học đã diễn ra hôm nay đều đã hoàn tất điểm danh.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Alert 2: Lớp sắp khai giảng */}
                            <div className="p-3.5 rounded-xl border bg-blue-50/80 border-blue-200 text-blue-900">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
                                        <CalendarCheck className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold">
                                            {alertStats.upcoming_classes_count > 0
                                                ? `${alertStats.upcoming_classes_count} lớp sắp khai giảng (7 ngày)`
                                                : 'Không có lớp khai giảng sắp tới'}
                                        </div>
                                        <p className="mt-0.5 text-2xs opacity-80 leading-relaxed">
                                            {alertStats.upcoming_classes_count > 0
                                                ? 'Kiểm tra danh sách học sinh và phân công giáo viên trước ngày học đầu tiên.'
                                                : 'Hiện không có lớp học mới dự kiến mở trong tuần tới.'}
                                        </p>
                                        {alertStats.upcoming_classes_count > 0 && (
                                            <Link
                                                href="/classes"
                                                className="mt-1.5 inline-flex items-center gap-1 text-2xs font-bold text-blue-700 hover:underline"
                                            >
                                                Xem danh sách lớp <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Alert 3: Học phí quá hạn */}
                            <div className={`p-3.5 rounded-xl border transition-all ${
                                alertStats.overdue_tuitions_count > 0
                                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg shrink-0 ${
                                        alertStats.overdue_tuitions_count > 0
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-slate-400 text-white'
                                    }`}>
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold">
                                            {alertStats.overdue_tuitions_count > 0
                                                ? `${alertStats.overdue_tuitions_count} khoản học phí quá hạn`
                                                : 'Không có học phí quá hạn'}
                                        </div>
                                        {alertStats.overdue_tuitions_count > 0 ? (
                                            <>
                                                <p className="mt-0.5 text-2xs opacity-80 leading-relaxed">
                                                    Tổng tiền còn nợ: <strong className="font-bold">{formatCurrency(alertStats.overdue_tuitions_amount || 0)}</strong>
                                                </p>
                                                <Link
                                                    href="/tuitions"
                                                    className="mt-1.5 inline-flex items-center gap-1 text-2xs font-bold text-amber-800 hover:underline"
                                                >
                                                    Xem chi tiết học phí <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            </>
                                        ) : (
                                            <p className="mt-0.5 text-2xs opacity-80 leading-relaxed">
                                                Tất cả học viên đã thanh toán học phí đúng hạn.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Row 3 — Biểu Đồ Doanh Thu Thu Học Phí & Trạng Thái Lớp Học */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Biểu đồ cột: Doanh thu thu học phí 6 tháng */}
                        <Card title="Doanh Thu Thu Học Phí (6 Tháng Gần Nhất)" className="lg:col-span-2">
                            <div className="h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={tuitionBar}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 13, fill: '#4b5563', fontWeight: 600 }} />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: '#4b5563' }}
                                            tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(Number(value))}
                                        />
                                        <Tooltip
                                            formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Số tiền thu']}
                                        />
                                        <Bar dataKey="amount" name="Thu học phí" fill="#059669" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Biểu đồ tròn: Trạng thái lớp học */}
                        <Card title="Phân Bố Trạng Thái Lớp Học" className="lg:col-span-1">
                            <CustomPieChart data={classStatusPie} height={280} />
                        </Card>
                    </div>

                    {/* Row 4 — Biểu Đồ Tăng Trưởng Học Sinh & Giáo Viên Mới */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card title="Số Lượng Học Sinh Mới Đăng Ký (6 Tháng)">
                            <div className="h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={studentsBar}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 13, fill: '#4b5563', fontWeight: 600 }} />
                                        <YAxis tick={{ fontSize: 13, fill: '#4b5563' }} />
                                        <Tooltip />
                                        <Bar dataKey="students" name="Học sinh mới" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card title="Số Lượng Giáo Viên Mới Đăng Ký (6 Tháng)">
                            <div className="h-72 w-full pt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={teachersBar}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 13, fill: '#4b5563', fontWeight: 600 }} />
                                        <YAxis tick={{ fontSize: 13, fill: '#4b5563' }} />
                                        <Tooltip />
                                        <Bar dataKey="teachers" name="Giáo viên mới" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Render Teacher Dashboard
    if (role === 'teacher') {
        const monthlySchedule = props.monthly_schedule || {
            month: '',
            month_label: '',
            prev_month: '',
            next_month: '',
            days: [],
        };
        const myClassesCount = stats.my_classes || 0;
        const myStudentsCount = stats.my_students || 0;

        // Current time in HH:mm
        const now = new Date();
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;
        const todayMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Calculate total sessions in current month
        const totalMonthSessions = (monthlySchedule.days || []).reduce(
            (acc: number, day: any) => (day.is_current_month ? acc + (day.schedules?.length || 0) : acc),
            0,
        );

        const handleMonthChange = (targetMonth: string) => {
            router.get('/dashboard', { month: targetMonth }, { preserveState: true, preserveScroll: true });
        };

        const weekdayHeaders = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

        return (
            <AppLayout title="Bảng Điều Khiển - Giáo Viên">
                <div className="space-y-8">
                    {/* Header Banner & Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <Card className="border-gray-200 bg-white p-6 shadow-xs flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xs font-semibold text-gray-500 uppercase tracking-wider">Tổng Ca Dạy Tháng Này</div>
                                <div className="text-2xl font-black text-gray-900 mt-0.5">{totalMonthSessions} ca học</div>
                            </div>
                        </Card>

                        <Card className="border-gray-200 bg-white p-6 shadow-xs flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xs font-semibold text-gray-500 uppercase tracking-wider">Lớp Đang Phụ Trách</div>
                                <div className="text-2xl font-black text-gray-900 mt-0.5">{myClassesCount} lớp</div>
                            </div>
                        </Card>

                        <Card className="border-gray-200 bg-white p-6 shadow-xs flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-2xs font-semibold text-gray-500 uppercase tracking-wider">Học Sinh Trung Tâm</div>
                                <div className="text-2xl font-black text-gray-900 mt-0.5">{myStudentsCount} học sinh</div>
                            </div>
                        </Card>
                    </div>

                    {/* Monthly Timetable Calendar */}
                    <Card className="border-gray-200 bg-white p-5 shadow-xs space-y-5">
                        {/* Calendar Header & Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
                                    <Clock className="w-5 h-5 text-emerald-600" />
                                    <span>Thời Khóa Biểu Giảng Dạy</span>
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Giờ hiện tại: <strong className="text-emerald-700 font-mono">{currentTimeStr}</strong>. Nhấp vào ca học hôm nay để điểm danh.
                                </p>
                            </div>

                            {/* Month Navigator */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleMonthChange(monthlySchedule.prev_month)}
                                    className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-2xs transition-colors"
                                    title="Tháng trước"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-sm rounded-lg min-w-[130px] text-center">
                                    {monthlySchedule.month_label || 'Lịch Giảng Dạy'}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleMonthChange(monthlySchedule.next_month)}
                                    className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-2xs transition-colors"
                                    title="Tháng sau"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>

                                {monthlySchedule.month !== todayMonthStr && (
                                    <button
                                        type="button"
                                        onClick={() => handleMonthChange(todayMonthStr)}
                                        className="ml-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors"
                                    >
                                        Hôm nay
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Weekday Headers (Desktop) */}
                        <div className="hidden lg:grid grid-cols-7 gap-2.5 text-center font-bold text-xs text-gray-600 uppercase tracking-wider pb-1">
                            {weekdayHeaders.map((header, idx) => (
                                <div
                                    key={header}
                                    className={`py-2 rounded-lg ${idx >= 5 ? 'bg-amber-50/70 text-amber-900 font-bold' : 'bg-slate-100/70 text-slate-700'}`}
                                >
                                    {header}
                                </div>
                            ))}
                        </div>

                        {/* Month Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                            {(monthlySchedule.days || []).map((dayItem: any, index: number) => {
                                const isToday = Boolean(dayItem.is_today);
                                const isCurrentMonth = Boolean(dayItem.is_current_month);
                                const schedules = dayItem.schedules || [];

                                return (
                                    <div
                                        key={`${dayItem.date}-${index}`}
                                        className={`flex flex-col rounded-xl border transition-all duration-200 min-h-[140px] ${
                                            isToday
                                                ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-xs'
                                                : isCurrentMonth
                                                  ? 'border-gray-200 bg-white hover:border-gray-300'
                                                  : 'border-gray-100 bg-slate-50/50 opacity-60'
                                        }`}
                                    >
                                        {/* Day Cell Header */}
                                        <div
                                            className={`px-2.5 py-1.5 border-b flex items-center justify-between rounded-t-xl text-xs ${
                                                isToday
                                                    ? 'bg-emerald-600 text-white font-bold'
                                                    : isCurrentMonth
                                                      ? 'bg-slate-50/90 border-gray-100 text-gray-800 font-semibold'
                                                      : 'bg-slate-100/50 border-gray-100 text-gray-400 font-normal'
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <span className="lg:hidden text-2xs font-medium opacity-80">{dayItem.day_name},</span>
                                                <span className={`font-mono ${isToday ? 'text-sm font-black' : 'font-bold'}`}>
                                                    {dayItem.day_number}
                                                </span>
                                            </div>

                                            {isToday && (
                                                <span className="text-3xs px-1.5 py-0.2 bg-white text-emerald-800 rounded-full font-bold">
                                                    Hôm nay
                                                </span>
                                            )}

                                            {!isToday && schedules.length > 0 && (
                                                <span className="text-3xs px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
                                                    {schedules.length} ca
                                                </span>
                                            )}
                                        </div>

                                        {/* Day Cell Sessions */}
                                        <div className="p-1.5 flex-1 space-y-1 overflow-y-auto max-h-[220px]">
                                            {schedules.length > 0 ? (
                                                schedules.map((s: any) => (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => setSelectedSession(s)}
                                                        className={`w-full text-left px-2 py-1.5 rounded-lg border text-2xs font-bold flex items-center justify-between gap-1 transition-all shadow-2xs cursor-pointer ${
                                                            isToday
                                                                ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 hover:shadow-xs'
                                                                : 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                                                        }`}
                                                        title={`Nhấp xem chi tiết ca: ${s.time} - ${s.class_name}`}
                                                    >
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <Clock className={`w-3.5 h-3.5 shrink-0 ${isToday ? 'text-emerald-100' : 'text-emerald-600'}`} />
                                                            <span className="font-mono truncate">Ca: {s.time}</span>
                                                        </div>
                                                        {isToday && (
                                                            <span className="shrink-0 text-3xs px-1 py-0.2 bg-white text-emerald-800 rounded font-black">
                                                                Hôm nay
                                                            </span>
                                                        )}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="h-full flex items-center justify-center text-center py-3">
                                                    <span className="text-3xs text-gray-300 italic">-</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Session Detail Modal */}
                    <Modal
                        isOpen={Boolean(selectedSession)}
                        onClose={() => setSelectedSession(null)}
                        title="Chi Tiết Ca Học"
                        maxWidth="lg"
                        footer={
                            <div className="flex items-center justify-end gap-2 w-full">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setSelectedSession(null)}
                                >
                                    Đóng
                                </Button>
                                {selectedSession?.class_id && (
                                    <Link
                                        href={`/classes/${selectedSession.class_id}/schedule?date=${selectedSession.session_date}`}
                                    >
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            icon={<Calendar className="w-4 h-4 text-emerald-600" />}
                                        >
                                            Thời Khóa Biểu Lớp
                                        </Button>
                                    </Link>
                                )}
                                {selectedSession?.session_id && (
                                    (!selectedSession.status || Number(selectedSession.status) !== SESSION_STATUS_CANCELLED) ? (
                                        <Link href={`/attendance/session/${selectedSession.session_id}`}>
                                            <Button
                                                variant="success"
                                                size="sm"
                                                icon={<UserCheck className="w-4 h-4" />}
                                            >
                                                Điểm Danh
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled
                                            title="Chỉ có thể điểm danh khi buổi học đang diễn ra hoặc đã kết thúc"
                                            icon={<UserCheck className="w-4 h-4 text-gray-400" />}
                                            className="opacity-60 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-400"
                                        >
                                            Điểm Danh
                                        </Button>
                                    )
                                )}
                            </div>
                        }
                    >
                        {selectedSession && (
                            <div className="space-y-4 text-sm text-gray-800">
                                {/* Header info */}
                                <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-2 bg-emerald-600 text-white rounded-lg">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-2xs font-bold uppercase text-emerald-800">Khung Giờ Học</div>
                                            <div className="text-base font-black text-emerald-950 font-mono">
                                                Ca: {selectedSession.time}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={selectedSession.is_today ? 'active' : 'pending'}>
                                        {selectedSession.is_today ? 'Hôm Nay' : selectedSession.session_date}
                                    </Badge>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                        <div className="text-2xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                            <span>Lớp Học</span>
                                        </div>
                                        <div className="font-bold text-gray-900 text-sm">{selectedSession.class_name}</div>
                                        {selectedSession.class_code && (
                                            <div className="font-mono text-xs text-gray-500">Mã: {selectedSession.class_code}</div>
                                        )}
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                        <div className="text-2xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                            <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                                            <span>Môn Học</span>
                                        </div>
                                        <div className="font-bold text-gray-900 text-sm">{selectedSession.subject_name}</div>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                        <div className="text-2xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                            <DoorOpen className="w-3.5 h-3.5 text-amber-600" />
                                            <span>Phòng Học</span>
                                        </div>
                                        <div className="font-bold text-gray-900 text-sm">{selectedSession.room_name || 'Chưa xếp phòng'}</div>
                                    </div>

                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                        <div className="text-2xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Ngày Học</span>
                                        </div>
                                        <div className="font-bold text-gray-900 text-sm font-mono">{selectedSession.session_date}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Modal>
                </div>
            </AppLayout>
        );
    }

    // Render Student Dashboard
    const monthlySchedule = props.monthly_schedule || {
        month: '',
        month_label: '',
        prev_month: '',
        next_month: '',
        days: [],
    };
    const myClassesCount = stats.my_classes || 0;
    const examCount = stats.exam_count || (props.exam_results?.length || 0);

    // Current time in HH:mm
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const todayMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Calculate total sessions in current month
    const totalMonthSessions = (monthlySchedule.days || []).reduce(
        (acc: number, day: any) => (day.is_current_month ? acc + (day.schedules?.length || 0) : acc),
        0,
    );

    const handleMonthChange = (targetMonth: string) => {
        router.get('/dashboard', { month: targetMonth }, { preserveState: true, preserveScroll: true });
    };

    const weekdayHeaders = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
    const examResults = props.exam_results || [];

    const filteredExamResults = examResults.filter((item: any) => {
        if (!examSearch) {
            return true;
        }

        const q = examSearch.toLowerCase();

        return (
            item.exam_name?.toLowerCase().includes(q) ||
            item.subject_name?.toLowerCase().includes(q) ||
            item.class_name?.toLowerCase().includes(q)
        );
    });

    const examColumns: Column<any>[] = [
        {
            header: 'Tên Bài Thi',
            accessorKey: 'exam_name',
            cell: (row) => <span className="font-semibold text-gray-900 text-sm">{row.exam_name}</span>,
        },
        {
            header: 'Môn Học',
            accessorKey: 'subject_name',
            cell: (row) => <span className="text-sm text-gray-800">{row.subject_name}</span>,
        },
        {
            header: 'Lớp Học',
            accessorKey: 'class_name',
            cell: (row) => <span className="text-sm text-gray-800">{row.class_name}</span>,
        },
        {
            header: 'Điểm Số',
            cell: (row) => <span className="font-bold text-emerald-600 text-lg">{row.score}</span>,
        },
        {
            header: 'Đánh Giá / Thăng Hạng',
            cell: (row) => <Badge variant={row.score >= 8 ? 'active' : row.score >= 5 ? 'pending' : 'expired'}>{row.grade}</Badge>,
        },
        {
            header: 'Ngày Thi',
            accessorKey: 'exam_date',
            cell: (row) => <span className="text-sm text-gray-600 font-mono">{row.exam_date}</span>,
        },
    ];

    return (
        <AppLayout title="Bảng Điều Khiển - Học Sinh">
            <div className="space-y-8">
                {/* Header Banner & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <Card className="border-gray-200 bg-white p-6 shadow-xs flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xs font-semibold text-gray-500 uppercase tracking-wider">Tổng Ca Học Tháng Này</div>
                            <div className="text-2xl font-black text-gray-900 mt-0.5">{totalMonthSessions} ca học</div>
                        </div>
                    </Card>

                    <Card className="border-gray-200 bg-white p-6 shadow-xs flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xs font-semibold text-gray-500 uppercase tracking-wider">Lớp Đang Học</div>
                            <div className="text-2xl font-black text-gray-900 mt-0.5">{myClassesCount} lớp</div>
                        </div>
                    </Card>

                    <Card className="border-gray-200 bg-white p-6 shadow-xs flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xs font-semibold text-gray-500 uppercase tracking-wider">Bài Thi Đã Tham Gia</div>
                            <div className="text-2xl font-black text-gray-900 mt-0.5">{examCount} bài thi</div>
                        </div>
                    </Card>
                </div>

                {/* Monthly Timetable Calendar */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs space-y-5">
                    {/* Calendar Header & Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2.5">
                                <Clock className="w-5 h-5 text-emerald-600" />
                                <span>Thời Khóa Biểu Học Tập</span>
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Giờ hiện tại: <strong className="text-emerald-700 font-mono">{currentTimeStr}</strong>. Nhấp vào ca học để xem chi tiết.
                            </p>
                        </div>

                        {/* Month Navigator */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleMonthChange(monthlySchedule.prev_month)}
                                className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-2xs transition-colors"
                                title="Tháng trước"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-sm rounded-lg min-w-[130px] text-center">
                                {monthlySchedule.month_label || 'Lịch Học Tập'}
                            </div>

                            <button
                                type="button"
                                onClick={() => handleMonthChange(monthlySchedule.next_month)}
                                className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-2xs transition-colors"
                                title="Tháng sau"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>

                            {monthlySchedule.month !== todayMonthStr && (
                                <button
                                    type="button"
                                    onClick={() => handleMonthChange(todayMonthStr)}
                                    className="ml-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 transition-colors"
                                >
                                    Hôm nay
                                </button>
                            )}

                            <Link href="/student/schedule" className="ml-1">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    icon={<Calendar className="w-4 h-4 text-emerald-600" />}
                                >
                                    Lịch Chi Tiết
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Weekday Headers (Desktop) */}
                    <div className="hidden lg:grid grid-cols-7 gap-2.5 text-center font-bold text-xs text-gray-600 uppercase tracking-wider pb-1">
                        {weekdayHeaders.map((header, idx) => (
                            <div
                                key={header}
                                className={`py-2 rounded-lg ${idx >= 5 ? 'bg-amber-50/70 text-amber-900 font-bold' : 'bg-slate-100/70 text-slate-700'}`}
                            >
                                {header}
                            </div>
                        ))}
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                        {(monthlySchedule.days || []).map((dayItem: any, index: number) => {
                            const isToday = Boolean(dayItem.is_today);
                            const isCurrentMonth = Boolean(dayItem.is_current_month);
                            const schedules = dayItem.schedules || [];

                            return (
                                <div
                                    key={`${dayItem.date}-${index}`}
                                    className={`flex flex-col rounded-xl border transition-all duration-200 min-h-[140px] ${
                                        isToday
                                            ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20 shadow-xs'
                                            : isCurrentMonth
                                              ? 'border-gray-200 bg-white hover:border-gray-300'
                                              : 'border-gray-100 bg-slate-50/50 opacity-60'
                                    }`}
                                >
                                    {/* Day Cell Header */}
                                    <div
                                        className={`px-2.5 py-1.5 border-b flex items-center justify-between rounded-t-xl text-xs ${
                                            isToday
                                                ? 'bg-emerald-600 text-white font-bold'
                                                : isCurrentMonth
                                                  ? 'bg-slate-50/90 border-gray-100 text-gray-800 font-semibold'
                                                  : 'bg-slate-100/50 border-gray-100 text-gray-400 font-normal'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className="lg:hidden text-2xs font-medium opacity-80">{dayItem.day_name},</span>
                                            <span className={`font-mono ${isToday ? 'text-sm font-black' : 'font-bold'}`}>
                                                {dayItem.day_number}
                                            </span>
                                        </div>

                                        {isToday && (
                                            <span className="text-3xs px-1.5 py-0.2 bg-white text-emerald-800 rounded-full font-bold">
                                                Hôm nay
                                            </span>
                                        )}

                                        {!isToday && schedules.length > 0 && (
                                            <span className="text-3xs px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-semibold">
                                                {schedules.length} ca
                                            </span>
                                        )}
                                    </div>

                                    {/* Day Cell Sessions */}
                                    <div className="p-1.5 flex-1 space-y-1 overflow-y-auto max-h-[220px]">
                                        {schedules.length > 0 ? (
                                            schedules.map((s: any) => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => setSelectedSession(s)}
                                                    className={`w-full text-left px-2 py-1.5 rounded-lg border text-2xs font-bold flex items-center justify-between gap-1 transition-all shadow-2xs cursor-pointer ${
                                                        isToday
                                                            ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 hover:shadow-xs'
                                                            : 'bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                                                    }`}
                                                    title={`Nhấp xem chi tiết ca: ${s.time} - ${s.class_name}`}
                                                >
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        <Clock className={`w-3.5 h-3.5 shrink-0 ${isToday ? 'text-emerald-100' : 'text-emerald-600'}`} />
                                                        <span className="font-mono truncate">Ca: {s.time}</span>
                                                    </div>
                                                    {isToday && (
                                                        <span className="shrink-0 text-3xs px-1 py-0.2 bg-white text-emerald-800 rounded font-black">
                                                            Hôm nay
                                                        </span>
                                                    )}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-center py-3">
                                                <span className="text-3xs text-gray-300 italic">-</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Session Detail Modal for Student */}
                <Modal
                    isOpen={Boolean(selectedSession)}
                    onClose={() => setSelectedSession(null)}
                    title="Chi Tiết Ca Học"
                    maxWidth="lg"
                    footer={
                        <div className="flex items-center justify-end gap-2 w-full">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedSession(null)}
                            >
                                Đóng
                            </Button>
                            <Link
                                href={`/student/schedule?date=${selectedSession?.session_date}`}
                            >
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    icon={<Calendar className="w-4 h-4 text-emerald-600" />}
                                >
                                    Xem Lịch Tuần
                                </Button>
                            </Link>
                        </div>
                    }
                >
                    {selectedSession && (
                        <div className="space-y-4 text-sm text-gray-800">
                            {/* Header info */}
                            <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-emerald-600 text-white rounded-lg">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-2xs font-bold uppercase text-emerald-800">Khung Giờ Học</div>
                                        <div className="text-base font-black text-emerald-950 font-mono">
                                            Ca: {selectedSession.time}
                                        </div>
                                    </div>
                                </div>
                                <Badge variant={selectedSession.is_today ? 'active' : 'pending'}>
                                    {selectedSession.is_today ? 'Hôm Nay' : selectedSession.session_date}
                                </Badge>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                    <div className="text-2xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                        <span>Lớp Học</span>
                                    </div>
                                    <div className="font-bold text-gray-900 text-sm">{selectedSession.class_name}</div>
                                    {selectedSession.class_code && (
                                        <div className="font-mono text-xs text-gray-500">Mã: {selectedSession.class_code}</div>
                                    )}
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                    <div className="text-2xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                        <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                                        <span>Môn Học</span>
                                    </div>
                                    <div className="font-bold text-gray-900 text-sm">{selectedSession.subject_name}</div>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                    <div className="text-2xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                        <User className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Giáo Viên Phụ Trách</span>
                                    </div>
                                    <div className="font-bold text-gray-900 text-sm">{selectedSession.teacher_name || 'Đang cập nhật'}</div>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                                    <div className="text-2xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                        <DoorOpen className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Phòng Học</span>
                                    </div>
                                    <div className="font-bold text-gray-900 text-sm">{selectedSession.room_name || 'Chưa xếp phòng'}</div>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5 sm:col-span-2">
                                    <div className="text-2xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Ngày Học</span>
                                    </div>
                                    <div className="font-bold text-gray-900 text-sm font-mono">{selectedSession.session_date}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Kết quả thi có thanh tìm kiếm */}
                <Card
                    title="Bảng Kết Quả Kỳ Thi"
                    headerAction={
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-64">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm bài thi, môn học..."
                                    value={examSearch}
                                    onChange={(e) => setExamSearch(e.target.value)}
                                    className="w-full pl-9 pr-3.5 py-2 text-sm rounded-lg border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <a
                                href="/student/transcript/print"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    icon={<Printer className="w-4 h-4 text-emerald-600" />}
                                >
                                    In / Xuất PDF Bảng Điểm
                                </Button>
                            </a>
                        </div>
                    }
                >
                    <DataTable columns={examColumns} data={filteredExamResults} />
                </Card>
            </div>
        </AppLayout>
    );
};

export default Dashboard;
