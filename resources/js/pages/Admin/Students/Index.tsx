import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Download,
    Upload,
    Search,
    FileSpreadsheet,
    Users,
    Plus,
    Edit2,
    Trash2,
    Building2,
    Phone,
    Mail,
    AlertCircle,
    Calendar,
    Filter,
    UserCheck,
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

interface Student {
    id: number;
    student_code: string;
    username: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    gender: 'male' | 'female' | 'other' | null;
    date_of_birth: string | null;
    parent_name: string | null;
    parent_phone: string | null;
    parent_relationship: string | null;
    admission_date: string | null;
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
    students: PaginatedData<Student>;
    centers: Center[];
    filters: {
        search?: string;
        center_id?: number | null;
        status?: string;
    };
}

export default function StudentIndex({ students, centers = [], filters }: Props) {
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
    const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/students',
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
        router.get('/students', {}, { preserveState: true });
    };

    const handleExport = () => {
        const queryParams = new URLSearchParams();
        if (selectedCenterId) queryParams.append('center_id', selectedCenterId);
        window.location.href = `/students/export?${queryParams.toString()}`;
    };

    const handleDownloadSample = () => {
        window.location.href = '/students/sample-csv';
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

        router.post('/students/import', formData, {
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

    const openDeleteModal = (student: Student) => {
        setDeletingStudent(student);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingStudent) return;
        setIsDeleting(true);
        router.delete(`/students/${deletingStudent.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setDeletingStudent(null);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="active">Đang học</Badge>;
            case 'inactive':
                return <Badge variant="expired">Nghỉ học</Badge>;
            case 'graduated':
                return <Badge variant="pending">Tốt nghiệp</Badge>;
            case 'suspended':
            case 'locked':
                return <Badge variant="danger">Đình chỉ / Khóa</Badge>;
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
        <AppLayout title="Quản Lý Học Sinh - Hệ Thống Giáo Dục Sam">
            <Head title="Quản Lý Học Sinh" />

            <div className="space-y-6">
                {/* Header Top Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
                            <Users className="h-7 w-7 text-emerald-600" />
                            Quản Lý Học Sinh
                        </h1>
                        <p className="mt-1 text-xs text-gray-500">
                            Danh sách học viên, thông tin phụ huynh và tiến trình học tập tại các trung tâm.
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
                        <Link href="/students/create">
                            <Button
                                variant="success"
                                size="md"
                                icon={<Plus className="h-4 w-4" />}
                            >
                                Thêm Học Sinh Mới
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
                                    placeholder="Tìm theo tên học sinh, mã HS, username, email, phụ huynh..."
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
                                    <option value="active">Đang học</option>
                                    <option value="inactive">Nghỉ học</option>
                                    <option value="graduated">Tốt nghiệp</option>
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

                {/* Main Students Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Học Sinh</th>
                                    <th className="px-6 py-4">Tài Khoản & Liên Hệ</th>
                                    <th className="px-6 py-4">Phụ Huynh</th>
                                    <th className="px-6 py-4">Trung Tâm</th>
                                    <th className="px-6 py-4">Ngày Nhập Học</th>
                                    <th className="px-6 py-4">Trạng Thái</th>
                                    <th className="px-6 py-4 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {students.data && students.data.length > 0 ? (
                                    students.data.map((student) => (
                                        <tr
                                            key={student.id}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                                                        {student.full_name?.charAt(0) || 'H'}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">
                                                            {student.full_name}
                                                        </div>
                                                        <div className="font-mono text-[11px] text-gray-400">
                                                            Mã: {student.student_code} • {getGenderLabel(student.gender)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-mono text-gray-800">
                                                    @{student.username}
                                                </div>
                                                <div className="mt-0.5 text-[11px] text-gray-500">
                                                    {student.phone && <span>{student.phone}</span>}
                                                    {student.email && (
                                                        <span>{student.phone ? ' • ' : ''}{student.email}</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {student.parent_name ? (
                                                    <div>
                                                        <div className="font-semibold text-gray-800">
                                                            {student.parent_name}
                                                            {student.parent_relationship && (
                                                                <span className="ml-1 text-[11px] font-normal text-gray-400">
                                                                    ({student.parent_relationship})
                                                                </span>
                                                            )}
                                                        </div>
                                                        {student.parent_phone && (
                                                            <div className="font-mono text-[11px] text-gray-500">
                                                                {student.parent_phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="italic text-gray-400">Chưa có thông tin</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-800">
                                                    {student.center?.name || 'N/A'}
                                                </div>
                                                {student.center?.code && (
                                                    <div className="font-mono text-[11px] text-gray-400">
                                                        {student.center.code}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 font-mono text-gray-600">
                                                {student.admission_date || '-'}
                                            </td>

                                            <td className="px-6 py-4">
                                                {getStatusBadge(student.status)}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link href={`/students/${student.id}/edit`}>
                                                        <Button
                                                            variant="edit"
                                                            size="sm"
                                                            icon={<Edit2 className="h-3.5 w-3.5" />}
                                                            title="Sửa thông tin học sinh"
                                                        >
                                                            Sửa
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        icon={<Trash2 className="h-3.5 w-3.5" />}
                                                        onClick={() => openDeleteModal(student)}
                                                        title="Xóa học sinh"
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
                                                <Users className="h-8 w-8 text-gray-300" />
                                                <p className="font-semibold text-gray-700">
                                                    Không tìm thấy học sinh nào phù hợp
                                                </p>
                                                <p className="text-gray-400">
                                                    Thử thay đổi bộ lọc hoặc thêm học sinh mới vào hệ thống.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {students.links && students.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-3 text-xs text-gray-600">
                            <div>
                                Hiển thị trang <strong>{students.current_page}</strong> / {students.last_page} (Tổng {students.total} học sinh)
                            </div>
                            <div className="flex gap-1">
                                {students.links.map((link, idx) => (
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
                title="Import Danh Sách Học Sinh Từ Tệp CSV"
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
                        Vui lòng tải lên tệp CSV chứa danh sách học sinh đúng theo định dạng chuẩn của hệ thống.
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
                title="Xác Nhận Xóa Học Sinh"
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
                            Bạn có chắc chắn muốn xóa học sinh "{deletingStudent?.full_name}" (Mã: {deletingStudent?.student_code})?
                        </p>
                    </div>
                    <p className="text-xs text-gray-500">
                        Tài khoản và hồ sơ học tập của học sinh sẽ được ẩn khỏi hệ thống (soft delete) và có thể phục hồi khi cần thiết.
                    </p>
                </div>
            </Modal>
        </AppLayout>
    );
}
