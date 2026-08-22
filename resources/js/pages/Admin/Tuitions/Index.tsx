import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    DollarSign,
    Plus,
    Search,
    Eye,
    Edit2,
    Trash2,
    CreditCard,
    CheckCircle2,
    Clock,
    AlertCircle,
    Filter,
    Calendar,
    Wallet,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Tooltip, { TruncatedText } from '../../../components/ui/Tooltip';
import AppLayout from '../../../layouts/AppLayout';

import { usePermission } from '@/hooks/usePermission';
interface StudentTuitionItem {
    id: number;
    center_id: number;
    student_id: number;
    class_id: number;
    title: string | null;
    total_amount: number | string;
    paid_amount: number | string;
    remaining_amount: number | string;
    status: 'pending' | 'partial' | 'completed' | 'overdue';
    due_date: string | null;
    note: string | null;
    payments_count: number;
    student?: {
        id: number;
        full_name: string;
        student_code: string;
        phone: string | null;
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
    centers: Array<{ id: number; name: string; code: string }>;
    classes: Array<{ id: number; name: string; code: string; center_id: number }>;
    filters: {
        search?: string;
        center_id?: number | null;
        class_id?: number | null;
        status?: string;
    };
}


export const Index: React.FC<IndexProps> = ({
    tuitions,
    stats,
    centers,
    classes,
    filters,
}) => {
    const { can } = usePermission();
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';

    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedCenterId, setSelectedCenterId] = useState<string>(
        filters?.center_id ? String(filters.center_id) : '',
    );
    const [selectedClassId, setSelectedClassId] = useState<string>(
        filters?.class_id ? String(filters.class_id) : '',
    );
    const [selectedStatus, setSelectedStatus] = useState<string>(
        filters?.status || 'all',
    );

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingTuition, setDeletingTuition] = useState<StudentTuitionItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(Number(amount) || 0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/tuitions',
            {
                search: searchTerm,
                center_id: selectedCenterId || undefined,
                class_id: selectedClassId || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
            },
            { preserveState: true },
        );
    };

    const handleResetFilter = () => {
        setSearchTerm('');
        setSelectedCenterId('');
        setSelectedClassId('');
        setSelectedStatus('all');
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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="active">Đã hoàn thành</Badge>;
            case 'partial':
                return <Badge variant="pending">Còn nợ</Badge>;
            case 'overdue':
                return <Badge variant="danger">Quá hạn</Badge>;
            case 'pending':
            default:
                return <Badge variant="expired">Chưa đóng</Badge>;
        }
    };

    const filteredClasses = selectedCenterId
        ? classes.filter((c) => String(c.center_id) === String(selectedCenterId))
        : classes;

    return (
        <AppLayout title="Quản Lý Học Phí Khóa Học - Giáo Dục Sam">
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


                {/* Filter Box */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                                    <select
                                        value={selectedCenterId}
                                        onChange={(e) => {
                                            setSelectedCenterId(e.target.value);
                                            setSelectedClassId('');
                                        }}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">Tất cả Trung tâm</option>
                                        {centers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">Tất cả Lớp học</option>
                                    {filteredClasses.map((cl) => (
                                        <option key={cl.id} value={cl.id}>
                                            {cl.name} ({cl.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="all">Tất cả Trạng thái</option>
                                    <option value="pending">Chưa đóng</option>
                                    <option value="partial">Đang đóng (Còn nợ)</option>
                                    <option value="completed">Đã hoàn thành</option>
                                    <option value="overdue">Quá hạn</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-1">
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
                                Lọc Dữ Liệu
                            </Button>
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
                                                        <TruncatedText
                                                            text={item.student?.full_name ?? 'N/A'}
                                                            maxLines={1}
                                                            className="font-bold text-gray-900"
                                                        />
                                                        <div className="mt-0.5 font-mono text-xs text-gray-400">
                                                            {item.student?.student_code ?? ''}
                                                            {item.student?.phone && ` • ${item.student.phone}`}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="max-w-[220px]">
                                                        <TruncatedText
                                                            text={item.school_class?.name ?? 'Chưa gán lớp'}
                                                            maxLines={1}
                                                            className="font-semibold text-gray-800"
                                                        />
                                                        <div className="mt-0.5 text-xs text-gray-500">
                                                            <TruncatedText
                                                                text={`${item.title || item.school_class?.code || ''}${item.center ? ` (${item.center.name})` : ''}`}
                                                                maxLines={1}
                                                                className="text-xs text-gray-500"
                                                            />
                                                        </div>
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
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Xác Nhận Xóa Hồ Sơ Học Phí"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            Hủy Bỏ
                        </Button>
                        <Button
                            variant="danger"
                            size="md"
                            onClick={confirmDelete}
                            isLoading={isDeleting}
                            icon={<Trash2 className="h-5 w-5" />}
                        >
                            Xác Nhận Xóa
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="h-6 w-6 shrink-0" />
                        <p className="text-base font-semibold">
                            Hành động này sẽ xóa khoản học phí của học sinh "{deletingTuition?.student?.full_name}" khỏi danh sách quản lý.
                        </p>
                    </div>
                    <p className="text-sm text-gray-500">
                        Các đợt đóng tiền liên quan sẽ được ẩn (soft delete) và có thể phục hồi nếu cần thiết từ cơ sở dữ liệu.
                    </p>
                </div>
            </Modal>
        </AppLayout>
    );
};

export default Index;
