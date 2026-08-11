import {
    Building2,
    Users,
    GraduationCap,
    BookOpen,
    Search,
    Calendar,
    Award,
    CreditCard,
} from 'lucide-react';
import React, { useState } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
} from 'recharts';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import type { Column } from '../components/ui/DataTable';
import DataTable from '../components/ui/DataTable';
import AppLayout from '../layouts/AppLayout';

export const Dashboard: React.FC<any> = (props) => {
    const role = props.role || 'super_admin';
    const stats = props.stats || {};
    const center = props.center || null;

    const [examSearch, setExamSearch] = useState('');

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
                cell: (row) => <span className="font-semibold text-gray-900">{row.code}</span>,
            },
            {
                header: 'Tên Trung Tâm',
                accessorKey: 'name',
                cell: (row) => <span className="font-medium text-gray-800">{row.name}</span>,
            },
            {
                header: 'Gói Dịch Vụ',
                cell: (row) => (
                    <Badge variant={row.subscription_plan === 'yearly' ? 'active' : 'pending'}>
                        {row.subscription_plan === 'yearly' ? 'Gói Theo Năm' : row.subscription_plan === 'monthly' ? 'Gói Hàng Tháng' : 'Dùng Thử 14 Ngày'}
                    </Badge>
                ),
            },
            {
                header: 'Số Điện Thoại',
                accessorKey: 'phone',
            },
            {
                header: 'Trạng Thái',
                cell: (row) => (
                    <Badge variant={row.status === 'active' ? 'active' : 'expired'}>
                        {row.status === 'active' ? 'Đang hoạt động' : 'Chờ kích hoạt'}
                    </Badge>
                ),
            },
        ];

        return (
            <AppLayout title="Bảng Điều Khiển - Super Admin">
                <div className="space-y-8">
                    <Card className="border-gray-200 bg-white">
                        <h2 className="text-xl font-bold text-gray-900">Tổng Quan Hệ Thống (Super Admin)</h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Thống kê toàn bộ các trung tâm đào tạo, tình hình đăng ký mới và gia hạn gói dịch vụ.
                        </p>
                    </Card>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tổng Trung Tâm</p>
                                    <h4 className="text-2xl font-bold text-gray-900">{stats.centers ?? 0}</h4>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                    <Building2 className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tổng Học Sinh</p>
                                    <h4 className="text-2xl font-bold text-gray-900">{stats.students ?? 0}</h4>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tổng Giáo Viên</p>
                                    <h4 className="text-2xl font-bold text-gray-900">{stats.teachers ?? 0}</h4>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                    <Users className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>
                        <Card className="bg-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tổng Lớp Học</p>
                                    <h4 className="text-2xl font-bold text-gray-900">{stats.classes ?? 0}</h4>
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
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={regPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                            {regPieData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Biểu đồ cột: Thống kê số lượng trung tâm đăng ký mới 6 tháng gần nhất */}
                        <Card title="Trung Tâm Đăng Ký Mới (6 Tháng Gần Nhất)" className="lg:col-span-2">
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={regBarData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
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
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={nonRenewedPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} label>
                                            {nonRenewedPieData.map((entry: any, index: number) => (
                                                <Cell key={`cell-nr-${index}`} fill={entry.color || '#ef4444'} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
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
        const classesBar = props.classes_bar_chart || [];

        return (
            <AppLayout title="Bảng Điều Khiển - Admin Quản Lý">
                <div className="space-y-8">
                    <Card className="border-gray-200 bg-white">
                        <h2 className="text-xl font-bold text-gray-900">Thống Kê Trung Tâm Được Quản Lý</h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Theo dõi tăng trưởng Giáo viên, Học sinh và Lớp học mới trong 6 tháng gần nhất.
                        </p>
                    </Card>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <Card className="bg-white">
                            <p className="text-xs font-semibold uppercase text-gray-500">Trung Tâm Phụ Trách</p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">{stats.centers ?? 0}</h4>
                        </Card>
                        <Card className="bg-white">
                            <p className="text-xs font-semibold uppercase text-gray-500">Tổng Học Sinh</p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">{stats.students ?? 0}</h4>
                        </Card>
                        <Card className="bg-white">
                            <p className="text-xs font-semibold uppercase text-gray-500">Tổng Giáo Viên</p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">{stats.teachers ?? 0}</h4>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card title="Số Lượng Giáo Viên Mới Đăng Ký (6 Tháng)">
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={teachersBar}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="teachers" name="Giáo viên mới" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card title="Số Lượng Học Sinh Mới Đăng Ký (6 Tháng)">
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={studentsBar}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="students" name="Học sinh mới" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    <Card title="Số Lượng Lớp Học Thêm Mới (6 Tháng)">
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={classesBar}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="classes" name="Lớp mới" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    // Render Center Manager Dashboard
    if (role === 'center') {
        const studentsBar = props.students_bar_chart || [];
        const classesBar = props.classes_bar_chart || [];

        return (
            <AppLayout title="Bảng Điều Khiển Trung Tâm">
                <div className="space-y-8">
                    <Card className="border-gray-200 bg-white">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{center?.name ?? 'Trung Tâm Giáo Dục'}</h2>
                                <p className="mt-1 text-xs text-gray-500">Mã trung tâm: {center?.code}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="active">Đang hoạt động</Badge>
                                <Button variant="success" size="sm" icon={<CreditCard className="w-4 h-4" />}>
                                    Gia Hạn ZaloPay
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <Card className="bg-white">
                            <p className="text-xs font-semibold uppercase text-gray-500">Học Sinh Đang Hoạt Động (Cùng Lúc)</p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">{stats.students ?? 0}</h4>
                        </Card>
                        <Card className="bg-white">
                            <p className="text-xs font-semibold uppercase text-gray-500">Lớp Học Đang Mở (Cùng Lúc)</p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">{stats.classes ?? 0}</h4>
                        </Card>
                        <Card className="bg-white">
                            <p className="text-xs font-semibold uppercase text-gray-500">Tổng Số Giáo Viên</p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">{stats.teachers ?? 0}</h4>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card title="Số Học Sinh Đăng Ký Mới (6 Tháng Gần Nhất)">
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={studentsBar}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="students" name="Học sinh mới" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card title="Số Lớp Học Mới Khởi Tạo (6 Tháng Gần Nhất)">
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={classesBar}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="classes" name="Lớp mới" fill="#10b981" radius={[4, 4, 0, 0]} />
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
        const weeklySchedule = props.weekly_schedule || [];

        return (
            <AppLayout title="Bảng Điều Khiển - Giáo Viên">
                <div className="space-y-8">
                    <Card className="border-gray-200 bg-white">
                        <h2 className="text-xl font-bold text-gray-900">Lịch Giảng Dạy Trong Tuần</h2>
                        <p className="mt-1 text-xs text-gray-500">Danh sách các ca dạy theo lớp và môn học được phân công.</p>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {weeklySchedule.map((dayItem: any) => (
                            <Card key={dayItem.weekday} title={dayItem.day_name} className="bg-white border-gray-200">
                                {dayItem.schedules && dayItem.schedules.length > 0 ? (
                                    <div className="space-y-3 pt-2">
                                        {dayItem.schedules.map((s: any) => (
                                            <div key={s.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                                                <div className="font-bold text-gray-900 text-sm">{s.class_name}</div>
                                                <div className="text-xs font-semibold text-emerald-700">{s.subject_name}</div>
                                                <div className="text-xs text-gray-500 flex items-center justify-between pt-1">
                                                    <span>{s.room_name}</span>
                                                    <span className="font-medium text-gray-700">{s.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic pt-2">Không có lịch dạy.</p>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Render Student Dashboard
    const weeklySchedule = props.weekly_schedule || [];
    const examResults = props.exam_results || [];

    const filteredExamResults = examResults.filter((item: any) => {
        if (!examSearch) return true;
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
            cell: (row) => <span className="font-semibold text-gray-900">{row.exam_name}</span>,
        },
        {
            header: 'Môn Học',
            accessorKey: 'subject_name',
        },
        {
            header: 'Lớp Học',
            accessorKey: 'class_name',
        },
        {
            header: 'Điểm Số',
            cell: (row) => <span className="font-bold text-emerald-600 text-base">{row.score}</span>,
        },
        {
            header: 'Đánh Giá / Thăng Hạng',
            cell: (row) => <Badge variant={row.score >= 8 ? 'active' : row.score >= 5 ? 'pending' : 'expired'}>{row.grade}</Badge>,
        },
        {
            header: 'Ngày Thi',
            accessorKey: 'exam_date',
        },
    ];

    return (
        <AppLayout title="Bảng Điều Khiển - Học Sinh">
            <div className="space-y-8">
                <Card className="border-gray-200 bg-white">
                    <h2 className="text-xl font-bold text-gray-900">Góc Học Tập Của Tôi</h2>
                    <p className="mt-1 text-xs text-gray-500">Xem lịch học trong tuần và bảng kết quả học tập kỳ thi.</p>
                </Card>

                {/* Lịch học trong tuần */}
                <div>
                    <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                        <span>Lịch Học Trong Tuần</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {weeklySchedule.map((dayItem: any) => (
                            <Card key={dayItem.weekday} title={dayItem.day_name} className="bg-white border-gray-200">
                                {dayItem.schedules && dayItem.schedules.length > 0 ? (
                                    <div className="space-y-3 pt-2">
                                        {dayItem.schedules.map((s: any) => (
                                            <div key={s.id} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg space-y-1">
                                                <div className="font-bold text-gray-900 text-sm">{s.class_name}</div>
                                                <div className="text-xs font-semibold text-emerald-700">{s.subject_name}</div>
                                                <div className="text-xs text-gray-500 flex items-center justify-between pt-1">
                                                    <span>{s.room_name}</span>
                                                    <span className="font-medium text-gray-700">{s.time}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic pt-2">Không có lịch học.</p>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Kết quả thi có thanh tìm kiếm */}
                <Card
                    title="Bảng Kết Quả Kỳ Thi"
                    headerAction={
                        <div className="relative w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm bài thi, môn học..."
                                value={examSearch}
                                onChange={(e) => setExamSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
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
