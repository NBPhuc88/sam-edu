import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Download,
    Upload,
    Search,
    FileSpreadsheet,
    UserCheck,
    Plus,
    Edit2,
    Trash2,
    GraduationCap,
    Building2,
    Phone,
    Mail,
    AlertCircle,
    Calendar,
    Filter,
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

interface Teacher {
    id: number;
    teacher_code: string;
    username: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    specialization: string | null;
    gender: 'male' | 'female' | 'other' | null;
    date_of_birth: string | null;
    hire_date: string | null;
    status: string;
    center_id: number;
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
    teachers: PaginatedData<Teacher>;
    centers: Center[];
    filters: {
        search?: string;
        center_id?: number | null;
        status?: string;
    };
}

export default function TeacherIndex({ teachers, centers = [], filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCenterId, setSelectedCenterId] = useState<string>(
        filters.center_id ? String(filters.center_id) : '',
    );
    const [selectedStatus, setSelectedStatus] = useState<string>(
        filters.status || 'all',
    );

    // Import modal state
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingTeacher, setDeletingTeacher] = useState<Teacher | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/teachers',
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
        router.get('/teachers', {}, { preserveState: true });
    };

    const handleExport = () => {
        const queryParams = new URLSearchParams();
        if (selectedCenterId) queryParams.append('center_id', selectedCenterId);
        window.location.href = `/teachers/export?${queryParams.toString()}`;
    };

    const handleDownloadSample = () => {
        window.location.href = '/teachers/sample-csv';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setErrorMessage(null);
        }
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setErrorMessage('Vui lòng chọn tệp CSV để tải lên.');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        if (selectedCenterId) {
            formData.append('center_id', selectedCenterId);
        }

        router.post('/teachers/import', formData, {
            onSuccess: () => {
                setIsImportModalOpen(false);
                setSelectedFile(null);
            },
            onError: (errors) => {
                setErrorMessage(errors.file || 'Có lỗi xảy ra khi tải lên tệp CSV.');
            },
            onFinish: () => {
                setIsUploading(false);
            },
        });
    };

    const openDeleteModal = (teacher: Teacher) => {
        setDeletingTeacher(teacher);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingTeacher) return;
        setIsDeleting(true);
        router.delete(`/teachers/${deletingTeacher.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setDeletingTeacher(null);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="active">Đang hoạt động</Badge>;
            case 'inactive':
                return <Badge variant="expired">Tạm dừng</Badge>;
            case 'locked':
                return <Badge variant="danger">Bị khóa</Badge>;
            default:
                return <Badge variant="info">{status}</Badge>;
        }
    };

    const getGenderLabel = (gender: string | null) => {
        switch (gender) {
            case 'male':
                return 'Nam';
            case 'female':
                return 'Nữ';
            case 'other':
                return 'Khác';
            default:
                return '-';
        }
    };

    return (
        <AppLayout title="Quản Lý Giáo Viên - Hệ Thống Giáo Dục Sam">
            <Head title="Quản Lý Giáo Viên" />

            <div className="space-y-6">
                {/* Header Top Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
                            <GraduationCap className="h-7 w-7 text-emerald-600" />
                            Quản Lý Giáo Viên
                        </h1>
                        <p className="mt-1 text-xs text-gray-500">
                            Danh sách giáo viên, giảng viên trực thuộc trung tâm và thông tin chuyên môn đào tạo.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<FileSpreadsheet className="h-4 w-4" />}
                            onClick={handleDownloadSample}
                            title="Tải tệp mẫu CSV"
                        >
                            Tệp Mẫu CSV
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<Upload className="h-4 w-4" />}
                            onClick={() => setIsImportModalOpen(true)}
                        >
                            Import CSV
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<Download className="h-4 w-4" />}
                            onClick={handleExport}
                        >
                            Export CSV
                        </Button>
                        <Link href="/teachers/create">
                            <Button
                                variant="success"
                                size="md"
                                icon={<Plus className="h-4 w-4" />}
                            >
                                Thêm Giáo Viên Mới
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filter Box */}
                <Card className="border-gray-200 bg-white p-4 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="lg:col-span-2">
                                <Input
                                    placeholder="Tìm theo tên giáo viên, mã GV, username, email, môn dạy..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    icon={<Search className="h-4 w-4 text-gray-400" />}
                                />
                            </div>

                            {centers && centers.length > 1 && (
                                <div>
                                    <select
                                        value={selectedCenterId}
                                        onChange={(e) => setSelectedCenterId(e.target.value)}
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
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="all">Tất cả Trạng thái</option>
                                    <option value="active">Đang hoạt động</option>
                                    <option value="inactive">Tạm dừng</option>
                                    <option value="locked">Bị khóa</option>
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
                                Đặt lại
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

                {/* Main Teachers Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Giáo Viên</th>
                                    <th className="px-6 py-4">Tài Khoản & Liên Hệ</th>
                                    <th className="px-6 py-4">Trung Tâm</th>
                                    <th className="px-6 py-4">Chuyên Môn</th>
                                    <th className="px-6 py-4">Ngày Vào Làm</th>
                                    <th className="px-6 py-4">Trạng Thái</th>
                                    <th className="px-6 py-4 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {teachers.data && teachers.data.length > 0 ? (
                                    teachers.data.map((teacher) => (
                                        <tr
                                            key={teacher.id}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                                                        {teacher.full_name?.charAt(0) || 'G'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">
                                                            {teacher.full_name}
                                                        </div>
                                                        <div className="font-mono text-[11px] text-gray-400">
                                                            Mã: {teacher.teacher_code} • {getGenderLabel(teacher.gender)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-mono text-gray-800">
                                                    @{teacher.username}
                                                </div>
                                                <div className="mt-0.5 text-[11px] text-gray-500">
                                                    {teacher.phone && <span>{teacher.phone}</span>}
                                                    {teacher.email && (
                                                        <span>{teacher.phone ? ' • ' : ''}{teacher.email}</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800">
                                                    {teacher.center?.name || 'N/A'}
                                                </div>
                                                {teacher.center?.code && (
                                                    <div className="font-mono text-[11px] text-gray-400">
                                                        {teacher.center.code}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {teacher.specialization ? (
                                                    <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                        {teacher.specialization}
                                                    </span>
                                                ) : (
                                                    <span className="italic text-gray-400">Chưa thiết lập</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 font-mono text-gray-600">
                                                {teacher.hire_date || '-'}
                                            </td>

                                            <td className="px-6 py-4">
                                                {getStatusBadge(teacher.status)}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link href={`/teachers/${teacher.id}/edit`}>
                                                        <Button
                                                            variant="edit"
                                                            size="sm"
                                                            icon={<Edit2 className="h-3.5 w-3.5" />}
                                                            title="Sửa thông tin giáo viên"
                                                        >
                                                            Sửa
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        icon={<Trash2 className="h-3.5 w-3.5" />}
                                                        onClick={() => openDeleteModal(teacher)}
                                                        title="Xóa giáo viên"
                                                    >
                                                        Xóa
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-xs text-gray-500"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <GraduationCap className="h-8 w-8 text-gray-300" />
                                                <p className="font-semibold text-gray-700">
                                                    Không tìm thấy giáo viên nào phù hợp
                                                </p>
                                                <p className="text-gray-400">
                                                    Thử thay đổi bộ lọc hoặc thêm giáo viên mới vào hệ thống.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {teachers.links && teachers.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-3 text-xs text-gray-600">
                            <div>
                                Hiển thị trang <strong>{teachers.current_page}</strong> / {teachers.last_page} (Tổng {teachers.total} giáo viên)
                            </div>
                            <div className="flex gap-1">
                                {teachers.links.map((link, idx) => (
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

            {/* Import CSV Modal */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => {
                    setIsImportModalOpen(false);
                    setSelectedFile(null);
                    setErrorMessage(null);
                }}
                title="Import Danh Sách Giáo Viên Từ Tệp CSV"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setIsImportModalOpen(false);
                                setSelectedFile(null);
                                setErrorMessage(null);
                            }}
                            disabled={isUploading}
                        >
                            Hủy Bỏ
                        </Button>
                        <Button
                            variant="success"
                            onClick={handleImportSubmit}
                            isLoading={isUploading}
                            icon={<Upload className="h-4 w-4" />}
                        >
                            Bắt Đầu Import
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                        Vui lòng tải lên tệp CSV chứa danh sách giáo viên đúng theo định dạng chuẩn của hệ thống.
                    </p>

                    {errorMessage && (
                        <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600">
                            {errorMessage}
                        </div>
                    )}

                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-emerald-500 transition-colors">
                        <FileSpreadsheet className="mx-auto h-10 w-10 text-gray-400" />
                        <label className="mt-3 block cursor-pointer">
                            <span className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                                Chọn tệp từ máy tính
                            </span>
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                        {selectedFile && (
                            <p className="mt-2 text-xs font-medium text-gray-700">
                                Đã chọn: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </p>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Xác Nhận Xóa Giáo Viên"
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
                            Bạn có chắc chắn muốn xóa giáo viên "{deletingTeacher?.full_name}" (Mã: {deletingTeacher?.teacher_code})?
                        </p>
                    </div>
                    <p className="text-xs text-gray-500">
                        Tài khoản và thông tin giảng dạy của giáo viên sẽ được ẩn khỏi hệ thống (soft delete) và có thể phục hồi khi cần thiết.
                    </p>
                </div>
            </Modal>
        </AppLayout>
    );
}
