import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import ScrollableSelect from '@/components/ui/ScrollableSelect';
import {
    DISCOUNT_TYPE_DIRECT,
    DISCOUNT_TYPE_PERCENTAGE,
    PAYMENT_METHOD_BANK_TRANSFER,
    PAYMENT_METHOD_OPTIONS,
} from '@/constants/enums';
import { usePermission } from '@/hooks/usePermission';
import AppLayout from '@/layouts/AppLayout';
import { Head,router,usePage } from '@inertiajs/react';
import {
DollarSign,
Receipt,
Save,
} from 'lucide-react';
import React,{ useState } from 'react';

interface CenterItem {
    id: number;
    name: string;
    code: string;
}

interface ClassItem {
    id: number;
    name: string;
    code: string;
    center_id: number;
    total_tuition_fee?: number | string | null;
    students?: StudentItem[];
}

interface StudentItem {
    id: number;
    full_name: string;
    student_code: string;
    phone: string | null;
    center_id: number;
}

interface CreateProps {
    centers: CenterItem[];
    classes: ClassItem[];
    students: StudentItem[];
    selectedCenterId?: number | null;
    errors?: Record<string, string>;
}

export const Create: React.FC<CreateProps> = ({
    centers,
    classes,
    students,
    selectedCenterId,
    errors = {},
}) => {
    const { isSuperAdmin } = usePermission();
    const { auth } = usePage<any>().props;
    const userCenterId = auth?.user?.center_id;

    const [centerId, setCenterId] = useState<string>(
        !isSuperAdmin && userCenterId ? String(userCenterId) : (selectedCenterId ? String(selectedCenterId) : (centers[0]?.id ? String(centers[0].id) : ''))
    );
    const [classId, setClassId] = useState<string>('');
    const [studentId, setStudentId] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [baseAmount, setBaseAmount] = useState<string>('');
    const [discountType, setDiscountType] = useState<string>('');
    const [discountValue, setDiscountValue] = useState<string>('');
    const [dueDate, setDueDate] = useState<string>('');
    const [note, setNote] = useState<string>('');

    // First installment section (Optional)
    const [hasInitialPayment, setHasInitialPayment] = useState<boolean>(false);
    const [initialAmount, setInitialAmount] = useState<string>('');
    const [initialDate, setInitialDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [initialMethod, setInitialMethod] = useState<number>(PAYMENT_METHOD_BANK_TRANSFER);
    const [initialCode, setInitialCode] = useState<string>('');
    const [initialNote, setInitialNote] = useState<string>('Đóng đợt 1');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const computedTotalAmount = React.useMemo(() => {
        const base = Number(baseAmount) || 0;
        if (base <= 0) return 0;
        const type = Number(discountType);
        const val = Number(discountValue) || 0;
        if (type === DISCOUNT_TYPE_DIRECT) {
            return Math.max(0, base - val);
        }
        if (type === DISCOUNT_TYPE_PERCENTAGE) {
            return Math.max(0, Math.round(base * (1 - val / 100)));
        }
        return base;
    }, [baseAmount, discountType, discountValue]);

    const isInitialAmountExceeded =
        hasInitialPayment &&
        Number(initialAmount) > 0 &&
        computedTotalAmount > 0 &&
        Number(initialAmount) > computedTotalAmount;

    // Filter classes and students by selected center and selected class
    const filteredClasses = centerId
        ? classes.filter((c) => String(c.center_id) === String(centerId))
        : classes;

    const selectedClass = classes.find((c) => String(c.id) === String(classId));
    const filteredStudents = classId
        ? (selectedClass?.students || [])
        : (centerId ? students.filter((s) => String(s.center_id) === String(centerId)) : students);

    // Reset class and student when center changes
    const handleCenterChange = (newCenterId: string) => {
        setCenterId(newCenterId);
        setClassId('');
        setStudentId('');
        setBaseAmount('');
    };

    // Auto update title and base amount when class is selected & reset student
    const handleClassChange = (newClassId: string) => {
        setClassId(newClassId);
        setStudentId('');
        const selectedCls = filteredClasses.find((c) => String(c.id) === String(newClassId));

        if (selectedCls) {
            if (!title) {
                setTitle(`Học phí ${selectedCls.name}`);
            }
            if (selectedCls.total_tuition_fee !== undefined && selectedCls.total_tuition_fee !== null) {
                setBaseAmount(String(Number(selectedCls.total_tuition_fee)));
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isInitialAmountExceeded) {
            return;
        }

        setIsSubmitting(true);

        const payload: any = {
            center_id: Number(centerId),
            class_id: Number(classId),
            student_id: Number(studentId),
            title: title || undefined,
            total_amount: computedTotalAmount,
            discount_type: discountType ? Number(discountType) : undefined,
            discount_value: discountValue !== '' ? Number(discountValue) : undefined,
            due_date: dueDate || undefined,
            note: note || undefined,
        };

        if (hasInitialPayment && Number(initialAmount) > 0) {
            payload.initial_payment_amount = Number(initialAmount);
            payload.initial_payment_date = initialDate;
            payload.initial_payment_method = initialMethod;
            payload.initial_transaction_code = initialCode || undefined;
            payload.initial_payment_note = initialNote || undefined;
        }

        router.post('/tuitions', payload, {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout title="Tạo Khoản Thu Học Phí Mới - SAM Digital">
            <Head title="Tạo Khoản Thu Học Phí Mới" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BackButton fallbackUrl="/tuitions" size="md" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tạo Khoản Thu Học Phí Mới</h1>
                            <p className="text-sm text-gray-500">
                                Thiết lập tổng số tiền học phí khóa học mà học sinh cần hoàn thành.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Main Tuition Info Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-gray-900 uppercase tracking-wider">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                            1. Thông Tin Khoản Học Phí
                        </h2>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 items-start">
                            {/* Center Selection (Super Admin only) */}
                            {isSuperAdmin && (
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Trung Tâm Đào Tạo (*)
                                    </label>
                                    <ScrollableSelect
                                        value={centerId}
                                        onChange={handleCenterChange}
                                        options={centers.map((c) => ({
                                            value: String(c.id),
                                            label: c.name,
                                        }))}
                                        placeholder="-- Chọn Trung tâm --"
                                        searchable={true}
                                    />
                                    {errors.center_id && (
                                        <p className="mt-1.5 text-xs text-red-600">{errors.center_id}</p>
                                    )}
                                </div>
                            )}

                            {/* Class Selection */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Lớp Học / Khóa Học (*)
                                </label>
                                <ScrollableSelect
                                    value={classId}
                                    onChange={handleClassChange}
                                    disabled={!centerId}
                                    options={filteredClasses.map((cl) => ({
                                        value: String(cl.id),
                                        label: cl.name,
                                    }))}
                                    placeholder="-- Chọn Lớp học --"
                                    searchable={true}
                                />
                                {errors.class_id && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.class_id}</p>
                                )}
                            </div>

                            {/* Student Selection */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Học Sinh Đóng Học Phí (*)
                                </label>
                                <ScrollableSelect
                                    value={studentId}
                                    onChange={(val) => setStudentId(val)}
                                    disabled={!classId}
                                    options={filteredStudents.map((st) => ({
                                        value: String(st.id),
                                        label: st.full_name,
                                        subLabel: st.phone ? `SĐT: ${st.phone}` : undefined,
                                    }))}
                                    placeholder={
                                        !classId
                                            ? '-- Vui lòng chọn Lớp học trước --'
                                            : filteredStudents.length === 0
                                            ? '-- Lớp chưa có học sinh ghi danh --'
                                            : '-- Chọn Học sinh --'
                                    }
                                    searchable={true}
                                />
                                {errors.student_id && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.student_id}</p>
                                )}
                            </div>

                            {/* Tuition Title */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Tiêu Đề Khoản Thu / Học Phần
                                </label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Ví dụ: Học phí Lớp Toán 12 Nâng Cao - Học kỳ 1"
                                    className="!py-3 !text-sm"
                                />
                                {errors.title && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.title}</p>
                                )}
                            </div>

                            {/* Base Tuition Fee */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Học Phí Gốc Của Lớp (VNĐ) (*)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={baseAmount}
                                    onChange={(e) => setBaseAmount(e.target.value)}
                                    placeholder="Ví dụ: 10000000"
                                    className="!py-3 !text-sm"
                                    required
                                />
                            </div>

                            {/* Discount Type */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Kiểu Giảm Giá
                                </label>
                                <select
                                    value={discountType}
                                    onChange={(e) => {
                                        setDiscountType(e.target.value);
                                        if (!e.target.value) setDiscountValue('');
                                    }}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="">Không giảm giá</option>
                                    <option value={DISCOUNT_TYPE_DIRECT}>Giảm trực tiếp (VNĐ)</option>
                                    <option value={DISCOUNT_TYPE_PERCENTAGE}>Giảm theo phần trăm (%)</option>
                                </select>
                            </div>

                            {/* Discount Value */}
                            {discountType && (
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Mức Giảm Giá {Number(discountType) === DISCOUNT_TYPE_PERCENTAGE ? '(%)' : '(VNĐ)'} (*)
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max={Number(discountType) === DISCOUNT_TYPE_PERCENTAGE ? '100' : (baseAmount ? Number(baseAmount) : undefined)}
                                        step={Number(discountType) === DISCOUNT_TYPE_PERCENTAGE ? '1' : '1000'}
                                        value={discountValue}
                                        onChange={(e) => setDiscountValue(e.target.value)}
                                        placeholder={Number(discountType) === DISCOUNT_TYPE_PERCENTAGE ? 'Ví dụ: 10' : 'Ví dụ: 500000'}
                                        className="!py-3 !text-sm"
                                    />
                                    {errors.discount_value && (
                                        <p className="mt-1.5 text-xs text-red-600">{errors.discount_value}</p>
                                    )}
                                </div>
                            )}

                            {/* Final Total Amount (Calculated) */}
                            <div className={discountType ? '' : 'md:col-span-1'}>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Tổng Học Phí Cần Đóng (Sau Giảm Trừ)
                                </label>
                                <div className="flex h-[46px] items-center px-4 rounded-lg bg-emerald-50 border border-emerald-200 text-base font-bold text-emerald-800">
                                    {formatCurrency(computedTotalAmount)}
                                </div>
                                {errors.total_amount && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.total_amount}</p>
                                )}
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Hạn Chót Đóng Học Phí (Nếu có)
                                </label>
                                <DatePicker
                                    value={dueDate}
                                    onChange={(val) => setDueDate(val)}
                                    className="!py-3 !text-sm w-full"
                                />
                                {errors.due_date && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.due_date}</p>
                                )}
                            </div>

                            {/* Note */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Ghi Chú
                                </label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                    placeholder="Ghi chú về hình thức đóng, chính sách giảm trừ hoặc ưu đãi..."
                                    className="w-full rounded-lg border border-gray-300 p-3.5 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Optional First Installment Card */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 uppercase tracking-wider">
                                    <Receipt className="h-5 w-5 text-blue-600" />
                                    2. Thu Tiền Đợt 1 Ngay Lúc Này (Tùy Chọn)
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Nếu học sinh đã nộp tiền đợt 1 (cọc hoặc đóng trước một phần), bạn có thể ghi nhận ngay.
                                </p>
                            </div>
                            <label className="relative inline-flex cursor-pointer items-center">
                                <input
                                    type="checkbox"
                                    checked={hasInitialPayment}
                                    onChange={(e) => {
                                        setHasInitialPayment(e.target.checked);

                                        if (e.target.checked && !initialAmount && computedTotalAmount > 0) {
                                            setInitialAmount(String(computedTotalAmount));
                                        }
                                    }}
                                    className="peer sr-only"
                                />
                                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:top-[2px] after:start-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-hidden"></div>
                            </label>
                        </div>

                        {hasInitialPayment && (
                            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 items-start">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Số Tiền Thu Đợt 1 (VNĐ) (*)
                                    </label>
                                    <Input
                                        type="number"
                                        min="1000"
                                        max={computedTotalAmount ? computedTotalAmount : undefined}
                                        step="1000"
                                        value={initialAmount}
                                        onChange={(e) => setInitialAmount(e.target.value)}
                                        placeholder="Ví dụ: 5000000"
                                        className={`!py-3 !text-sm ${isInitialAmountExceeded ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                                        required={hasInitialPayment}
                                    />
                                    {isInitialAmountExceeded && (
                                        <p className="mt-1.5 text-xs font-semibold text-red-600">
                                            Số tiền đóng đợt 1 ({formatCurrency(Number(initialAmount))}) không được vượt quá tổng học phí ({formatCurrency(computedTotalAmount)}).
                                        </p>
                                    )}
                                    {errors.initial_payment_amount && (
                                        <p className="mt-1.5 text-xs text-red-600">{errors.initial_payment_amount}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Ngày Thu Tiền (*)
                                    </label>
                                    <DatePicker
                                        value={initialDate}
                                        onChange={(val) => setInitialDate(val)}
                                        className="!py-3 !text-sm w-full"
                                        required={hasInitialPayment}
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Phương Thức Thanh Toán (*)
                                    </label>
                                    <select
                                        value={initialMethod}
                                        onChange={(e) => setInitialMethod(Number(e.target.value))}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        {PAYMENT_METHOD_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Mã Phiếu Thu / Mã Giao Dịch
                                    </label>
                                    <Input
                                        value={initialCode}
                                        onChange={(e) => setInitialCode(e.target.value)}
                                        placeholder="Ví dụ: PT-20260110-01"
                                        className="!py-3 !text-sm"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Ghi Chú Đợt Thu
                                    </label>
                                    <Input
                                        value={initialNote}
                                        onChange={(e) => setInitialNote(e.target.value)}
                                        placeholder="Ví dụ: Đợt 1 - Cọc giữ chỗ đầu khóa"
                                        className="!py-3 !text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </Card>

                    {/* Submit Bar */}
                    <div className="flex items-center justify-end gap-3">
                        <BackButton fallbackUrl="/tuitions" size="lg" label="Hủy Bỏ" />
                        <Button
                            type="submit"
                            variant="success"
                            size="lg"
                            isLoading={isSubmitting}
                            disabled={isSubmitting || isInitialAmountExceeded}
                            icon={<Save className="h-5 w-5" />}
                        >
                            Tạo Hồ Sơ Học Phí
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default Create;
