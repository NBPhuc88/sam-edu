import { Head, router, useForm } from '@inertiajs/react';
import {
    Calendar,
    Plus,
    Search,
    Edit3,
    Trash2,
    Sparkles,
    CalendarDays,
    Info,
    Moon,
    Sun,
    RefreshCw,
} from 'lucide-react';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Pagination, { PaginationLink } from '@/components/ui/Pagination';
import AppLayout from '@/layouts/AppLayout';
import { parseDate, WEEKDAY_NAMES } from '@/lib/date';

interface Holiday {
    id: number;
    name: string;
    date: string;
    year: number;
    is_lunar: boolean;
    is_recurring: boolean;
    description: string | null;
    created_at: string;
}

interface Props {
    holidays: {
        data: Holiday[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links?: PaginationLink[];
    };
    selectedYear: number;
    availableYears: number[];
    filters: {
        year?: number;
        search?: string;
    };
}

export default function Index({
    holidays,
    selectedYear,
    availableYears,
    filters,
}: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [activeYear, setActiveYear] = useState<number>(selectedYear || new Date().getFullYear());

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
    const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);
    const [isSeeding, setIsSeeding] = useState(false);

    // Form for create/edit
    const {
        data,
        setData,
        post,
        patch,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        name: '',
        date: `${activeYear}-01-01`,
        is_lunar: false,
        is_recurring: false,
        description: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/holidays',
            { year: activeYear, search: searchTerm },
            { preserveState: true }
        );
    };

    const handleYearChange = (year: number) => {
        setActiveYear(year);
        router.get(
            '/holidays',
            { year, search: searchTerm },
            { preserveState: true }
        );
    };

    const openCreateModal = () => {
        reset();
        clearErrors();
        setData({
            name: '',
            date: `${activeYear}-01-01`,
            is_lunar: false,
            is_recurring: false,
            description: '',
        });
        setEditingHoliday(null);
        setIsCreateModalOpen(true);
    };

    const openEditModal = (holiday: Holiday) => {
        reset();
        clearErrors();
        setEditingHoliday(holiday);
        setData({
            name: holiday.name,
            date: holiday.date,
            is_lunar: holiday.is_lunar,
            is_recurring: holiday.is_recurring,
            description: holiday.description || '',
        });
        setIsCreateModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingHoliday) {
            patch(`/holidays/${editingHoliday.id}`, {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    setEditingHoliday(null);
                    reset();
                },
            });
        } else {
            post('/holidays', {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = () => {
        if (!deletingHoliday) return;
        router.delete(`/holidays/${deletingHoliday.id}`, {
            onSuccess: () => setDeletingHoliday(null),
        });
    };

    const handleSeedDefaults = () => {
        setIsSeeding(true);
        router.post(
            '/holidays/seed',
            { year: activeYear },
            {
                onFinish: () => setIsSeeding(false),
            }
        );
    };

    const formatDateVietnamese = (dateStr: string) => {
        if (!dateStr) return '';
        const d = parseDate(dateStr);
        if (!d) return dateStr;
        const dayOfWeek = WEEKDAY_NAMES[d.getDay()];
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year} (${dayOfWeek})`;
    };

    return (
        <AppLayout title="Quản Lý Ngày Lễ">
            <Head title="Quản Lý Ngày Lễ" />

            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header Banner */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <CalendarDays className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    Quản Lý Ngày Lễ Quốc Gia
                                </h1>
                                <p className="text-xs text-gray-500">
                                    Cấu hình danh sách ngày lễ theo năm. Khi thêm/sửa/xóa ngày lễ, hệ thống tự động đồng bộ và dời ca học cho các lớp liên quan.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleSeedDefaults}
                            disabled={isSeeding}
                            className="flex items-center gap-2 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                        >
                            <Sparkles className={`h-4 w-4 text-emerald-600 ${isSeeding ? 'animate-spin' : ''}`} />
                            <span>Khởi Tạo Ngày Lễ Năm {activeYear}</span>
                        </Button>

                        <Button
                            type="button"
                            variant="success"
                            onClick={openCreateModal}
                            className="flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Thêm Ngày Lễ</span>
                        </Button>
                    </div>
                </div>

                {/* Filters & Year Selector */}
                <Card className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Year Selector Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="mr-1 text-xs font-bold uppercase text-gray-500">Năm:</span>
                            {availableYears.map((year) => (
                                <button
                                    key={year}
                                    type="button"
                                    onClick={() => handleYearChange(year)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                                        activeYear === year
                                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/20'
                                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Input
                                    type="text"
                                    placeholder="Tìm tên ngày lễ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 text-xs"
                                />
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                            <Button type="submit" variant="secondary" className="px-3 py-2 text-xs">
                                Tìm
                            </Button>
                            {searchTerm && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        setSearchTerm('');
                                        router.get('/holidays', { year: activeYear }, { preserveState: true });
                                    }}
                                    className="px-2.5 py-2 text-xs text-gray-500"
                                >
                                    Xóa
                                </Button>
                            )}
                        </form>
                    </div>
                </Card>

                {/* Holidays Table */}
                <Card className="overflow-hidden p-0 shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-[11px] font-bold uppercase text-gray-700">
                                <tr>
                                    <th className="px-5 py-3.5">STT</th>
                                    <th className="px-5 py-3.5">Ngày Lễ (Dương Lịch)</th>
                                    <th className="px-5 py-3.5">Tên Ngày Nghỉ Lễ</th>
                                    <th className="px-5 py-3.5">Phân Loại</th>
                                    <th className="px-5 py-3.5">Mô Tả / Ghi Chú</th>
                                    <th className="px-5 py-3.5 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {holidays.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Calendar className="h-10 w-10 text-gray-300" />
                                                <p className="text-sm font-medium text-gray-600">
                                                    Chưa có ngày lễ nào cho năm {activeYear}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Bạn có thể bấm nút "Khởi Tạo Ngày Lễ Năm {activeYear}" ở góc trên để tự động tạo nhanh.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    holidays.data.map((item, idx) => (
                                        <tr key={item.id} className="transition-colors hover:bg-slate-50/70">
                                            <td className="px-5 py-3.5 font-medium text-gray-500">
                                                {(holidays.current_page - 1) * holidays.per_page + idx + 1}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="font-mono font-bold text-gray-900">
                                                    {formatDateVietnamese(item.date)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-emerald-950">
                                                {item.name}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {item.is_lunar ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 ring-1 ring-purple-600/20">
                                                        <Moon className="h-3 w-3" />
                                                        Âm Lịch
                                                    </span>
                                                ) : item.is_recurring ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-600/20">
                                                        <Sun className="h-3 w-3" />
                                                        Cố Định Hàng Năm
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                                                        Dương Lịch
                                                    </span>
                                                )}
                                            </td>
                                            <td className="max-w-xs truncate px-5 py-3.5 text-gray-500">
                                                {item.description || '—'}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="edit"
                                                        onClick={() => openEditModal(item)}
                                                        className="px-2.5 py-1 text-xs"
                                                        title="Chỉnh sửa ngày lễ"
                                                    >
                                                        <Edit3 className="h-3.5 w-3.5" />
                                                        <span>Sửa</span>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="danger"
                                                        onClick={() => setDeletingHoliday(item)}
                                                        className="px-2.5 py-1 text-xs"
                                                        title="Xóa ngày lễ"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        <span>Xóa</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {holidays.last_page > 1 && (
                        <div className="border-t border-gray-100 px-5 py-3.5">
                            <Pagination
                                links={holidays.links || []}
                                from={holidays.from}
                                to={holidays.to}
                                total={holidays.total}
                                perPage={holidays.per_page}
                                currentParams={{ year: activeYear, search: searchTerm }}
                            />
                        </div>
                    )}
                </Card>

                {/* Information Note */}
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-900">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <div>
                        <span className="font-bold">Cơ chế đồng bộ tự động:</span> Khi bạn Thêm, Sửa hoặc Xóa bất kỳ ngày lễ nào, hệ thống sẽ tự động kích hoạt tiến trình ngầm (Queue Job) để quét lại toàn bộ các lịch học đang mở có áp dụng ngày nghỉ lễ và tự động điều chỉnh dời ca học cho chuẩn xác.
                    </div>
                </div>
            </div>

            {/* Create / Edit Holiday Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={editingHoliday ? 'Chỉnh Sửa Ngày Lễ' : `Thêm Ngày Lễ Mới (Năm ${activeYear})`}
                maxWidth="md"
                footer={
                    <div className="flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            Hủy Bỏ
                        </Button>
                        <Button
                            type="button"
                            variant="success"
                            onClick={handleSubmit}
                            disabled={processing}
                        >
                            {processing ? 'Đang Lưu...' : editingHoliday ? 'Cập Nhật Ngày Lễ' : 'Lưu Ngày Lễ'}
                        </Button>
                    </div>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700">
                            Tên Ngày Lễ <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="VD: Tết Nguyên Đán (Mùng 1), Giỗ Tổ Hùng Vương..."
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700">
                            Ngày Dương Lịch <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={data.date}
                            onChange={(e) => setData('date', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono font-semibold text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            required
                        />
                        {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-100 bg-slate-50 p-3">
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={data.is_lunar}
                                onChange={(e) => setData('is_lunar', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Ngày lễ gốc Âm lịch</span>
                        </label>

                        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={data.is_recurring}
                                onChange={(e) => setData('is_recurring', e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Cố định hàng năm</span>
                        </label>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700">
                            Mô Tả / Ghi Chú
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Nhập mô tả thêm nếu có..."
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deletingHoliday}
                onClose={() => setDeletingHoliday(null)}
                title="Xác Nhận Xóa Ngày Lễ"
                maxWidth="sm"
                footer={
                    <div className="flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setDeletingHoliday(null)}
                        >
                            Hủy Bỏ
                        </Button>
                        <Button
                            type="button"
                            variant="danger"
                            onClick={handleDelete}
                        >
                            Xác Nhận Xóa
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3">
                    <p className="text-sm text-gray-700">
                        Bạn có chắc chắn muốn xóa ngày lễ{' '}
                        <span className="font-bold text-gray-900">{deletingHoliday?.name}</span> (Ngày {deletingHoliday?.date}) không?
                    </p>
                    <p className="text-xs text-red-600 font-semibold">
                        Lưu ý: Hệ thống sẽ tự động cập nhật lại các lịch học đang áp dụng ngày lễ này trong nền.
                    </p>
                </div>
            </Modal>
        </AppLayout>
    );
}
