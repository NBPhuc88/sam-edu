import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import React, { useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import DatePicker from '../ui/DatePicker';
import Input from '../ui/Input';
import { toISODateString } from '@/lib/date';

export interface CenterFormData {
    id?: number;
    code: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    status: number;
    subscription_plan: string;
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

    const calculateExpirationDate = (planCode: string): string => {
        const selectedPlan = subscriptionPlans.find(
            (p: any) => p.code === planCode,
        );
        const date = new Date();

        if (selectedPlan?.duration_days) {
            date.setDate(date.getDate() + Number(selectedPlan.duration_days));
        } else if (planCode === 'trial') {
            date.setDate(date.getDate() + 30);
        } else {
            date.setDate(date.getDate() + 30);
        }

        return date.toISOString().split('T')[0];
    };

    // Form state initialized with initial values or defaults
    const [formData, setFormData] = useState<CenterFormData>(() => {
        const defaultPlan = initialValues?.subscription_plan || 'basic_5';
        const defaultExpires = initialValues?.expires_at
            ? toISODateString(initialValues.expires_at)
            : mode === 'create'
              ? calculateExpirationDate(defaultPlan)
              : '';

        const rawStatus = initialValues?.status;
        const normalizedStatus = rawStatus === 0 ? 0 : rawStatus === 2 ? 2 : rawStatus === 3 ? 3 : rawStatus === 4 ? 4 : 1;

        return {
            code: initialValues?.code || '',
            name: initialValues?.name || '',
            phone: initialValues?.phone || '',
            email: initialValues?.email || '',
            address: initialValues?.address || '',
            status: normalizedStatus,
            subscription_plan: defaultPlan,
            expires_at: defaultExpires,
            max_students: initialValues?.max_students ?? 200,
            max_classes: initialValues?.max_classes ?? 15,
        };
    });

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    ) => {
        const { name, value } = e.target;

        if (name === 'subscription_plan') {
            const selectedPlan = subscriptionPlans.find(
                (p: any) => p.code === value,
            );
            const autoExpiresAt = calculateExpirationDate(value);

            setFormData((prev) => ({
                ...prev,
                subscription_plan: value,
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

        if (mode === 'create') {
            // Send full form payload on creation
            onSubmit(formData);
        } else {
            // Mode EDIT: Send ONLY changed / dirty fields
            const changedPayload: Partial<CenterFormData> = {};

            Object.keys(formData).forEach((key) => {
                const k = key as keyof CenterFormData;
                const currentValue = formData[k];
                const originalValue = initialValues?.[k];

                // Normalize date string for fair comparison if key is expires_at
                if (k === 'expires_at') {
                    const origDateStr = originalValue ? toISODateString(originalValue as string) : '';

                    if (currentValue !== origDateStr) {
                        changedPayload[k] = currentValue as any;
                    }
                } else if (
                    currentValue !== originalValue &&
                    currentValue !== (originalValue ?? '')
                ) {
                    changedPayload[k] = currentValue as any;
                }
            });

            // Always pass at least empty or dirty payload
            onSubmit(changedPayload);
        }
    };

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
                        {errors.code && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.code}
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
                        {errors.name && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.name}
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
                        {errors.phone && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.phone}
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
                        {errors.email && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.email}
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
                        {errors.address && (
                            <p className="mt-1.5 text-sm text-red-600">
                                {errors.address}
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
                                name="subscription_plan"
                                value={formData.subscription_plan}
                                onChange={handleChange}
                                disabled={!isSuperAdmin}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                {subscriptionPlans.map((plan: any) => (
                                    <option key={plan.id} value={plan.code}>
                                        {plan.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-800">
                                Gói Dịch Vụ SaaS Hiện Tại
                            </label>
                            {(() => {
                                const currentPlanObj = subscriptionPlans.find((p: any) => p.code === formData.subscription_plan || p.id === formData.subscription_plan || String(p.id) === String(formData.subscription_plan));
                                const displayPlanText = currentPlanObj ? currentPlanObj.name : formData.subscription_plan;

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
                            <option value={1}>
                                Đang hoạt động
                            </option>
                            <option value={0}>
                                Tạm dừng / Khóa
                            </option>
                            <option value={2}>
                                Dùng thử
                            </option>
                            <option value={3}>
                                Chờ thanh toán
                            </option>
                            <option value={4}>
                                Đã hết hạn
                            </option>
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
