import { router } from '@inertiajs/react';
import {
    Activity,
    Building2,
    Calendar,
    CircleDollarSign,
    Filter,
    LineChart as LineChartIcon,
    TrendingUp,
    UserPlus,
} from 'lucide-react';
import React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import type { Column } from '../../components/ui/DataTable';
import DataTable from '../../components/ui/DataTable';
import Pagination, { PaginationLink } from '../../components/ui/Pagination';
import AppLayout from '../../layouts/AppLayout';

interface ClassStat {
    id: number;
    code: string;
    name: string;
    student_count: number;
    max_capacity: number;
    occupancy_rate: number;
    status: number;
}

interface SubjectStat {
    subject_id: number;
    name: string;
    code: string;
    count: number;
}

interface SubjectTrendPoint {
    month: string;
    label: string;
    count: number;
}

interface CenterSubject {
    id: number;
    name: string;
    code: string;
}

interface CenterDetail {
    centerId: number | null;
    centerName: string;
    centerCode: string;
    monthlyNewStudents: number;
    monthlyRevenue: number;
    monthlyTuitionCreated: number;
    topSubjectsByMonth: SubjectStat[];
    topSubjectsLast3Months: SubjectStat[];
    subjectTrend: SubjectTrendPoint[];
    centerSubjects: CenterSubject[];
    selectedSubjectId: number | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

interface StatisticsProps {
    role: string;
    isSuperAdmin: boolean;
    allowedCenters?: { id: number; code: string; name: string }[];
    selectedCenterId: number | null;
    selectedMonth: string;
    selectedSubjectId: number | null;
    centerDetail: CenterDetail;
    classStats: PaginatedData<ClassStat>;
}

export const Statistics: React.FC<StatisticsProps> = ({
    role,
    isSuperAdmin,
    allowedCenters,
    selectedCenterId,
    selectedMonth,
    selectedSubjectId,
    centerDetail,
    classStats,
}) => {
    const handleCenterFilterChange = (
        e: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const val = e.target.value ? Number(e.target.value) : undefined;

        router.get(
            '/statistics',
            {
                center_id: val,
                month: selectedMonth,
                per_page:
                    classStats?.per_page !== 15
                        ? classStats?.per_page
                        : undefined,
                page: 1,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value || undefined;

        router.get(
            '/statistics',
            {
                center_id: selectedCenterId || undefined,
                month: val,
                subject_id: selectedSubjectId || undefined,
                per_page:
                    classStats?.per_page !== 15
                        ? classStats?.per_page
                        : undefined,
                page: 1,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSubjectFilterChange = (
        e: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const val = e.target.value ? Number(e.target.value) : undefined;

        router.get(
            '/statistics',
            {
                center_id: selectedCenterId || undefined,
                month: selectedMonth,
                subject_id: val,
                per_page:
                    classStats?.per_page !== 15
                        ? classStats?.per_page
                        : undefined,
                page: 1,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const getClassStatusBadge = (status: number) => {
        switch (status) {
            case 1:
                return <Badge variant="active">Đang học</Badge>;
            case 2:
                return <Badge variant="pending">Tạm ngưng</Badge>;
            case 3:
                return <Badge variant="info">Hoàn thành</Badge>;
            case 4:
                return <Badge variant="danger">Đã đóng</Badge>;
            default:
                return <Badge variant="info">Khác</Badge>;
        }
    };

    // Columns definition for Class Statistics Table (NO center column)
    const classColumns: Column<ClassStat>[] = [
        {
            header: 'Mã Lớp',
            accessorKey: 'code',
            cell: (row) => (
                <span className="font-bold text-gray-900">{row.code}</span>
            ),
        },
        {
            header: 'Tên Lớp Học',
            accessorKey: 'name',
            cell: (row) => (
                <span className="font-medium text-gray-800">{row.name}</span>
            ),
        },
        {
            header: 'Sĩ Số Thực Tế / Tối Đa',
            cell: (row) => (
                <span className="font-semibold text-gray-900">
                    {row.student_count} / {row.max_capacity} học sinh
                </span>
            ),
        },
        {
            header: 'Tỷ Lệ Lấp Đầy',
            cell: (row) => {
                const rate = row.occupancy_rate;
                const badgeVariant =
                    rate >= 80 ? 'active' : rate >= 50 ? 'pending' : 'info';

                return (
                    <div className="flex items-center gap-2.5">
                        <Badge variant={badgeVariant}>{rate}% Tải Lớp</Badge>
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                            <div
                                className={`h-2 rounded-full ${
                                    rate >= 80
                                        ? 'bg-emerald-600'
                                        : rate >= 50
                                          ? 'bg-blue-600'
                                          : 'bg-amber-500'
                                }`}
                                style={{ width: `${rate}%` }}
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Trạng Thái',
            cell: (row) => getClassStatusBadge(row.status),
        },
    ];

    const currentSelectedSubject = centerDetail?.centerSubjects?.find(
        (s) => s.id === (centerDetail?.selectedSubjectId || selectedSubjectId),
    );

    return (
        <AppLayout title="Thống Kê & Báo Cáo Trung Tâm">
            <div className="space-y-8">
                {/* Header Action Bar with Role Badge & Center Selection */}
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Thống Kê & Báo Cáo
                            </h2>
                            <Badge
                                variant={
                                    role === 'admin' ? 'active' : 'pending'
                                }
                            >
                                {isSuperAdmin
                                    ? 'SUPER ADMIN'
                                    : 'QUẢN TRỊ VIÊN TRUNG TÂM'}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-600">
                            Trung tâm:{' '}
                            <span className="font-semibold text-emerald-700">
                                {centerDetail?.centerName || 'N/A'} (
                                {centerDetail?.centerCode || 'N/A'})
                            </span>
                        </p>
                    </div>

                    {/* Scope Filter Dropdown for Super Admin */}
                    {isSuperAdmin &&
                        allowedCenters &&
                        allowedCenters.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-gray-500" />
                                <select
                                    value={selectedCenterId || ''}
                                    onChange={handleCenterFilterChange}
                                    className="min-w-[240px] w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden"
                                >
                                    {allowedCenters.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                </div>

                {/* Filter Month Section */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                        <span>Kỳ Báo Cáo Thống Kê:</span>
                        <span className="font-bold text-gray-900">
                            Tháng {selectedMonth?.split('-').reverse().join('/')}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <label
                            htmlFor="month-filter-input"
                            className="text-sm font-medium text-gray-600"
                        >
                            Chọn tháng:
                        </label>
                        <input
                            id="month-filter-input"
                            type="month"
                            value={selectedMonth}
                            onChange={handleMonthChange}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden"
                        />
                    </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {/* KPI 1: New Students in Month */}
                    <Card className="bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                    Học Sinh Mới Trong Tháng
                                </p>
                                <h4 className="mt-2 text-3xl font-bold text-gray-900">
                                    {centerDetail?.monthlyNewStudents || 0}
                                </h4>
                                <p className="mt-1 text-xs text-emerald-600 font-medium">
                                    Đăng ký mới kỳ{' '}
                                    {selectedMonth
                                        ?.split('-')
                                        .reverse()
                                        .join('/')}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <UserPlus className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>

                    {/* KPI 2: Revenue in Month */}
                    <Card className="bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                    Tiền Thu Được Trong Tháng
                                </p>
                                <h4 className="mt-2 text-2xl font-bold text-gray-900">
                                    {formatVND(
                                        centerDetail?.monthlyRevenue || 0,
                                    )}
                                </h4>
                                <p className="mt-1 text-xs text-blue-600 font-medium">
                                    Đợt nộp thực tế (cũ & mới)
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <CircleDollarSign className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>

                    {/* KPI 3: Tuition Added in Month */}
                    <Card className="bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                                    Tổng Học Phí Thêm Mới
                                </p>
                                <h4 className="mt-2 text-2xl font-bold text-gray-900">
                                    {formatVND(
                                        centerDetail?.monthlyTuitionCreated ||
                                            0,
                                    )}
                                </h4>
                                <p className="mt-1 text-xs text-purple-600 font-medium">
                                    Học phí phát sinh từ HS mới
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* 2 Bar Charts Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Chart A: Top Subjects in Selected Month */}
                    <Card
                        title={`Top Môn Học Đăng Ký Nhiều Nhất - Tháng ${selectedMonth?.split('-').reverse().join('/')}`}
                    >
                        <div className="h-80 w-full pt-4">
                            {centerDetail?.topSubjectsByMonth &&
                            centerDetail.topSubjectsByMonth.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={centerDetail.topSubjectsByMonth}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#e5e7eb"
                                        />
                                        <XAxis
                                            dataKey="code"
                                            tick={{
                                                fontSize: 12,
                                                fill: '#4b5563',
                                                fontWeight: 600,
                                            }}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{
                                                fontSize: 12,
                                                fill: '#4b5563',
                                            }}
                                        />
                                        <Tooltip
                                            formatter={(
                                                value: any,
                                                _name: any,
                                                item: any,
                                            ) => [
                                                `${value} lượt đăng ký`,
                                                item.payload.name,
                                            ]}
                                        />
                                        <Bar
                                            dataKey="count"
                                            name="Lượt đăng ký"
                                            fill="#059669"
                                            radius={[6, 6, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                                    <Activity className="mb-2 h-10 w-10 text-gray-300" />
                                    <p className="text-sm">
                                        Chưa có lượt đăng ký môn học nào trong
                                        tháng này
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Chart B: Top Subjects in Last 3 Months */}
                    <Card title="Top Môn Học Đăng Ký Nhiều Nhất - 3 Tháng Gần Nhất">
                        <div className="h-80 w-full pt-4">
                            {centerDetail?.topSubjectsLast3Months &&
                            centerDetail.topSubjectsLast3Months.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={
                                            centerDetail.topSubjectsLast3Months
                                        }
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                            stroke="#e5e7eb"
                                        />
                                        <XAxis
                                            dataKey="code"
                                            tick={{
                                                fontSize: 12,
                                                fill: '#4b5563',
                                                fontWeight: 600,
                                            }}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{
                                                fontSize: 12,
                                                fill: '#4b5563',
                                            }}
                                        />
                                        <Tooltip
                                            formatter={(
                                                value: any,
                                                _name: any,
                                                item: any,
                                            ) => [
                                                `${value} lượt đăng ký`,
                                                item.payload.name,
                                            ]}
                                        />
                                        <Bar
                                            dataKey="count"
                                            name="Lượt đăng ký"
                                            fill="#2563eb"
                                            radius={[6, 6, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                                    <Activity className="mb-2 h-10 w-10 text-gray-300" />
                                    <p className="text-sm">
                                        Chưa có dữ liệu đăng ký trong 3 tháng
                                        vừa qua
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Line Chart: Registration Trend (6 months) */}
                <Card>
                    <div className="mb-4 flex flex-col justify-between gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                            <LineChartIcon className="h-5 w-5 text-purple-600" />
                            <div>
                                <h3 className="text-base font-bold text-gray-900">
                                    Biến Động Đăng Ký Môn Học Trong 6 Tháng Gần
                                    Nhất
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Đang xem môn:{' '}
                                    <span className="font-semibold text-purple-700">
                                        {currentSelectedSubject?.name ||
                                            'Chưa chọn môn'}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Subject selector for line chart */}
                        {centerDetail?.centerSubjects &&
                            centerDetail.centerSubjects.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-gray-500" />
                                    <select
                                        value={
                                            centerDetail.selectedSubjectId || ''
                                        }
                                        onChange={handleSubjectFilterChange}
                                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 shadow-xs focus:border-purple-500 focus:outline-hidden"
                                    >
                                        {centerDetail.centerSubjects.map(
                                            (sub) => (
                                                <option
                                                    key={sub.id}
                                                    value={sub.id}
                                                >
                                                    {sub.name} ({sub.code})
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </div>
                            )}
                    </div>

                    <div className="h-80 w-full pt-2">
                        {centerDetail?.subjectTrend &&
                        centerDetail.subjectTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={centerDetail.subjectTrend}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#e5e7eb"
                                    />
                                    <XAxis
                                        dataKey="label"
                                        tick={{
                                            fontSize: 12,
                                            fill: '#4b5563',
                                            fontWeight: 600,
                                        }}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{
                                            fontSize: 12,
                                            fill: '#4b5563',
                                        }}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => [
                                            `${value} lượt đăng ký`,
                                            'Lượt đăng ký',
                                        ]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        name="Lượt đăng ký"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        dot={{
                                            r: 5,
                                            fill: '#8b5cf6',
                                            strokeWidth: 2,
                                            stroke: '#ffffff',
                                        }}
                                        activeDot={{ r: 7 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                                <Activity className="mb-2 h-10 w-10 text-gray-300" />
                                <p className="text-sm">
                                    Trung tâm chưa có môn học nào để theo dõi
                                    biến động
                                </p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* TanStack Table: Detailed Class Occupancy (NO center column) */}
                <Card title="Bảng Chi Tiết Sĩ Số Học Sinh Cho Từng Lớp Học">
                    <DataTable
                        columns={classColumns}
                        data={classStats?.data || []}
                        emptyMessage="Không có dữ liệu lớp học"
                    />
                    {classStats && (
                        <div className="mt-4">
                            <Pagination
                                links={classStats.links}
                                from={classStats.from}
                                to={classStats.to}
                                total={classStats.total}
                                perPage={classStats.per_page}
                                currentParams={{
                                    center_id: selectedCenterId,
                                    month: selectedMonth,
                                    subject_id: selectedSubjectId,
                                }}
                                onPerPageChange={(newPerPage) => {
                                    router.get(
                                        '/statistics',
                                        {
                                            center_id:
                                                selectedCenterId || undefined,
                                            month: selectedMonth,
                                            subject_id:
                                                selectedSubjectId || undefined,
                                            per_page: newPerPage,
                                            page: 1,
                                        },
                                        { preserveState: true, preserveScroll: true },
                                    );
                                }}
                            />
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
};

export default Statistics;


