import { Head, router, usePage } from '@inertiajs/react';
import { Download, Upload, Search, FileSpreadsheet, UserCheck } from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AppLayout from '@/layouts/AppLayout';

interface Center {
    id: number;
    name: string;
}

interface Teacher {
    id: number;
    teacher_code: string;
    username: string;
    full_name: string;
    email: string;
    phone: string | null;
    specialization: string | null;
    status: string;
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
    filters: {
        search?: string;
        center_id?: string;
    };
}

export default function TeacherIndex({ teachers, filters }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const [search, setSearch] = useState(filters.search || '');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/teachers', { search }, { preserveState: true });
    };

    const handleExport = () => {
        window.location.href = `/teachers/export${filters.center_id ? `?center_id=${filters.center_id}` : ''}`;
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

        if (filters.center_id) {
            formData.append('center_id', filters.center_id);
        }

        router.post('/teachers/import', formData, {
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

    const columns: Column<Teacher>[] = [
        {
            header: 'Mã GV',
            accessorKey: 'teacher_code',
            cell: (row) => <span className="font-mono text-xs font-semibold text-gray-800">{row.teacher_code}</span>,
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
            header: 'Chuyên môn',
            accessorKey: 'specialization',
            cell: (row) => row.specialization || <span className="text-gray-400 italic">Chưa có</span>,
        },
        {
            header: 'Trạng thái',
            accessorKey: 'status',
            cell: (row) => (
                <Badge variant={row.status === 'active' ? 'active' : 'info'}>
                    {row.status === 'active' ? 'Đang giảng dạy' : 'Tạm nghỉ'}
                </Badge>
            ),
        },
    ];

    return (
        <AppLayout title="Quản lý Giáo viên">
            <Head title="Quản lý Giáo viên" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <UserCheck className="w-7 h-7 text-emerald-600" />
                            Quản lý Giáo viên
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Quản lý danh sách giáo viên, xuất và nhập thông tin giáo viên qua file CSV stream.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={handleExport} className="flex items-center gap-2">
                            <Download className="w-4 h-4 text-gray-600" />
                            Export CSV
                        </Button>
                        <Button variant="success" onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Import CSV
                        </Button>
                    </div>
                </div>

                {/* Notifications */}
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

                {/* Content Card */}
                <Card>
                    {/* Search & Action Bar */}
                    <div className="p-4 border-b border-gray-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-md w-full">
                            <Input
                                placeholder="Tìm kiếm theo Tên, Mã GV, Email, Chuyên môn..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Button type="submit" variant="secondary" className="px-3">
                                <Search className="w-4 h-4" />
                            </Button>
                        </form>

                        <div className="text-xs text-gray-500 font-medium">
                            Tổng số giáo viên: <span className="font-bold text-gray-900">{teachers.total}</span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="p-4">
                        <DataTable columns={columns} data={teachers.data} emptyMessage="Không tìm thấy giáo viên nào" />
                    </div>

                    {/* Pagination */}
                    {teachers.last_page > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 text-sm">
                            <div className="text-gray-500">
                                Trang {teachers.current_page} / {teachers.last_page}
                            </div>
                            <div className="flex items-center gap-1">
                                {teachers.links.map((link, idx) => (
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
                title="Import Thông tin Giáo viên từ CSV"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsImportModalOpen(false)} disabled={isUploading}>
                            Hủy bỏ
                        </Button>
                        <Button variant="success" onClick={handleImportSubmit} disabled={isUploading || !selectedFile}>
                            {isUploading ? 'Đang tải lên...' : 'Tải lên & Import'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Chọn tệp CSV chứa danh sách giáo viên để nhập vào hệ thống. Hệ thống tự động tạo mới hoặc cập nhật thông tin nếu mã giáo viên đã tồn tại.
                    </p>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
                        <div className="font-semibold flex items-center gap-1">
                            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                            Lưu ý định dạng file CSV:
                        </div>
                        <div>- Các cột hỗ trợ: Mã giáo viên, Tên đăng nhập, Họ, Tên, Họ và tên, Email, Số điện thoại, Ngày sinh (YYYY-MM-DD), Giới tính, Ngày vào làm (YYYY-MM-DD), Chuyên môn, Ghi chú.</div>
                        <div>- Bạn có thể tải tệp mẫu chuẩn bên dưới để xem định dạng chi tiết.</div>
                    </div>

                    <div className="pt-2">
                        <Button variant="secondary" onClick={handleDownloadSample} type="button" className="w-full text-xs py-2 flex items-center justify-center gap-2">
                            <Download className="w-4 h-4 text-emerald-600" />
                            Tải tệp CSV mẫu giáo viên (.csv)
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
