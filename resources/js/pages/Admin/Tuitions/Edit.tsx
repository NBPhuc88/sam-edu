import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import ScrollableSelect from '@/components/ui/ScrollableSelect';
import {
    DISCOUNT_TYPE_DIRECT,
    DISCOUNT_TYPE_PERCENTAGE,
} from '@/constants/enums';
import { usePermission } from '@/hooks/usePermission';
import AppLayout from '@/layouts/AppLayout';
import { Head,router,usePage } from '@inertiajs/react';
import { Save } from 'lucide-react';
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

interface EditProps {
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
        due_date: string | null;
        note: string | null;
        student?: {
            id: number;
            full_name: string;
            student_code: string;
        };
        school_class?: {
            id: number;
            name: string;
            code: string;
            total_tuition_fee?: number | null;
        };
        center?: {
            id: number;
            name: string;
            code: string;
        };
    };
    centers: CenterItem[];
    classes: ClassItem[];
    students: StudentItem[];
    errors?: Record<string, string>;
}

export const Edit: React.FC<EditProps> = ({
    tuition,
    centers,
    classes,
    students,
    errors = {},
}) => {
    const { isSuperAdmin } = usePermission();

    const [centerId, setCenterId] = useState<string>(String(tuition.center_id));
    const [classId, setClassId] = useState<string>(String(tuition.class_id));
    const [studentId, setStudentId] = useState<string>(String(tuition.student_id));
    const [title, setTitle] = useState<string>(tuition.title || '');

    // Calculate initial base amount
    const initialBase = React.useMemo(() => {
        const total = Number(tuition.total_amount) || 0;
        const type = Number(tuition.discount_type);
        const val = Number(tuition.discount_value) || 0;
        if (type === DISCOUNT_TYPE_DIRECT && val > 0) {
            return String(total + val);
        }
        if (type === DISCOUNT_TYPE_PERCENTAGE && val > 0 && val < 100) {
            return String(Math.round(total / (1 - val / 100)));
        }
        if (tuition.school_class?.total_tuition_fee) {
            return String(Number(tuition.school_class.total_tuition_fee));
        }
        return String(total);
    }, [tuition]);

    const [baseAmount, setBaseAmount] = useState<string>(initialBase);
    const [discountType, setDiscountType] = useState<string>(tuition.discount_type ? String(tuition.discount_type) : '');
    const [discountValue, setDiscountValue] = useState<string>(
        tuition.discount_value !== undefined && tuition.discount_value !== null ? String(Number(tuition.discount_value)) : ''
    );
    const [dueDate, setDueDate] = useState<string>(tuition.due_date || '');
    const [note, setNote] = useState<string>(tuition.note || '');

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

    const paidAmount = Number(tuition.paid_amount) || 0;
    const isTotalAmountBelowPaid = computedTotalAmount < paidAmount;

    const filteredClasses = classes.filter((c) => String(c.center_id) === String(centerId));
    const selectedClass = classes.find((c) => String(c.id) === String(classId));
    const filteredStudents = classId
        ? (selectedClass?.students || [])
        : (centerId ? students.filter((s) => String(s.center_id) === String(centerId)) : students);

    const handleCenterChange = (newCenterId: string) => {
        setCenterId(newCenterId);
        setClassId('');
        setStudentId('');
        setBaseAmount('');
    };

    const handleClassChange = (newClassId: string) => {
        setClassId(newClassId);
        const newSelectedClass = classes.find((c) => String(c.id) === String(newClassId));
        if (newSelectedClass) {
            if (newSelectedClass.total_tuition_fee !== undefined && newSelectedClass.total_tuition_fee !== null) {
                setBaseAmount(String(Number(newSelectedClass.total_tuition_fee)));
            }
            if (newSelectedClass.students) {
                const isCurrentStudentInClass = newSelectedClass.students.some((s) => String(s.id) === String(studentId));
                if (!isCurrentStudentInClass) {
                    setStudentId('');
                }
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isTotalAmountBelowPaid) {
            return;
        }

        setIsSubmitting(true);

        router.patch(
            `/tuitions/${tuition.id}`,
            {
                center_id: Number(centerId),
                class_id: Number(classId),
                student_id: Number(studentId),
                title: title || undefined,
                total_amount: computedTotalAmount,
                discount_type: discountType ? Number(discountType) : undefined,
                discount_value: discountValue !== '' ? Number(discountValue) : undefined,
                due_date: dueDate || null,
                note: note || null,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title="Chỉnh Sửa Hồ Sơ Học Phí - SAM Digital">
            <Head title="Chỉnh Sửa Hồ Sơ Học Phí" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Top bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BackButton fallbackUrl={`/tuitions/${tuition.id}`} size="md" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Chỉnh Sửa Hồ Sơ Học Phí #{tuition.id}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Cập nhật tổng số tiền học phí hoặc thông tin liên quan của học sinh.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 items-start">
                            {/* Center (Super Admin only) */}
                            {isSuperAdmin && (
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Trung Tâm Đào Tạo
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
                                </div>
                            )}

                            {/* Class */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Lớp Học (*)
                                </label>
                                <ScrollableSelect
                                    value={classId}
                                    onChange={handleClassChange}
                                    options={filteredClasses.map((cl) => ({
                                        value: String(cl.id),
                                        label: cl.name,
                                    }))}
                                    placeholder="-- Chọn Lớp học --"
                                    searchable={true}
                                />
                            </div>

                            {/* Student */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Học Sinh (*)
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
                            </div>

                            {/* Title */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Tiêu Đề Khoản Thu
                                </label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Tiêu đề học phí..."
                                    className="!py-3 !text-sm"
                                />
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

                            {/* Final Total Amount */}
                            <div className={discountType ? '' : 'md:col-span-1'}>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Tổng Học Phí Sau Giảm Trừ (VNĐ) (*)
                                </label>
                                <div className="flex h-[46px] items-center px-4 rounded-lg bg-emerald-50 border border-emerald-200 text-base font-bold text-emerald-800">
                                    {formatCurrency(computedTotalAmount)}
                                </div>
                                {isTotalAmountBelowPaid ? (
                                    <p className="mt-1.5 text-xs font-semibold text-red-600">
                                        Tổng học phí ({formatCurrency(computedTotalAmount)}) không được nhỏ hơn số tiền học sinh đã đóng ({formatCurrency(paidAmount)}).
                                    </p>
                                ) : paidAmount > 0 ? (
                                    <p className="mt-1.5 text-xs text-gray-500">
                                        Đã đóng: <strong className="text-gray-800">{formatCurrency(paidAmount)}</strong>. Tổng học phí tối thiểu phải bằng số tiền đã đóng.
                                    </p>
                                ) : null}
                                {errors.total_amount && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.total_amount}</p>
                                )}
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Hạn Chót Đóng Học Phí
                                </label>
                                <DatePicker
                                    value={dueDate}
                                    onChange={(val) => setDueDate(val)}
                                    className="!py-3 !text-sm w-full"
                                />
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
                                    className="w-full rounded-lg border border-gray-300 p-3.5 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Submit Bar */}
                    <div className="flex items-center justify-end gap-3">
                        <BackButton fallbackUrl={`/tuitions/${tuition.id}`} size="lg" label="Hủy Bỏ" />
                        <Button
                            type="submit"
                            variant="edit"
                            size="lg"
                            isLoading={isSubmitting}
                            disabled={isSubmitting || isTotalAmountBelowPaid}
                            icon={<Save className="h-5 w-5" />}
                        >
                            Cập Nhật Hồ Sơ
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
};

export default Edit;
