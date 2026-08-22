import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    GraduationCap,
    Plus,
    Search,
    Edit2,
    Trash2,
    Users,
    MessageSquare,
    AlertCircle,
    Filter,
    Calendar,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AppLayout from '@/layouts/AppLayout';

import { usePermission } from '@/hooks/usePermission';
interface Center {
    id: number;
    name: string;
    code: string;
}

interface Subject {
    id: number;
    name: string;
    code: string;
}

interface Teacher {
    id: number;
    full_name: string;
    teacher_code: string;
}

interface ClassSubject {
    id: number;
    subject_id: number;
    teacher_id: number;
    subject?: Subject;
    teacher?: Teacher;
}

interface SchoolClass {
    id: number;
    center_id: number;
    code: string;
    name: string;
    description: string | null;
    max_students: number | null;
    start_date: string | null;
    end_date: string | null;
    status: number | string;
    students_count?: number;
    center?: Center;
    class_subjects?: ClassSubject[];
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    classes: PaginatedData<SchoolClass>;
    centers: Center[];
    filters: {
        search?: string;
        center_id?: number | null;
        status?: string;
    };
}

export default function ClassIndex({ classes, centers = [], filters }: Props) {
    const { can } = usePermission();
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
    const [deletingClass, setDeletingClass] = useState<SchoolClass | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/classes',
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
        router.get('/classes', {}, { preserveState: true });
    };

    const openDeleteModal = (cls: SchoolClass) => {
        setDeletingClass(cls);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingClass) {
return;
}

        setIsDeleting(true);
        router.delete(`/classes/${deletingClass.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setDeletingClass(null);
            },
        });
    };

    const getStatusBadge = (status: number | string) => {
        const num = Number(status);

        if (num === 1 || status === 'active') {
            return <Badge variant="active">Đang mở lớp</Badge>;
        }

        if (num === 2 || status === 'completed') {
            return <Badge variant="pending">Đã hoàn thành</Badge>;
        }

        return <Badge variant="expired">Tạm dừng / Đóng</Badge>;
    };

    return (
        <AppLayout title="Quản Lý Lớp Học - Hệ Thống Giáo Dục Sam">
            <Head title="Quản Lý Lớp Học" />

            <div className="space-y-6">
                {/* Header Top Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
                            <GraduationCap className="h-7 w-7 text-emerald-600" />
                            Quản Lý Lớp Học
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Quản lý thông tin lớp học, phân công nhiều môn học & giáo viên phụ trách theo trung tâm.
                        </p>
                    </div>

                    {can('classes.create') && (
                        <Link href="/classes/create">
                            <Button
                                variant="success"
                                size="md"
                                icon={<Plus className="h-4.5 w-4.5" />}
                            >
                                Thêm Lớp Học Mới
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
                                    placeholder="Tìm theo tên lớp, mã lớp, môn học, giáo viên..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    icon={<Search className="h-5 w-5 text-gray-400" />}
                                    className="!py-2.5 !text-sm"
                                />
                            </div>

                            {isSuperAdmin && centers && centers.length > 1 && (
                                <div>
                                    <select
                                        value={selectedCenterId}
                                        onChange={(e) => setSelectedCenterId(e.target.value)}
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
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="all">Tất cả Trạng thái</option>
                                    <option value="1">Đang mở lớp</option>
                                    <option value="2">Đã hoàn thành</option>
                                    <option value="0">Tạm dừng / Đóng</option>
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

                {/* Main Classes Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Lớp Học</th>
                                    <th className="px-6 py-4">Trung Tâm</th>
                                    <th className="px-6 py-4">Môn Học & Giáo Viên Phụ Trách</th>
                                    <th className="px-6 py-4">Sĩ Số</th>
                                    <th className="px-6 py-4">Thời Gian</th>
                                    <th className="px-6 py-4">Trạng Thái</th>
                                    {(can('classes.edit') || can('classes.delete')) && (
                                        <th className="px-6 py-4 text-right">Thao Tác</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {classes.data && classes.data.length > 0 ? (
                                    classes.data.map((cls) => (
                                        <tr
                                            key={cls.id}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">
                                                    {cls.name}
                                                </div>
                                                <div className="mt-0.5 font-mono text-xs text-gray-400">
                                                    Mã: {cls.code}
                                                </div>
                                                {cls.description && (
                                                    <div className="mt-1 line-clamp-1 text-xs text-gray-500">
                                                        {cls.description}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800">
                                                    {cls.center?.name || 'N/A'}
                                                </div>
                                                {cls.center?.code && (
                                                    <div className="font-mono text-xs text-gray-400">
                                                        {cls.center.code}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {cls.class_subjects && cls.class_subjects.length > 0 ? (
                                                    <div className="flex flex-col gap-1.5">
                                                        {cls.class_subjects.map((cs) => (
                                                            <div
                                                                key={cs.id}
                                                                className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs"
                                                            >
                                                                <span className="font-bold text-gray-800">
                                                                    {cs.subject?.name || 'Môn học'}:
                                                                </span>
                                                                <span className="text-emerald-700 font-medium">
                                                                    GV {cs.teacher?.full_name || 'Chưa gán'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="italic text-gray-400">Chưa gán môn & giáo viên</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                                                    <Users className="h-4 w-4 text-gray-400" />
                                                    <span>{cls.students_count || 0}</span>
                                                    {cls.max_students && (
                                                        <span className="text-gray-400 font-normal">
                                                            / {cls.max_students}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-xs text-gray-600">
                                                {cls.start_date || cls.end_date ? (
                                                    <div>
                                                        <div>Từ: {cls.start_date || '...'}</div>
                                                        <div>Đến: {cls.end_date || '...'}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {getStatusBadge(cls.status)}
                                            </td>

                                            {(can('classes.edit') || can('classes.delete')) && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={`/classes/${cls.id}/schedule`}>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                icon={<Calendar className="h-4 w-4 text-emerald-600" />}
                                                                title="Xem thời khóa biểu lớp học"
                                                            >
                                                                Lịch Học
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/classes/${cls.id}/students`}>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                icon={<Users className="h-4 w-4" />}
                                                                title="Danh sách học sinh"
                                                            >
                                                                Học Sinh
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/classes/${cls.id}/chat`}>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
                                                                title="Nhóm chat lớp"
                                                            >
                                                                Chat
                                                            </Button>
                                                        </Link>
                                                        {can('classes.edit') && (
                                                            <Link href={`/classes/${cls.id}/edit`}>
                                                                <Button
                                                                    variant="edit"
                                                                    size="sm"
                                                                    icon={<Edit2 className="h-4 w-4" />}
                                                                    title="Sửa lớp học"
                                                                >
                                                                    Sửa
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {can('classes.delete') && (
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                icon={<Trash2 className="h-4 w-4" />}
                                                                onClick={() => openDeleteModal(cls)}
                                                                title="Xóa lớp học"
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
                                            colSpan={can('classes.edit') || can('classes.delete') ? 7 : 6}
                                            className="px-6 py-12 text-center text-sm text-gray-500"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <GraduationCap className="h-10 w-10 text-gray-300" />
                                                <p className="text-base font-semibold text-gray-700">
                                                    Không tìm thấy lớp học nào phù hợp
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Thử thay đổi bộ lọc hoặc tạo lớp học mới cho trung tâm.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {classes.links && classes.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 text-sm text-gray-600">
                            <div>
                                Hiển thị trang <strong>{classes.current_page}</strong> / {classes.last_page} (Tổng {classes.total} lớp học)
                            </div>
                            <div className="flex gap-1.5">
                                {classes.links.map((link, idx) => (
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
                title="Xác Nhận Xóa Lớp Học"
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
                            Bạn có chắc chắn muốn xóa lớp học "{deletingClass?.name}" (Mã: {deletingClass?.code})?
                        </p>
                    </div>
                    <p className="text-sm text-gray-500">
                        Lớp học và dữ liệu phân công môn học sẽ được ẩn khỏi hệ thống (soft delete).
                    </p>
                </div>
            </Modal>
        </AppLayout>
    );
}
