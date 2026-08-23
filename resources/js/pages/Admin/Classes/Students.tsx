import { Head, router, usePage } from '@inertiajs/react';
import {
    Download,
    Upload,
    Search,
    FileSpreadsheet,
    ArrowLeft,
    GraduationCap,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AppLayout from '@/layouts/AppLayout';
import { formatDate } from '@/lib/date';
import { useCanExportCsv } from '@/hooks/usePlanFeature';

interface SchoolClass {
    id: number;
    code: string;
    name: string;
    max_students: number;
    center?: { id: number; name: string };
}

interface Student {
    id: number;
    student_code: string;
    username: string;
    full_name: string;
    email: string;
    phone: string | null;
    parent_name: string | null;
    parent_phone: string | null;
    pivot?: {
        enrolled_at: string;
        status: string;
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
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
            cell: (row) => (
                <Badge
                    variant={row.pivot?.status === 'active' ? 'active' : 'info'}
                >
                    {row.pivot?.status === 'active' ? 'Đang học' : 'Nghỉ học'}
                </Badge>
            ),
        },
    ];

    return (
        <AppLayout title={`Học sinh lớp ${schoolClass.name}`}>
            <Head title={`Học sinh lớp ${schoolClass.name}`} />

            <div className="space-y-6">
                {/* Back Link & Header */}
                <div>
                    <button
                        onClick={() => window.history.back()}
                        className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại danh sách lớp học
                    </button>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="flex items-center gap-2.5 text-2xl font-bold text-gray-900">
                                <GraduationCap className="h-7 w-7 text-emerald-600" />
                                Học sinh Lớp: {schoolClass.name} (
                                {schoolClass.code})
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Sĩ số hiện tại:{' '}
                                <span className="font-semibold text-gray-900">
                                    {students.total}
                                </span>{' '}
                                / {schoolClass.max_students} học sinh
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="secondary"
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
                                <Download className="h-4.5 w-4.5 text-gray-600" />
                                Export CSV Lớp {!canExportCsv && '🔒'}
                            </Button>
                            {!isTeacher && (
                                <Button
                                    variant="success"
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
                </div>

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
                            variant="secondary"
                            size="md"
                            onClick={handleDownloadSample}
                            type="button"
                            className="flex w-full items-center justify-center gap-2 py-2.5 text-sm"
                        >
                            <Download className="h-4.5 w-4.5 text-emerald-600" />
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
        </AppLayout>
    );
}
