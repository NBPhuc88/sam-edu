import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    DollarSign,
    Plus,
    Edit2,
    Trash2,
    Calendar,
    Receipt,
    CreditCard,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    BookOpen,
    Building2,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import AppLayout from '../../../layouts/AppLayout';

interface TuitionPaymentItem {
    id: number;
    student_tuition_id: number;
    amount: number | string;
    payment_date: string;
    payment_method: string;
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

interface ShowProps {
    tuition: {
        id: number;
        center_id: number;
        student_id: number;
        class_id: number;
        title: string | null;
        total_amount: number | string;
        paid_amount: number | string;
        remaining_amount: number | string;
        status: 'pending' | 'partial' | 'completed' | 'overdue';
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
        payments: TuitionPaymentItem[];
    };
}

export const Show: React.FC<ShowProps> = ({ tuition }) => {
    // Add Payment Modal State
    const [addPaymentOpen, setAddPaymentOpen] = useState(false);
    const [addAmount, setAddAmount] = useState<string>(
        String(Math.max(0, Number(tuition.remaining_amount) || 0)),
    );
    const [addDate, setAddDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [addMethod, setAddMethod] = useState<string>('bank_transfer');
    const [addCode, setAddCode] = useState<string>('');
    const [addNote, setAddNote] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);

    // Edit Payment Modal State
    const [editPaymentOpen, setEditPaymentOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<TuitionPaymentItem | null>(null);
    const [editAmount, setEditAmount] = useState<string>('');
    const [editDate, setEditDate] = useState<string>('');
    const [editMethod, setEditMethod] = useState<string>('bank_transfer');
    const [editCode, setEditCode] = useState<string>('');
    const [editNote, setEditNote] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);

    // Delete Payment Modal State
    const [deletePaymentOpen, setDeletePaymentOpen] = useState(false);
    const [deletingPayment, setDeletingPayment] = useState<TuitionPaymentItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(Number(amount) || 0);
    };

    const getPaymentMethodLabel = (method: string) => {
        switch (method) {
            case 'cash':
                return 'Tiền mặt';
            case 'bank_transfer':
                return 'Chuyển khoản NH';
            case 'momo':
                return 'Ví MoMo';
            case 'zalopay':
                return 'Ví ZaloPay';
            case 'credit_card':
                return 'Thẻ tín dụng';
            case 'other':
            default:
                return 'Khác';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge variant="active">Đã hoàn thành</Badge>;
            case 'partial':
                return <Badge variant="pending">Còn nợ</Badge>;
            case 'overdue':
                return <Badge variant="danger">Quá hạn</Badge>;
            case 'pending':
            default:
                return <Badge variant="expired">Chưa đóng</Badge>;
        }
    };

    const total = Number(tuition.total_amount) || 0;
    const paid = Number(tuition.paid_amount) || 0;
    const remaining = Number(tuition.remaining_amount) || 0;
    const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

    // Handle submit Add Payment
    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
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
        if (!editingPayment) return;
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
        if (!deletingPayment) return;
        setIsDeleting(true);

        router.delete(`/tuitions/payments/${deletingPayment.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeletePaymentOpen(false);
                setDeletingPayment(null);
            },
        });
    };

    return (
        <AppLayout title="Chi Tiết Hồ Sơ Học Phí - Giáo Dục Sam">
            <Head title="Chi Tiết Hồ Sơ Học Phí" />

            <div className="space-y-6">
                {/* Top Action Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/tuitions">
                            <Button variant="secondary" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-gray-900">
                                    Hồ Sơ Học Phí: {tuition.student?.full_name}
                                </h1>
                                {getStatusBadge(tuition.status)}
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Lớp: <strong>{tuition.school_class?.name}</strong> • Trung tâm: <strong>{tuition.center?.name}</strong>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={`/tuitions/${tuition.id}/edit`}>
                            <Button variant="edit" size="sm" icon={<Edit2 className="h-3.5 w-3.5" />}>
                                Chỉnh Sửa Hồ Sơ
                            </Button>
                        </Link>
                        <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                                setAddAmount(String(Math.max(0, remaining)));
                                setAddPaymentOpen(true);
                            }}
                            icon={<Plus className="h-3.5 w-3.5" />}
                        >
                            Thu Tiền Đợt Mới
                        </Button>
                    </div>
                </div>

                {/* 3 Summary Money Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <Card className="border-l-4 border-l-blue-500 bg-white p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Tổng Học Phí Cần Đóng
                        </p>
                        <h3 className="mt-1 text-2xl font-extrabold text-gray-900">
                            {formatCurrency(total)}
                        </h3>
                        <div className="mt-2 text-xs text-gray-400">
                            Hạn đóng: <span className="font-mono font-medium text-gray-700">{tuition.due_date || 'Không có'}</span>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 bg-white p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                            Đã Đóng Thực Tế
                        </p>
                        <h3 className="mt-1 text-2xl font-extrabold text-emerald-700">
                            {formatCurrency(paid)}
                        </h3>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                            <span>{tuition.payments.length} đợt đóng</span>
                            <span className="font-bold text-emerald-800">{percent}%</span>
                        </div>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 bg-white p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                            Số Tiền Còn Nợ
                        </p>
                        <h3 className="mt-1 text-2xl font-extrabold text-amber-700">
                            {formatCurrency(remaining)}
                        </h3>
                        <div className="mt-2 text-xs text-gray-400">
                            Trạng thái: <span className="font-medium text-gray-700">{remaining === 0 ? 'Đã hoàn thành' : 'Còn thiếu'}</span>
                        </div>
                    </Card>
                </div>

                {/* Progress Bar & Profile Detail Grid */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left: Student & Tuition Info */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs lg:col-span-1">
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-900">
                            Thông Tin Học Sinh & Khóa Học
                        </h2>
                        <div className="space-y-3 text-xs">
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Họ và tên:</span>
                                <span className="font-bold text-gray-900">{tuition.student?.full_name}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Mã học sinh:</span>
                                <span className="font-mono font-semibold text-emerald-700">{tuition.student?.student_code}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Số điện thoại:</span>
                                <span className="font-medium text-gray-800">{tuition.student?.phone || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Phụ huynh:</span>
                                <span className="font-medium text-gray-800">
                                    {tuition.student?.parent_name ? `${tuition.student.parent_name} (${tuition.student.parent_phone || ''})` : 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Lớp học:</span>
                                <span className="font-bold text-gray-900">{tuition.school_class?.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Trung tâm:</span>
                                <span className="font-medium text-gray-800">{tuition.center?.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Tiêu đề khoản thu:</span>
                                <span className="font-medium text-gray-900">{tuition.title || 'Học phí lớp học'}</span>
                            </div>
                            {tuition.note && (
                                <div className="pt-1">
                                    <span className="text-gray-500">Ghi chú:</span>
                                    <p className="mt-1 rounded-lg bg-gray-50 p-2.5 text-gray-700 italic">
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
                                    <Receipt className="h-4 w-4 text-emerald-600" />
                                    Lịch Sử Các Đợt Thu Tiền ({tuition.payments.length} đợt)
                                </h2>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    Danh sách các lần nộp tiền học phí của học sinh cho khóa học này.
                                </p>
                            </div>
                            <Button
                                variant="success"
                                size="sm"
                                onClick={() => {
                                    setAddAmount(String(Math.max(0, remaining)));
                                    setAddPaymentOpen(true);
                                }}
                                icon={<Plus className="h-3.5 w-3.5" />}
                            >
                                Thu Đợt Mới
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-gray-600">
                                <thead className="border-b border-gray-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-gray-700">
                                    <tr>
                                        <th className="px-4 py-3">Đợt</th>
                                        <th className="px-4 py-3">Ngày Thu</th>
                                        <th className="px-4 py-3">Số Tiền</th>
                                        <th className="px-4 py-3">Hình Thức</th>
                                        <th className="px-4 py-3">Mã Phiếu / GD</th>
                                        <th className="px-4 py-3">Ghi Chú</th>
                                        <th className="px-4 py-3 text-right">Thao Tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {tuition.payments && tuition.payments.length > 0 ? (
                                        tuition.payments.map((p, index) => (
                                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-4 py-3 font-bold text-gray-900">
                                                    Đợt {tuition.payments.length - index}
                                                </td>
                                                <td className="px-4 py-3 font-mono font-medium text-gray-700">
                                                    {p.payment_date}
                                                </td>
                                                <td className="px-4 py-3 font-extrabold text-emerald-700">
                                                    {formatCurrency(p.amount)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-800">
                                                        {getPaymentMethodLabel(p.payment_method)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[11px] text-gray-600">
                                                    {p.transaction_code || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500">
                                                    {p.note || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => openEditModal(p)}
                                                            className="rounded-md p-1 text-gray-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                                            title="Sửa đợt đóng"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => openDeletePaymentModal(p)}
                                                            className="rounded-md p-1 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                            title="Xóa đợt đóng"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-400">
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
                <form onSubmit={handleAddPayment} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                            Số Tiền Thu Đợt Này (VNĐ) (*)
                        </label>
                        <Input
                            type="number"
                            min="1000"
                            step="1000"
                            value={addAmount}
                            onChange={(e) => setAddAmount(e.target.value)}
                            placeholder="Nhập số tiền thu..."
                            required
                        />
                        {remaining > 0 && (
                            <p className="mt-1 text-[11px] text-gray-500">
                                Số tiền còn nợ hiện tại: <strong>{formatCurrency(remaining)}</strong>
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                            Ngày Thu Tiền (*)
                        </label>
                        <Input
                            type="date"
                            value={addDate}
                            onChange={(e) => setAddDate(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                            Hình Thức Thanh Toán (*)
                        </label>
                        <select
                            value={addMethod}
                            onChange={(e) => setAddMethod(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                            <option value="cash">Tiền mặt</option>
                            <option value="momo">Ví MoMo</option>
                            <option value="zalopay">Ví ZaloPay</option>
                            <option value="credit_card">Thẻ tín dụng / Quẹt thẻ</option>
                            <option value="other">Khác</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                            Mã Phiếu Thu / Mã Giao Dịch
                        </label>
                        <Input
                            value={addCode}
                            onChange={(e) => setAddCode(e.target.value)}
                            placeholder="VD: PT-20260110-01"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                            Ghi Chú Đợt Thu
                        </label>
                        <Input
                            value={addNote}
                            onChange={(e) => setAddNote(e.target.value)}
                            placeholder="VD: Đợt 2 - Thu bổ sung trước kỳ thi"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
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
                            icon={<CheckCircle2 className="h-4 w-4" />}
                        >
                            Xác Nhận Thu Tiền
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal 2: Chỉnh Sửa Đợt Thu Tiền */}
            <Modal
                isOpen={editPaymentOpen}
                onClose={() => setEditPaymentOpen(false)}
                title="Chỉnh Sửa Đợt Thu Tiền"
            >
                <form onSubmit={handleEditPayment} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                            Số Tiền Thu (VNĐ) (*)
                        </label>
                        <Input
                            type="number"
                            min="1000"
                            step="1000"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                            Ngày Thu Tiền (*)
                        </label>
                        <Input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                            Hình Thức Thanh Toán (*)
                        </label>
                        <select
                            value={editMethod}
                            onChange={(e) => setEditMethod(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                            <option value="cash">Tiền mặt</option>
                            <option value="momo">Ví MoMo</option>
                            <option value="zalopay">Ví ZaloPay</option>
                            <option value="credit_card">Thẻ tín dụng / Quẹt thẻ</option>
                            <option value="other">Khác</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                            Mã Phiếu Thu / Mã Giao Dịch
                        </label>
                        <Input
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                            Ghi Chú Đợt Thu
                        </label>
                        <Input
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
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
                            icon={<Edit2 className="h-4 w-4" />}
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
                            icon={<Trash2 className="h-4 w-4" />}
                        >
                            Xác Nhận Xóa
                        </Button>
                    </>
                }
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="h-6 w-6 shrink-0" />
                        <p className="text-sm font-semibold">
                            Bạn có chắc chắn muốn xóa đợt thu {formatCurrency(deletingPayment?.amount || 0)} ngày {deletingPayment?.payment_date}?
                        </p>
                    </div>
                    <p className="text-xs text-gray-500">
                        Tổng tiền đã đóng và số tiền còn nợ của học sinh sẽ tự động được tính toán lại sau khi xóa.
                    </p>
                </div>
            </Modal>
        </AppLayout>
    );
};

export default Show;
