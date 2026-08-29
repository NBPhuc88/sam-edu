import {
    CENTER_STATUS_ACTIVE,
    CENTER_STATUS_PAUSED,
    CENTER_STATUS_EXPIRED,
    CENTER_STATUS_OPTIONS,
} from '@/constants/enums';
import { toISODateString } from '@/lib/date';
import { notify } from '@/lib/toast';
import { Link,usePage } from '@inertiajs/react';
import { ArrowLeft,Building2,Save } from 'lucide-react';
import React,{ useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import DatePicker from '../ui/DatePicker';
import Input from '../ui/Input';

export interface CenterFormData {
    id?: number;
    code: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    status: number;
    subscription_plan_id: number;
    expires_at: string;
    max_students: number;
    max_classes: number;
}

interface CenterFormProps {
    mode: 'create' | 'edit';
    initialValues?: Partial<CenterFormData>;
    subscriptionPlans: any[];
    onSubmit: (payload: Partial<CenterFormData>) => void;
    isLoading?: boolean;
    errors?: Record<string, string>;
}

export const CenterForm: React.FC<CenterFormProps> = ({
    mode,
    initialValues,
    subscriptionPlans,
    onSubmit,
    isLoading = false,
    errors = {},
}) => {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';
    const backHref = isSuperAdmin ? '/centers' : '/dashboard';

    const calculateExpirationDate = (planId: number): string => {
        const selectedPlan = subscriptionPlans.find(
            (p: any) => p.id === Number(planId),
        );
        const date = new Date();

        if (selectedPlan?.duration_days) {
            date.setDate(date.getDate() + Number(selectedPlan.duration_days));
        } else {
            date.setDate(date.getDate() + 30);
        }

        return date.toISOString().split('T')[0];
    };

    // Form state initialized with initial values or defaults
    const [formData, setFormData] = useState<CenterFormData>(() => {
        const rawPlanId = initialValues?.subscription_plan_id;
        const matchedPlan = subscriptionPlans.find(
            (p: any) => p.id === Number(rawPlanId),
        );
        const defaultPlanId = matchedPlan?.id ?? (subscriptionPlans[0]?.id || 1);
        const defaultExpires = initialValues?.expires_at
            ? toISODateString(initialValues.expires_at)
            : mode === 'create'
              ? calculateExpirationDate(defaultPlanId)
              : '';

        const rawStatus = initialValues?.status;
        const normalizedStatus = rawStatus === 2 ? CENTER_STATUS_PAUSED : rawStatus === 3 ? CENTER_STATUS_EXPIRED : CENTER_STATUS_ACTIVE;

        return {
            code: initialValues?.code || '',
            name: initialValues?.name || '',
            phone: initialValues?.phone || '',
            email: initialValues?.email || '',
            address: initialValues?.address || '',
            status: normalizedStatus,
            subscription_plan_id: defaultPlanId,
            expires_at: defaultExpires,
            max_students: initialValues?.max_students ?? 200,
            max_classes: initialValues?.max_classes ?? 15,
        };
    });

    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Vui lòng nhập tên trung tâm.';
        } else if (formData.name.length > 100) {
            newErrors.name = 'Tên trung tâm không được vượt quá 100 ký tự.';
        }

        if (formData.phone && !/^(0|\+84)[0-9]{9,10}$/.test(formData.phone.replace(/\s+/g, ''))) {
            newErrors.phone = 'Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0912345678).';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Địa chỉ email không hợp lệ.';
        }

        if (mode === 'create' && !formData.subscription_plan_id) {
            newErrors.subscription_plan_id = 'Vui lòng chọn gói dịch vụ SaaS.';
        }

        setClientErrors(newErrors);
        const hasErrors = Object.keys(newErrors).length > 0;
        if (hasErrors) {
            const firstError = Object.values(newErrors)[0];
            if (typeof firstError === 'string') {
                notify.error(firstError);
            }
        }

        return !hasErrors;
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    ) => {
        const { name, value } = e.target;

        if (clientErrors[name]) {
            setClientErrors((prev) => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }

        if (name === 'subscription_plan_id') {
            const planId = Number(value);
            const selectedPlan = subscriptionPlans.find(
                (p: any) => p.id === planId,
            );
            const autoExpiresAt = calculateExpirationDate(planId);

            setFormData((prev) => ({
                ...prev,
                subscription_plan_id: planId,
                expires_at: autoExpiresAt,
                max_students: selectedPlan?.max_students ?? prev.max_students,
                max_classes: selectedPlan?.max_classes ?? prev.max_classes,
            }));

            return;
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        if (mode === 'create') {
            // Send full form payload on creation
            onSubmit(formData);
        } else {
            // Mode EDIT: Send ONLY genuinely changed / dirty fields
            const changedPayload: Partial<CenterFormData> = {};

            const numberFields: (keyof CenterFormData)[] = [
                'status',
                'subscription_plan_id',
                'max_students',
                'max_classes',
            ];

            (Object.keys(formData) as (keyof CenterFormData)[]).forEach((k) => {
                if (k === 'id') return;

                const currentValue = formData[k];
                const originalValue = initialValues?.[k];

                if (k === 'expires_at') {
                    const currDate = currentValue ? toISODateString(currentValue as string) : '';
                    const origDate = originalValue ? toISODateString(originalValue as string) : '';

                    if (currDate !== origDate) {
                        changedPayload[k] = currDate as any;
                    }
                } else if (numberFields.includes(k)) {
                    const currNum = Number(currentValue);
                    const origNum = originalValue !== undefined && originalValue !== null ? Number(originalValue) : null;

                    if (origNum === null || currNum !== origNum) {
                        changedPayload[k] = currNum as any;
                    }
                } else {
                    const currStr = String(currentValue ?? '').trim();
                    const origStr = String(originalValue ?? '').trim();

                    if (currStr !== origStr) {
                        changedPayload[k] = (currentValue ?? '') as any;
                    }
                }
            });

            // If nothing changed, pass empty object
            onSubmit(changedPayload);
        }
    };

    const mergedErrors = { ...errors, ...clientErrors };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 sm:p-8">
                <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
                    <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {mode === 'create'
                                ? 'Thông Tin Trung Tâm Mới'
                                : `Thông Tin Trung Tâm: ${initialValues?.name || ''}`}
                        </h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
                    {/* Center Code */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-800">
                            Mã Trung Tâm
                        </label>
                        <Input
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            placeholder="Mã tự động (ví dụ: CTR0000001)"
                            disabled={mode === 'edit'} // Code is readonly on edit
                            className="!py-3 !text-sm"
                        />
                        {mergedErrors.code && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {mergedErrors.code}
                            </p>
                        )}
                    </div>

                    {/* Center Name */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-800">
                            Tên Trung Tâm <span className="text-red-500">*</span>
                        </label>
                        <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nhập tên trung tâm đào tạo"
                            className="!py-3 !text-sm"
                            required
                        />
                        {mergedErrors.name && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {mergedErrors.name}
                            </p>
                        )}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-800">
                            Số Điện Thoại Liên Hệ
                        </label>
                        <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="0988.xxx.xxx"
                            className="!py-3 !text-sm"
                        />
                        {mergedErrors.phone && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {mergedErrors.phone}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-800">
                            Email Liên Hệ / Quản Lý
                        </label>
                        <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="admin@trungtam.com"
                            className="!py-3 !text-sm"
                        />
                        {mergedErrors.email && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {mergedErrors.email}
                            </p>
                        )}
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-semibold text-gray-800">
                            Địa Chỉ Trụ Sở
                        </label>
                        <Input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
                            className="!py-3 !text-sm"
                        />
                        {mergedErrors.address && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {mergedErrors.address}
                            </p>
                        )}
                    </div>

                    {/* Subscription Plan */}
                    {mode === 'create' ? (
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                Gói Dịch Vụ SaaS <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="subscription_plan_id"
                                value={formData.subscription_plan_id}
                                onChange={handleChange}
                                disabled={!isSuperAdmin}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                {subscriptionPlans.map((plan: any) => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name}
                                    </option>
                                ))}
                            </select>
                            {mergedErrors.subscription_plan_id && (
                                <p className="mt-1.5 text-sm text-red-600">
                                    {mergedErrors.subscription_plan_id}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                Gói Dịch Vụ SaaS Hiện Tại
                            </label>
                            {(() => {
                                const currentPlanObj = subscriptionPlans.find((p: any) => p.id === Number(formData.subscription_plan_id));
                                const displayPlanText = currentPlanObj ? currentPlanObj.name : `Gói #${formData.subscription_plan_id}`;

                                return (
                                    <Input
                                        value={displayPlanText}
                                        disabled
                                        readOnly
                                        className="!py-3 !text-sm disabled:bg-gray-100 disabled:cursor-not-allowed font-medium text-gray-900"
                                    />
                                );
                            })()}
                            <p className="mt-1.5 text-xs text-gray-500">
                                💡 Để đổi gói cước hoặc gia hạn, vui lòng sử dụng chức năng <strong>Gia Hạn / Đổi Gói Cước</strong>.
                            </p>
                        </div>
                    )}

                    {/* Status */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-800">
                            Trạng Thái Hoạt Động <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={(e) => setFormData((prev) => ({ ...prev, status: Number(e.target.value) }))}
                            disabled={!isSuperAdmin}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            {CENTER_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Expiration Date */}
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-800">
                            Ngày Hết Hạn Gói Cước
                        </label>
                        <DatePicker
                            value={formData.expires_at}
                            onChange={(val) => setFormData((prev) => ({ ...prev, expires_at: val }))}
                            disabled={!isSuperAdmin || mode === 'edit'}
                            className="!py-3 !text-sm w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        {mode === 'edit' && (
                            <p className="mt-1.5 text-xs text-gray-500">
                                💡 Ngày hết hạn được tự động cập nhật khi Gia hạn hoặc Đổi gói cước.
                            </p>
                        )}
                    </div>

                    {/* Capacity Limits */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                Giới Hạn HS
                            </label>
                            <Input
                                type="number"
                                name="max_students"
                                value={formData.max_students}
                                onChange={handleChange}
                                placeholder="200"
                                disabled={!isSuperAdmin}
                                className="!py-3 !text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                Giới Hạn Lớp
                            </label>
                            <Input
                                type="number"
                                name="max_classes"
                                value={formData.max_classes}
                                onChange={handleChange}
                                placeholder="15"
                                disabled={!isSuperAdmin}
                                className="!py-3 !text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Form Action Buttons */}
                <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
                    <Link href={backHref}>
                        <Button
                            variant="secondary"
                            size="lg"
                            icon={<ArrowLeft className="h-5 w-5" />}
                        >
                            {isSuperAdmin ? 'Danh Sách Trung Tâm' : 'Trang Chủ Dashboard'}
                        </Button>
                    </Link>
                    <Button
                        type="submit"
                        variant={mode === 'create' ? 'success' : 'edit'}
                        size="lg"
                        isLoading={isLoading}
                        icon={<Save className="h-5 w-5" />}
                    >
                        {mode === 'create' ? 'Tạo Trung Tâm' : 'Lưu Thay Đổi'}
                    </Button>
                </div>
            </Card>
        </form>
    );
};

export default CenterForm;
