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
import Tooltip, { TruncatedText } from '@/components/ui/Tooltip';
import AppLayout from '@/layouts/AppLayout';
import { formatDate } from '@/lib/date';

import { usePermission } from '@/hooks/usePermission';
import { useCanUseChat } from '@/hooks/usePlanFeature';
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
        per_page?: number;
    };
    isTeacher?: boolean;
}

export default function ClassIndex({
    classes,
    centers = [],
    filters,
    isTeacher = false,
}: Props) {
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

    const canUseChat = useCanUseChat();

    const getStatusBadge = (status: number | string) => {
        const num = Number(status);

        if (num === 1 || status === 'active') {
            return <Badge variant="active">Đang hoạt động</Badge>;
        }

        if (num === 2 || status === 'completed') {
            return <Badge variant="pending">Đã hoàn thành</Badge>;
        }

        if (num === 3 || status === 'closed') {
            return <Badge variant="danger">Đã đóng</Badge>;
        }

        return <Badge variant="expired">Tạm dừng</Badge>;
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
                                    <option value="1">Đang hoạt động</option>
                                    <option value="0">Tạm dừng</option>
                                    <option value="2">Đã hoàn thành</option>
                                    <option value="3">Đã đóng</option>
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
                                    {isSuperAdmin && <th className="px-6 py-4">Trung Tâm</th>}
                                    {isTeacher ? (
                                        <th className="px-6 py-4">Môn Học</th>
                                    ) : (
                                        <th className="px-6 py-4">Môn Học & Giáo Viên Phụ Trách</th>
                                    )}
                                    <th className="px-6 py-4 whitespace-nowrap">Sĩ Số</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Trạng Thái</th>
                                    <th className="px-6 py-4 text-right whitespace-nowrap">Thao Tác</th>
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
                                                <div className="min-w-[200px] max-w-xs space-y-1">
                                                    <TruncatedText
                                                        text={cls.name}
                                                        maxLines={2}
                                                        className="font-bold text-gray-900"
                                                    />
                                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                                        <span className="font-mono text-gray-400">
                                                            {cls.code}
                                                        </span>
                                                        {(cls.start_date || cls.end_date) && (
                                                            <span className="inline-flex items-center gap-1 text-gray-500 font-mono text-[11px]">
                                                                <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
                                                                {formatDate(cls.start_date, '/')}
                                                                {cls.end_date ? ` - ${formatDate(cls.end_date, '/')}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {cls.description && (
                                                        <TruncatedText
                                                            text={cls.description}
                                                            maxLines={1}
                                                            className="text-xs text-gray-500"
                                                        />
                                                    )}
                                                </div>
                                            </td>

                                            {isSuperAdmin && (
                                                <td className="px-6 py-4">
                                                    <div className="max-w-[200px] space-y-0.5">
                                                        <TruncatedText
                                                            text={cls.center?.name || 'N/A'}
                                                            maxLines={1}
                                                            className="font-semibold text-gray-800"
                                                        />
                                                        {cls.center?.code && (
                                                            <div className="font-mono text-xs text-gray-400">
                                                                {cls.center.code}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            )}

                                            <td className="px-6 py-4">
                                                {cls.class_subjects && cls.class_subjects.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1.5 max-w-sm">
                                                        {cls.class_subjects.map((cs) => {
                                                            const subjectName = cs.subject?.name || 'Môn học';
                                                            const teacherName = cs.teacher?.full_name ? `GV ${cs.teacher.full_name}` : 'Chưa gán';
                                                            return isTeacher ? (
                                                                <div
                                                                    key={cs.id}
                                                                    className="inline-flex items-center rounded-md border border-gray-200 bg-slate-50/80 px-2.5 py-1 text-xs font-semibold text-gray-800"
                                                                >
                                                                    {subjectName}
                                                                </div>
                                                            ) : (
                                                                <Tooltip
                                                                    key={cs.id}
                                                                    content={`${subjectName} • ${teacherName}`}
                                                                >
                                                                    <div className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-slate-50/80 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-slate-100 hover:border-gray-300">
                                                                        <span className="font-semibold text-gray-800 truncate max-w-[140px]">
                                                                            {subjectName}
                                                                        </span>
                                                                        <span className="text-gray-300">•</span>
                                                                        <span className="text-emerald-700 truncate max-w-[120px]">
                                                                            {teacherName}
                                                                        </span>
                                                                    </div>
                                                                </Tooltip>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <span className="italic text-xs text-gray-400">
                                                        {isTeacher ? 'Chưa gán môn học' : 'Chưa gán môn & giáo viên'}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
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

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(cls.status)}
                                            </td>

                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Tooltip content="Xem thời khóa biểu lớp học">
                                                        <Link
                                                            href={`/classes/${cls.id}/schedule`}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors shadow-2xs"
                                                        >
                                                            <Calendar className="h-4 w-4" />
                                                        </Link>
                                                    </Tooltip>
                                                    <Tooltip content="Danh sách học sinh trong lớp">
                                                        <Link
                                                            href={`/classes/${cls.id}/students`}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors shadow-2xs"
                                                        >
                                                            <Users className="h-4 w-4" />
                                                        </Link>
                                                    </Tooltip>
                                                    <Tooltip content={canUseChat ? 'Nhóm chat trao đổi lớp học' : 'Nhóm chat (Tính năng thuộc Gói Nâng Cao 🔒)'}>
                                                        <Link
                                                            href={canUseChat ? `/classes/${cls.id}/chat` : '/upgrade-plan?feature=chat'}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300 transition-colors shadow-2xs"
                                                        >
                                                            <MessageSquare className="h-4 w-4" />
                                                        </Link>
                                                    </Tooltip>
                                                    {!isTeacher && can('classes.edit') && (
                                                        <Tooltip content="Chỉnh sửa lớp học">
                                                            <Link href={`/classes/${cls.id}/edit`}>
                                                                <Button
                                                                    variant="edit"
                                                                    size="sm"
                                                                    icon={<Edit2 className="h-3.5 w-3.5" />}
                                                                    className="h-8 px-2.5 text-xs"
                                                                >
                                                                    Sửa
                                                                </Button>
                                                            </Link>
                                                        </Tooltip>
                                                    )}
                                                    {!isTeacher && can('classes.delete') && (
                                                        <Tooltip content="Xóa lớp học">
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                icon={<Trash2 className="h-3.5 w-3.5" />}
                                                                onClick={() => openDeleteModal(cls)}
                                                                className="h-8 px-2.5 text-xs"
                                                            >
                                                                Xóa
                                                            </Button>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={(isSuperAdmin ? 1 : 0) + 5}
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
