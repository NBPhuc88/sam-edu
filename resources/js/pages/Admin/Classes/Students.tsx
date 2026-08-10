import { Head, router, usePage } from '@inertiajs/react';
import { Download, Upload, Search, FileSpreadsheet, ArrowLeft, GraduationCap } from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AppLayout from '@/layouts/AppLayout';

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
}

export default function ClassStudentsPage({ schoolClass, students, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(`/classes/${schoolClass.id}/students`, { search }, { preserveState: true });
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
                setErrorMessage(err.file || 'Có lỗi xảy ra khi tải tệp CSV lên.');
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
            cell: (row) => <span className="font-mono text-xs font-semibold text-gray-800">{row.student_code}</span>,
        },
        {
            header: 'Họ và tên',
            accessorKey: 'full_name',
            cell: (row) => (
                <div>
                    <div className="font-medium text-gray-900">{row.full_name}</div>
                    <div className="text-xs text-gray-500">{row.email}</div>
                </div>
            ),
        },
        {
            header: 'Số điện thoại',
            accessorKey: 'phone',
            cell: (row) => row.phone || <span className="text-gray-400 italic">Chưa có</span>,
        },
        {
            header: 'Phụ huynh',
            cell: (row) => (
                <div>
                    <div className="text-xs font-medium text-gray-800">{row.parent_name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{row.parent_phone || ''}</div>
                </div>
            ),
        },
        {
            header: 'Ngày ghi danh',
            cell: (row) => (
                <span className="text-xs text-gray-600">
                    {row.pivot?.enrolled_at ? new Date(row.pivot.enrolled_at).toLocaleDateString('vi-VN') : '—'}
                </span>
            ),
        },
        {
            header: 'Trạng thái',
            cell: (row) => (
                <Badge variant={row.pivot?.status === 'active' ? 'active' : 'info'}>
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
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Quay lại danh sách lớp học
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <GraduationCap className="w-7 h-7 text-emerald-600" />
                                Học sinh Lớp: {schoolClass.name} ({schoolClass.code})
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Sĩ số hiện tại: <span className="font-semibold text-gray-900">{students.total}</span> / {schoolClass.max_students} học sinh
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="secondary" onClick={handleExport} className="flex items-center gap-2">
                                <Download className="w-4 h-4 text-gray-600" />
                                Export CSV Lớp
                            </Button>
                            <Button variant="success" onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                Import CSV Lớp
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash.success && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
                        {flash.success}
                    </div>
                )}
                {flash.error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                        {flash.error}
                    </div>
                )}

                {/* Table Card */}
                <Card>
                    {/* Search & Header */}
                    <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
                            <Input
                                placeholder="Tìm học sinh trong lớp theo Tên, Mã HS, Email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Button type="submit" variant="secondary" className="px-3">
                                <Search className="w-4 h-4" />
                            </Button>
                        </form>

                        <div className="text-xs text-gray-500 font-medium">
                            Số học sinh hiển thị: <span className="font-bold text-gray-900">{students.data.length}</span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="p-4">
                        <DataTable columns={columns} data={students.data} emptyMessage="Lớp học chưa có học sinh nào" />
                    </div>

                    {/* Pagination */}
                    {students.last_page > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 text-sm">
                            <div className="text-gray-500">
                                Trang {students.current_page} / {students.last_page}
                            </div>
                            <div className="flex items-center gap-1">
                                {students.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                                            link.active
                                                ? 'bg-emerald-600 text-white'
                                                : link.url
                                                  ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
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
                        <Button variant="secondary" onClick={() => setIsImportModalOpen(false)} disabled={isUploading}>
                            Hủy bỏ
                        </Button>
                        <Button variant="success" onClick={handleImportSubmit} disabled={isUploading || !selectedFile}>
                            {isUploading ? 'Đang ghi danh...' : 'Tải lên & Ghi danh'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Tải tệp CSV danh sách học sinh để ghi danh vào lớp. Nếu học sinh chưa có trên hệ thống, hệ thống sẽ tự động tạo mới học sinh và đưa vào lớp học.
                    </p>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                        <div className="font-semibold flex items-center gap-1">
                            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                            Định dạng các cột trong CSV:
                        </div>
                        <div>- Cột bắt buộc: Mã học sinh (hoặc Tên đăng nhập / Email).</div>
                        <div>- Cột tùy chọn: Họ và tên, Số điện thoại, Tên phụ huynh, SĐT phụ huynh.</div>
                    </div>

                    <div className="pt-2">
                        <Button variant="secondary" onClick={handleDownloadSample} type="button" className="w-full text-xs py-2 flex items-center justify-center gap-2">
                            <Download className="w-4 h-4 text-emerald-600" />
                            Tải tệp CSV mẫu cho lớp học (.csv)
                        </Button>
                    </div>

                    <div className="space-y-1 pt-2">
                        <label className="block text-xs font-semibold text-gray-700">Chọn tệp CSV từ máy tính</label>
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleFileChange}
                            className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-gray-200 rounded-md p-1"
                        />
                        {errorMessage && <p className="text-xs text-red-600 mt-1 font-medium">{errorMessage}</p>}
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
