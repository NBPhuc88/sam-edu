import { Head, Link, router } from '@inertiajs/react';
import { Building2, Plus, Search, Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Pagination from '../../../components/ui/Pagination';
import { TruncatedText } from '../../../components/ui/Tooltip';
import AppLayout from '../../../layouts/AppLayout';
import { formatDate } from '@/lib/date';
import { usePermission } from '@/hooks/usePermission';

interface Center {
    id: number;
    code: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    status: 'active' | 'inactive' | 'expired' | 'suspended';
    subscription_plan: string;
    expires_at: string | null;
    students_count?: number;
    classes_count?: number;
    teachers_count?: number;
}

interface IndexProps {
    centers: {
        data: Center[];
        links: any[];
        from?: number | null;
        to?: number | null;
        total: number;
    };
    filters: {
        search?: string;
        per_page?: number;
    };
}

export const Index: React.FC<IndexProps> = ({ centers, filters }) => {
    const { can } = usePermission();
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [perPage, setPerPage] = useState<number>(filters?.per_page || 20);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingCenter, setDeletingCenter] = useState<Center | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/centers', { search: searchTerm, per_page: perPage }, { preserveState: true });
    };

    const openDeleteModal = (center: Center) => {
        setDeletingCenter(center);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingCenter) {
return;
}

        setIsDeleting(true);
        router.delete(`/centers/${deletingCenter.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setDeletingCenter(null);
            },
        });
    };

    return (
        <AppLayout title="Quản lý Danh sách Trung tâm - SAM Digital">
            <Head title="Quản lý Danh sách Trung tâm" />

            <div className="space-y-6">
                {/* Top Header Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
                            <Building2 className="h-7 w-7 text-emerald-600" />
                            Quản Lý Danh Sách Trung Tâm
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Tổng số <strong>{centers.total}</strong> trung tâm
                            đào tạo trên hệ thống
                        </p>
                    </div>
                    {can('centers.create') && (
                        <Link href="/centers/create">
                            <Button
                                variant="success"
                                size="md"
                                icon={<Plus className="h-4.5 w-4.5" />}
                            >
                                Thêm Trung Tâm Mới
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Filter & Search Bar */}
                <Card className="p-5">
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="flex-1">
                            <Input
                                placeholder="Tìm kiếm theo mã, tên trung tâm, email, sđt..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={
                                    <Search className="h-5 w-5 text-gray-400" />
                                }
                                className="!py-2.5 !text-sm"
                            />
                        </div>
                        <Button type="submit" variant="secondary" size="md" className="px-5">
                            Tìm Kiếm
                        </Button>
                    </form>
                </Card>

                {/* Centers Table List */}
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-700">
                                <tr>
                                    <th className="px-6 py-4">
                                        Mã & Tên Trung Tâm
                                    </th>
                                    <th className="px-6 py-4">Liên Hệ</th>
                                    <th className="px-6 py-4">Gói SaaS</th>
                                    <th className="px-6 py-4">Quy Mô</th>
                                    <th className="px-6 py-4">Hạn Sử Dụng</th>
                                    <th className="px-6 py-4">Trạng Thái</th>
                                    {(can('centers.edit') || can('centers.delete')) && (
                                        <th className="px-6 py-4 text-right">
                                            Thao Tác
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {centers.data && centers.data.length > 0 ? (
                                    centers.data.map((center) => (
                                        <tr
                                            key={center.id}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs space-y-0.5">
                                                    <TruncatedText
                                                        text={center.name}
                                                        maxLines={2}
                                                        className="font-bold text-gray-900"
                                                    />
                                                    <div className="mt-0.5 font-mono text-xs text-gray-400">
                                                        {center.code}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-800">
                                                    {center.phone ||
                                                        'Chưa cập nhật'}
                                                </div>
                                                <div className="text-xs text-gray-400 max-w-[180px] truncate">
                                                    <TruncatedText
                                                        text={center.email || 'N/A'}
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {(() => {
                                                    const planLabels: Record<string, string> = {
                                                        trial: 'Dùng Thử',
                                                        basic_5: 'Cơ Bản (5 Lớp)',
                                                        basic_20: 'Cơ Bản (20 Lớp)',
                                                        advanced_5: 'Nâng Cao (5 Lớp)',
                                                        advanced_20: 'Nâng Cao (20 Lớp)',
                                                    };
                                                    const isAdv = center.subscription_plan?.startsWith('advanced');
                                                    const isTr = center.subscription_plan === 'trial';

                                                    return (
                                                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${
                                                            isAdv
                                                                ? 'bg-purple-50 text-purple-800 border border-purple-200'
                                                                : isTr
                                                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                        }`}>
                                                            {planLabels[center.subscription_plan] || center.subscription_plan}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex items-center gap-3 text-gray-700">
                                                    <span title="Số lớp học">
                                                        <strong>
                                                            {center.classes_count ??
                                                                0}
                                                        </strong>{' '}
                                                        Lớp
                                                    </span>
                                                    <span>•</span>
                                                    <span title="Số học sinh">
                                                        <strong>
                                                            {center.students_count ??
                                                                0}
                                                        </strong>{' '}
                                                        HS
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {center.expires_at ? (
                                                    <div className="flex items-center gap-1.5 text-gray-700">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        {formatDate(center.expires_at)}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        Vô thời hạn
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge
                                                    variant={
                                                        center.status ===
                                                        'active'
                                                            ? 'active'
                                                            : center.status ===
                                                                  'expired'
                                                              ? 'danger'
                                                              : 'info'
                                                    }
                                                >
                                                    {center.status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            {(can('centers.edit') || can('centers.delete')) && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {can('centers.edit') && (
                                                            <Link
                                                                href={`/centers/${center.id}/edit`}
                                                            >
                                                                <Button
                                                                    variant="edit"
                                                                    size="sm"
                                                                    icon={
                                                                        <Edit2 className="h-4 w-4" />
                                                                    }
                                                                >
                                                                    Sửa
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {can('centers.delete') && (
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                icon={
                                                                    <Trash2 className="h-4 w-4" />
                                                                }
                                                                onClick={() =>
                                                                    openDeleteModal(center)
                                                                }
                                                            >
                                                                Xóa
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-12 text-center text-sm text-gray-500"
                                        >
                                            Chưa tìm thấy trung tâm nào phù hợp.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Pagination Footer */}
                <Pagination
                    links={centers.links}
                    from={centers.from}
                    to={centers.to}
                    total={centers.total}
                    perPage={perPage}
                    currentParams={{ search: searchTerm }}
                    onPerPageChange={(newPerPage) => {
                        setPerPage(newPerPage);
                        router.get('/centers', { search: searchTerm, per_page: newPerPage, page: 1 }, { preserveState: true });
                    }}
                />
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Xác Nhận Xóa Trung Tâm"
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
                            Bạn có chắc chắn muốn xóa trung tâm "{deletingCenter?.name}" (Mã: {deletingCenter?.code})?
                        </p>
                    </div>
                    <p className="text-sm text-gray-500">
                        Thông tin trung tâm và các dữ liệu liên quan sẽ được xử lý an toàn theo quy định hệ thống.
                    </p>
                </div>
            </Modal>
        </AppLayout>
    );
};

export default Index;
