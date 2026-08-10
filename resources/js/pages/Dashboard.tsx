import {
    Building2,
    Users,
    GraduationCap,
    BookOpen,
    Plus,
    Edit,
    Trash2,
    CheckCircle2,
    CreditCard,
} from 'lucide-react';
import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import type { Column } from '../components/ui/DataTable';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import AppLayout from '../layouts/AppLayout';

interface ClassData {
    id: number;
    code: string;
    name: string;
    max_students: number;
    status: string;
    created_at: string;
}

export const Dashboard: React.FC<any> = ({ stats, monthlyEnrollments, recentClasses, center }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [actionMessage, setActionMessage] = useState<string | null>(null);

    const handleSuccessClick = () => {
        setActionMessage('Đã thực hiện thao tác thành công.');
        setTimeout(() => setActionMessage(null), 4000);
    };

    const handleEditClick = (className: string) => {
        setActionMessage(`Đã cập nhật thông tin lớp "${className}".`);
        setTimeout(() => setActionMessage(null), 4000);
    };

    const handleDeleteClick = (className: string) => {
        if (confirm(`Bạn có chắc chắn muốn XÓA lớp "${className}"?`)) {
            setActionMessage(`Đã xóa lớp "${className}" thành công.`);
            setTimeout(() => setActionMessage(null), 4000);
        }
    };

    // Columns definition for DataTable
    const columns: Column<ClassData>[] = [
        {
            header: 'Mã Lớp',
            accessorKey: 'code',
            cell: (row) => <span className="font-semibold text-gray-900">{row.code}</span>,
        },
        {
            header: 'Tên Lớp Học',
            accessorKey: 'name',
            cell: (row) => <span className="text-gray-800">{row.name}</span>,
        },
        {
            header: 'Sĩ Số Tối Đa',
            cell: (row) => (row.max_students ? `${row.max_students} học sinh` : 'Không giới hạn'),
        },
        {
            header: 'Trạng Thái',
            cell: (row) => (
                <Badge variant={row.status === 'active' ? 'active' : 'info'}>
                    {row.status === 'active' ? 'Đang mở' : row.status}
                </Badge>
            ),
        },
        {
            header: 'Thao Tác Nút Bấm',
            cell: (row) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="edit"
                        size="sm"
                        icon={<Edit className="w-3.5 h-3.5" />}
                        onClick={() => handleEditClick(row.name)}
                    >
                        Sửa
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => handleDeleteClick(row.name)}
                    >
                        Xóa
                    </Button>
                </div>
            ),
        },
    ];

    const tableData: ClassData[] = recentClasses || [];

    return (
        <AppLayout title="Dashboard Quản Trị">
            <div className="space-y-8">
                {/* User Notification Toast */}
                {actionMessage && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-2 shadow-xs">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{actionMessage}</span>
                    </div>
                )}

                {/* Dashboard Action Header */}
                <Card className="bg-white border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Tổng quan Hệ thống Quản lý Giáo dục Sam</h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Báo cáo tình hình học sinh, lớp học và gia hạn dịch vụ trung tâm.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <Button
                                variant="success"
                                icon={<Plus className="w-4 h-4" />}
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                Tạo Lớp Học Mới
                            </Button>
                            <Button
                                variant="edit"
                                icon={<Edit className="w-4 h-4" />}
                                onClick={handleSuccessClick}
                            >
                                Cập Nhật Hệ Thống
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Top Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-white hover:border-gray-300 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Trung Tâm</p>
                                <h4 className="text-2xl font-bold text-gray-900">{stats?.centers ?? 0}</h4>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Building2 className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white hover:border-gray-300 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tổng Học Sinh</p>
                                <h4 className="text-2xl font-bold text-gray-900">{stats?.students ?? 0}</h4>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white hover:border-gray-300 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Giáo Viên</p>
                                <h4 className="text-2xl font-bold text-gray-900">{stats?.teachers ?? 0}</h4>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                <Users className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-white hover:border-gray-300 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Lớp Học Active</p>
                                <h4 className="text-2xl font-bold text-gray-900">{stats?.classes ?? 0}</h4>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                <BookOpen className="w-6 h-6" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Chart & Activity Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recharts Area Chart */}
                    <Card title="Thống Kê Nhập Học Theo Tháng" className="lg:col-span-2">
                        <div className="h-64 w-full pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyEnrollments || []}>
                                    <defs>
                                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                                            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="students"
                                        stroke="#059669"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorStudents)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Quick Overview Card */}
                    <Card title="Gói Dịch Vụ SaaS Trung Tâm">
                        <div className="space-y-4 text-sm">
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                                <div className="text-xs text-gray-500 uppercase font-semibold">Trung tâm hiện tại</div>
                                <div className="font-bold text-gray-900 text-base">{center?.name || 'Trung tâm Đào tạo Demo'}</div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="active">Đang hoạt động</Badge>
                                    <span className="text-xs text-gray-500">Gói: {center?.subscription_plan || 'Basic'}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-100">
                                <span>Thanh toán gia hạn:</span>
                                <span className="font-bold text-emerald-700">ZaloPay QR Code v2</span>
                            </div>

                            <Button
                                variant="success"
                                className="w-full justify-center mt-2"
                                icon={<CreditCard className="w-4 h-4" />}
                                onClick={handleSuccessClick}
                            >
                                Gia Hạn Qua ZaloPay
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* TanStack Data Table for Recent Classes */}
                <Card
                    title="Danh Sách Lớp Học Mới Nhất"
                    headerAction={
                        <Button
                            variant="success"
                            size="sm"
                            icon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            Thêm Lớp Mới
                        </Button>
                    }
                >
                    <DataTable columns={columns} data={tableData} />
                </Card>
            </div>

            {/* Create Class Modal Demo */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Tạo Lớp Học Mới"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                            Hủy Bỏ
                        </Button>
                        <Button
                            variant="success"
                            onClick={() => {
                                setIsCreateModalOpen(false);
                                handleSuccessClick();
                            }}
                        >
                            Lưu Lớp Học
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 text-sm text-gray-700">
                    <p>Nhập thông tin tên lớp học và mã lớp mới để thêm vào trung tâm:</p>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-900 mb-1">Mã Lớp</label>
                            <input
                                type="text"
                                placeholder="VD: TQ-05"
                                className="ui-input"
                                defaultValue="TQ-05"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-900 mb-1">Tên Lớp Học</label>
                            <input
                                type="text"
                                placeholder="VD: Tiếng Trung Nâng Cao"
                                className="ui-input"
                                defaultValue="Tiếng Trung Nâng Cao"
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
};

export default Dashboard;
