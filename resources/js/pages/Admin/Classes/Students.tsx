import BackButton from '@/components/ui/BackButton';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { Column } from '@/components/ui/DataTable';
import DataTable from '@/components/ui/DataTable';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
    CLASS_STATUS_ACTIVE,
    CLASS_STUDENT_STATUS_ACTIVE,
    CLASS_STUDENT_STATUS_COMPLETED,
    CLASS_STUDENT_STATUS_LEFT,
    CLASS_STUDENT_STATUS_TRANSFERRED,
} from '@/constants/enums';
import { useCanExportCsv } from '@/hooks/usePlanFeature';
import AppLayout from '@/layouts/AppLayout';
import { formatDate } from '@/lib/date';
import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Download,
    Edit2,
    FileSpreadsheet,
    GraduationCap,
    Search,
    Trash2,
    Upload,
    UserPlus,
} from 'lucide-react';
import React, { useState } from 'react';
import AddStudentModal from './components/AddStudentModal';

interface SchoolClass {
    id: number;
    code: string;
    name: string;
    max_students: number;
    students_count?: number;
    status?: number;
    center?: { id: number; name: string };
}

interface Student {
    id: number;
    student_code: string;
    username: string;
    full_name: string;
    email: string;
    phone: string | null;
    status: number;
    parent_name: string | null;
    parent_phone: string | null;
    pivot?: {
        enrolled_at: string;
        status: number;
        note: string | null;
    };
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    schoolClass: SchoolClass;
    students: PaginatedData<Student>;
    filters: {
        search?: string;
    };
    isTeacher?: boolean;
}

export default function ClassStudentsPage({
    schoolClass,
    students,
    filters,
    isTeacher = false,
}: Props) {
    const canExportCsv = useCanExportCsv();
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>()
        .props;
    const [search, setSearch] = useState(filters.search || '');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [removingStudent, setRemovingStudent] = useState<Student | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [editingStatus, setEditingStatus] = useState<number>(CLASS_STUDENT_STATUS_ACTIVE);
    const [editingNote, setEditingNote] = useState<string>('');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

    const handleOpenStatusModal = (student: Student) => {
        setEditingStudent(student);
        const st = student.pivot?.status;
        setEditingStatus(st !== undefined && st !== null ? Number(st) : CLASS_STUDENT_STATUS_ACTIVE);
        setEditingNote(student.pivot?.note || '');
    };

    const handleStatusSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editingStudent) return;

        setIsUpdatingStatus(true);
        router.patch(
            `/classes/${schoolClass.id}/students/${editingStudent.id}/status`,
            {
                status: Number(editingStatus),
                note: editingNote,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingStudent(null);
                },
                onFinish: () => {
                    setIsUpdatingStatus(false);
                },
            },
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            `/classes/${schoolClass.id}/students`,
            { search },
            { preserveState: true },
        );
    };

    const handleExport = () => {
        window.location.href = `/classes/${schoolClass.id}/students/export`;
    };

    const handleDownloadSample = () => {
        window.location.href = '/classes/students/sample-csv';
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

        router.post(`/classes/${schoolClass.id}/students/import`, formData, {
            onSuccess: () => {
                setIsImportModalOpen(false);
                setSelectedFile(null);
                setIsUploading(false);
            },
            onError: (err) => {
                setErrorMessage(
                    err.file || 'Có lỗi xảy ra khi tải tệp CSV lên.',
                );
                setIsUploading(false);
            },
            onFinish: () => {
                setIsUploading(false);
            },
        });
    };

    const columns: Column<Student>[] = [
        {
            header: 'Mã HS',
            accessorKey: 'student_code',
            cell: (row) => (
                <span className="font-mono text-sm font-semibold text-gray-800">
                    {row.student_code}
                </span>
            ),
        },
        {
            header: 'Họ và tên',
            accessorKey: 'full_name',
            cell: (row) => (
                <div>
                    <div className="font-bold text-gray-900">
                        {row.full_name}
                    </div>
                    <div className="text-xs text-gray-500">{row.email}</div>
                </div>
            ),
        },
        {
            header: 'Số điện thoại',
            accessorKey: 'phone',
            cell: (row) =>
                row.phone ? (
                    <span className="font-mono text-sm text-gray-700">{row.phone}</span>
                ) : (
                    <span className="text-gray-400 italic text-sm">Chưa có</span>
                ),
        },
        {
            header: 'Phụ huynh',
            cell: (row) => (
                <div>
                    <div className="text-sm font-semibold text-gray-800">
                        {row.parent_name || 'N/A'}
                    </div>
                    <div className="font-mono text-xs text-gray-500">
                        {row.parent_phone || ''}
                    </div>
                </div>
            ),
        },
        {
            header: 'Ngày ghi danh',
            cell: (row) => (
                <span className="text-sm font-mono text-gray-600">
                    {row.pivot?.enrolled_at ? formatDate(row.pivot.enrolled_at) : '—'}
                </span>
            ),
        },
        {
            header: 'Trạng thái',
            cell: (row) => {
                const pivotStatus = row.pivot?.status !== undefined ? Number(row.pivot.status) : CLASS_STUDENT_STATUS_ACTIVE;

                return (
                    <div
                        className={!isTeacher ? 'cursor-pointer inline-block group' : 'inline-block'}
                        onClick={() => !isTeacher && handleOpenStatusModal(row)}
                        title={!isTeacher ? 'Nhấn để thay đổi trạng thái trong lớp' : undefined}
                    >
                        {pivotStatus === CLASS_STUDENT_STATUS_LEFT ? (
                            <Badge variant="danger" className="transition-opacity group-hover:opacity-80">
                                Đã thôi học
                            </Badge>
                        ) : pivotStatus === CLASS_STUDENT_STATUS_TRANSFERRED ? (
                            <Badge variant="info" className="transition-opacity group-hover:opacity-80">
                                Đã chuyển lớp
                            </Badge>
                        ) : pivotStatus === CLASS_STUDENT_STATUS_COMPLETED ? (
                            <Badge variant="pending" className="transition-opacity group-hover:opacity-80">
                                Đã hoàn thành
                            </Badge>
                        ) : (
                            <Badge variant="active" className="transition-opacity group-hover:opacity-80">
                                Đang học
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        ...(!isTeacher
            ? [
                  {
                      header: 'Thao tác',
                      cell: (row: Student) => (
                          <div className="flex items-center justify-end gap-2">
                              <Button
                                  variant="edit"
                                  size="sm"
                                  icon={<Edit2 className="h-4 w-4" />}
                                  onClick={() => handleOpenStatusModal(row)}
                                  title="Chỉnh sửa trạng thái trong lớp"
                              >
                                  Đổi trạng thái
                              </Button>
                              <Button
                                  variant="danger"
                                  size="sm"
                                  icon={<Trash2 className="h-4 w-4" />}
                                  onClick={() => setRemovingStudent(row)}
                                  title="Xóa học sinh khỏi lớp"
                              >
                                  Xóa
                              </Button>
                          </div>
                      ),
                  },
              ]
            : []),
    ];

    const confirmRemove = () => {
        if (!removingStudent) return;
        setIsRemoving(true);
        router.delete(`/classes/${schoolClass.id}/students/${removingStudent.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsRemoving(false);
                setRemovingStudent(null);
            },
        });
    };

    const isClassActive =
        schoolClass.status === undefined ||
        schoolClass.status === null ||
        Number(schoolClass.status) === CLASS_STATUS_ACTIVE;

    return (
        <AppLayout title={`Học sinh lớp: ${schoolClass.name}`}>
            <Head title={`Học sinh lớp ${schoolClass.name}`} />

            <div className="space-y-6">
                {/* Back Link & Header */}
                {/* Header Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <BackButton fallbackUrl="/classes" label="Quay lại danh sách lớp" className="mb-2" />
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <GraduationCap className="h-7 w-7 text-emerald-600" />
                            Học sinh Lớp: {schoolClass.name} ({schoolClass.code})
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Sĩ số hiện tại:{' '}
                            <span className="font-semibold text-gray-900">
                                {schoolClass.students_count ?? 0}
                            </span>{' '}
                            {schoolClass.max_students ? `/ ${schoolClass.max_students} học sinh` : 'học sinh'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {!isTeacher && isClassActive && (
                            <Button
                                variant="success"
                                size="md"
                                onClick={() => setIsAddModalOpen(true)}
                                icon={<UserPlus className="h-4.5 w-4.5" />}
                            >
                                Thêm Học Sinh
                            </Button>
                        )}
                        <Button
                            variant="export"
                            size="md"
                            onClick={() => {
                                if (!canExportCsv) {
                                    router.visit('/upgrade-plan?feature=export_csv');
                                } else {
                                    handleExport();
                                }
                            }}
                            className="flex items-center gap-2"
                            title={!canExportCsv ? 'Tính năng thuộc Gói Nâng Cao' : 'Xuất danh sách học sinh lớp'}
                        >
                            <Download className="h-4.5 w-4.5" />
                            Export CSV Lớp {!canExportCsv && '🔒'}
                        </Button>
                        {!isTeacher && isClassActive && (
                            <Button
                                variant="import"
                                size="md"
                                onClick={() => {
                                    if (!canExportCsv) {
                                        router.visit('/upgrade-plan?feature=export_csv');
                                    } else {
                                        setIsImportModalOpen(true);
                                    }
                                }}
                                className="flex items-center gap-2"
                                title={!canExportCsv ? 'Tính năng thuộc Gói Nâng Cao' : 'Nhập danh sách học sinh vào lớp'}
                            >
                                <Upload className="h-4.5 w-4.5" />
                                Import CSV Lớp {!canExportCsv && '🔒'}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Inactive Class Alert */}
                {!isClassActive && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 flex items-center gap-3 shadow-xs">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                        <span>Lớp học này hiện không ở trạng thái đang hoạt động (Tạm ngưng, Hoàn thành hoặc Đã đóng). Không thể thêm mới hoặc import thêm học sinh vào lớp.</span>
                    </div>
                )}

                {/* Flash Messages */}
                {flash.success && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                {/* Table Card */}
                <Card>
                    {/* Search & Header */}
                    <div className="flex flex-col justify-between gap-4 border-b border-gray-100 bg-slate-50/50 p-5 sm:flex-row sm:items-center">
                        <form
                            onSubmit={handleSearch}
                            className="flex w-full max-w-md items-center gap-2"
                        >
                            <Input
                                placeholder="Tìm học sinh trong lớp theo Tên, Mã HS, Email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="!py-2.5 !text-sm"
                            />
                            <Button
                                type="submit"
                                variant="secondary"
                                size="md"
                                className="px-4"
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                        </form>

                        <div className="text-sm font-medium text-gray-500">
                            Số học sinh hiển thị:{' '}
                            <span className="font-bold text-gray-900">
                                {students.data.length}
                            </span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="p-4">
                        <DataTable
                            columns={columns}
                            data={students.data}
                            emptyMessage="Lớp học chưa có học sinh nào"
                        />
                    </div>

                    {/* Pagination */}
                    {students.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 text-sm">
                            <div className="text-gray-500">
                                Trang {students.current_page} /{' '}
                                {students.last_page}
                            </div>
                            <div className="flex items-center gap-1.5">
                                {students.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() =>
                                            link.url && router.get(link.url)
                                        }
                                        className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                                            link.active
                                                ? 'bg-emerald-600 text-white'
                                                : link.url
                                                  ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
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
                onClose={() => setIsImportModalOpen(false)}
                title={`Import & Ghi danh Học sinh vào Lớp ${schoolClass.name}`}
                footer={
                    <>
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => setIsImportModalOpen(false)}
                            disabled={isUploading}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="success"
                            size="md"
                            onClick={handleImportSubmit}
                            disabled={isUploading || !selectedFile}
                        >
                            {isUploading
                                ? 'Đang ghi danh...'
                                : 'Tải lên & Ghi danh'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Tải tệp CSV danh sách học sinh để ghi danh vào lớp. Nếu
                        học sinh chưa có trên hệ thống, hệ thống sẽ tự động tạo
                        mới học sinh và đưa vào lớp học.
                    </p>

                    <div className="space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        <div className="flex items-center gap-1.5 font-semibold">
                            <FileSpreadsheet className="h-5 w-5 text-amber-600" />
                            Định dạng các cột trong CSV:
                        </div>
                        <div>
                            - Cột bắt buộc: Mã học sinh (hoặc Tên đăng nhập /
                            Email).
                        </div>
                        <div>
                            - Cột tùy chọn: Họ và tên, Số điện thoại, Tên phụ
                            huynh, SĐT phụ huynh.
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            variant="sample"
                            size="md"
                            onClick={handleDownloadSample}
                            type="button"
                            className="flex w-full items-center justify-center gap-2 py-2.5 text-sm"
                        >
                            <Download className="h-4.5 w-4.5" />
                            Tải tệp CSV mẫu cho lớp học (.csv)
                        </Button>
                    </div>

                    <div className="space-y-2 pt-2">
                        <label className="block text-sm font-semibold text-gray-700">
                            Chọn tệp CSV từ máy tính
                        </label>
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleFileChange}
                            className="block w-full cursor-pointer rounded-md border border-gray-200 p-2 text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                        />
                        {errorMessage && (
                            <p className="mt-1 text-sm font-medium text-red-600">
                                {errorMessage}
                            </p>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Add Student Modal */}
            <AddStudentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                classId={schoolClass.id}
                className={schoolClass.name}
                classCode={schoolClass.code}
            />

            {/* Update Class Student Status Modal */}
            <Modal
                isOpen={!!editingStudent}
                onClose={() => setEditingStudent(null)}
                title="Cập Nhật Trạng Thái Học Sinh Trong Lớp"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => setEditingStudent(null)}
                            disabled={isUpdatingStatus}
                        >
                            Hủy Bỏ
                        </Button>
                        <Button
                            variant="edit"
                            size="md"
                            onClick={handleStatusSubmit}
                            isLoading={isUpdatingStatus}
                            icon={<Edit2 className="h-4 w-4" />}
                        >
                            Lưu Thay Đổi
                        </Button>
                    </>
                }
            >
                <form onSubmit={handleStatusSubmit} className="space-y-4">
                    <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-500">Học sinh:</span>
                            <span className="font-bold text-gray-900">{editingStudent?.full_name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-500">Mã học sinh:</span>
                            <span className="font-mono font-semibold text-gray-800">{editingStudent?.student_code}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-500">Lớp học:</span>
                            <span className="font-semibold text-emerald-700">{schoolClass.name}</span>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                            Trạng thái trong lớp <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={editingStatus}
                            onChange={(e) => setEditingStatus(Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value={CLASS_STUDENT_STATUS_ACTIVE}>🟢 Đang học lớp này</option>
                            <option value={CLASS_STUDENT_STATUS_COMPLETED}>🟡 Đã hoàn thành khóa học</option>
                            <option value={CLASS_STUDENT_STATUS_TRANSFERRED}>🔵 Đã chuyển sang lớp khác</option>
                            <option value={CLASS_STUDENT_STATUS_LEFT}>🔴 Đã thôi học / Nghỉ học</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                            Ghi chú / Lý do (Tùy chọn)
                        </label>
                        <textarea
                            rows={3}
                            value={editingNote}
                            onChange={(e) => setEditingNote(e.target.value)}
                            placeholder="Nhập lý do chuyển lớp, xin nghỉ hoặc ngày hoàn tất..."
                            className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                </form>
            </Modal>

            {/* Remove Student Confirmation Modal */}
            <Modal
                isOpen={!!removingStudent}
                onClose={() => setRemovingStudent(null)}
                title="Xác Nhận Xóa Học Sinh Khỏi Lớp"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => setRemovingStudent(null)}
                            disabled={isRemoving}
                        >
                            Hủy Bỏ
                        </Button>
                        <Button
                            variant="danger"
                            size="md"
                            onClick={confirmRemove}
                            isLoading={isRemoving}
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
                            Bạn có chắc muốn xóa học sinh "{removingStudent?.full_name}" khỏi lớp "{schoolClass.name}"?
                        </p>
                    </div>
                    <p className="text-sm text-gray-500">
                        Học sinh sẽ được gỡ khỏi danh sách lớp học này. Hồ sơ học sinh trong trung tâm vẫn được giữ nguyên.
                    </p>
                </div>
            </Modal>
        </AppLayout>
    );
}
