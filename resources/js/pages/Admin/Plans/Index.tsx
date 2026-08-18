import { Head, Link, router } from '@inertiajs/react';
import {
    DollarSign,
    Plus,
    Search,
    Edit2,
    Trash2,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    Shield,
    Users,
    Layers,
    Calendar,
    Tag,
    Clock,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import AppLayout from '@/layouts/AppLayout';

interface SubscriptionPlan {
    id: number;
    code: string;
    name: string;
    price: number;
    yearly_price: number | null;
    duration_days: number;
    max_students: number | null;
    max_classes: number | null;
    features: string[] | null;
    badge_text: string | null;
    is_featured: boolean;
    created_at?: string;
    updated_at?: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    plans: PaginatedData<SubscriptionPlan>;
    stats: {
        total: number;
        free: number;
        paid: number;
        featured: number;
    };
    filters: {
        search?: string;
        type?: string;
        per_page?: number;
    };
}

export default function PlanIndex({ plans, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState<string>(filters.type || 'all');

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Detail view modal
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [viewingPlan, setViewingPlan] = useState<SubscriptionPlan | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/plans',
            {
                search: search || undefined,
                type: selectedType !== 'all' ? selectedType : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleFilterType = (type: string) => {
        setSelectedType(type);
        router.get(
            '/plans',
            {
                search: search || undefined,
                type: type !== 'all' ? type : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleReset = () => {
        setSearch('');
        setSelectedType('all');
        router.get('/plans');
    };

    const openDeleteModal = (plan: SubscriptionPlan) => {
        setDeletingPlan(plan);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingPlan) {
return;
}

        setIsDeleting(true);
        router.delete(`/plans/${deletingPlan.id}`, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setDeletingPlan(null);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const openDetailModal = (plan: SubscriptionPlan) => {
        setViewingPlan(plan);
        setDetailModalOpen(true);
    };

    const formatCurrency = (val: number | null | undefined) => {
        if (val === null || val === undefined || val === 0) {
return 'Miễn phí (0đ)';
}

        return `${val.toLocaleString('vi-VN')}đ`;
    };

    return (
        <AppLayout title="Quản Lý Gói Dịch Vụ SaaS">
            <Head title="Cấu Hình Gói Dịch Vụ SaaS" />

            <div className="space-y-6">
                {/* Header & Action Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                            <span>Tài Chính</span>
                            <span>/</span>
                            <span className="text-emerald-700 font-semibold">Cấu Hình Gói SaaS</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <DollarSign className="h-7 w-7 text-emerald-600" />
                            Quản Lý Gói Dịch Vụ SaaS
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Cấu hình các gói cước đăng ký & gia hạn dịch vụ phần mềm cho Trung tâm giáo dục.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/plans/create">
                            <Button
                                variant="success"
                                size="md"
                                icon={<Plus className="h-4 w-4" />}
                                className="shadow-sm hover:shadow-md transition-shadow"
                            >
                                Tạo Gói Cước Mới
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Card className="p-4 bg-white border border-gray-100 shadow-xs hover:border-emerald-200 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng Gói Cước</p>
                                <p className="mt-1 text-2xl font-extrabold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-white border border-gray-100 shadow-xs hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gói Miễn Phí (Trial)</p>
                                <p className="mt-1 text-2xl font-extrabold text-blue-600">{stats.free}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                <Clock className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-white border border-gray-100 shadow-xs hover:border-emerald-200 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gói Trả Phí</p>
                                <p className="mt-1 text-2xl font-extrabold text-emerald-600">{stats.paid}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                <Shield className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-white border border-gray-100 shadow-xs hover:border-amber-200 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gói Nổi Bật</p>
                                <p className="mt-1 text-2xl font-extrabold text-amber-600">{stats.featured}</p>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                <Sparkles className="h-5 w-5" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filter and Search Bar */}
                <Card className="p-4 bg-white border border-gray-200 shadow-xs">
                    <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên gói, mã gói, huy hiệu..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedType}
                                    onChange={(e) => handleFilterType(e.target.value)}
                                    aria-label="Lọc theo loại gói cước"
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="all">Tất cả loại gói</option>
                                    <option value="free">Gói Miễn Phí (Trial)</option>
                                    <option value="paid">Gói Trả Phí</option>
                                    <option value="featured">Gói Nổi Bật</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button type="submit" variant="success" size="sm" icon={<Search className="h-3.5 w-3.5" />}>
                                Tìm kiếm
                            </Button>
                            {(search || selectedType !== 'all') && (
                                <Button type="button" variant="secondary" size="sm" onClick={handleReset}>
                                    Đặt lại
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>

                {/* Data Table */}
                <Card className="overflow-hidden bg-white border border-gray-200 shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-gray-700">
                                <tr>
                                    <th className="px-4 py-3.5">Mã & Tên Gói</th>
                                    <th className="px-4 py-3.5">Giá Theo Tháng</th>
                                    <th className="px-4 py-3.5">Giá Theo Năm</th>
                                    <th className="px-4 py-3.5">Thời Hạn</th>
                                    <th className="px-4 py-3.5">Giới Hạn</th>
                                    <th className="px-4 py-3.5">Tính Năng</th>
                                    <th className="px-4 py-3.5">Huy Hiệu</th>
                                    <th className="px-4 py-3.5 text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {plans.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                                            <AlertCircle className="mx-auto h-8 w-8 text-gray-300" />
                                            <p className="mt-2 text-base font-medium text-gray-600">
                                                Không tìm thấy gói cước nào
                                            </p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                Thử thay đổi bộ lọc tìm kiếm hoặc tạo gói cước mới.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    plans.data.map((plan) => (
                                        <tr key={plan.id} className="hover:bg-slate-50/60 transition-colors">
                                            {/* Name and Code */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-start gap-2.5">
                                                    <div
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                                                            plan.is_featured
                                                                ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300'
                                                                : plan.price === 0
                                                                  ? 'bg-blue-100 text-blue-800'
                                                                  : 'bg-emerald-100 text-emerald-800'
                                                        }`}
                                                    >
                                                        {plan.is_featured ? <Sparkles className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-bold text-gray-900 hover:text-emerald-700 cursor-pointer" onClick={() => openDetailModal(plan)}>
                                                                {plan.name}
                                                            </span>
                                                            {plan.is_featured && (
                                                                <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                                                                    Nổi bật
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="font-mono text-xs text-gray-500">
                                                            {plan.code}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Monthly Price */}
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-gray-900">
                                                    {formatCurrency(plan.price)}
                                                </div>
                                                <div className="text-[11px] text-gray-400">/tháng (mặc định)</div>
                                            </td>

                                            {/* Yearly Price */}
                                            <td className="px-4 py-3.5">
                                                {plan.yearly_price && plan.yearly_price > 0 ? (
                                                    <div>
                                                        <div className="font-bold text-emerald-700">
                                                            {plan.yearly_price.toLocaleString('vi-VN')}đ
                                                        </div>
                                                        <div className="text-[11px] text-emerald-600 font-medium">
                                                            {plan.price > 0
                                                                ? `Tiết kiệm ~${Math.round(
                                                                      (1 - plan.yearly_price / (plan.price * 12)) * 100,
                                                                  )}%/năm`
                                                                : '/năm'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Chưa thiết lập</span>
                                                )}
                                            </td>

                                            {/* Duration */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1 text-gray-700">
                                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                    <span>{plan.duration_days} ngày</span>
                                                </div>
                                            </td>

                                            {/* Limits */}
                                            <td className="px-4 py-3.5">
                                                <div className="space-y-0.5 text-xs">
                                                    <div className="flex items-center gap-1 text-gray-700">
                                                        <Users className="h-3 w-3 text-gray-400" />
                                                        <span>{plan.max_students ? `${plan.max_students} HS` : 'Không giới hạn'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-gray-700">
                                                        <Layers className="h-3 w-3 text-gray-400" />
                                                        <span>{plan.max_classes ? `${plan.max_classes} Lớp` : 'Không giới hạn'}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Features Count */}
                                            <td className="px-4 py-3.5">
                                                {plan.features && plan.features.length > 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openDetailModal(plan)}
                                                        className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium hover:underline"
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        {plan.features.length} tính năng
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400">0 tính năng</span>
                                                )}
                                            </td>

                                            {/* Badge */}
                                            <td className="px-4 py-3.5">
                                                {plan.badge_text ? (
                                                    <Badge variant={plan.is_featured ? 'active' : 'info'}>
                                                        {plan.badge_text}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link href={`/plans/${plan.id}/edit`}>
                                                        <Button
                                                            variant="edit"
                                                            size="sm"
                                                            icon={<Edit2 className="h-3.5 w-3.5" />}
                                                            title="Chỉnh sửa gói cước"
                                                        >
                                                            Sửa
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        icon={<Trash2 className="h-3.5 w-3.5" />}
                                                        onClick={() => openDeleteModal(plan)}
                                                        title="Xóa gói cước"
                                                    >
                                                        Xóa
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {plans.total > plans.data.length && (
                        <div className="border-t border-gray-100 p-4">
                            <Pagination
                                links={plans.links}
                                from={plans.from}
                                to={plans.to}
                                total={plans.total}
                                perPage={filters.per_page ?? 20}
                                currentParams={{
                                    search: search || undefined,
                                    type: selectedType !== 'all' ? selectedType : undefined,
                                }}
                            />
                        </div>
                    )}
                </Card>
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title={`Chi tiết gói: ${viewingPlan?.name || ''}`}
                footer={
                    <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                        Đóng
                    </Button>
                }
            >
                {viewingPlan && (
                    <div className="space-y-4 text-sm text-gray-700">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h4 className="text-base font-bold text-gray-900">{viewingPlan.name}</h4>
                                <p className="font-mono text-xs text-gray-500">Mã: {viewingPlan.code}</p>
                            </div>
                            {viewingPlan.badge_text && (
                                <Badge variant={viewingPlan.is_featured ? 'active' : 'info'}>
                                    {viewingPlan.badge_text}
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
                            <div>
                                <span className="text-xs text-gray-500">Giá theo tháng:</span>
                                <p className="font-bold text-gray-900">{formatCurrency(viewingPlan.price)}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">Giá mua theo năm:</span>
                                <p className="font-bold text-emerald-700">{formatCurrency(viewingPlan.yearly_price)}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">Thời hạn chu kỳ:</span>
                                <p className="font-semibold text-gray-800">{viewingPlan.duration_days} ngày</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">Giới hạn học sinh & lớp:</span>
                                <p className="font-semibold text-gray-800">
                                    {viewingPlan.max_students ? `${viewingPlan.max_students} HS` : 'Không giới hạn'} /{' '}
                                    {viewingPlan.max_classes ? `${viewingPlan.max_classes} Lớp` : 'Không giới hạn'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                                <Tag className="h-4 w-4 text-emerald-600" />
                                Danh sách tính năng bao gồm:
                            </h5>
                            {viewingPlan.features && viewingPlan.features.length > 0 ? (
                                <ul className="space-y-1.5 rounded-lg border border-gray-200 bg-white p-3">
                                    {viewingPlan.features.map((feat, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs text-gray-700">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                            <span>{feat}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-gray-400 italic">Chưa có tính năng nào được cấu hình.</p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Xác nhận xóa gói cước SaaS"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
                            Hủy bỏ
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} isLoading={isDeleting} icon={<Trash2 className="h-4 w-4" />}>
                            Xác nhận xóa
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <p className="text-sm text-gray-700">
                        Bạn có chắc chắn muốn xóa gói cước{' '}
                        <strong className="text-gray-900 font-bold">{deletingPlan?.name}</strong> (Mã:{' '}
                        <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{deletingPlan?.code}</code>)?
                    </p>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        <p className="font-semibold">⚠️ Lưu ý quan trọng:</p>
                        <p className="mt-1">
                            Các trung tâm đang sử dụng gói này sẽ không bị xóa dữ liệu, nhưng gói cước này sẽ không còn hiển thị khi đăng ký mới hoặc gia hạn.
                        </p>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
