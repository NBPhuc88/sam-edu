import { Head, Link, router } from '@inertiajs/react';
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
    Building2,
    BookOpen,
    Filter,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import AppLayout from '../../../layouts/AppLayout';

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
        if (!deletingTuition) return;
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
                        <p className="mt-1 text-xs text-gray-500">
                            Theo dõi các khoản học phí, các đợt đóng tiền từng phần và công nợ của học sinh theo từng lớp học.
                        </p>
                    </div>
                    <Link href="/tuitions/create">
                        <Button
                            variant="success"
                            size="md"
                            icon={<Plus className="h-4 w-4" />}
                        >
                            Tạo Khoản Thu Học Phí Mới
                        </Button>
                    </Link>
                </div>

                {/* 3 Summary Statistics Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <Card className="border-l-4 border-l-blue-500 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    Tổng Học Phí Phải Thu
                                </p>
                                <h3 className="mt-1 text-2xl font-extrabold text-gray-900">
                                    {formatCurrency(stats?.total_amount || 0)}
                                </h3>
                                <p className="mt-1 text-[11px] text-gray-400">
                                    Tổng <strong>{stats?.total_tuitions || 0}</strong> hồ sơ học phí
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <CreditCard className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                                    Đã Thu Thực Tế
                                </p>
                                <h3 className="mt-1 text-2xl font-extrabold text-emerald-700">
                                    {formatCurrency(stats?.paid_amount || 0)}
                                </h3>
                                <p className="mt-1 text-[11px] text-gray-400">
                                    <strong>{stats?.completed_count || 0}</strong> hồ sơ đã đóng đủ 100%
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                                    Tổng Tiền Còn Nợ
                                </p>
                                <h3 className="mt-1 text-2xl font-extrabold text-amber-700">
                                    {formatCurrency(stats?.remaining_amount || 0)}
                                </h3>
                                <p className="mt-1 text-[11px] text-gray-400">
                                    <strong>{stats?.partial_count || 0}</strong> học sinh đang đóng dở
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Clock className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filter Box */}
                <Card className="border-gray-200 bg-white p-4 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <Input
                                    placeholder="Tìm tên HS, mã HS, tiêu đề..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    icon={<Search className="h-4 w-4 text-gray-400" />}
                                />
                            </div>

                            {centers && centers.length > 1 && (
                                <div>
                                    <select
                                        value={selectedCenterId}
                                        onChange={(e) => {
                                            setSelectedCenterId(e.target.value);
                                            setSelectedClassId('');
                                        }}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
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
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="all">Tất cả Trạng thái</option>
                                    <option value="pending">Chưa đóng</option>
                                    <option value="partial">Đang đóng (Còn nợ)</option>
                                    <option value="completed">Đã hoàn thành</option>
                                    <option value="overdue">Quá hạn</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleResetFilter}
                            >
                                Đặt lại bộ lọc
                            </Button>
                            <Button
                                type="submit"
                                variant="success"
                                size="sm"
                                icon={<Filter className="h-3.5 w-3.5" />}
                            >
                                Lọc Dữ Liệu
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Main Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Học Sinh</th>
                                    <th className="px-6 py-4">Lớp Học & Khóa Học</th>
                                    <th className="px-6 py-4">Tổng Học Phí</th>
                                    <th className="px-6 py-4">Đã Đóng</th>
                                    <th className="px-6 py-4">Còn Nợ</th>
                                    <th className="px-6 py-4">Tiến Độ & Trạng Thái</th>
                                    <th className="px-6 py-4">Hạn Đóng</th>
                                    <th className="px-6 py-4 text-right">Thao Tác</th>
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
                                                    <div className="font-bold text-gray-900">
                                                        {item.student?.full_name ?? 'N/A'}
                                                    </div>
                                                    <div className="mt-0.5 font-mono text-[11px] text-gray-400">
                                                        {item.student?.student_code ?? ''}
                                                        {item.student?.phone && ` • ${item.student.phone}`}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-800">
                                                        {item.school_class?.name ?? 'Chưa gán lớp'}
                                                    </div>
                                                    <div className="mt-0.5 text-[11px] text-gray-500">
                                                        {item.title || item.school_class?.code || ''}
                                                        {item.center && (
                                                            <span className="ml-1 text-gray-400">
                                                                ({item.center.name})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 font-bold text-gray-900">
                                                    {formatCurrency(total)}
                                                </td>

                                                <td className="px-6 py-4 font-bold text-emerald-700">
                                                    {formatCurrency(paid)}
                                                    {item.payments_count > 0 && (
                                                        <span className="ml-1 font-normal text-[11px] text-gray-500">
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
                                                    <div className="space-y-1.5 min-w-[130px]">
                                                        <div className="flex items-center justify-between text-[11px]">
                                                            {getStatusBadge(item.status)}
                                                            <span className="font-mono font-bold text-gray-700">
                                                                {percent}%
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
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

                                                <td className="px-6 py-4 text-gray-600">
                                                    {item.due_date ? (
                                                        <span className="font-mono">{item.due_date}</span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Không có</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Link href={`/tuitions/${item.id}`}>
                                                            <Button
                                                                variant="success"
                                                                size="sm"
                                                                icon={<Eye className="h-3.5 w-3.5" />}
                                                                title="Xem chi tiết & Đợt đóng tiền"
                                                            >
                                                                Chi tiết
                                                            </Button>
                                                        </Link>

                                                        <Link href={`/tuitions/${item.id}/edit`}>
                                                            <Button
                                                                variant="edit"
                                                                size="sm"
                                                                icon={<Edit2 className="h-3.5 w-3.5" />}
                                                                title="Chỉnh sửa thông tin"
                                                            >
                                                                Sửa
                                                            </Button>
                                                        </Link>

                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            icon={<Trash2 className="h-3.5 w-3.5" />}
                                                            onClick={() => openDeleteModal(item)}
                                                            title="Xóa hồ sơ học phí"
                                                        >
                                                            Xóa
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-6 py-12 text-center text-xs text-gray-500"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <DollarSign className="h-8 w-8 text-gray-300" />
                                                <p className="font-semibold text-gray-700">
                                                    Không tìm thấy hồ sơ học phí nào phù hợp
                                                </p>
                                                <p className="text-gray-400">
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
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-3 text-xs text-gray-600">
                            <div>
                                Hiển thị trang <strong>{tuitions.current_page}</strong> / {tuitions.last_page} (Tổng {tuitions.total} hồ sơ)
                            </div>
                            <div className="flex gap-1">
                                {tuitions.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
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
                            icon={<Trash2 className="h-4 w-4" />}
                        >
                            Xác Nhận Xóa
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="h-6 w-6 shrink-0" />
                        <p className="text-sm font-semibold">
                            Hành động này sẽ xóa khoản học phí của học sinh "{deletingTuition?.student?.full_name}" khỏi danh sách quản lý.
                        </p>
                    </div>
                    <p className="text-xs text-gray-500">
                        Các đợt đóng tiền liên quan sẽ được ẩn (soft delete) và có thể phục hồi nếu cần thiết từ cơ sở dữ liệu.
                    </p>
                </div>
            </Modal>
        </AppLayout>
    );
};

export default Index;
