import DeleteConfirmModal from '@/components/common/DeleteConfirmModal';
import BackButton from '@/components/ui/BackButton';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AppLayout from '@/layouts/AppLayout';
import { Head,Link,router } from '@inertiajs/react';
import {
AlertCircle,
BookOpen,
CheckCircle2,
Edit2,
Plus,
Receipt,
Trash2,
} from 'lucide-react';
import React,{ useState } from 'react';

import {
    DISCOUNT_TYPE_DIRECT,
    DISCOUNT_TYPE_PERCENTAGE,
    PAYMENT_METHOD_BANK_TRANSFER,
    PAYMENT_METHOD_LABELS,
    PAYMENT_METHOD_OPTIONS,
    TUITION_STATUS_OVERDUE,
    TUITION_STATUS_PAID,
    TUITION_STATUS_PARTIAL,
    TUITION_STATUS_PENDING,
} from '@/constants/enums';
import { usePermission } from '@/hooks/usePermission';

interface TuitionPaymentItem {
    id: number;
    student_tuition_id: number;
    amount: number;
    payment_date: string;
    payment_method: number;
    transaction_code: string | null;
    note: string | null;
    received_by: number | null;
    receiver?: {
        id: number;
        username: string;
        full_name: string;
    };
    created_at: string;
}

interface StudentClassTuitionItem {
    id: number;
    center_id: number;
    student_id: number;
    class_id: number;
    title: string | null;
    total_amount: number;
    discount_type?: number | null;
    discount_value?: number | string | null;
    paid_amount: number;
    remaining_amount: number;
    status: number;
    due_date: string | null;
    payments_count?: number;
    school_class?: {
        id: number;
        name: string;
        code: string;
    };
}

interface ShowProps {
    tuition: {
        id: number;
        center_id: number;
        student_id: number;
        class_id: number;
        title: string | null;
        total_amount: number;
        discount_type?: number | null;
        discount_value?: number | string | null;
        paid_amount: number;
        remaining_amount: number;
        status: number;
        due_date: string | null;
        note: string | null;
        created_at: string;
        student?: {
            id: number;
            full_name: string;
            student_code: string;
            phone: string | null;
            email: string | null;
            parent_name: string | null;
            parent_phone: string | null;
            tuitions?: StudentClassTuitionItem[];
        };
        school_class?: {
            id: number;
            name: string;
            code: string;
        };
        center?: {
            id: number;
            name: string;
            code: string;
        };
        creator?: {
            id: number;
            username: string;
            full_name: string;
        };
        payments?: TuitionPaymentItem[];
    };
    errors?: Record<string, string>;
}

export const Show: React.FC<ShowProps> = ({ tuition, errors = {} }) => {
    const { can } = usePermission();
    // Add Payment Modal State
    const [addPaymentOpen, setAddPaymentOpen] = useState(false);
    const [addAmount, setAddAmount] = useState<string>(
        String(Math.max(0, Number(tuition.remaining_amount) || 0)),
    );
    const [addDate, setAddDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [addMethod, setAddMethod] = useState<number>(PAYMENT_METHOD_BANK_TRANSFER);
    const [addCode, setAddCode] = useState<string>('');
    const [addNote, setAddNote] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);

    // Edit Payment Modal State
    const [editPaymentOpen, setEditPaymentOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<TuitionPaymentItem | null>(null);
    const [editAmount, setEditAmount] = useState<string>('');
    const [editDate, setEditDate] = useState<string>('');
    const [editMethod, setEditMethod] = useState<number>(PAYMENT_METHOD_BANK_TRANSFER);
    const [editCode, setEditCode] = useState<string>('');
    const [editNote, setEditNote] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);

    // Delete Payment Modal State
    const [deletePaymentOpen, setDeletePaymentOpen] = useState(false);
    const [deletingPayment, setDeletingPayment] = useState<TuitionPaymentItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Delete Tuition Modal State
    const [deleteTuitionModalOpen, setDeleteTuitionModalOpen] = useState(false);
    const [deletingTuitionTarget, setDeletingTuitionTarget] = useState<StudentClassTuitionItem | null>(null);
    const [isDeletingTuition, setIsDeletingTuition] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const getPaymentMethodLabel = (method: number) => {
        return PAYMENT_METHOD_LABELS[method] || 'Khác';
    };

    const getStatusBadge = (status: number) => {
        if (status === TUITION_STATUS_PAID) {
            return <Badge variant="active">Đã hoàn thành</Badge>;
        }
        if (status === TUITION_STATUS_PARTIAL) {
            return <Badge variant="pending">Còn nợ</Badge>;
        }
        if (status === TUITION_STATUS_OVERDUE) {
            return <Badge variant="danger">Quá hạn</Badge>;
        }
        return <Badge variant="expired">Chưa đóng</Badge>;
    };

    const total = Number(tuition.total_amount) || 0;
    const paid = Number(tuition.paid_amount) || 0;
    const remaining = Number(tuition.remaining_amount) || 0;
    const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

    const allStudentTuitions: StudentClassTuitionItem[] =
        tuition.student?.tuitions && tuition.student.tuitions.length > 0
            ? tuition.student.tuitions
            : [tuition];

    const allTotalAmount = allStudentTuitions.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
    const allPaidAmount = allStudentTuitions.reduce((sum, item) => sum + (Number(item.paid_amount) || 0), 0);
    const allRemainingAmount = allStudentTuitions.reduce((sum, item) => sum + (Number(item.remaining_amount) || 0), 0);
    const allPercent = allTotalAmount > 0 ? Math.min(100, Math.round((allPaidAmount / allTotalAmount) * 100)) : 0;

    const isAddAmountExceeded = remaining > 0 && Number(addAmount) > remaining;
    const isAddAmountInvalid = Number(addAmount) <= 0 || isAddAmountExceeded || remaining <= 0;

    const otherPaymentsTotal = paid - (editingPayment ? Number(editingPayment.amount) : 0);
    const maxEditAllowed = Math.max(0, total - otherPaymentsTotal);
    const isEditAmountExceeded = Number(editAmount) > maxEditAllowed;
    const isEditAmountInvalid = Number(editAmount) <= 0 || isEditAmountExceeded;

    // Handle submit Add Payment
    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();

        if (isAddAmountInvalid) {
            return;
        }

        setIsAdding(true);

        router.post(
            `/tuitions/${tuition.id}/payments`,
            {
                amount: Number(addAmount),
                payment_date: addDate,
                payment_method: addMethod,
                transaction_code: addCode || null,
                note: addNote || null,
            },
            {
                onFinish: () => {
                    setIsAdding(false);
                    setAddPaymentOpen(false);
                    setAddCode('');
                    setAddNote('');
                },
            },
        );
    };

    // Open Edit Payment Modal
    const openEditModal = (payment: TuitionPaymentItem) => {
        setEditingPayment(payment);
        setEditAmount(String(payment.amount));
        setEditDate(payment.payment_date);
        setEditMethod(payment.payment_method);
        setEditCode(payment.transaction_code || '');
        setEditNote(payment.note || '');
        setEditPaymentOpen(true);
    };

    // Handle submit Edit Payment
    const handleEditPayment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingPayment || isEditAmountInvalid) {
            return;
        }

        setIsEditing(true);

        router.patch(
            `/tuitions/payments/${editingPayment.id}`,
            {
                amount: Number(editAmount),
                payment_date: editDate,
                payment_method: editMethod,
                transaction_code: editCode || null,
                note: editNote || null,
            },
            {
                onFinish: () => {
                    setIsEditing(false);
                    setEditPaymentOpen(false);
                    setEditingPayment(null);
                },
            },
        );
    };

    // Open Delete Payment Modal
    const openDeletePaymentModal = (payment: TuitionPaymentItem) => {
        setDeletingPayment(payment);
        setDeletePaymentOpen(true);
    };

    // Handle confirm Delete Payment
    const handleConfirmDeletePayment = () => {
        if (!deletingPayment) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/tuitions/payments/${deletingPayment.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeletePaymentOpen(false);
                setDeletingPayment(null);
            },
        });
    };

    // Open Delete Tuition Modal
    const openDeleteTuitionModal = (item: StudentClassTuitionItem) => {
        setDeletingTuitionTarget(item);
        setDeleteTuitionModalOpen(true);
    };

    // Handle confirm Delete Tuition
    const handleConfirmDeleteTuition = () => {
        if (!deletingTuitionTarget) {
            return;
        }

        setIsDeletingTuition(true);

        router.delete(`/tuitions/${deletingTuitionTarget.id}`, {
            onFinish: () => {
                setIsDeletingTuition(false);
                setDeleteTuitionModalOpen(false);
                setDeletingTuitionTarget(null);
            },
        });
    };

    return (
        <AppLayout title="Chi Tiết Hồ Sơ Học Phí - SAM Digital">
            <Head title="Chi Tiết Hồ Sơ Học Phí" />

            <div className="space-y-6">
                {/* Top Action Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <BackButton fallbackUrl="/tuitions" size="md" />
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Hồ Sơ Học Phí: {tuition.student?.full_name}
                                </h1>
                                {getStatusBadge(tuition.status)}
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                Lớp đang xem: <strong className="text-blue-700">{tuition.school_class?.name}</strong> ({tuition.school_class?.code}) • Trung tâm: <strong>{tuition.center?.name}</strong>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {can('tuitions.payments') && (
                            <Button
                                variant="success"
                                size="md"
                                onClick={() => {
                                    setAddAmount(String(Math.max(0, remaining)));
                                    setAddPaymentOpen(true);
                                }}
                                icon={<Plus className="h-4.5 w-4.5" />}
                            >
                                Thu Tiền Đợt Mới
                            </Button>
                        )}
                    </div>
                </div>

                {/* 3 Summary Money Cards (Tổng tất cả các lớp của học sinh) */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <Card className="border-l-4 border-l-blue-500 bg-white p-6 shadow-xs">
                        <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                            Tổng Học Phí (Tất Cả Các Lớp)
                        </p>
                        <h3 className="mt-1.5 text-2xl font-extrabold text-gray-900">
                            {formatCurrency(allTotalAmount)}
                        </h3>
                        <div className="mt-2 text-xs text-gray-400">
                            Tổng cộng: <span className="font-mono font-medium text-gray-700">{allStudentTuitions.length} lớp học</span>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 bg-white p-6 shadow-xs">
                        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                            Đã Đóng Thực Tế (Tất Cả Lớp)
                        </p>
                        <h3 className="mt-1.5 text-2xl font-extrabold text-emerald-700">
                            {formatCurrency(allPaidAmount)}
                        </h3>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>Tỉ lệ hoàn thành</span>
                            <span className="font-bold text-emerald-800">{allPercent}%</span>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 bg-white p-6 shadow-xs">
                        <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">
                            Tổng Còn Nợ (Tất Cả Lớp)
                        </p>
                        <h3 className="mt-1.5 text-2xl font-extrabold text-amber-700">
                            {formatCurrency(allRemainingAmount)}
                        </h3>
                        <div className="mt-2 text-xs text-gray-400">
                            Trạng thái: <span className="font-medium text-gray-700">{allRemainingAmount <= 0 ? 'Đã hoàn tất tất cả lớp' : 'Còn dư nợ'}</span>
                        </div>
                    </Card>
                </div>

                {/* Danh Sách Học Phí Theo Từng Lớp Của Học Sinh */}
                {allStudentTuitions.length > 0 && (
                    <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                        <div className="border-b border-gray-200 bg-slate-50 px-6 py-4">
                            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                                <BookOpen className="h-4.5 w-4.5 text-blue-600" />
                                Danh Sách Học Phí Theo Từng Lớp ({allStudentTuitions.length} lớp)
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="border-b border-gray-200 bg-gray-50/50 text-xs font-bold uppercase tracking-wider text-gray-700">
                                    <tr>
                                        <th className="px-6 py-3">Mã Lớp</th>
                                        <th className="px-6 py-3">Tên Lớp Học</th>
                                        <th className="px-6 py-3">Tổng Học Phí</th>
                                        <th className="px-6 py-3">Đã Đóng</th>
                                        <th className="px-6 py-3">Còn Nợ</th>
                                        <th className="px-6 py-3">Trạng Thái</th>
                                        <th className="px-6 py-3 text-right">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {allStudentTuitions.map((st) => {
                                        const isCurrent = Number(st.id) === Number(tuition.id);
                                        const cTotal = Number(st.total_amount) || 0;
                                        const cPaid = Number(st.paid_amount) || 0;
                                        const cRemaining = Number(st.remaining_amount) || 0;

                                        return (
                                            <tr
                                                key={st.id}
                                                className={`transition-colors ${isCurrent ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50/80'}`}
                                            >
                                                <td className="px-6 py-3.5">
                                                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                                                        {st.school_class?.code || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3.5 font-semibold text-gray-900">
                                                    {st.school_class?.name || st.title || 'Lớp học'}
                                                </td>
                                                <td className="px-6 py-3.5 font-bold text-gray-900">
                                                    {formatCurrency(cTotal)}
                                                </td>
                                                <td className="px-6 py-3.5 font-bold text-emerald-700">
                                                    {formatCurrency(cPaid)}
                                                </td>
                                                <td className="px-6 py-3.5 font-bold text-amber-700">
                                                    {cRemaining > 0 ? (
                                                        formatCurrency(cRemaining)
                                                    ) : (
                                                        <span className="font-semibold text-emerald-600">Đã đủ</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3.5">
                                                    {getStatusBadge(Number(st.status))}
                                                </td>
                                                <td className="px-6 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!isCurrent && (
                                                            <Link href={`/tuitions/${st.id}`}>
                                                                <Button
                                                                    variant="success"
                                                                    size="sm"
                                                                    title="Xem lịch sử đóng tiền lớp này"
                                                                >
                                                                    Xem đợt thu
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {can('tuitions.edit') && (
                                                            <Link href={`/tuitions/${st.id}/edit`}>
                                                                <Button
                                                                    variant="edit"
                                                                    size="sm"
                                                                    icon={<Edit2 className="h-3.5 w-3.5" />}
                                                                    title={`Sửa học phí lớp ${st.school_class?.name || ''}`}
                                                                >
                                                                    Sửa
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {can('tuitions.delete') && (
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                icon={<Trash2 className="h-3.5 w-3.5" />}
                                                                title={`Xóa học phí lớp ${st.school_class?.name || ''}`}
                                                                onClick={() => openDeleteTuitionModal(st)}
                                                            >
                                                                Xóa
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {/* Progress Bar & Profile Detail Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left: Student & Tuition Info */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs lg:col-span-1">
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-900">
                            Thông Tin Học Sinh & Khóa Học
                        </h2>
                        <div className="space-y-3.5 text-sm">
                            <div className="flex justify-between border-b border-gray-100 pb-2.5">
                                <span className="text-gray-500">Họ và tên:</span>
                                <span className="font-bold text-gray-900">{tuition.student?.full_name}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2.5">
                                <span className="text-gray-500">Mã học sinh:</span>
                                <span className="font-mono font-semibold text-emerald-700">{tuition.student?.student_code}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2.5">
                                <span className="text-gray-500">Số điện thoại:</span>
                                <span className="font-medium text-gray-800">{tuition.student?.phone || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2.5">
                                <span className="text-gray-500">Phụ huynh:</span>
                                <span className="font-medium text-gray-800">
                                    {tuition.student?.parent_name ? `${tuition.student.parent_name} (${tuition.student.parent_phone || ''})` : 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2.5">
                                <span className="text-gray-500">Lớp học:</span>
                                <span className="font-bold text-gray-900">{tuition.school_class?.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2.5">
                                <span className="text-gray-500">Trung tâm:</span>
                                <span className="font-medium text-gray-800">{tuition.center?.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2.5">
                                <span className="text-gray-500">Tiêu đề khoản thu:</span>
                                <span className="font-medium text-gray-900">{tuition.title || 'Học phí lớp học'}</span>
                            </div>
                            {tuition.discount_type && (
                                <div className="flex justify-between border-b border-gray-100 pb-2.5">
                                    <span className="text-gray-500">Ưu đãi / Giảm giá:</span>
                                    <span className="font-bold text-amber-700">
                                        {Number(tuition.discount_type) === DISCOUNT_TYPE_DIRECT
                                            ? `Giảm ${formatCurrency(Number(tuition.discount_value))}`
                                            : `Giảm ${Number(tuition.discount_value)}%`}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between border-b border-gray-100 pb-2.5">
                                <span className="text-gray-500">Người tạo hồ sơ:</span>
                                <span className="font-medium text-gray-900">{tuition.creator?.full_name || tuition.creator?.username || '—'}</span>
                            </div>
                            {tuition.note && (
                                <div className="pt-1">
                                    <span className="text-gray-500">Ghi chú:</span>
                                    <p className="mt-1.5 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 italic">
                                        "{tuition.note}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Right: Payment Installments Table */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs lg:col-span-2">
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900">
                                    <Receipt className="h-4.5 w-4.5 text-emerald-600" />
                                    Lịch Sử Các Đợt Thu Tiền ({tuition.payments?.length ?? 0} đợt)
                                </h2>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Danh sách các lần nộp tiền học phí của học sinh cho khóa học này.
                                </p>
                            </div>
                            {can('tuitions.payments') && (
                                <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => {
                                        setAddAmount(String(Math.max(0, remaining)));
                                        setAddPaymentOpen(true);
                                    }}
                                    icon={<Plus className="h-4 w-4" />}
                                >
                                    Thu Đợt Mới
                                </Button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="border-b border-gray-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-700">
                                    <tr>
                                        <th className="px-4 py-3.5">Đợt</th>
                                        <th className="px-4 py-3.5">Ngày Thu</th>
                                        <th className="px-4 py-3.5">Số Tiền</th>
                                        <th className="px-4 py-3.5">Hình Thức</th>
                                        <th className="px-4 py-3.5">Mã Phiếu / GD</th>
                                        <th className="px-4 py-3.5">Admin Thu Tiền</th>
                                        <th className="px-4 py-3.5">Ghi Chú</th>
                                        {(can('tuitions.edit') || can('tuitions.delete')) && (
                                            <th className="px-4 py-3.5 text-right">Thao Tác</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {tuition.payments && tuition.payments.length > 0 ? (
                                        tuition.payments.map((p, index) => (
                                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-4 py-3.5 font-bold text-gray-900">
                                                    Đợt {(tuition.payments?.length ?? 0) - index}
                                                </td>
                                                <td className="px-4 py-3.5 font-mono font-medium text-gray-700">
                                                    {p.payment_date}
                                                </td>
                                                <td className="px-4 py-3.5 font-extrabold text-emerald-700">
                                                    {formatCurrency(p.amount)}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="inline-flex rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800">
                                                        {getPaymentMethodLabel(p.payment_method)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 font-mono text-xs text-gray-600">
                                                    {p.transaction_code || '-'}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs font-medium text-gray-800">
                                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 border border-slate-200">
                                                        {p.receiver?.full_name || p.receiver?.username || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-gray-500 text-xs">
                                                    {p.note || '-'}
                                                </td>
                                                {(can('tuitions.edit') || can('tuitions.delete')) && (
                                                    <td className="px-4 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            {can('tuitions.edit') && (
                                                                <button
                                                                    onClick={() => openEditModal(p)}
                                                                    className="rounded-md p-1.5 text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                                                    title="Sửa đợt đóng"
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            {can('tuitions.delete') && (
                                                                <button
                                                                    onClick={() => openDeletePaymentModal(p)}
                                                                    className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                    title="Xóa đợt đóng"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={can('tuitions.edit') || can('tuitions.delete') ? 7 : 6} className="px-4 py-8 text-center text-sm text-gray-400">
                                                Chưa có đợt thu học phí nào được ghi nhận. Bấm <strong>"Thu Đợt Mới"</strong> để ghi nhận tiền đã nộp.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal 1: Thu Tiền Đợt Mới */}
            <Modal
                isOpen={addPaymentOpen}
                onClose={() => setAddPaymentOpen(false)}
                title="Ghi Nhận Thu Tiền Đợt Mới"
            >
                {remaining <= 0 ? (
                    <div className="space-y-4 py-2">
                        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                            <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
                            <div>
                                <h4 className="font-bold">Hồ sơ học phí đã hoàn tất</h4>
                                <p className="mt-0.5 text-xs text-emerald-700">
                                    Học sinh đã thanh toán đủ 100% tổng học phí ({formatCurrency(total)}). Không còn số dư cần đóng.
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                onClick={() => setAddPaymentOpen(false)}
                            >
                                Đóng
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleAddPayment} className="space-y-4">
                        <div>
                            <div className="mb-1.5 flex items-center justify-between">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Số Tiền Thu Đợt Này (VNĐ) (*)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setAddAmount(String(remaining))}
                                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                                >
                                    Đóng toàn bộ còn lại
                                </button>
                            </div>
                            <Input
                                type="number"
                                min="1000"
                                max={remaining}
                                step="1000"
                                value={addAmount}
                                onChange={(e) => setAddAmount(e.target.value)}
                                placeholder="Nhập số tiền thu..."
                                className={`!py-2.5 !text-sm ${isAddAmountExceeded ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                required
                            />
                            {isAddAmountExceeded ? (
                                <p className="mt-1 text-xs font-semibold text-red-600">
                                    Số tiền đóng ({formatCurrency(Number(addAmount))}) không được vượt quá số tiền còn nợ ({formatCurrency(remaining)}).
                                </p>
                            ) : (
                                <p className="mt-1 text-xs text-gray-500">
                                    Số tiền còn nợ hiện tại: <strong className="text-gray-800">{formatCurrency(remaining)}</strong>
                                </p>
                            )}
                            {errors?.amount && (
                                <p className="mt-1 text-xs font-medium text-red-600">{errors.amount}</p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                Ngày Thu Tiền (*)
                            </label>
                            <DatePicker
                                value={addDate}
                                onChange={(val) => setAddDate(val)}
                                className="!py-2.5 !text-sm w-full"
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                Hình Thức Thanh Toán (*)
                            </label>
                            <select
                                value={addMethod}
                                onChange={(e) => setAddMethod(Number(e.target.value))}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            >
                                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                Mã Phiếu Thu / Mã Giao Dịch
                            </label>
                            <Input
                                value={addCode}
                                onChange={(e) => setAddCode(e.target.value)}
                                placeholder="VD: PT-20260110-01"
                                className="!py-2.5 !text-sm"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                                Ghi Chú Đợt Thu
                            </label>
                            <Input
                                value={addNote}
                                onChange={(e) => setAddNote(e.target.value)}
                                placeholder="VD: Đợt 2 - Thu bổ sung trước kỳ thi"
                                className="!py-2.5 !text-sm"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                onClick={() => setAddPaymentOpen(false)}
                                disabled={isAdding}
                            >
                                Hủy Bỏ
                            </Button>
                            <Button
                                type="submit"
                                variant="success"
                                size="md"
                                isLoading={isAdding}
                                disabled={isAdding || isAddAmountInvalid}
                                icon={<CheckCircle2 className="h-4.5 w-4.5" />}
                            >
                                Xác Nhận Thu Tiền
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal 2: Chỉnh Sửa Đợt Thu Tiền */}
            <Modal
                isOpen={editPaymentOpen}
                onClose={() => setEditPaymentOpen(false)}
                title="Chỉnh Sửa Đợt Thu Tiền"
            >
                <form onSubmit={handleEditPayment} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Số Tiền Thu (VNĐ) (*)
                        </label>
                        <Input
                            type="number"
                            min="1000"
                            max={maxEditAllowed}
                            step="1000"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className={`!py-2.5 !text-sm ${isEditAmountExceeded ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                            required
                        />
                        {isEditAmountExceeded ? (
                            <p className="mt-1 text-xs font-semibold text-red-600">
                                Số tiền đóng ({formatCurrency(Number(editAmount))}) vượt quá số tiền tối đa cho phép ({formatCurrency(maxEditAllowed)}).
                            </p>
                        ) : (
                            <p className="mt-1 text-xs text-gray-500">
                                Số tiền tối đa có thể nhập cho đợt này: <strong className="text-gray-800">{formatCurrency(maxEditAllowed)}</strong>
                            </p>
                        )}
                        {errors?.amount && (
                            <p className="mt-1 text-xs font-medium text-red-600">{errors.amount}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Ngày Thu Tiền (*)
                        </label>
                        <DatePicker
                            value={editDate}
                            onChange={(val) => setEditDate(val)}
                            className="!py-2.5 !text-sm w-full"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Hình Thức Thanh Toán (*)
                        </label>
                        <select
                            value={editMethod}
                            onChange={(e) => setEditMethod(Number(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        >
                            {PAYMENT_METHOD_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Mã Phiếu Thu / Mã Giao Dịch
                        </label>
                        <Input
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            className="!py-2.5 !text-sm"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                            Ghi Chú Đợt Thu
                        </label>
                        <Input
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="!py-2.5 !text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            onClick={() => setEditPaymentOpen(false)}
                            disabled={isEditing}
                        >
                            Hủy Bỏ
                        </Button>
                        <Button
                            type="submit"
                            variant="edit"
                            size="md"
                            isLoading={isEditing}
                            disabled={isEditing || isEditAmountInvalid}
                            icon={<Edit2 className="h-4.5 w-4.5" />}
                        >
                            Lưu Thay Đổi
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal 3: Xác Nhận Xóa Đợt Thu */}
            <Modal
                isOpen={deletePaymentOpen}
                onClose={() => setDeletePaymentOpen(false)}
                title="Xác Nhận Xóa Đợt Thu Tiền"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => setDeletePaymentOpen(false)}
                            disabled={isDeleting}
                        >
                            Hủy Bỏ
                        </Button>
                        <Button
                            variant="danger"
                            size="md"
                            onClick={handleConfirmDeletePayment}
                            isLoading={isDeleting}
                            icon={<Trash2 className="h-4.5 w-4.5" />}
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
                            Bạn có chắc chắn muốn xóa đợt thu {formatCurrency(deletingPayment?.amount || 0)} ngày {deletingPayment?.payment_date}?
                        </p>
                    </div>
                    <p className="text-sm text-gray-500">
                        Tổng tiền đã đóng và số tiền còn nợ của học sinh sẽ tự động được tính toán lại sau khi xóa.
                    </p>
                </div>
            </Modal>

            {/* Modal 4: Xác Nhận Xóa Hồ Sơ Học Phí Lớp Học */}
            <DeleteConfirmModal
                isOpen={deleteTuitionModalOpen}
                onClose={() => setDeleteTuitionModalOpen(false)}
                onConfirm={handleConfirmDeleteTuition}
                entity="tuitions"
                entityId={deletingTuitionTarget?.id || null}
                entityName={`hồ sơ học phí lớp "${deletingTuitionTarget?.school_class?.name || deletingTuitionTarget?.title || ''}" của học sinh "${tuition.student?.full_name || ''}"`}
                isDeleting={isDeletingTuition}
            />
        </AppLayout>
    );
};

export default Show;
