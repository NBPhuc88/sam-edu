import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ScrollableSelect from '@/components/ui/ScrollableSelect';
import { TruncatedText } from '@/components/ui/Tooltip';
import {
SUBJECT_STATUS_ACTIVE,
SUBJECT_STATUS_INACTIVE,
SUBJECT_STATUS_LABELS,
} from '@/constants/enums';
import AppLayout from '@/layouts/AppLayout';
import { Head,Link,router,usePage } from '@inertiajs/react';
import {
AlertCircle,
BookOpen,
Calendar,
Edit2,
Filter,
Plus,
Search,
Trash2,
} from 'lucide-react';
import React,{ useState } from 'react';

import { usePermission } from '@/hooks/usePermission';
interface Center {
    id: number;
    name: string;
    code: string;
}

interface Subject {
    id: number;
    center_id: number;
    code: string;
    name: string;
    description: string | null;
    total_sessions: number | null;
    duration_minutes: number | null;
    tuition_fee: number | null;
    status: number;
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
    subjects: PaginatedData<Subject>;
    centers: Center[];
    filters: {
        search?: string;
        center_id?: number | null;
        status?: number;
    };
}

export default function SubjectIndex({ subjects, centers = [], filters }: Props) {
    const { can } = usePermission();
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCenterId, setSelectedCenterId] = useState<string>(
        filters.center_id ? String(filters.center_id) : '',
    );
    const [selectedStatus, setSelectedStatus] = useState<string>(
        filters.status !== undefined ? String(filters.status) : 'all',
    );

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const formatCurrency = (amount: number | string | null) => {
        if (amount === null || amount === undefined) {
return 'Chưa thiết lập';
}

        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(Number(amount) || 0);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/subjects',
            {
                search: search || undefined,
                center_id: selectedCenterId || undefined,
                status: selectedStatus !== 'all' ? Number(selectedStatus) : undefined,
            },
            { preserveState: true },
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedCenterId('');
        setSelectedStatus('all');
        router.get('/subjects', {}, { preserveState: true });
    };

    const handleDelete = (subject: Subject) => {
        setDeletingSubject(subject);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingSubject) return;

        setIsDeleting(true);
        router.delete(`/subjects/${deletingSubject.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setDeletingSubject(null);
            },
        });
    };

    const getStatusBadge = (status: number) => {
        if (status === SUBJECT_STATUS_ACTIVE) {
            return <Badge variant="active">{SUBJECT_STATUS_LABELS[SUBJECT_STATUS_ACTIVE]}</Badge>;
        }
        return <Badge variant="expired">{SUBJECT_STATUS_LABELS[SUBJECT_STATUS_INACTIVE]}</Badge>;
    };

    return (
        <AppLayout title="Quản Lý Môn Học - SAM Digital">
            <Head title="Quản Lý Môn Học" />

            <div className="space-y-6">
                {/* Header Top Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
                            <BookOpen className="h-7 w-7 text-emerald-600" />
                            Quản Lý Môn Học
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Danh mục các môn học, khóa đào tạo, số buổi học và học phí theo từng trung tâm.
                        </p>
                    </div>

                    {can('subjects.create') && (
                        <Link href="/subjects/create">
                            <Button
                                variant="success"
                                size="md"
                                icon={<Plus className="h-4.5 w-4.5" />}
                            >
                                Thêm Môn Học Mới
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Filter Box */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="lg:col-span-2">
                                <Input
                                    placeholder="Tìm theo tên môn học, mã môn, mô tả..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    icon={<Search className="h-5 w-5 text-gray-400" />}
                                    className="!py-2.5 !text-sm"
                                />
                            </div>

                            {isSuperAdmin && centers && centers.length > 1 && (
                                <div>
                                    <ScrollableSelect
                                        value={selectedCenterId}
                                        onChange={(val) => setSelectedCenterId(val)}
                                        placeholder="Tất cả Trung tâm"
                                        options={[
                                            { value: '', label: 'Tất cả Trung tâm' },
                                            ...centers.map((c) => ({
                                                value: String(c.id),
                                                label: `${c.name} (${c.code})`,
                                            })),
                                        ]}
                                    />
                                </div>
                            )}

                            <div>
                                <ScrollableSelect
                                    value={selectedStatus}
                                    onChange={(val) => setSelectedStatus(val)}
                                    options={[
                                        { value: 'all', label: 'Tất cả Trạng thái' },
                                        { value: String(SUBJECT_STATUS_ACTIVE), label: SUBJECT_STATUS_LABELS[SUBJECT_STATUS_ACTIVE] },
                                        { value: String(SUBJECT_STATUS_INACTIVE), label: SUBJECT_STATUS_LABELS[SUBJECT_STATUS_INACTIVE] },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-1">
                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                onClick={handleResetFilter}
                            >
                                Đặt lại
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

                {/* Main Subjects Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Môn Học</th>
                                    <th className="px-6 py-4">Trung Tâm</th>
                                    <th className="px-6 py-4">Số Buổi Học</th>
                                    <th className="px-6 py-4">Thời Lượng / Buổi</th>
                                    <th className="px-6 py-4">Học Phí Mặc Định</th>
                                    <th className="px-6 py-4">Trạng Thái</th>
                                    {(can('subjects.edit') || can('subjects.delete')) && (
                                        <th className="px-6 py-4 text-right">Thao Tác</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {subjects.data && subjects.data.length > 0 ? (
                                    subjects.data.map((sub) => (
                                        <tr
                                            key={sub.id}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs space-y-0.5">
                                                    <TruncatedText
                                                        text={sub.name}
                                                        maxLines={2}
                                                        className="font-bold text-gray-900"
                                                    />
                                                    <div className="mt-0.5 font-mono text-xs text-gray-400">
                                                        Mã: {sub.code}
                                                    </div>
                                                    {sub.description && (
                                                        <TruncatedText
                                                            text={sub.description}
                                                            maxLines={1}
                                                            className="mt-1 text-xs text-gray-500"
                                                        />
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="max-w-[200px] space-y-0.5">
                                                    <TruncatedText
                                                        text={sub.center?.name || 'N/A'}
                                                        maxLines={1}
                                                        className="font-semibold text-gray-800"
                                                    />
                                                    {sub.center?.code && (
                                                        <div className="font-mono text-xs text-gray-400">
                                                            {sub.center.code}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-gray-800">
                                                {sub.total_sessions ? `${sub.total_sessions} buổi` : '-'}
                                            </td>

                                            <td className="px-6 py-4 font-medium text-gray-700">
                                                {sub.duration_minutes ? `${sub.duration_minutes} phút` : '-'}
                                            </td>

                                            <td className="px-6 py-4 font-extrabold text-emerald-700">
                                                {formatCurrency(sub.tuition_fee)}
                                            </td>

                                            <td className="px-6 py-4">
                                                {getStatusBadge(sub.status)}
                                            </td>

                                            {(can('subjects.edit') || can('subjects.delete')) && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/sessions?subject_id=${sub.id}`}>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                icon={<Calendar className="h-4 w-4 text-emerald-600" />}
                                                                title="Xem danh sách ca/buổi học của môn này"
                                                            >
                                                                Buổi Học
                                                            </Button>
                                                        </Link>
                                                        {can('subjects.edit') && (
                                                            <Link href={`/subjects/${sub.id}/edit`}>
                                                                <Button
                                                                    variant="edit"
                                                                    size="sm"
                                                                    icon={<Edit2 className="h-4 w-4" />}
                                                                    title="Sửa môn học"
                                                                >
                                                                    Sửa
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {can('subjects.delete') && (
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                icon={<Trash2 className="h-4 w-4" />}
                                                                onClick={() => handleDelete(sub)}
                                                                title="Xóa môn học"
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
                                            colSpan={can('subjects.edit') || can('subjects.delete') ? 7 : 6}
                                            className="px-6 py-12 text-center text-sm text-gray-500"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <BookOpen className="h-10 w-10 text-gray-300" />
                                                <p className="text-base font-semibold text-gray-700">
                                                    Không tìm thấy môn học nào phù hợp
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Thử thay đổi bộ lọc hoặc thêm môn học mới cho trung tâm.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {subjects.links && subjects.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 text-sm text-gray-600">
                            <div>
                                Hiển thị trang <strong>{subjects.current_page}</strong> / {subjects.last_page} (Tổng {subjects.total} môn học)
                            </div>
                            <div className="flex gap-1.5">
                                {subjects.links.map((link, idx) => (
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
                title="Xác Nhận Xóa Môn Học"
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
                            Bạn có chắc chắn muốn xóa môn học "{deletingSubject?.name}" (Mã: {deletingSubject?.code})?
                        </p>
                    </div>
                    <p className="text-sm text-gray-500">
                        Môn học sẽ được ẩn khỏi hệ thống và có thể khôi phục khi cần thiết.
                    </p>
                </div>
            </Modal>
        </AppLayout>
    );
}
