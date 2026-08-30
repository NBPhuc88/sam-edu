import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import {
PAYMENT_METHOD_BANK_TRANSFER,
PAYMENT_METHOD_CASH,
PAYMENT_METHOD_CREDIT_CARD,
PAYMENT_METHOD_LABELS,
PAYMENT_METHOD_MOMO,
PAYMENT_METHOD_ZALOPAY,
TUITION_STATUS_OVERDUE,
TUITION_STATUS_PAID,
TUITION_STATUS_PARTIAL,
TUITION_STATUS_PENDING
} from '@/constants/enums';
import AppLayout from '@/layouts/AppLayout';
import { formatDate } from '@/lib/date';
import { Head,router } from '@inertiajs/react';
import {
    BookOpen,
    CheckCircle2,
    Clock,
    Eye,
    Filter,
    Receipt,
    Search,
    Wallet,
} from 'lucide-react';
import React,{ useState } from 'react';

interface TuitionPayment {
    id: number;
    amount: number;
    payment_date: string;
    payment_method: number;
    transaction_code?: string | null;
    received_by?: string | null;
    note?: string | null;
}

interface StudentTuitionItem {
    id: number;
    title: string;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    status: number;
    due_date?: string | null;
    created_at?: string | null;
    payments_count?: number;
    payments?: TuitionPayment[];
    school_class?: {
        id: number;
        name: string;
        code: string;
    } | null;
    center?: {
        id: number;
        name: string;
        code: string;
    } | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    student: {
        id: number;
        full_name: string;
        student_code: string;
    };
    tuitions: PaginatedData<StudentTuitionItem>;
    stats: {
        total_invoiced?: number;
        total_paid?: number;
        total_remaining?: number;
        paid_count?: number;
        partial_count?: number;
        unpaid_count?: number;
        total_amount?: number;
        paid_amount?: number;
        remaining_amount?: number;
        completed_count?: number;
        total_records?: number;
    };
    filters: {
        search?: string;
        status?: number;
        per_page?: number;
    };
}

export default function StudentTuitionIndex({
    student,
    tuitions,
    stats,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState<number>(filters.status !== undefined && filters.status !== null ? Number(filters.status) : 0);
    const [selectedTuition, setSelectedTuition] = useState<StudentTuitionItem | null>(null);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(Number(val) || 0);
    };

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const params: Record<string, any> = {};
        if (search && search.trim() !== '') {
            params.search = search.trim();
        }
        if (selectedStatus && Number(selectedStatus) > 0) {
            params.status = Number(selectedStatus);
        }
        router.get(
            '/student/tuitions',
            params,
            { preserveState: true },
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedStatus(0);
        router.get('/student/tuitions', {}, { preserveState: true });
    };

    const totalInvoiced = stats.total_invoiced ?? stats.total_amount ?? 0;
    const totalPaid = stats.total_paid ?? stats.paid_amount ?? 0;
    const totalRemaining = stats.total_remaining ?? stats.remaining_amount ?? 0;
    const paidCount = stats.paid_count ?? stats.completed_count ?? 0;
    const partialCount = stats.partial_count ?? 0;
    const unpaidCount = stats.unpaid_count ?? 0;
    const totalCount = stats.total_records ?? (paidCount + partialCount + unpaidCount);

    const getStatusBadge = (status: number) => {
        switch (status) {
            case TUITION_STATUS_PAID:
                return <Badge variant="active">Đã Hoàn Thành</Badge>;
            case TUITION_STATUS_PARTIAL:
                return <Badge variant="pending">Đang Đóng Từng Phần</Badge>;
            case TUITION_STATUS_OVERDUE:
                return <Badge variant="expired">Quá Hạn</Badge>;
            case TUITION_STATUS_PENDING:
            default:
                return <Badge variant="danger">Chưa Đóng</Badge>;
        }
    };

    const getPaymentMethodBadge = (method: number) => {
        switch (method) {
            case PAYMENT_METHOD_BANK_TRANSFER:
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Chuyển khoản</span>;
            case PAYMENT_METHOD_ZALOPAY:
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">QR ZaloPay</span>;
            case PAYMENT_METHOD_MOMO:
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">Ví MoMo</span>;
            case PAYMENT_METHOD_CREDIT_CARD:
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Thẻ tín dụng</span>;
            case PAYMENT_METHOD_CASH:
            default:
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">{PAYMENT_METHOD_LABELS[method] || 'Tiền mặt'}</span>;
        }
    };

    return (
        <AppLayout title="Lịch Sử Học Phí & Đóng Tiền">
            <Head title="Học Phí Của Tôi | SAM-EDU" />

            <div className="space-y-6 pb-12">
                {/* Header */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl flex items-center gap-2">
                            <Wallet className="h-6 w-6 text-emerald-600" />
                            <span>Học Phí & Lịch Sử Đóng Tiền</span>
                        </h1>
                        <p className="text-xs text-gray-500 sm:text-sm mt-0.5">
                            Theo dõi các khoản học phí, hạn nộp và biên lai các đợt đã thanh toán của bạn.
                        </p>
                    </div>
                </div>

                {/* Summary Stat Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-gray-200 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Tổng Học Phí</p>
                                <h3 className="mt-1 text-2xl font-black text-gray-900 font-mono">
                                    {formatCurrency(totalInvoiced)}
                                </h3>
                                <p className="text-2xs text-gray-400 mt-1">Tổng {totalCount} khoản thu</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <Receipt className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-gray-200 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-emerald-700 uppercase">Đã Thanh Toán</p>
                                <h3 className="mt-1 text-2xl font-black text-emerald-600 font-mono">
                                    {formatCurrency(totalPaid)}
                                </h3>
                                <p className="text-2xs text-emerald-600 font-semibold mt-1">
                                    {paidCount} khoản đã hoàn tất
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>

                    <Card className="border-gray-200 bg-white p-5 shadow-xs sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-amber-700 uppercase">Còn Lại Cần Nộp</p>
                                <h3 className="mt-1 text-2xl font-black text-amber-600 font-mono">
                                    {formatCurrency(totalRemaining)}
                                </h3>
                                <p className="text-2xs text-amber-700 font-semibold mt-1">
                                    {partialCount + unpaidCount} khoản đang chờ đóng
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                                <Clock className="h-6 w-6" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Filter Bar */}
                <Card className="border-gray-200 bg-white p-4 shadow-xs">
                    <form onSubmit={handleFilter} className="flex flex-col gap-3 md:flex-row md:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên khoản thu, lớp học..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs sm:text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-emerald-500 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(Number(e.target.value));
                                }}
                                className="rounded-xl border border-gray-200 bg-slate-50/50 py-2 px-3 text-xs sm:text-sm text-gray-700 focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                            >
                                <option value="0">Tất cả trạng thái</option>
                                <option value={TUITION_STATUS_PAID}>Đã hoàn thành</option>
                                <option value={TUITION_STATUS_PARTIAL}>Đang đóng từng phần</option>
                                <option value={TUITION_STATUS_PENDING}>Chưa đóng</option>
                                <option value={TUITION_STATUS_OVERDUE}>Quá hạn</option>
                            </select>

                            <Button
                                type="submit"
                                variant="success"
                                size="md"
                                icon={<Filter className="h-4 w-4" />}
                            >
                                Tìm kiếm
                            </Button>
                            {(Boolean(search) || selectedStatus > 0) && (
                                <Button variant="secondary" size="sm" type="button" onClick={handleResetFilter}>
                                    Đặt Lại
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>

                {/* Main Tuition Table */}
                <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                        <thead className="bg-slate-50/90 text-gray-700">
                            <tr>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500">
                                    Khoản Thu & Lớp Học
                                </th>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500 text-right">
                                    Tổng Học Phí
                                </th>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500 text-right">
                                    Đã Đóng
                                </th>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500 text-right">
                                    Còn Lại
                                </th>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500 text-center">
                                    Hạn Nộp
                                </th>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500 text-center">
                                    Trạng Thái
                                </th>
                                <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-2xs text-gray-500 text-center">
                                    Lịch Sử Đóng
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {tuitions.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-sm text-gray-400 italic">
                                        Không tìm thấy khoản học phí nào.
                                    </td>
                                </tr>
                            ) : (
                                tuitions.data.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-4 py-3.5">
                                            <div className="space-y-0.5">
                                                <div className="font-extrabold text-sm text-gray-900">
                                                    {item.title}
                                                </div>
                                                {item.school_class && (
                                                    <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                                                        <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                                                        <span>Lớp: {item.school_class.name}</span>
                                                        <span className="font-mono text-gray-400">({item.school_class.code})</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3.5 text-right font-mono font-bold text-gray-900 text-sm">
                                            {formatCurrency(item.total_amount)}
                                        </td>

                                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 text-sm">
                                            {formatCurrency(item.paid_amount)}
                                        </td>

                                        <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-600 text-sm">
                                            {formatCurrency(item.remaining_amount)}
                                        </td>

                                        <td className="px-4 py-3.5 text-center font-mono text-xs text-gray-600">
                                            {item.due_date ? formatDate(item.due_date, '/') : 'Không có'}
                                        </td>

                                        <td className="px-4 py-3.5 text-center">
                                            {getStatusBadge(item.status)}
                                        </td>

                                        <td className="px-4 py-3.5 text-center">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                icon={<Eye className="h-3.5 w-3.5 text-emerald-600" />}
                                                onClick={() => setSelectedTuition(item)}
                                                className="text-xs px-2.5 py-1"
                                            >
                                                <span>Xem {item.payments?.length || item.payments_count || 0} Đợt</span>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {tuitions.total > tuitions.per_page && (
                    <div className="pt-2">
                        <Pagination links={tuitions.links} total={tuitions.total} />
                    </div>
                )}

                {/* Payment History Modal */}
                <Modal
                    isOpen={Boolean(selectedTuition)}
                    onClose={() => setSelectedTuition(null)}
                    title="Lịch Sử Các Đợt Đóng Tiền"
                    maxWidth="2xl"
                    footer={
                        <div className="flex items-center justify-end w-full">
                            <Button variant="secondary" size="sm" onClick={() => setSelectedTuition(null)}>
                                Đóng
                            </Button>
                        </div>
                    }
                >
                    {selectedTuition && (
                        <div className="space-y-4">
                            {/* Summary Box */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <div className="text-2xs font-semibold uppercase text-gray-500">Khoản Thu</div>
                                    <div className="font-extrabold text-gray-900 text-sm">{selectedTuition.title}</div>
                                    {selectedTuition.school_class && (
                                        <div className="text-xs text-gray-500">Lớp: {selectedTuition.school_class.name}</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-2xs font-semibold uppercase text-gray-500">Tổng Tiền / Đã Đóng</div>
                                    <div className="font-bold text-gray-900 font-mono text-xs">
                                        {formatCurrency(selectedTuition.total_amount)}
                                    </div>
                                    <div className="font-bold text-emerald-600 font-mono text-xs">
                                        Đã đóng: {formatCurrency(selectedTuition.paid_amount)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xs font-semibold uppercase text-gray-500">Còn Lại / Trạng Thái</div>
                                    <div className="font-bold text-amber-600 font-mono text-xs">
                                        Còn lại: {formatCurrency(selectedTuition.remaining_amount)}
                                    </div>
                                    <div className="mt-1">{getStatusBadge(selectedTuition.status)}</div>
                                </div>
                            </div>

                            {/* Payment list table */}
                            <div className="rounded-xl border border-gray-200 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200 text-xs">
                                    <thead className="bg-slate-100 text-gray-600 font-bold uppercase text-3xs">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Đợt / Ngày Nộp</th>
                                            <th className="px-3 py-2 text-right">Số Tiền</th>
                                            <th className="px-3 py-2 text-center">Hình Thức</th>
                                            <th className="px-3 py-2 text-left">Mã Giao Dịch</th>
                                            <th className="px-3 py-2 text-left">Người Thu / Ghi Chú</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {!selectedTuition.payments || selectedTuition.payments.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-6 text-center text-gray-400 italic">
                                                    Chưa có đợt đóng tiền nào được ghi nhận.
                                                </td>
                                            </tr>
                                        ) : (
                                            selectedTuition.payments.map((p, idx) => (
                                                <tr key={p.id} className="hover:bg-slate-50/50">
                                                    <td className="px-3 py-2.5">
                                                        <div className="font-bold text-gray-800">Đợt #{idx + 1}</div>
                                                        <div className="font-mono text-2xs text-gray-500">
                                                            {formatDate(p.payment_date, '/')}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700 text-sm">
                                                        {formatCurrency(p.amount)}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center">
                                                        {getPaymentMethodBadge(p.payment_method)}
                                                    </td>
                                                    <td className="px-3 py-2.5 font-mono text-2xs text-gray-600">
                                                        {p.transaction_code || '-'}
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        {p.received_by && (
                                                            <div className="text-2xs font-semibold text-gray-700">
                                                                Thu bởi: {p.received_by}
                                                            </div>
                                                        )}
                                                        {p.note && (
                                                            <div className="text-2xs text-gray-500 italic">
                                                                {p.note}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AppLayout>
    );
}
