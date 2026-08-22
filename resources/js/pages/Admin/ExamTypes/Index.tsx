import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    FileCheck,
    Plus,
    Search,
    Edit2,
    Trash2,
    AlertCircle,
    Building2,
    Globe,
    Layers,
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
        <AppLayout>
            <Head title="Quản Lý Loại Đề Thi" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Layers className="w-7 h-7 text-indigo-600" />
                            Danh Sách Loại Đề Thi
                        </h1>
                        <p className="text-sm text-gray-700 mt-1">
                            Quản lý các loại đề thi, danh mục kiểm tra và cấu trúc bài thi linh hoạt
                        </p>
                    </div>

                    <Link href="/exam-types/create">
                        <Button variant="success" className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Thêm Loại Đề Thi Mới
                        </Button>
                    </Link>
                </div>

                {/* Filter & Search Bar */}
                <Card className="p-4 bg-white border border-gray-200">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1">
                                Tìm kiếm
                            </label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Tên, mã hoặc mô tả loại đề..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 text-gray-900"
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        {isSuperAdmin && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1">
                                    Trung tâm
                                </label>
                                <select
                                    value={selectedCenterId}
                                    onChange={(e) => setSelectedCenterId(e.target.value)}
                                    className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Tất cả (Hệ thống & Trung tâm)</option>
                                    {centers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1">
                                Trạng thái
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="active">Đang hoạt động</option>
                                <option value="inactive">Tạm ngưng</option>
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
                            <Button type="submit" variant="success" className="flex-1">
                                <Search className="w-4 h-4 mr-1.5" />
                                Lọc dữ liệu
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleResetFilter}
                                className="px-3"
                                title="Đặt lại bộ lọc"
                            >
                                Xóa lọc
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Table Data */}
                <Card className="bg-white border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-700">
                            <thead className="bg-slate-50 text-xs font-semibold text-gray-900 uppercase border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3.5">Mã Loại</th>
                                    <th className="px-4 py-3.5">Tên Loại Đề Thi</th>
                                    <th className="px-4 py-3.5">Phạm Vi / Trung Tâm</th>
                                    <th className="px-4 py-3.5">Mô Tả</th>
                                    <th className="px-4 py-3.5 text-center">Số Đề Thi Đang Dùng</th>
                                    <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                                    <th className="px-4 py-3.5 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {examTypes.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <AlertCircle className="w-10 h-10 text-gray-400 mb-2" />
                                                <p className="font-medium text-gray-900">Không tìm thấy loại đề thi nào</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Hãy thử điều chỉnh bộ lọc hoặc tạo loại đề thi mới.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    examTypes.data.map((type) => {
                                        const isSystemType = type.center_id === null;
                                        return (
                                            <tr key={type.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-mono font-bold text-indigo-700 text-xs">
                                                    {type.code}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="font-semibold text-gray-900">{type.name}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isSystemType ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                            <Globe className="w-3.5 h-3.5" />
                                                            Toàn hệ thống (Mẫu)
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                            <Building2 className="w-3.5 h-3.5" />
                                                            {type.center?.name || `Trung tâm #${type.center_id}`}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 max-w-xs truncate text-gray-600 text-xs">
                                                    {type.description || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                                        <FileCheck className="w-3 h-3 mr-1 text-gray-500" />
                                                        {type.exams_count ?? 0} đề thi
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {type.status === 'active' ? (
                                                        <Badge variant="active">Hoạt động</Badge>
                                                    ) : (
                                                        <Badge variant="danger">Tạm ngưng</Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/exam-types/${type.id}/edit`}>
                                                            <Button
                                                                variant="edit"
                                                                size="sm"
                                                                className="px-2.5 py-1 text-xs"
                                                                title="Chỉnh sửa loại đề thi"
                                                            >
                                                                <Edit2 className="w-3.5 h-3.5 mr-1" />
                                                                Sửa
                                                            </Button>
                                                        </Link>

                                                        {/* Không cho Admin phụ xóa loại đề thi toàn hệ thống */}
                                                        {(!isSystemType || isSuperAdmin) && (
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                className="px-2.5 py-1 text-xs"
                                                                onClick={() => openDeleteModal(type)}
                                                                title="Xóa loại đề thi"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                                Xóa
                                                            </Button>
                                                        )}
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
                        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                Hiển thị <span className="font-semibold">{examTypes.data.length}</span> trên tổng số{' '}
                                <span className="font-semibold">{examTypes.total}</span> loại đề thi
                            </p>
                            <div className="flex gap-1">
                                {examTypes.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveState
                                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                                            link.active
                                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                                                : link.url
                                                  ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
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
                        <code>{deletingType?.code}</code>)?
                    </p>
                    {deletingType && (deletingType.exams_count ?? 0) > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>
                                Hiện đang có <strong>{deletingType.exams_count}</strong> bài thi sử dụng loại đề này. Sau
                                khi xóa, loại đề sẽ được ẩn khỏi danh mục tạo mới.
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
