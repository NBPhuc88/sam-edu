import {
    SUBSCRIPTION_STATUS_ACTIVE,
    SUBSCRIPTION_STATUS_CANCELLED,
    SUBSCRIPTION_STATUS_EXPIRED,
    SUBSCRIPTION_STATUS_LABELS,
    SUBSCRIPTION_STATUS_PENDING,
} from '@/constants/enums';
import { toISODateString } from '@/lib/date';
import { notify } from '@/lib/toast';
import { router } from '@inertiajs/react';
import { Calendar, DollarSign, Layers, Save, Tag } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Button from '../ui/Button';
import DatePicker from '../ui/DatePicker';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

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

export interface SubscriptionRecord {
    id: number;
    plan_id: number;
    plan_name: string;
    price: number;
    duration_days: number;
    starts_at: string;
    ends_at: string;
    status: number;
    created_at?: string;
}

interface EditSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    centerId: number;
    subscription: SubscriptionRecord | null;
    subscriptionPlans: SubscriptionPlan[];
}

export const EditSubscriptionModal: React.FC<EditSubscriptionModalProps> = ({
    isOpen,
    onClose,
    centerId,
    subscription,
    subscriptionPlans,
}) => {
    const [planId, setPlanId] = useState<number>(0);
    const [price, setPrice] = useState<number>(0);
    const [durationDays, setDurationDays] = useState<number>(30);
    const [startsAt, setStartsAt] = useState<string>('');
    const [endsAt, setEndsAt] = useState<string>('');
    const [status, setStatus] = useState<number>(SUBSCRIPTION_STATUS_ACTIVE);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!isOpen || !subscription) return;

        setPlanId(Number(subscription.plan_id));
        setPrice(Number(subscription.price) || 0);
        setDurationDays(Number(subscription.duration_days) || 30);
        setStartsAt(subscription.starts_at ? toISODateString(subscription.starts_at) : '');
        setEndsAt(subscription.ends_at ? toISODateString(subscription.ends_at) : '');
        setStatus(Number(subscription.status) || SUBSCRIPTION_STATUS_ACTIVE);
        setErrors({});
    }, [isOpen, subscription]);

    // Handle plan change
    const handlePlanChange = (newPlanId: number) => {
        setPlanId(newPlanId);
        const plan = subscriptionPlans.find((p) => p.id === newPlanId);
        if (plan) {
            setPrice(Number(plan.price) || 0);
            setDurationDays(Number(plan.duration_days) || 30);
            if (startsAt) {
                const d = new Date(startsAt);
                d.setDate(d.getDate() + (Number(plan.duration_days) || 30));
                setEndsAt(d.toISOString().split('T')[0]);
            }
        }
    };

    // Helper calculate end date when duration or start date changes
    const handleDurationChange = (days: number) => {
        setDurationDays(days);
        if (startsAt && days > 0) {
            const d = new Date(startsAt);
            d.setDate(d.getDate() + days);
            setEndsAt(d.toISOString().split('T')[0]);
        }
    };

    const handleStartDateChange = (newStart: string) => {
        setStartsAt(newStart);
        if (newStart && durationDays > 0) {
            const d = new Date(newStart);
            d.setDate(d.getDate() + durationDays);
            setEndsAt(d.toISOString().split('T')[0]);
        }
    };

    const validate = (): boolean => {
        const newErrs: Record<string, string> = {};

        if (!planId) {
            newErrs.plan_id = 'Vui lòng chọn gói cước dịch vụ.';
        }
        if (price < 0) {
            newErrs.price = 'Giá tiền không được nhỏ hơn 0.';
        }
        if (durationDays < 1) {
            newErrs.duration_days = 'Thời hạn phải từ 1 ngày trở lên.';
        }
        if (!startsAt) {
            newErrs.starts_at = 'Vui lòng chọn ngày bắt đầu.';
        }
        if (!endsAt) {
            newErrs.ends_at = 'Vui lòng chọn ngày kết thúc.';
        }
        if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
            newErrs.ends_at = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.';
        }

        setErrors(newErrs);
        return Object.keys(newErrs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subscription || !validate()) return;

        setIsSubmitting(true);
        router.patch(
            `/centers/${centerId}/subscriptions/${subscription.id}`,
            {
                plan_id: planId,
                price,
                duration_days: durationDays,
                starts_at: startsAt,
                ends_at: endsAt,
                status,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    notify.success('Cập nhật lịch sử gói cước và tính toán lại thông số trung tâm thành công!');
                    onClose();
                },
                onError: (errs) => {
                    setIsSubmitting(false);
                    setErrors(errs);
                    const firstMsg = Object.values(errs)[0];
                    notify.error(typeof firstMsg === 'string' ? firstMsg : 'Có lỗi xảy ra khi cập nhật.');
                },
            },
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh Sửa Bản Ghi Lịch Sử Gói Cước" maxWidth="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Plan Selection */}
                <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                        <Layers className="h-3.5 w-3.5 text-emerald-600" />
                        Gói Cước Dịch Vụ <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={planId}
                        onChange={(e) => handlePlanChange(Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    >
                        <option value={0}>-- Chọn gói cước --</option>
                        {subscriptionPlans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                                {plan.name} ({Number(plan.price).toLocaleString('vi-VN')}đ / {plan.duration_days} ngày)
                            </option>
                        ))}
                    </select>
                    {errors.plan_id && <p className="mt-1 text-xs text-red-500">{errors.plan_id}</p>}
                </div>

                {/* Price & Duration */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                            Giá Tiền (VNĐ) <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="number"
                            min={0}
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value) || 0)}
                            className="!py-2.5 text-sm"
                            required
                        />
                        {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                            <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                            Thời Hạn (Ngày) <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="number"
                            min={1}
                            max={3650}
                            value={durationDays}
                            onChange={(e) => handleDurationChange(Number(e.target.value) || 1)}
                            className="!py-2.5 text-sm"
                            required
                        />
                        {errors.duration_days && <p className="mt-1 text-xs text-red-500">{errors.duration_days}</p>}
                    </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                            Ngày Bắt Đầu <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                            value={startsAt}
                            onChange={handleStartDateChange}
                            className="!py-2.5 text-sm"
                            required
                        />
                        {errors.starts_at && <p className="mt-1 text-xs text-red-500">{errors.starts_at}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700">
                            Ngày Kết Thúc <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                            value={endsAt}
                            onChange={(v) => setEndsAt(v)}
                            className="!py-2.5 text-sm"
                            required
                        />
                        {errors.ends_at && <p className="mt-1 text-xs text-red-500">{errors.ends_at}</p>}
                    </div>
                </div>

                {/* Status Selection */}
                <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700">
                        <Tag className="h-3.5 w-3.5 text-emerald-600" />
                        Trạng Thái Gói Cước <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(Number(e.target.value))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    >
                        <option value={SUBSCRIPTION_STATUS_PENDING}>
                            {SUBSCRIPTION_STATUS_LABELS[SUBSCRIPTION_STATUS_PENDING]}
                        </option>
                        <option value={SUBSCRIPTION_STATUS_ACTIVE}>
                            {SUBSCRIPTION_STATUS_LABELS[SUBSCRIPTION_STATUS_ACTIVE]}
                        </option>
                        <option value={SUBSCRIPTION_STATUS_EXPIRED}>
                            {SUBSCRIPTION_STATUS_LABELS[SUBSCRIPTION_STATUS_EXPIRED]}
                        </option>
                        <option value={SUBSCRIPTION_STATUS_CANCELLED}>
                            {SUBSCRIPTION_STATUS_LABELS[SUBSCRIPTION_STATUS_CANCELLED]}
                        </option>
                    </select>
                </div>

                <div className="rounded-lg bg-amber-50 p-3 border border-amber-200/80 text-xs text-amber-800 leading-relaxed">
                    💡 <strong>Lưu ý:</strong> Khi bạn cập nhật bản ghi này, hệ thống sẽ tự động tính toán lại Ngày hết hạn (`expires_at`), Giới hạn HS và Giới hạn Lớp của Trung tâm theo các gói cước đang có hiệu lực.
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                    <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
                        Hủy Bỏ
                    </Button>
                    <Button variant="success" type="submit" disabled={isSubmitting} icon={<Save className="h-4 w-4" />}>
                        {isSubmitting ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditSubscriptionModal;
