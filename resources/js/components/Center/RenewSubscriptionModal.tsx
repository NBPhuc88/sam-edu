import { router } from '@inertiajs/react';
import { Calendar, RefreshCw, DollarSign, Building2, Sparkles, Clock } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Button from '../ui/Button';
import DatePicker from '../ui/DatePicker';
import Input from '../ui/Input';
import Modal from '../ui/Modal';
import { toISODateString } from '@/lib/date';

interface SubscriptionPlan {
    id: number;
    code: string;
    name: string;
    price: number;
    yearly_price?: number | null;
    duration_days: number;
    max_students?: number | null;
    max_classes?: number | null;
}

interface CenterInfo {
    id: number;
    code: string;
    name: string;
    subscription_plan: string;
    expires_at: string | null;
    status: string;
}

interface RenewSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    center: CenterInfo | null;
    subscriptionPlans: SubscriptionPlan[];
}

type CycleType = 'monthly' | 'quarterly' | 'semi_annual' | 'yearly' | 'custom';

export const RenewSubscriptionModal: React.FC<RenewSubscriptionModalProps> = ({
    isOpen,
    onClose,
    center,
    subscriptionPlans,
}) => {
    const [selectedPlanCode, setSelectedPlanCode] = useState<string>('');
    const [cycle, setCycle] = useState<CycleType>('monthly');
    const [durationDays, setDurationDays] = useState<number>(30);
    const [startsAt, setStartsAt] = useState<string>('');
    const [endsAt, setEndsAt] = useState<string>('');
    const [price, setPrice] = useState<number>(0);
    const [note, setNote] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const getTodayISO = () => new Date().toISOString().split('T')[0];

    // Helper calculate end date
    const computeEndDate = (startDateStr: string, days: number): string => {
        if (!startDateStr) return getTodayISO();
        const d = new Date(startDateStr);
        d.setDate(d.getDate() + days);

        return d.toISOString().split('T')[0];
    };

    // Initialize or reset form when modal opens or center/plan changes
    useEffect(() => {
        if (!isOpen || !center) return;

        const initialPlanCode = center.subscription_plan || subscriptionPlans[0]?.code || 'basic_5';
        setSelectedPlanCode(initialPlanCode);
        setCycle('monthly');
        setNote('');
        setErrors({});

        // Determine starts_at based on rule:
        // Same plan & future expires_at -> start from expires_at
        // Different plan or expired -> start from today
        const today = getTodayISO();
        let initialStart = today;
        if (center.expires_at) {
            const expISO = toISODateString(center.expires_at);

            if (expISO && expISO > today && center.subscription_plan === initialPlanCode) {
                initialStart = expISO;
            }
        }

        setStartsAt(initialStart);

        // Default monthly (30 days)
        const initialPlan = subscriptionPlans.find((p) => p.code === initialPlanCode);
        const days = 30;
        setDurationDays(days);
        setEndsAt(computeEndDate(initialStart, days));
        setPrice(initialPlan?.price ?? 0);
    }, [isOpen, center]);

    // Handle Plan Selection Change
    const handlePlanChange = (newCode: string) => {
        setSelectedPlanCode(newCode);
        const selectedPlan = subscriptionPlans.find((p) => p.code === newCode);
        const today = getTodayISO();

        // Rule: Đổi gói cước mới (khác gói cũ) -> tính từ Ngày Hiện Tại (today)
        // Gia hạn gói cước cũ -> tính từ ngày hết hạn cũ (nếu còn hạn)
        let newStart = today;

        if (center?.expires_at && center.subscription_plan === newCode) {
            const expISO = toISODateString(center.expires_at);

            if (expISO && expISO > today) {
                newStart = expISO;
            }
        }

        setStartsAt(newStart);
        recalculateCycle(cycle, newCode, newStart);
    };

    // Handle Cycle Change
    const handleCycleChange = (newCycle: CycleType) => {
        setCycle(newCycle);
        recalculateCycle(newCycle, selectedPlanCode, startsAt);
    };

    // Recalculate duration, price, and end date based on plan & cycle
    const recalculateCycle = (cType: CycleType, pCode: string, startStr: string) => {
        const plan = subscriptionPlans.find((p) => p.code === pCode);
        let days = 30;
        let pAmount = plan?.price ?? 0;

        switch (cType) {
            case 'monthly':
                days = 30;
                pAmount = plan?.price ?? 0;
                break;
            case 'quarterly':
                days = 90;
                pAmount = (plan?.price ?? 0) * 3;
                break;
            case 'semi_annual':
                days = 180;
                pAmount = (plan?.price ?? 0) * 6;
                break;
            case 'yearly':
                days = 365;
                pAmount = plan?.yearly_price ? Number(plan.yearly_price) : (plan?.price ?? 0) * 12;
                break;
            case 'custom':
                days = durationDays;
                pAmount = price;
                break;
        }

        if (cType !== 'custom') {
            setDurationDays(days);
            setPrice(pAmount);
            setEndsAt(computeEndDate(startStr, days));
        }
    };

    // Handle Start Date change
    const handleStartDateChange = (newStart: string) => {
        setStartsAt(newStart);
        setEndsAt(computeEndDate(newStart, durationDays));
    };

    // Handle Custom Duration Days change
    const handleDurationDaysChange = (days: number) => {
        setDurationDays(days);
        setEndsAt(computeEndDate(startsAt, days));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!center) return;

        setIsSubmitting(true);
        setErrors({});

        router.post(
            `/centers/${center.id}/renew-subscription`,
            {
                plan_code: selectedPlanCode,
                duration_days: durationDays,
                starts_at: startsAt,
                ends_at: endsAt,
                price: price,
                note: note,
            },
            {
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    setErrors(errs);
                },
            },
        );
    };

    if (!isOpen || !center) return null;

    const currentPlanObj = subscriptionPlans.find((p) => p.code === center.subscription_plan);
    const selectedPlanObj = subscriptionPlans.find((p) => p.code === selectedPlanCode);
    const isSamePlan = center.subscription_plan === selectedPlanCode;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2.5 text-lg font-bold text-gray-900">
                    <RefreshCw className="h-5 w-5 text-emerald-600 animate-spin-slow" />
                    {isSamePlan ? 'Gia Hạn Gói Cước Dịch Vụ SaaS' : 'Đổi Gói Cước Dịch Vụ SaaS'}
                </div>
            }
            maxWidth="2xl"
            footer={
                <>
                    <Button
                        variant="secondary"
                        size="md"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Hủy Bỏ
                    </Button>
                    <Button
                        variant="success"
                        size="md"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        icon={<RefreshCw className="h-4.5 w-4.5" />}
                    >
                        {isSamePlan ? 'Xác Nhận Gia Hạn' : 'Xác Nhận Đổi Gói'}
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Center Summary Header */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 font-bold text-gray-900 text-base">
                                <Building2 className="h-5 w-5 text-emerald-600" />
                                {center.name}
                            </div>
                            <div className="mt-1 text-xs text-gray-600 flex items-center gap-3">
                                <span>Mã TT: <strong>{center.code}</strong></span>
                                <span>•</span>
                                <span>Gói hiện tại: <strong className="text-emerald-700">{currentPlanObj?.name || center.subscription_plan}</strong></span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500">Hạn sử dụng hiện tại</div>
                            <div className="font-semibold text-sm text-gray-800">
                                {center.expires_at ? toISODateString(center.expires_at) : 'Vô thời hạn'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plan Selection */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-800 flex items-center justify-between">
                        <span>Chọn Gói Cước Mới / Gia Hạn <span className="text-red-500">*</span></span>
                        {isSamePlan ? (
                            <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                                Gia hạn gói cũ
                            </span>
                        ) : (
                            <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                                Đổi sang gói mới (Hiệu lực từ hôm nay)
                            </span>
                        )}
                    </label>
                    <select
                        value={selectedPlanCode}
                        onChange={(e) => handlePlanChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    >
                        {subscriptionPlans.map((plan) => (
                            <option key={plan.id} value={plan.code}>
                                {plan.name}
                            </option>
                        ))}
                    </select>
                    {errors.plan_code && (
                        <p className="mt-1 text-xs text-red-600">{errors.plan_code}</p>
                    )}
                </div>

                {/* Billing Cycle Selector */}
                <div>
                    <label className="mb-2.5 block text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        <span>Chọn Thời Hạn Thanh Toán</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                        {[
                            { key: 'monthly', label: '30 Ngày', subLabel: '1 Tháng', days: 30 },
                            { key: 'quarterly', label: '90 Ngày', subLabel: '3 Tháng', days: 90 },
                            { key: 'semi_annual', label: '180 Ngày', subLabel: '6 Tháng', days: 180 },
                            { key: 'yearly', label: '365 Ngày', subLabel: '1 Năm', days: 365, badge: 'Tiết kiệm' },
                            { key: 'custom', label: 'Tùy Chỉnh', subLabel: 'Số ngày', days: durationDays },
                        ].map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => handleCycleChange(item.key as CycleType)}
                                className={`relative flex flex-col items-center justify-center rounded-xl border py-3 px-2 text-center transition-all cursor-pointer ${
                                    cycle === item.key
                                        ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold shadow-xs ring-2 ring-emerald-500/30'
                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-slate-50 hover:border-gray-300'
                                }`}
                            >
                                {item.badge && (
                                    <span className="absolute -top-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                        {item.badge}
                                    </span>
                                )}
                                <span className="text-sm font-bold text-gray-900">{item.label}</span>
                                <span className="text-[11px] font-semibold text-emerald-700 mt-0.5">{item.subLabel}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Selection: Start & End */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-800 flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>Ngày Bắt Đầu Hợp Đồng</span>
                        </label>
                        <DatePicker
                            value={startsAt}
                            onChange={(val) => handleStartDateChange(val)}
                            className="!py-2.5 !text-sm w-full"
                        />
                        {errors.starts_at && (
                            <p className="mt-1 text-xs text-red-600">{errors.starts_at}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-800 flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-emerald-600" />
                            <span>Ngày Kết Thúc (Tự Động)</span>
                        </label>
                        <DatePicker
                            value={endsAt}
                            onChange={(val) => setEndsAt(val)}
                            className="!py-2.5 !text-sm w-full"
                        />
                        {errors.ends_at && (
                            <p className="mt-1 text-xs text-red-600">{errors.ends_at}</p>
                        )}
                    </div>
                </div>

                {/* Custom Duration & Price */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-800">
                            Số Ngày Sử Dụng
                        </label>
                        <Input
                            type="number"
                            value={durationDays}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                if (cycle !== 'custom') setCycle('custom');
                                handleDurationDaysChange(val);
                            }}
                            min={1}
                            placeholder="30"
                            className="!py-2.5 !text-sm"
                        />
                        {errors.duration_days && (
                            <p className="mt-1 text-xs text-red-600">{errors.duration_days}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-800 flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            <span>Thành Tiền (VNĐ)</span>
                        </label>
                        <Input
                            type="number"
                            value={price}
                            onChange={(e) => {
                                if (cycle !== 'custom') setCycle('custom');
                                setPrice(Number(e.target.value));
                            }}
                            min={0}
                            placeholder="0"
                            className="!py-2.5 !text-sm"
                        />
                        <div className="mt-1 text-xs text-emerald-700 font-semibold">
                            = {price.toLocaleString('vi-VN')} VNĐ
                        </div>
                        {errors.price && (
                            <p className="mt-1 text-xs text-red-600">{errors.price}</p>
                        )}
                    </div>
                </div>

                {/* Plan Benefits Info */}
                {selectedPlanObj && (
                    <div className="rounded-lg bg-gray-50 p-3.5 border border-gray-200/80 text-xs text-gray-700 space-y-1">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                            Quyền hạn &amp; Hạn mức gói mới:
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>• Giới hạn Học sinh: <strong>{selectedPlanObj.max_students ? `${selectedPlanObj.max_students} HS` : 'Không giới hạn'}</strong></div>
                            <div>• Giới hạn Lớp học: <strong>{selectedPlanObj.max_classes ? `${selectedPlanObj.max_classes} Lớp` : 'Không giới hạn'}</strong></div>
                        </div>
                    </div>
                )}

                {/* Note */}
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-800">
                        Ghi Chú Giao Dịch / Gia Hạn (Tùy chọn)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Nhập lý do, hình thức thanh toán hoặc mã hóa đơn liên quan..."
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                </div>
            </form>
        </Modal>
    );
};

export default RenewSubscriptionModal;
