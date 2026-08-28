import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ScrollableSelect from '@/components/ui/ScrollableSelect';
import Tooltip,{ TruncatedText } from '@/components/ui/Tooltip';
import AppLayout from '@/layouts/AppLayout';
import { Head,Link,router,usePage } from '@inertiajs/react';
import {
Calendar,
Download,
Edit2,
Eye,
FileSpreadsheet,
Filter,
GraduationCap,
Plus,
Search,
Trash2,
Upload,
} from 'lucide-react';
import React,{ useState } from 'react';

import { usePermission } from '@/hooks/usePermission';
import { useCanExportCsv } from '@/hooks/usePlanFeature';
import { formatDate } from '@/lib/date';
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
    gender: number | null;
    date_of_birth: string | null;
    hire_date: string | null;
    status: number;
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
    const { can } = usePermission();
    const canExportCsv = useCanExportCsv();
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';

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

        if (selectedCenterId) {
            queryParams.append('center_id', selectedCenterId);
        }

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
        if (!deletingTeacher) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/teachers/${deletingTeacher.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setDeletingTeacher(null);
            },
        });
    };

    const getStatusBadge = (status: number) => {
        if (status === 1) {
            return <Badge variant="active">Đang hoạt động</Badge>;
        }
        if (status === 0) {
            return <Badge variant="expired">Tạm dừng</Badge>;
        }
        if (status === 2) {
            return <Badge variant="danger">Bị khóa</Badge>;
        }
        return <Badge variant="info">Chưa rõ</Badge>;
    };

    const getGenderLabel = (gender: number | null) => {
        if (gender === 1) return 'Nam';
        if (gender === 2) return 'Nữ';
        if (gender === 3) return 'Khác';
        return '-';
    };

    return (
        <AppLayout title="Quản Lý Giáo Viên - SAM Digital">
            <Head title="Quản Lý Giáo Viên" />

            <div className="space-y-6">
                {/* Header Top Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
                            <GraduationCap className="h-7 w-7 text-emerald-600" />
                            Quản Lý Giáo Viên
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Danh sách giáo viên, giảng viên trực thuộc trung tâm và thông tin chuyên môn đào tạo.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="secondary"
                            size="md"
                            icon={<FileSpreadsheet className="h-4.5 w-4.5" />}
                            onClick={() => {
                                if (!canExportCsv) {
                                    router.visit('/upgrade-plan?feature=export_csv');
                                } else {
                                    handleDownloadSample();
                                }
                            }}
                            title="Tải tệp mẫu CSV"
                        >
                            Tệp Mẫu CSV {!canExportCsv && '🔒'}
                        </Button>
                        {can('teachers.create') && (
                            <Button
                                variant="secondary"
                                size="md"
                                icon={<Upload className="h-4.5 w-4.5" />}
                                onClick={() => {
                                    if (!canExportCsv) {
                                        router.visit('/upgrade-plan?feature=export_csv');
                                    } else {
                                        setIsImportModalOpen(true);
                                    }
                                }}
                            >
                                Import CSV {!canExportCsv && '🔒'}
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            size="md"
                            icon={<Download className="h-4.5 w-4.5" />}
                            onClick={() => {
                                if (!canExportCsv) {
                                    router.visit('/upgrade-plan?feature=export_csv');
                                } else {
                                    handleExport();
                                }
                            }}
                            title={!canExportCsv ? 'Tính năng thuộc Gói Nâng Cao' : 'Xuất danh sách giáo viên'}
                        >
                            Export CSV {!canExportCsv && '🔒'}
                        </Button>
                        {can('teachers.create') && (
                            <Link href="/teachers/create">
                                <Button
                                    variant="success"
                                    size="md"
                                    icon={<Plus className="h-4.5 w-4.5" />}
                                >
                                    Thêm Giáo Viên Mới
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filter Box */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="lg:col-span-2">
                                <Input
                                    placeholder="Tìm theo tên giáo viên, mã GV, username, email, môn dạy..."
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
                                        { value: '1', label: 'Đang hoạt động' },
                                        { value: '0', label: 'Tạm dừng' },
                                        { value: '2', label: 'Bị khóa' },
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

                {/* Main Teachers Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Giáo Viên</th>
                                    <th className="px-6 py-4">Số Điện Thoại</th>
                                    <th className="px-6 py-4">Chuyên Môn</th>
                                    <th className="px-6 py-4">Ngày Vào Làm</th>
                                    <th className="px-6 py-4">Trạng Thái</th>
                                    {(can('teachers.show') || can('teachers.edit') || can('teachers.delete')) && (
                                        <th className="px-6 py-4 text-right">Thao Tác</th>
                                    )}
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
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                                                        {teacher.full_name?.charAt(0) || 'G'}
                                                    </div>
                                                    <div className="max-w-xs">
                                                        <TruncatedText
                                                            text={teacher.full_name}
                                                            maxLines={1}
                                                            className="font-bold text-gray-900"
                                                        />
                                                        <div className="font-mono text-xs text-gray-400">
                                                            Mã: {teacher.teacher_code} • {getGenderLabel(teacher.gender)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-mono text-gray-700">
                                                {teacher.phone || <span className="text-gray-400 italic font-sans text-xs">---</span>}
                                            </td>

                                            <td className="px-6 py-4">
                                                {teacher.specialization ? (
                                                    <Tooltip content={teacher.specialization}>
                                                        <span className="inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 max-w-[160px] truncate">
                                                            {teacher.specialization}
                                                        </span>
                                                    </Tooltip>
                                                ) : (
                                                    <span className="italic text-gray-400">Chưa thiết lập</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 font-mono text-gray-600">
                                                {teacher.hire_date ? formatDate(teacher.hire_date, '/') : '-'}
                                            </td>

                                            <td className="px-6 py-4">
                                                {getStatusBadge(teacher.status)}
                                            </td>

                                            {(can('teachers.show') || can('teachers.edit') || can('teachers.delete')) && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {can('teachers.show') && (
                                                            <Link href={`/teachers/${teacher.id}/show`}>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    icon={<Eye className="h-4 w-4 text-emerald-600" />}
                                                                    title="Xem chi tiết & thống kê ca dạy"
                                                                >
                                                                    Chi tiết
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        <Link href={`/teachers/${teacher.id}/schedule`}>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                icon={<Calendar className="h-4 w-4 text-blue-600" />}
                                                                title="Xem thời khóa biểu / lịch dạy của giáo viên"
                                                            >
                                                                Lịch Dạy
                                                            </Button>
                                                        </Link>
                                                        {can('teachers.edit') && (
                                                            <Link href={`/teachers/${teacher.id}/edit`}>
                                                                <Button
                                                                    variant="edit"
                                                                    size="sm"
                                                                    icon={<Edit2 className="h-4 w-4" />}
                                                                    title="Sửa thông tin giáo viên"
                                                                >
                                                                    Sửa
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {can('teachers.delete') && (
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                icon={<Trash2 className="h-4 w-4" />}
                                                                onClick={() => openDeleteModal(teacher)}
                                                                title="Xóa giáo viên"
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
                                            colSpan={can('teachers.show') || can('teachers.edit') || can('teachers.delete') ? 6 : 5}
                                            className="px-6 py-12 text-center text-sm text-gray-500"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <GraduationCap className="h-10 w-10 text-gray-300" />
                                                <p className="text-base font-semibold text-gray-700">
                                                    Không tìm thấy giáo viên nào phù hợp
                                                </p>
                                                <p className="text-sm text-gray-400">
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
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 text-sm text-gray-600">
                            <div>
                                Hiển thị trang <strong>{teachers.current_page}</strong> / {teachers.last_page} (Tổng {teachers.total} giáo viên)
                            </div>
                            <div className="flex gap-1.5">
                                {teachers.links.map((link, idx) => (
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
                            size="md"
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
                            size="md"
                            onClick={handleImportSubmit}
                            isLoading={isUploading}
                            icon={<Upload className="h-5 w-5" />}
                        >
                            Bắt Đầu Import
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Vui lòng tải lên tệp CSV chứa danh sách giáo viên đúng theo định dạng chuẩn của hệ thống.
                    </p>

                    {errorMessage && (
                        <div className="rounded-lg bg-red-50 p-3.5 text-sm text-red-600">
                            {errorMessage}
                        </div>
                    )}

                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-emerald-500 transition-colors">
                        <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                        <label className="mt-4 block cursor-pointer">
                            <span className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
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
                            <p className="mt-2.5 text-sm font-medium text-gray-700">
                                Đã chọn: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </p>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDeletingTeacher(null);
                }}
                onConfirm={confirmDelete}
                entity="teachers"
                entityId={deletingTeacher?.id || null}
                entityName={`giáo viên "${deletingTeacher?.full_name}" (${deletingTeacher?.teacher_code})`}
                isDeleting={isDeleting}
            />
        </AppLayout>
    );
}
