import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import { Head,Link,router,usePage } from '@inertiajs/react';
import {
Calendar,
CheckCircle2,
Clock,
CreditCard,
DollarSign,
Download,
Edit2,
Eye,
Filter,
Plus,
Search,
Trash2,
Wallet
} from 'lucide-react';
import React,{ useState } from 'react';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import ScrollableSelect from '../../../components/ui/ScrollableSelect';
import Tooltip, { TruncatedText } from '../../../components/ui/Tooltip';
import AppLayout from '../../../layouts/AppLayout';
import TuitionChartSection,{ TuitionChartStatsData } from './components/TuitionChartSection';

import {
    TUITION_STATUS_OVERDUE,
    TUITION_STATUS_PAID,
    TUITION_STATUS_PARTIAL,
    TUITION_STATUS_PENDING,
} from '@/constants/enums';
import { usePermission } from '@/hooks/usePermission';
interface StudentTuitionItem {
    id: number;
    center_id: number;
    student_id: number;
    class_id: number;
    title: string | null;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: number;
    due_date: string | null;
    note: string | null;
    payments_count: number;
    creator?: {
        id: number;
        full_name: string;
        username: string;
    };
    student?: {
        id: number;
        full_name: string;
        student_code: string;
        phone: string | null;
        deleted_at?: string | null;
    };
    school_class?: {
        id: number;
        name: string;
        code: string;
    };
    center?: {
        id: number;
        name: string;
        code: string;
    };
    classes?: Array<{
        id: number;
        name: string;
        code: string;
        total_amount: number;
        paid_amount: number;
        remaining_amount: number;
        status: number;
    }>;
}

interface IndexProps {
    tuitions: {
        data: StudentTuitionItem[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
    };
    stats: {
        total_amount: number;
        paid_amount: number;
        remaining_amount: number;
        total_tuitions: number;
        completed_count: number;
        partial_count: number;
        pending_count: number;
        last_month_paid_amount?: number;
        this_month_paid_amount?: number;
        last_month_name?: string;
        this_month_name?: string;
    };
    chartStats?: TuitionChartStatsData;
    centers: Array<{ id: number; name: string; code: string }>;
    classes: Array<{ id: number; name: string; code: string; center_id: number }>;
    filters: {
        search?: string;
        center_id?: number | null;
        class_id?: number | null;
        status?: string;
        month?: string;
    };
}


export const Index: React.FC<IndexProps> = ({
    tuitions,
    stats,
    chartStats,
    centers,
    classes,
    filters,
}) => {
    const { can, isSuperAdmin } = usePermission();

    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedCenterId, setSelectedCenterId] = useState<number>(
        filters?.center_id ? Number(filters.center_id) : 0,
    );
    const [selectedClassId, setSelectedClassId] = useState<number>(
        filters?.class_id ? Number(filters.class_id) : 0,
    );
    const [selectedStatus, setSelectedStatus] = useState<number>(
        filters?.status !== undefined && filters?.status !== null ? Number(filters.status) : 0,
    );
    const [selectedMonth, setSelectedMonth] = useState<string>(
        filters?.month || '',
    );

    // Filter classes by selected center
    const filteredClasses = selectedCenterId
        ? classes.filter((c) => Number(c.center_id) === selectedCenterId)
        : classes;

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingTuition, setDeletingTuition] = useState<StudentTuitionItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/tuitions',
            {
                search: searchTerm || undefined,
                center_id: selectedCenterId ? Number(selectedCenterId) : undefined,
                class_id: selectedClassId ? Number(selectedClassId) : undefined,
                status: selectedStatus ? Number(selectedStatus) : undefined,
                month: selectedMonth || undefined,
            },
            { preserveState: true },
        );
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCenterId) params.append('center_id', String(selectedCenterId));
        if (selectedClassId) params.append('class_id', String(selectedClassId));
        if (selectedStatus) params.append('status', String(selectedStatus));
        if (selectedMonth) params.append('month', selectedMonth);

        window.location.href = `/tuitions/export?${params.toString()}`;
    };

    const handleResetFilter = () => {
        setSearchTerm('');
        setSelectedCenterId(0);
        setSelectedClassId(0);
        setSelectedStatus(0);
        setSelectedMonth('');
        router.get('/tuitions', {}, { preserveState: true });
    };

    const openDeleteModal = (tuition: StudentTuitionItem) => {
        setDeletingTuition(tuition);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingTuition) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/tuitions/${deletingTuition.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setDeletingTuition(null);
            },
        });
    };

    const getStatusBadge = (status: number) => {
        if (status === TUITION_STATUS_PAID) {
            return <Badge variant="active">Đã hoàn thành</Badge>;
        }
        if (status === TUITION_STATUS_PARTIAL) {
            return <Badge variant="pending">Còn nợ</Badge>;
        }
        if (status === TUITION_STATUS_OVERDUE) {
            return <Badge variant="danger">Quá hạn</Badge>;
        }
        return <Badge variant="expired">Chưa đóng</Badge>;
    };

    return (
        <AppLayout title="Quản Lý Học Phí Khóa Học - SAM Digital">
            <Head title="Quản Lý Học Phí Khóa Học" />

            <div className="space-y-6">
                {/* Header Top Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
                            <DollarSign className="h-7 w-7 text-emerald-600" />
                            Quản Lý Học Phí & Đóng Tiền
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Theo dõi các khoản học phí, các đợt đóng tiền từng phần và công nợ của học sinh theo từng lớp học.
                        </p>
                    </div>
                    {can('tuitions.create') && (
                        <Link href="/tuitions/create">
                            <Button
                                variant="success"
                                size="md"
                                icon={<Plus className="h-4.5 w-4.5" />}
                            >
                                Tạo Khoản Thu Học Phí Mới
                            </Button>
                        </Link>
                    )}
                </div>

                {/* 5 Summary Statistics Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                    <Card className="border-l-4 border-l-blue-500 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Tổng Phải Thu
                                </p>
                                <h3 className="mt-1 text-xl font-extrabold text-gray-900">
                                    {formatCurrency(stats?.total_amount || 0)}
                                </h3>
                                <p className="mt-1 text-xs text-gray-400">
                                    <strong>{stats?.total_tuitions || 0}</strong> hồ sơ học phí
                                </p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <CreditCard className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                                    Đã Thu Tất Cả
                                </p>
                                <h3 className="mt-1 text-xl font-extrabold text-emerald-700">
                                    {formatCurrency(stats?.paid_amount || 0)}
                                </h3>
                                <p className="mt-1 text-xs text-gray-400">
                                    <strong>{stats?.completed_count || 0}</strong> hồ sơ đóng đủ
                                </p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                                    Tổng Còn Nợ
                                </p>
                                <h3 className="mt-1 text-xl font-extrabold text-amber-700">
                                    {formatCurrency(stats?.remaining_amount || 0)}
                                </h3>
                                <p className="mt-1 text-xs text-gray-400">
                                    <strong>{stats?.partial_count || 0}</strong> đang đóng dở
                                </p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Clock className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">
                                    {stats?.last_month_name ? `Thu ${stats.last_month_name}` : 'Thu Tháng Trước'}
                                </p>
                                <h3 className="mt-1 text-xl font-extrabold text-purple-700">
                                    {formatCurrency(stats?.last_month_paid_amount || 0)}
                                </h3>
                                <p className="mt-1 text-xs text-gray-400">
                                    Tháng trước
                                </p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                <Calendar className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-teal-500 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                                    {stats?.this_month_name ? `Thu ${stats.this_month_name}` : 'Thu Tháng Này'}
                                </p>
                                <h3 className="mt-1 text-xl font-extrabold text-teal-700">
                                    {formatCurrency(stats?.this_month_paid_amount || 0)}
                                </h3>
                                <p className="mt-1 text-xs text-gray-400">
                                    Đầu tháng đến hôm nay
                                </p>
                            </div>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                <Wallet className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Detailed Charts Section */}
                {chartStats && (
                    <TuitionChartSection chartStats={chartStats} />
                )}

                {/* Filter Box */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <div>
                                <Input
                                    placeholder="Tìm tên HS, mã HS, tiêu đề..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    icon={<Search className="h-5 w-5 text-gray-400" />}
                                    className="!py-2.5 !text-sm"
                                />
                            </div>

                            {isSuperAdmin && centers && centers.length > 1 && (
                                <div>
                                    <ScrollableSelect
                                        value={selectedCenterId}
                                        onChange={(val) => {
                                            setSelectedCenterId(Number(val));
                                            setSelectedClassId(0);
                                        }}
                                        options={[
                                            { value: 0, label: 'Tất cả Trung tâm' },
                                            ...centers.map((c) => ({
                                                value: c.id,
                                                label: c.name,
                                            })),
                                        ]}
                                        placeholder="Tất cả Trung tâm"
                                        searchable={true}
                                    />
                                </div>
                            )}

                            <div>
                                <ScrollableSelect
                                    value={selectedClassId}
                                    onChange={(val) => setSelectedClassId(Number(val))}
                                    options={[
                                        { value: 0, label: 'Tất cả Lớp học' },
                                        ...filteredClasses.map((cl) => ({
                                            value: cl.id,
                                            label: cl.name,
                                        })),
                                    ]}
                                    placeholder="Tất cả Lớp học"
                                    searchable={true}
                                />
                            </div>

                            <div>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    title="Lọc theo tháng phát sinh/hạn nộp (Để trống để xem tổng tất cả)"
                                    placeholder="Tất cả các tháng"
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <ScrollableSelect
                                    value={selectedStatus}
                                    onChange={(val) => setSelectedStatus(Number(val))}
                                    options={[
                                        { value: 0, label: 'Tất cả Trạng thái' },
                                        { value: TUITION_STATUS_PENDING, label: 'Chờ thanh toán' },
                                        { value: TUITION_STATUS_PAID, label: 'Đã hoàn thành' },
                                        { value: TUITION_STATUS_PARTIAL, label: 'Thanh toán 1 phần' },
                                        { value: TUITION_STATUS_OVERDUE, label: 'Quá hạn' },
                                    ]}
                                    placeholder="Tất cả Trạng thái"
                                    searchable={false}
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                            <Button
                                type="button"
                                variant="export"
                                size="md"
                                icon={<Download className="h-4 w-4" />}
                                onClick={handleExport}
                                title="Xuất tệp CSV/Excel danh sách học phí đã qua bộ lọc"
                            >
                                Xuất Dữ Liệu Excel / CSV
                            </Button>
                            <div className="flex items-center gap-2.5">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="md"
                                    onClick={handleResetFilter}
                                >
                                    Đặt lại bộ lọc
                                </Button>
                                <Button
                                    type="submit"
                                    variant="success"
                                    size="md"
                                    icon={<Filter className="h-4 w-4" />}
                                >
                                    Tìm kiếm
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>

                {/* Main Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Học Sinh</th>
                                    <th className="px-6 py-4">Lớp Học & Khóa Học</th>
                                    <th className="px-6 py-4">Tổng Học Phí</th>
                                    <th className="px-6 py-4">Đã Đóng</th>
                                    <th className="px-6 py-4">Còn Nợ</th>
                                    <th className="px-6 py-4">Tiến Độ & Trạng Thái</th>
                                    <th className="px-6 py-4">Hạn Đóng</th>
                                    {(can('tuitions.edit') || can('tuitions.delete')) && (
                                        <th className="px-6 py-4 text-right">Thao Tác</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {tuitions.data && tuitions.data.length > 0 ? (
                                    tuitions.data.map((item) => {
                                        const total = Number(item.total_amount) || 0;
                                        const paid = Number(item.paid_amount) || 0;
                                        const remaining = Number(item.remaining_amount) || 0;
                                        const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

                                        return (
                                            <tr
                                                key={item.id}
                                                className="transition-colors hover:bg-slate-50/80"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="max-w-xs">
                                                        <div className="flex items-center gap-1.5">
                                                            <TruncatedText
                                                                text={item.student?.full_name ?? 'N/A'}
                                                                maxLines={1}
                                                                className="font-bold text-gray-900"
                                                            />
                                                            {item.student?.deleted_at && (
                                                                <span className="inline-flex items-center rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20 shrink-0">
                                                                    Đã xóa
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-0.5 font-mono text-xs text-gray-400">
                                                            {item.student?.student_code ?? ''}
                                                            {item.student?.phone && ` • ${item.student.phone}`}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1.5 max-w-[220px]">
                                                        {item.classes && item.classes.length > 0 ? (
                                                            item.classes.map((cls, cIdx) => (
                                                                <Tooltip
                                                                    key={cIdx}
                                                                    content={
                                                                        <div className="space-y-1 py-0.5">
                                                                            <div className="font-bold text-white text-xs">{cls.name}</div>
                                                                            <div className="text-[11px] text-gray-300">
                                                                                Mã lớp: <span className="font-mono text-emerald-400 font-semibold">{cls.code || 'N/A'}</span>
                                                                            </div>
                                                                            <div className="text-[11px] text-gray-300">
                                                                                Học phí: <span className="font-semibold text-amber-300">{formatCurrency(cls.total_amount)}</span>
                                                                            </div>
                                                                            <div className="text-[11px] text-gray-300">
                                                                                Đã đóng: <span className="font-semibold text-emerald-400">{formatCurrency(cls.paid_amount)}</span>
                                                                                {cls.remaining_amount > 0 && (
                                                                                    <span> • Còn nợ: <span className="text-rose-300 font-semibold">{formatCurrency(cls.remaining_amount)}</span></span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    }
                                                                >
                                                                    <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-mono font-bold text-blue-700 hover:bg-blue-100 hover:text-blue-900 border border-blue-200/80 transition-colors shadow-2xs cursor-pointer">
                                                                        <span>{cls.code || cls.name}</span>
                                                                    </div>
                                                                </Tooltip>
                                                            ))
                                                        ) : (
                                                            <Tooltip
                                                                content={
                                                                    <div className="space-y-1 py-0.5">
                                                                        <div className="font-bold text-white text-xs">{item.school_class?.name ?? 'Chưa gán lớp'}</div>
                                                                        <div className="text-[11px] text-gray-300">
                                                                            Mã lớp: <span className="font-mono text-emerald-400 font-semibold">{item.school_class?.code ?? 'N/A'}</span>
                                                                        </div>
                                                                        <div className="text-[11px] text-gray-300">
                                                                            Học phí: <span className="font-semibold text-amber-300">{formatCurrency(total)}</span>
                                                                        </div>
                                                                    </div>
                                                                }
                                                            >
                                                                <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-mono font-bold text-blue-700 hover:bg-blue-100 hover:text-blue-900 border border-blue-200/80 transition-colors shadow-2xs cursor-pointer">
                                                                    <span>{item.school_class?.code || item.school_class?.name || 'Chưa gán lớp'}</span>
                                                                </div>
                                                            </Tooltip>
                                                        )}
                                                        {item.center && (
                                                            <div className="text-[11px] text-gray-400">
                                                                {item.center.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 font-bold text-gray-900">
                                                    {formatCurrency(total)}
                                                </td>

                                                <td className="px-6 py-4 font-bold text-emerald-700">
                                                    {formatCurrency(paid)}
                                                    {item.payments_count > 0 && (
                                                        <span className="ml-1 font-normal text-xs text-gray-500">
                                                            ({item.payments_count} đợt)
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 font-bold text-amber-700">
                                                    {remaining > 0 ? formatCurrency(remaining) : (
                                                        <span className="font-semibold text-emerald-600">Đã đủ</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="space-y-1.5 min-w-[140px]">
                                                        <div className="flex items-center justify-between text-xs">
                                                            {getStatusBadge(item.status)}
                                                            <span className="font-mono font-bold text-gray-700">
                                                                {percent}%
                                                            </span>
                                                        </div>
                                                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                                            <div
                                                                className={`h-full transition-all duration-300 ${
                                                                    percent === 100
                                                                        ? 'bg-emerald-600'
                                                                        : percent > 0
                                                                          ? 'bg-blue-600'
                                                                          : 'bg-gray-300'
                                                                }`}
                                                                style={{ width: `${percent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-gray-600 text-sm">
                                                    {item.due_date ? (
                                                        <span className="font-mono">{item.due_date}</span>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-xs">Không có</span>
                                                    )}
                                                </td>

                                                {(can('tuitions.edit') || can('tuitions.delete')) && (
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link href={`/tuitions/${item.id}`}>
                                                                <Button
                                                                    variant="success"
                                                                    size="sm"
                                                                    icon={<Eye className="h-4 w-4" />}
                                                                    title="Xem chi tiết & Đợt đóng tiền"
                                                                >
                                                                    Chi tiết
                                                                </Button>
                                                            </Link>

                                                            {can('tuitions.edit') && (
                                                                <Link href={`/tuitions/${item.id}/edit`}>
                                                                    <Button
                                                                        variant="edit"
                                                                        size="sm"
                                                                        icon={<Edit2 className="h-4 w-4" />}
                                                                        title="Chỉnh sửa thông tin"
                                                                    >
                                                                        Sửa
                                                                    </Button>
                                                                </Link>
                                                            )}

                                                            {can('tuitions.delete') && (
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    icon={<Trash2 className="h-4 w-4" />}
                                                                    onClick={() => openDeleteModal(item)}
                                                                    title="Xóa hồ sơ học phí"
                                                                >
                                                                    Xóa
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={can('tuitions.edit') || can('tuitions.delete') ? 8 : 7}
                                            className="px-6 py-12 text-center text-sm text-gray-500"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <DollarSign className="h-10 w-10 text-gray-300" />
                                                <p className="text-base font-semibold text-gray-700">
                                                    Không tìm thấy hồ sơ học phí nào phù hợp
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Hãy thử điều chỉnh bộ lọc hoặc bấm "Tạo Khoản Thu Học Phí Mới"
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tuitions.links && tuitions.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 text-sm text-gray-600">
                            <div>
                                Hiển thị trang <strong>{tuitions.current_page}</strong> / {tuitions.last_page} (Tổng {tuitions.total} hồ sơ)
                            </div>
                            <div className="flex gap-1.5">
                                {tuitions.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                                            link.active
                                                ? 'bg-emerald-600 text-white'
                                                : link.url
                                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                  : 'cursor-not-allowed text-gray-400 opacity-50'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                entity="tuitions"
                entityId={deletingTuition?.id || null}
                entityName={`hồ sơ học phí của học sinh "${deletingTuition?.student?.full_name}"`}
                isDeleting={isDeleting}
            />
        </AppLayout>
    );
};

export default Index;
