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
AlertCircle,
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
Users
} from 'lucide-react';
import React,{ useState } from 'react';
import AssignClassModal from './components/AssignClassModal';
import BulkAssignClassModal from './components/BulkAssignClassModal';

import {
    GENDER_LABELS,
    STUDENT_STATUS_ACTIVE,
    STUDENT_STATUS_GRADUATED,
    STUDENT_STATUS_INACTIVE,
    STUDENT_STATUS_LABELS,
} from '@/constants/enums';
import { usePermission } from '@/hooks/usePermission';
import { useCanExportCsv } from '@/hooks/usePlanFeature';
import { formatDate } from '@/lib/date';
interface Center {
    id: number;
    name: string;
    code: string;
}

interface SchoolClassOption {
    id: number;
    name: string;
    code: string;
    center_id: number;
}

interface StudentClassTag {
    id: number;
    name: string;
    code: string;
}

interface Student {
    id: number;
    student_code: string;
    username: string | null;
    full_name: string;
    email: string | null;
    phone: string | null;
    gender: number | null;
    date_of_birth: string | null;
    parent_name: string | null;
    parent_phone: string | null;
    parent_relationship: string | null;
    admission_date: string | null;
    status: number;
    center_id: number;
    center?: Center;
    classes?: StudentClassTag[];
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
    classes?: SchoolClassOption[];
    filters: {
        search?: string;
        center_id?: number | null;
        class_id?: number | null;
        status?: string;
        per_page?: number;
    };
    isTeacher?: boolean;
}

export default function StudentIndex({
    students,
    centers = [],
    classes = [],
    filters,
    isTeacher = false,
}: Props) {
    const { can, isSuperAdmin } = usePermission();
    const canExportCsv = useCanExportCsv();

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCenterId, setSelectedCenterId] = useState<number>(
        filters.center_id ? Number(filters.center_id) : 0,
    );
    const [selectedClassId, setSelectedClassId] = useState<number>(
        filters.class_id ? Number(filters.class_id) : 0,
    );
    const [selectedStatus, setSelectedStatus] = useState<number>(
        filters.status !== undefined && filters.status !== null ? Number(filters.status) : 0,
    );

    // Filter available classes by selected center
    const availableClasses = selectedCenterId
        ? classes.filter((c) => Number(c.center_id) === selectedCenterId)
        : classes;

    // Selection & Bulk Actions state
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assigningStudent, setAssigningStudent] = useState<Student | null>(null);
    const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);

    const toggleSelectStudent = (id: number) => {
        setSelectedStudentIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAllStudents = () => {
        if (!students.data || students.data.length === 0) return;
        const currentIds = students.data.map((s) => s.id);
        const allSelected = currentIds.every((id) => selectedStudentIds.includes(id));

        if (allSelected) {
            setSelectedStudentIds((prev) => prev.filter((id) => !currentIds.includes(id)));
        } else {
            setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...currentIds])));
        }
    };

    const openAssignModal = (student: Student) => {
        setAssigningStudent(student);
        setAssignModalOpen(true);
    };

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
                center_id: selectedCenterId ? Number(selectedCenterId) : undefined,
                class_id: selectedClassId ? Number(selectedClassId) : undefined,
                status: selectedStatus ? Number(selectedStatus) : undefined,
            },
            { preserveState: true },
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedCenterId(0);
        setSelectedClassId(0);
        setSelectedStatus(0);
        router.get('/students', {}, { preserveState: true });
    };

    const handleExport = () => {
        const queryParams = new URLSearchParams();

        if (selectedCenterId) {
            queryParams.append('center_id', String(selectedCenterId));
        }

        if (selectedClassId) {
            queryParams.append('class_id', String(selectedClassId));
        }

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
            formData.append('center_id', String(selectedCenterId));
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
        if (!deletingStudent) {
return;
}

        setIsDeleting(true);
        router.delete(`/students/${deletingStudent.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setDeletingStudent(null);
            },
        });
    };

    const getStatusBadge = (status: number) => {
        if (status === STUDENT_STATUS_ACTIVE) {
            return <Badge variant="active">{STUDENT_STATUS_LABELS[STUDENT_STATUS_ACTIVE]}</Badge>;
        }

        if (status === STUDENT_STATUS_GRADUATED) {
            return <Badge variant="pending">{STUDENT_STATUS_LABELS[STUDENT_STATUS_GRADUATED]}</Badge>;
        }

        return <Badge variant="expired">{STUDENT_STATUS_LABELS[STUDENT_STATUS_INACTIVE]}</Badge>;
    };

    const getGenderLabel = (gender: number | null) => {
        if (!gender) return '-';
        return GENDER_LABELS[gender] || '-';
    };

    return (
        <AppLayout title="Quản Lý Học Sinh - SAM Digital">
            <Head title="Quản Lý Học Sinh" />

            <div className="space-y-6">
                {/* Header Top Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
                            <Users className="h-7 w-7 text-emerald-600" />
                            Quản Lý Học Sinh
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Danh sách học viên, thông tin phụ huynh và tiến trình học tập tại các trung tâm.
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
                        {can('students.create') && (
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
                            title={!canExportCsv ? 'Tính năng thuộc Gói Nâng Cao' : 'Xuất danh sách học sinh'}
                        >
                            Export CSV {!canExportCsv && '🔒'}
                        </Button>
                        {can('students.create') && (
                            <Link href="/students/create">
                                <Button
                                    variant="success"
                                    size="md"
                                    icon={<Plus className="h-4.5 w-4.5" />}
                                >
                                    Thêm Học Sinh Mới
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Filter Box */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <Input
                                    placeholder="Tìm theo tên học sinh, mã HS, username, email, phụ huynh..."
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
                                        onChange={(val) => {
                                            setSelectedCenterId(Number(val));
                                            setSelectedClassId(0);
                                        }}
                                        placeholder="Tất cả Trung tâm"
                                        options={[
                                            { value: 0, label: 'Tất cả Trung tâm' },
                                            ...centers.map((c) => ({
                                                value: c.id,
                                                label: `${c.name} (${c.code})`,
                                            })),
                                        ]}
                                    />
                                </div>
                            )}

                            <div>
                                <ScrollableSelect
                                    value={selectedClassId}
                                    onChange={(val) => setSelectedClassId(Number(val))}
                                    placeholder="Tất cả Lớp học"
                                    options={[
                                        { value: 0, label: 'Tất cả Lớp học' },
                                        ...availableClasses.map((cls) => ({
                                            value: cls.id,
                                            label: cls.name,
                                        })),
                                    ]}
                                    searchable={true}
                                />
                            </div>

                            <div>
                                <ScrollableSelect
                                    value={selectedStatus}
                                    onChange={(val) => setSelectedStatus(Number(val))}
                                    options={[
                                        { value: 0, label: 'Tất cả Trạng thái' },
                                        { value: STUDENT_STATUS_ACTIVE, label: STUDENT_STATUS_LABELS[STUDENT_STATUS_ACTIVE] },
                                        { value: STUDENT_STATUS_INACTIVE, label: STUDENT_STATUS_LABELS[STUDENT_STATUS_INACTIVE] },
                                        { value: STUDENT_STATUS_GRADUATED, label: STUDENT_STATUS_LABELS[STUDENT_STATUS_GRADUATED] },
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
                                Tìm kiếm
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Bulk Actions Banner */}
                {selectedStudentIds.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-xs">
                        <div className="flex items-center gap-3">
                            <Badge variant="active" className="px-3 py-1 text-sm font-bold">
                                Đã chọn {selectedStudentIds.length} học sinh
                            </Badge>
                            <span className="text-xs text-emerald-800 hidden sm:inline">
                                Áp dụng thao tác phân lớp hàng loạt cho danh sách đã chọn
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedStudentIds([])}
                            >
                                Bỏ chọn
                            </Button>
                            {can('students.edit') && (
                                <Button
                                    type="button"
                                    variant="success"
                                    size="sm"
                                    icon={<GraduationCap className="h-4 w-4" />}
                                    onClick={() => setBulkAssignModalOpen(true)}
                                >
                                    Ghi Danh Vào Lớp ({selectedStudentIds.length})
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Students Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-700">
                                <tr>
                                    <th className="w-10 px-4 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            aria-label="Chọn tất cả học sinh"
                                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                            checked={
                                                (students.data?.length ?? 0) > 0 &&
                                                students.data.every((s) => selectedStudentIds.includes(s.id))
                                            }
                                            onChange={toggleSelectAllStudents}
                                        />
                                    </th>
                                    <th className="px-6 py-4">Học Sinh</th>
                                    <th className="px-6 py-4">Số Điện Thoại</th>
                                    <th className="px-6 py-4">Sinh Nhật</th>
                                    <th className="px-6 py-4">Trạng Thái</th>
                                    {(can('students.show') || can('students.edit') || can('students.delete')) && (
                                        <th className="px-6 py-4 text-right">Thao Tác</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {students.data && students.data.length > 0 ? (
                                    students.data.map((student) => {
                                        const isSelected = selectedStudentIds.includes(student.id);
                                        return (
                                        <tr
                                            key={student.id}
                                            className={`transition-colors ${isSelected ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : 'hover:bg-slate-50/80'}`}
                                        >
                                            <td className="w-10 px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Chọn học sinh ${student.full_name}`}
                                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectStudent(student.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                                                        {student.full_name?.charAt(0) || 'H'}
                                                    </div>
                                                    <div className="max-w-xs">
                                                        <TruncatedText
                                                            text={student.full_name}
                                                            maxLines={1}
                                                            className="font-bold text-gray-900"
                                                        />
                                                        <div className="font-mono text-xs text-gray-400">
                                                            Mã: {student.student_code} • {getGenderLabel(student.gender)}
                                                        </div>
                                                        {student.classes && student.classes.length > 0 && (
                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                {student.classes.map((cls) => (
                                                                    <Tooltip
                                                                        key={cls.id}
                                                                        content={`Lớp: ${cls.name} (${cls.code})`}
                                                                    >
                                                                        <span
                                                                            className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 max-w-[120px] truncate"
                                                                        >
                                                                            {cls.name}
                                                                        </span>
                                                                    </Tooltip>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 font-mono text-gray-700">
                                                {student.phone || (student.parent_phone ? (
                                                    <span className="text-gray-500" title={`SĐT Phụ huynh: ${student.parent_phone}`}>
                                                        {student.parent_phone} <span className="text-[10px] text-gray-400 font-sans">(PH)</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic font-sans text-xs">---</span>
                                                ))}
                                            </td>

                                            <td className="px-6 py-4 font-mono text-gray-700">
                                                {student.date_of_birth ? formatDate(student.date_of_birth, '/') : <span className="text-gray-400 italic font-sans text-xs">---</span>}
                                            </td>

                                            <td className="px-6 py-4">
                                                {getStatusBadge(student.status)}
                                            </td>

                                            {(can('students.show') || can('students.edit') || can('students.delete')) && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {can('students.show') && (
                                                            <Link href={`/students/${student.id}/show`}>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    icon={<Eye className="h-4 w-4 text-emerald-600" />}
                                                                    title="Xem chi tiết & thống kê điểm danh"
                                                                >
                                                                    Chi tiết
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {can('students.edit') && (
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                size="sm"
                                                                icon={<GraduationCap className="h-4 w-4 text-emerald-600" />}
                                                                onClick={() => openAssignModal(student)}
                                                                title="Phân lớp cho học sinh"
                                                            >
                                                                Phân Lớp
                                                            </Button>
                                                        )}
                                                        {can('students.edit') && (
                                                            <Link href={`/students/${student.id}/edit`}>
                                                                <Button
                                                                    variant="edit"
                                                                    size="sm"
                                                                    icon={<Edit2 className="h-4 w-4" />}
                                                                    title="Sửa thông tin học sinh"
                                                                >
                                                                    Sửa
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {can('students.delete') && (
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                icon={<Trash2 className="h-4 w-4" />}
                                                                onClick={() => openDeleteModal(student)}
                                                                title="Xóa học sinh"
                                                            >
                                                                Xóa
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );})
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={can('students.show') || can('students.edit') || can('students.delete') ? 6 : 5}
                                            className="px-6 py-12 text-center text-sm text-gray-500"
                                        >
                                            <div className="flex flex-col items-center justify-center space-y-2">
                                                <Users className="h-10 w-10 text-gray-300" />
                                                <p className="text-base font-semibold text-gray-700">
                                                    Không tìm thấy học sinh nào phù hợp
                                                </p>
                                                <p className="text-sm text-gray-400">
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
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 text-sm text-gray-600">
                            <div>
                                Hiển thị trang <strong>{students.current_page}</strong> / {students.last_page} (Tổng {students.total} học sinh)
                            </div>
                            <div className="flex gap-1.5">
                                {students.links.map((link, idx) => (
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
                title="Import Danh Sách Học Sinh Từ Tệp CSV"
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
                        Vui lòng tải lên tệp CSV chứa danh sách học sinh đúng theo định dạng chuẩn của hệ thống.
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
                            Bạn có chắc chắn muốn xóa học sinh "{deletingStudent?.full_name}" (Mã: {deletingStudent?.student_code})?
                        </p>
                    </div>
                    <p className="text-sm text-gray-500">
                        Tài khoản và hồ sơ học tập của học sinh sẽ được ẩn khỏi hệ thống và có thể phục hồi khi cần thiết.
                    </p>
                </div>
            </Modal>

            {/* Single Student Assign Class Modal */}
            <AssignClassModal
                isOpen={assignModalOpen}
                onClose={() => {
                    setAssignModalOpen(false);
                    setAssigningStudent(null);
                }}
                student={assigningStudent}
                allClasses={classes}
            />

            {/* Bulk Assign Students to Class Modal */}
            <BulkAssignClassModal
                isOpen={bulkAssignModalOpen}
                onClose={() => {
                    setBulkAssignModalOpen(false);
                    setSelectedStudentIds([]);
                }}
                selectedStudentIds={selectedStudentIds}
                students={students.data}
                allClasses={classes}
                centers={centers}
                selectedCenterId={selectedCenterId ? Number(selectedCenterId) : undefined}
            />
        </AppLayout>
    );
}
