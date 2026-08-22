import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    FileCheck,
    Plus,
    Search,
    Edit2,
    Trash2,
    Building2,
    Globe,
    Layers,
    Filter,
    RotateCcw,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AppLayout from '@/layouts/AppLayout';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface ExamType {
    id: number;
    center_id: number | null;
    code: string;
    name: string;
    description: string | null;
    status: string;
    exams_count?: number;
    center?: Center;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    examTypes: PaginatedData<ExamType>;
    centers: Center[];
    filters: {
        search?: string;
        center_id?: number | null;
        status?: string;
    };
}

export default function ExamTypeIndex({ examTypes, centers = [], filters }: Props) {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCenterId, setSelectedCenterId] = useState<string>(
        filters.center_id ? String(filters.center_id) : '',
    );
    const [selectedStatus, setSelectedStatus] = useState<string>(
        filters.status || 'all',
    );

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingType, setDeletingType] = useState<ExamType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/exam-types',
            {
                search: search || undefined,
                center_id: selectedCenterId || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
            },
            { preserveState: true },
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedCenterId('');
        setSelectedStatus('all');
        router.get('/exam-types', {}, { preserveState: true });
    };

    const openDeleteModal = (type: ExamType) => {
        setDeletingType(type);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeletingType(null);
        setDeleteModalOpen(false);
    };

    const handleDelete = () => {
        if (!deletingType) return;
        setIsDeleting(true);

        router.delete(`/exam-types/${deletingType.id}`, {
            onSuccess: () => {
                setIsDeleting(false);
                closeDeleteModal();
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <AppLayout title="Danh Sách Loại Đề Thi - Hệ Thống Giáo Dục Sam">
            <Head title="Quản Lý Loại Đề Thi" />

            <div className="space-y-6">
                {/* Top Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Danh Sách Loại Đề Thi
                        </h1>
                        <p className="text-sm text-gray-500">
                            Quản lý cấu trúc, danh mục và tiêu chuẩn các loại bài kiểm tra trong hệ thống
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link href="/exam-types/create">
                            <Button
                                variant="success"
                                size="md"
                                className="whitespace-nowrap"
                                icon={<Plus className="h-4.5 w-4.5" />}
                            >
                                Thêm Loại Đề Thi Mới
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filter Card */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
                            {/* Search */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Tìm kiếm loại đề thi
                                </label>
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tìm theo tên loại đề, mã loại, mô tả..."
                                    icon={<Search className="h-4 w-4 text-gray-400" />}
                                />
                            </div>

                            {/* Center Filter (Super Admin only) */}
                            {isSuperAdmin && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                        Trung Tâm
                                    </label>
                                    <select
                                        value={selectedCenterId}
                                        onChange={(e) => setSelectedCenterId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">-- Tất cả Trung Tâm --</option>
                                        {centers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Status Filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Trạng Thái
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="all">-- Tất cả trạng thái --</option>
                                    <option value="active">Đang hoạt động</option>
                                    <option value="inactive">Tạm ngưng</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleResetFilter}
                            >
                                Đặt Lại
                            </Button>
                            <Button
                                type="submit"
                                variant="success"
                                size="sm"
                                icon={<Filter className="h-4 w-4" />}
                            >
                                Áp Dụng Lọc
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Table Data */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="ui-table">
                            <thead>
                                <tr>
                                    <th className="w-12 text-center">STT</th>
                                    <th>Mã Loại</th>
                                    <th>Tên Loại Đề Thi</th>
                                    <th>Trung Tâm</th>
                                    <th className="text-center whitespace-nowrap">Số Đề Thi Đang Dùng</th>
                                    <th className="text-center">Trạng Thái</th>
                                    <th className="text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {examTypes.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Layers className="h-10 w-10 text-gray-300" />
                                                <p className="mt-3 font-semibold text-gray-700">
                                                    Không tìm thấy loại đề thi nào phù hợp
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Hãy thử điều chỉnh bộ lọc hoặc tạo loại đề thi mới vào hệ thống.
                                                </p>
                                                <div className="mt-4">
                                                    <Link href="/exam-types/create">
                                                        <Button variant="success" size="sm" icon={<Plus className="h-4 w-4" />}>
                                                            Thêm Loại Đề Thi Mới
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    examTypes.data.map((type, idx) => {
                                        const isSystemType = type.center_id === null;
                                        return (
                                            <tr key={type.id} className="transition-colors hover:bg-slate-50/60">
                                                {/* STT */}
                                                <td className="text-center font-medium text-gray-500 text-xs">
                                                    {(examTypes.current_page - 1) * 15 + (idx + 1)}
                                                </td>

                                                {/* Code */}
                                                <td>
                                                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 font-mono text-xs font-bold text-emerald-800 border border-emerald-200/60">
                                                        {type.code}
                                                    </span>
                                                </td>

                                                {/* Name & Description */}
                                                <td>
                                                    <div className="space-y-0.5">
                                                        <div className="font-bold text-gray-900">
                                                            {type.name}
                                                        </div>
                                                        {type.description && (
                                                            <div className="text-2xs text-gray-500 line-clamp-1">
                                                                {type.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Center */}
                                                <td>
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-200">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        {type.center?.name || `Trung tâm #${type.center_id}`}
                                                    </span>
                                                </td>

                                                {/* Exams count */}
                                                <td className="text-center">
                                                    <span className="inline-flex items-center justify-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800 border border-gray-200">
                                                        <FileCheck className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                                        {type.exams_count ?? 0} đề thi
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="text-center">
                                                    {type.status === 'active' ? (
                                                        <Badge variant="active">Hoạt động</Badge>
                                                    ) : (
                                                        <Badge variant="danger">Tạm ngưng</Badge>
                                                    )}
                                                </td>

                                                {/* Action Buttons: Sửa & Xóa */}
                                                <td className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/exam-types/${type.id}/edit`}>
                                                            <Button
                                                                variant="edit"
                                                                size="sm"
                                                                icon={<Edit2 className="h-3.5 w-3.5" />}
                                                                title="Chỉnh sửa loại đề thi"
                                                            >
                                                                Sửa
                                                            </Button>
                                                        </Link>

                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            icon={<Trash2 className="h-3.5 w-3.5" />}
                                                            onClick={() => openDeleteModal(type)}
                                                            title="Xóa loại đề thi"
                                                        >
                                                            Xóa
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {examTypes.links && examTypes.links.length > 3 && (
                        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-slate-50/50">
                            <p className="text-xs text-gray-500">
                                Hiển thị <span className="font-semibold text-gray-900">{examTypes.data.length}</span> trên tổng số{' '}
                                <span className="font-semibold text-gray-900">{examTypes.total}</span> loại đề thi
                            </p>
                            <div className="flex gap-1">
                                {examTypes.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveState
                                        className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                                            link.active
                                                ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                                : link.url
                                                  ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 font-medium'
                                                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Confirm Delete Modal */}
            <Modal isOpen={deleteModalOpen} onClose={closeDeleteModal} title="Xác nhận xóa Loại Đề Thi">
                <div className="space-y-4 text-gray-900">
                    <p className="text-sm">
                        Bạn có chắc chắn muốn xóa loại đề thi{' '}
                        <strong className="text-red-600 font-bold">{deletingType?.name}</strong> (Mã:{' '}
                        <code className="px-1.5 py-0.5 bg-gray-100 rounded text-indigo-700 font-mono text-xs font-bold">{deletingType?.code}</code>)?
                    </p>
                    {deletingType && (deletingType.exams_count ?? 0) > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-start gap-2">
                            <FileCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                                Hiện đang có <strong>{deletingType.exams_count}</strong> bài thi đang sử dụng loại đề này. Sau
                                khi xóa, loại đề sẽ được ẩn khỏi danh mục tạo đề thi mới.
                            </span>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={closeDeleteModal} disabled={isDeleting}>
                            Hủy bỏ
                        </Button>
                        <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
