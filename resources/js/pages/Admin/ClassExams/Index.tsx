import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    Award,
    FileCheck,
    Plus,
    Search,
    Edit2,
    Trash2,
    Filter,
    Users,
    BookOpen,
    PlayCircle,
    CheckCircle2,
    AlertCircle,
    Eye,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Tooltip, { TruncatedText } from '@/components/ui/Tooltip';
import ScrollableSelect from '@/components/ui/ScrollableSelect';
import AppLayout from '@/layouts/AppLayout';
import AssignExamModal from './AssignExamModal';
import { Center, ClassExam, Exam, PaginatedData, SchoolClass } from './types';

import { usePermission } from '@/hooks/usePermission';
interface Props {
    classExams: PaginatedData<ClassExam>;
    centers: Center[];
    classes: SchoolClass[];
    exams: Exam[];
    stats?: {
        total: number;
        scheduled: number;
        ongoing: number;
        completed: number;
    };
    filters: {
        search?: string;
        center_id?: number | null;
        class_id?: number | null;
        exam_id?: number | null;
        status?: string;
        per_page?: number;
    };
    isTeacher?: boolean;
}

export default function ClassExamIndex({
    classExams,
    centers = [],
    classes = [],
    exams = [],
    stats,
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
    const [selectedClassId, setSelectedClassId] = useState<string>(
        filters.class_id ? String(filters.class_id) : '',
    );
    const [selectedStatus, setSelectedStatus] = useState<string>(
        filters.status || 'all',
    );

    // Modal state
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [editingClassExam, setEditingClassExam] = useState<ClassExam | null>(null);

    // Delete dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingExam, setDeletingExam] = useState<ClassExam | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredClasses = selectedCenterId
        ? classes.filter((c) => String(c.center_id) === String(selectedCenterId))
        : classes;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/class-exams',
            {
                search: search || undefined,
                center_id: selectedCenterId || undefined,
                class_id: selectedClassId || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
            },
            { preserveState: true },
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedCenterId('');
        setSelectedClassId('');
        setSelectedStatus('all');
        router.get('/class-exams', {}, { preserveState: true });
    };

    const openCreateModal = () => {
        setEditingClassExam(null);
        setAssignModalOpen(true);
    };

    const openEditModal = (item: ClassExam) => {
        setEditingClassExam(item);
        setAssignModalOpen(true);
    };

    const openDeleteDialog = (item: ClassExam) => {
        setDeletingExam(item);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingExam) return;
        setIsDeleting(true);
        router.delete(`/class-exams/${deletingExam.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteDialogOpen(false);
                setDeletingExam(null);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                        <Calendar className="h-3 w-3" /> Đã lên lịch
                    </span>
                );
            case 'ongoing':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200 animate-pulse">
                        <PlayCircle className="h-3 w-3" /> Đang diễn ra
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 border border-gray-200">
                        <CheckCircle2 className="h-3 w-3" /> Đã kết thúc
                    </span>
                );
            case 'cancelled':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                        <AlertCircle className="h-3 w-3" /> Đã hủy
                    </span>
                );
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <AppLayout title="Quản Lý Kỳ Thi Lớp Học - SAM Digital">
            <Head title="Quản Lý Kỳ Thi Lớp Học" />

            <div className="space-y-6">
                {/* Top Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Quản Lý Kỳ Thi Lớp Học
                        </h1>
                        <p className="text-sm text-gray-500">
                            Gán đề thi từ Kho đề thi mẫu cho các lớp học, lên lịch thi và theo dõi tiến độ thi.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/exams">
                            <Button
                                variant="secondary"
                                size="md"
                                icon={<BookOpen className="h-4 w-4" />}
                            >
                                Đến Kho Đề Thi
                            </Button>
                        </Link>
                        {can('class-exams.create') && (
                            <Button
                                variant="success"
                                size="md"
                                icon={<Plus className="h-4.5 w-4.5" />}
                                onClick={openCreateModal}
                            >
                                Gán Đề Thi Cho Lớp
                            </Button>
                        )}
                    </div>
                </div>

                {/* KPI Stat Cards */}
                {stats && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-gray-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Tổng Số Kỳ Thi
                                    </p>
                                    <p className="mt-1.5 text-2xl font-extrabold text-gray-900">
                                        {stats.total}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                    <FileCheck className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>

                        <Card className="border-gray-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Đã Lên Lịch
                                    </p>
                                    <p className="mt-1.5 text-2xl font-extrabold text-blue-600">
                                        {stats.scheduled}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                    <Calendar className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>

                        <Card className="border-gray-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Đang Diễn Ra
                                    </p>
                                    <p className="mt-1.5 text-2xl font-extrabold text-emerald-600">
                                        {stats.ongoing}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                                    <PlayCircle className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>

                        <Card className="border-gray-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Đã Hoàn Thành
                                    </p>
                                    <p className="mt-1.5 text-2xl font-extrabold text-purple-600">
                                        {stats.completed}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Filter Card */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Search */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Tìm kiếm kỳ thi
                                </label>
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tên bài thi, lớp học, mã đề..."
                                    icon={<Search className="h-4 w-4 text-gray-400" />}
                                    className="!py-2 !text-sm !h-[38px]"
                                />
                            </div>

                            {/* Center Filter (Super Admin only) */}
                            {isSuperAdmin && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                        Trung Tâm
                                    </label>
                                    <ScrollableSelect
                                        value={selectedCenterId}
                                        onChange={(val) => {
                                            setSelectedCenterId(val);
                                            setSelectedClassId('');
                                        }}
                                        options={[
                                            { value: '', label: '-- Tất cả Trung Tâm --' },
                                            ...centers.map((c) => ({
                                                value: String(c.id),
                                                label: c.name,
                                            })),
                                        ]}
                                        placeholder="-- Tất cả Trung Tâm --"
                                        searchable={true}
                                    />
                                </div>
                            )}

                            {/* Class Filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Lớp Học
                                </label>
                                <ScrollableSelect
                                    value={selectedClassId}
                                    onChange={(val) => setSelectedClassId(val)}
                                    options={[
                                        { value: '', label: '-- Tất cả Lớp Học --' },
                                        ...filteredClasses.map((c) => ({
                                            value: String(c.id),
                                            label: c.name,
                                        })),
                                    ]}
                                    placeholder="-- Tất cả Lớp Học --"
                                    searchable={true}
                                />
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Trạng thái
                                </label>
                                <ScrollableSelect
                                    value={selectedStatus}
                                    onChange={(val) => setSelectedStatus(val)}
                                    options={[
                                        { value: 'all', label: 'Tất cả trạng thái' },
                                        { value: 'scheduled', label: 'Đã lên lịch' },
                                        { value: 'ongoing', label: 'Đang diễn ra' },
                                        { value: 'completed', label: 'Đã kết thúc' },
                                        { value: 'cancelled', label: 'Đã hủy' },
                                    ]}
                                    placeholder="Tất cả trạng thái"
                                    searchable={false}
                                />
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

                {/* Data Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="ui-table">
                            <thead>
                                <tr>
                                    <th className="w-12 text-center">STT</th>
                                    <th>Mã & Tiêu Đề</th>
                                    <th>Mã Vào Phòng</th>
                                    <th>Lớp Học</th>
                                    <th>Đề Thi Gốc</th>
                                    <th>Lịch Thi</th>
                                    <th>Thời Lượng</th>
                                    <th>Thang Điểm</th>
                                    <th>Trạng Thái</th>
                                    {(can('class-exams.edit') || can('class-exams.delete')) && (
                                        <th className="text-right">Thao Tác</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {classExams.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={can('class-exams.edit') || can('class-exams.delete') ? 10 : 9} className="py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <FileCheck className="h-10 w-10 text-gray-300" />
                                                <p className="mt-3 font-semibold text-gray-700">
                                                    Chưa có kỳ thi nào được gán cho lớp
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Hãy chọn đề thi từ Kho đề thi mẫu và gán vào lớp học để lên lịch thi.
                                                </p>
                                                {can('class-exams.create') && (
                                                    <div className="mt-4">
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            icon={<Plus className="h-4 w-4" />}
                                                            onClick={openCreateModal}
                                                        >
                                                            Gán Đề Thi Ngay
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    classExams.data.map((item, index) => {
                                        const rowNum = (classExams.current_page - 1) * classExams.per_page + index + 1;
                                        const cls = item.schoolClass || item.school_class;
                                        const ex = item.exam;

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="text-center font-mono text-xs font-semibold text-gray-500">
                                                    {rowNum}
                                                </td>
                                                <td>
                                                    <div className="max-w-xs space-y-0.5">
                                                        <TruncatedText
                                                            text={item.title}
                                                            maxLines={2}
                                                            className="font-bold text-gray-900 text-sm"
                                                        />
                                                        <div className="font-mono text-2xs text-gray-500">
                                                            Mã: {item.code || `CE${item.id}`}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                                        {item.access_code || '---'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="max-w-[200px] space-y-0.5">
                                                        <div className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                                                            <Users className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                            <TruncatedText
                                                                text={cls?.name || 'N/A'}
                                                                maxLines={1}
                                                                className="font-bold text-gray-800 text-xs"
                                                            />
                                                        </div>
                                                        <TruncatedText
                                                            text={cls?.center?.name || ''}
                                                            maxLines={1}
                                                            className="text-2xs text-gray-500"
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="max-w-[200px] space-y-0.5">
                                                        <div className="font-semibold text-blue-900 text-xs flex items-center gap-1">
                                                            <BookOpen className="h-3 w-3 text-blue-600 shrink-0" />
                                                            <TruncatedText
                                                                text={ex?.name || 'Đề thi không xác định'}
                                                                maxLines={1}
                                                                className="font-semibold text-blue-900 text-xs"
                                                            />
                                                        </div>
                                                        {ex?.subject && (
                                                            <Tooltip content={`Môn học: ${ex.subject.name}`}>
                                                                <span className="text-3xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 inline-block max-w-[150px] truncate">
                                                                    {ex.subject.name}
                                                                </span>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="space-y-0.5 text-xs text-gray-700">
                                                        <div className="flex items-center gap-1 font-medium">
                                                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                            <span>{item.exam_date}</span>
                                                        </div>
                                                        {item.start_time && (
                                                            <span className="text-2xs text-gray-500 flex items-center gap-1">
                                                                <Clock className="h-3 w-3 text-gray-400" />
                                                                {item.start_time.substring(0, 5)} {item.end_time ? `- ${item.end_time.substring(0, 5)}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="font-semibold text-xs text-gray-800">
                                                        {item.duration_minutes || ex?.duration_minutes || 45} phút
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-1 text-sm font-bold text-gray-900">
                                                        <Award className="h-3.5 w-3.5 text-amber-500" />
                                                        <span>{item.max_score}</span>
                                                        {item.pass_score && (
                                                            <span className="text-2xs font-normal text-gray-500">
                                                                (Đạt: {item.pass_score})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {getStatusBadge(item.status)}
                                                </td>
                                                {(can('class-exams.edit') || can('class-exams.delete')) && (
                                                    <td className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link href={`/class-exams/${item.id}/room`}>
                                                                <Button
                                                                    type="button"
                                                                    variant="success"
                                                                    size="sm"
                                                                    icon={<PlayCircle className="h-3.5 w-3.5" />}
                                                                    title="Vào phòng thi"
                                                                >
                                                                    Phòng Thi
                                                                </Button>
                                                            </Link>
                                                            {can('class-exams.edit') && (
                                                                <Button
                                                                    type="button"
                                                                    variant="edit"
                                                                    size="sm"
                                                                    icon={<Edit2 className="h-3.5 w-3.5" />}
                                                                    onClick={() => openEditModal(item)}
                                                                    title="Sửa lịch thi"
                                                                >
                                                                    Sửa
                                                                </Button>
                                                            )}
                                                            {can('class-exams.delete') && (
                                                                <Button
                                                                    type="button"
                                                                    variant="danger"
                                                                    size="sm"
                                                                    icon={<Trash2 className="h-3.5 w-3.5" />}
                                                                    onClick={() => openDeleteDialog(item)}
                                                                    title="Hủy kỳ thi"
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
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Assign / Edit Exam Modal */}
            <AssignExamModal
                isOpen={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                centers={centers}
                classes={classes}
                exams={exams}
                editingClassExam={editingClassExam}
            />

            {/* Delete Confirm Popup */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                title="Xác Nhận Hủy Kỳ Thi Của Lớp"
                message={`Bạn có chắc chắn muốn hủy kỳ thi "${deletingExam?.title}" của lớp ${deletingExam?.schoolClass?.name || deletingExam?.school_class?.name}? Thao tác này không thể hoàn tác.`}
                confirmLabel="Xóa Kỳ Thi"
                cancelLabel="Giữ Lại"
                variant="danger"
                isLoading={isDeleting}
                onConfirm={confirmDelete}
                onCancel={() => setDeleteDialogOpen(false)}
            />
        </AppLayout>
    );
}
