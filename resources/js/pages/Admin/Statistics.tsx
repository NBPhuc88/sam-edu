import { router } from '@inertiajs/react';
import { Building2, BookOpen, GraduationCap, Filter } from 'lucide-react';
import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
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
    center_name: string;
    center_code: string;
    student_count: number;
    max_capacity: number;
    occupancy_rate: number;
    status: number;
}

interface CenterStat {
    id: number;
    code: string;
    name: string;
    student_count: number;
    class_count: number;
    teacher_count: number;
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
    centerStats: CenterStat[];
    classStats: PaginatedData<ClassStat>;
    classChartStats?: { id: number; code: string; name: string; student_count: number }[];
    totalClasses?: number;
    selectedCenterId: number | null;
}

export const Statistics: React.FC<StatisticsProps> = ({
    role,
    isSuperAdmin,
    allowedCenters,
    centerStats,
    classStats,
    classChartStats,
    totalClasses,
    selectedCenterId,
}) => {
    const handleCenterFilterChange = (
        e: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const val = e.target.value;

        router.get(
            '/statistics',
            {
                center_id: val || undefined,
                per_page: classStats?.per_page !== 15 ? classStats?.per_page : undefined,
                page: 1,
            },
            { preserveState: true },
        );
    };

    // Columns definition for Class Statistics Table
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
            header: 'Trung Tâm',
            cell: (row) => (
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                    {row.center_name} ({row.center_code})
                </span>
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
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
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
    ];

    return (
        <AppLayout title="Thống Kê Học Sinh Theo Lớp & Trung Tâm">
            <div className="space-y-8">
                {/* Header Action Bar with Role Badge & Center Scope Filter */}
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Thống Kê Sĩ Số Học Sinh
                            </h2>
                            <Badge
                                variant={
                                    role === 'admin' ? 'active' : 'pending'
                                }
                            >
                                Quyền: {role.toUpperCase()}{' '}
                                {isSuperAdmin ? '(Super Admin)' : ''}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                            Báo cáo phân tích lượng học sinh cho từng lớp và từng trung tâm được phân quyền.
                        </p>
                    </div>

                    {/* Scope Filter Dropdown (Super Admin only) */}
                    {isSuperAdmin && allowedCenters && allowedCenters.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Filter className="h-4.5 w-4.5 text-gray-500" />
                            <select
                                value={selectedCenterId || ''}
                                onChange={handleCenterFilterChange}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden min-w-[220px]"
                            >
                                <option value="">
                                    Tất cả Trung tâm được phép
                                </option>
                                {allowedCenters.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.code})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Summary Metrics Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <Card className="bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
                                    Trung Tâm Trong Phạm Vi
                                </p>
                                <h4 className="mt-1.5 text-2xl font-bold text-gray-900">
                                    {centerStats?.length || 0}
                                </h4>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Building2 className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
                                    Tổng Lớp Học Phạm Vi
                                </p>
                                <h4 className="mt-1.5 text-2xl font-bold text-gray-900">
                                    {totalClasses ?? classStats?.total ?? 0}
                                </h4>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <BookOpen className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
                                    Tổng Học Sinh Quản Lý
                                </p>
                                <h4 className="mt-1.5 text-2xl font-bold text-gray-900">
                                    {centerStats
                                        ? centerStats.reduce(
                                              (sum: number, c: CenterStat) =>
                                                  sum + (c.student_count || 0),
                                              0,
                                          )
                                        : 0}
                                </h4>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Recharts Bar Charts Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Chart 1: Students per Center */}
                    <Card title="Thống Kê Học Sinh Theo Trung Tâm">
                        <div className="h-72 w-full pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={centerStats || []}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#e5e7eb"
                                    />
                                    <XAxis
                                        dataKey="code"
                                        tick={{ fontSize: 13, fill: '#4b5563', fontWeight: 600 }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 13, fill: '#4b5563' }}
                                    />
                                    <Tooltip />
                                    <Bar
                                        dataKey="student_count"
                                        name="Học sinh"
                                        fill="#059669"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Chart 2: Students per Class */}
                    <Card title="Thống Kê Học Sinh Theo Lớp Học">
                        <div className="h-72 w-full pt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={classChartStats || classStats?.data || []}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#e5e7eb"
                                    />
                                    <XAxis
                                        dataKey="code"
                                        tick={{ fontSize: 13, fill: '#4b5563', fontWeight: 600 }}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 13, fill: '#4b5563' }}
                                    />
                                    <Tooltip />
                                    <Bar
                                        dataKey="student_count"
                                        name="Học sinh"
                                        fill="#2563eb"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* TanStack Table: Detailed Class Occupancy */}
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
                                currentParams={{ center_id: selectedCenterId }}
                                onPerPageChange={(newPerPage) => {
                                    router.get(
                                        '/statistics',
                                        {
                                            center_id: selectedCenterId || undefined,
                                            per_page: newPerPage,
                                            page: 1,
                                        },
                                        { preserveState: true },
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

