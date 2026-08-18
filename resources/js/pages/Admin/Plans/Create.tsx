import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    DollarSign,
    CheckCircle2,
    Layers,
    Users,
    Eye,
    Shield,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import AppLayout from '@/layouts/AppLayout';

interface Props {
    errors?: Record<string, string>;
}

const DEFAULT_FEATURE_SUGGESTIONS = [
    'Quản lý 1 trung tâm đào tạo',
    'Điểm danh & Quản lý lớp học thông minh',
    'Biểu đồ thống kê Recharts nâng cao',
    'Cổng thanh toán ZaloPay QR Code v2',
    'Nhập xuất dữ liệu Excel/CSV',
    'Hỗ trợ kỹ thuật 24/7 qua Hotline/Email',
];

export default function PlanCreate({ errors = {} }: Props) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [price, setPrice] = useState<string>('500000');
    const [yearlyPrice, setYearlyPrice] = useState<string>('4800000');
    const [durationDays, setDurationDays] = useState<string>('30');
    const [maxStudents, setMaxStudents] = useState<string>('200');
    const [maxClasses, setMaxClasses] = useState<string>('15');
    const [badgeText, setBadgeText] = useState('');
    const [isFeatured, setIsFeatured] = useState(false);

    // Dynamic features list
    const [features, setFeatures] = useState<string[]>([
        'Quản lý 1 trung tâm đào tạo',
        'Điểm danh & Quản lý lớp học thông minh',
        'Hỗ trợ kỹ thuật 24/7',
    ]);
    const [newFeatureText, setNewFeatureText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddFeature = (text?: string) => {
        const featToAdd = text || newFeatureText.trim();

        if (!featToAdd) {
return;
}

        if (!features.includes(featToAdd)) {
            setFeatures([...features, featToAdd]);
        }

        if (!text) {
setNewFeatureText('');
}
    };

    const handleRemoveFeature = (index: number) => {
        setFeatures(features.filter((_, i) => i !== index));
    };

    const handleFeatureChange = (index: number, value: string) => {
        const updated = [...features];
        updated[index] = value;
        setFeatures(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/plans',
            {
                name,
                code: code || undefined,
                price: Number(price) || 0,
                yearly_price: yearlyPrice ? Number(yearlyPrice) : 0,
                duration_days: Number(durationDays) || 30,
                max_students: maxStudents ? Number(maxStudents) : null,
                max_classes: maxClasses ? Number(maxClasses) : null,
                badge_text: badgeText || null,
                is_featured: isFeatured,
                features: features.filter((f) => f.trim() !== ''),
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const parsedPrice = Number(price) || 0;
    const parsedYearlyPrice = Number(yearlyPrice) || 0;
    const yearlySavingsPercent =
        parsedPrice > 0 && parsedYearlyPrice > 0
            ? Math.round((1 - parsedYearlyPrice / (parsedPrice * 12)) * 100)
            : 0;

    return (
        <AppLayout title="Tạo Gói Dịch Vụ Mới">
            <Head title="Tạo Gói Cước SaaS Mới" />

            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header & Back Link */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
                            <Link href="/plans" className="hover:text-emerald-700 transition-colors">
                                Cấu Hình Gói SaaS
                            </Link>
                            <span>/</span>
                            <span className="text-emerald-700 font-semibold">Tạo Mới</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Plus className="h-7 w-7 text-emerald-600" />
                            Tạo Gói Dịch Vụ SaaS Mới
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Thiết lập cấu hình gói cước phần mềm, giá theo tháng và giá theo năm cho khách hàng.
                        </p>
                    </div>

                    <Link href="/plans">
                        <Button variant="secondary" size="md" icon={<ArrowLeft className="h-4 w-4" />}>
                            Quay lại danh sách
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left: Form Fields (8 Cols) */}
                    <div className="space-y-6 lg:col-span-8">
                        {/* Section 1: Thông tin cơ bản */}
                        <Card className="p-6 bg-white border border-gray-200 shadow-xs space-y-5">
                            <div className="border-b border-gray-100 pb-3">
                                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-emerald-600" />
                                    Thông Tin Gói Cước
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Đặt tên hiển thị và mã nhận diện cho gói dịch vụ.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Plan Name */}
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Tên Gói Cước <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Ví dụ: Gói Tiêu Chuẩn (Standard), Gói Pro Doanh Nghiệp"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        error={errors.name}
                                        required
                                    />
                                </div>

                                {/* Code */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Mã Định Danh (Code)
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Để trống để tự động sinh mã (VD: PLAN000000001)"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                        error={errors.code}
                                    />
                                    <span className="text-[11px] text-gray-400 mt-1 block">
                                        Dùng trong hệ thống hoặc cổng thanh toán. Để trống nếu muốn tự sinh.
                                    </span>
                                </div>

                                {/* Badge Text */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Huy Hiệu Nổi Bật (Badge Text)
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="Ví dụ: PHỔ BIẾN, TIẾT KIỆM 20%, DÙNG THỬ"
                                        value={badgeText}
                                        onChange={(e) => setBadgeText(e.target.value)}
                                        error={errors.badge_text}
                                    />
                                </div>
                            </div>

                            {/* Is Featured Checkbox */}
                            <div className="flex items-center gap-3 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_featured"
                                    checked={isFeatured}
                                    onChange={(e) => setIsFeatured(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <label htmlFor="is_featured" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Đánh dấu là <strong>Gói nổi bật (Featured / Recommended)</strong> - hiển thị viền xanh & huy hiệu trên trang giá
                                </label>
                            </div>
                        </Card>

                        {/* Section 2: Cấu hình Giá & Thời hạn */}
                        <Card className="p-6 bg-white border border-gray-200 shadow-xs space-y-5">
                            <div className="border-b border-gray-100 pb-3">
                                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-emerald-600" />
                                    Cấu Hình Giá Bán & Thời Hạn
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Thiết lập giá mua theo tháng và giá mua trọn gói theo năm (tích hợp trong 1 gói).
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {/* Monthly Price */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Giá Theo Tháng (VNĐ) <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        placeholder="500000 (0 = Miễn phí)"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        error={errors.price}
                                        required
                                    />
                                    <span className="text-[11px] text-gray-400 mt-1 block">
                                        {parsedPrice === 0 ? 'Miễn phí (0đ)' : `${parsedPrice.toLocaleString('vi-VN')} đ/tháng`}
                                    </span>
                                </div>

                                {/* Yearly Price */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Giá Mua Theo Năm (VNĐ)
                                    </label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        placeholder="4800000"
                                        value={yearlyPrice}
                                        onChange={(e) => setYearlyPrice(e.target.value)}
                                        error={errors.yearly_price}
                                    />
                                    <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
                                        {parsedYearlyPrice > 0
                                            ? `${parsedYearlyPrice.toLocaleString('vi-VN')} đ/năm ${
                                                  yearlySavingsPercent > 0 ? `(Tiết kiệm ${yearlySavingsPercent}%)` : ''
                                              }`
                                            : '0đ hoặc để trống nếu không áp dụng'}
                                    </span>
                                </div>

                                {/* Duration Days */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Chu Kỳ Mặc Định (Ngày) <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="30 (tháng) hoặc 14 (trial)"
                                        value={durationDays}
                                        onChange={(e) => setDurationDays(e.target.value)}
                                        error={errors.duration_days}
                                        required
                                    />
                                    <span className="text-[11px] text-gray-400 mt-1 block">
                                        VD: 14 ngày (Dùng thử), 30 ngày (Gói tháng)
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {/* Section 3: Giới hạn học sinh & Lớp học */}
                        <Card className="p-6 bg-white border border-gray-200 shadow-xs space-y-5">
                            <div className="border-b border-gray-100 pb-3">
                                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-emerald-600" />
                                    Hạn Mức Sử Dụng
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Giới hạn quy mô trung tâm theo gói (để trống = không giới hạn).
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Số Học Sinh Tối Đa
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Để trống nếu không giới hạn"
                                        value={maxStudents}
                                        onChange={(e) => setMaxStudents(e.target.value)}
                                        error={errors.max_students}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Số Lớp Học Tối Đa
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        placeholder="Để trống nếu không giới hạn"
                                        value={maxClasses}
                                        onChange={(e) => setMaxClasses(e.target.value)}
                                        error={errors.max_classes}
                                    />
                                </div>
                            </div>
                        </Card>

                        {/* Section 4: Danh sách tính năng */}
                        <Card className="p-6 bg-white border border-gray-200 shadow-xs space-y-5">
                            <div className="border-b border-gray-100 pb-3">
                                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    Danh Sách Tính Năng Của Gói
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Thêm các đầu mục tính năng hiển thị cho khách hàng khi chọn gói cước.
                                </p>
                            </div>

                            {/* Features list */}
                            <div className="space-y-2">
                                {features.map((feat, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold">
                                            {idx + 1}
                                        </div>
                                        <Input
                                            type="text"
                                            value={feat}
                                            onChange={(e) => handleFeatureChange(idx, e.target.value)}
                                            placeholder={`Tính năng ${idx + 1}`}
                                            className="flex-1 text-sm"
                                        />
                                        <Button
                                            type="button"
                                            variant="danger"
                                            size="sm"
                                            icon={<Trash2 className="h-3.5 w-3.5" />}
                                            onClick={() => handleRemoveFeature(idx)}
                                            title="Xóa dòng"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Add new feature input */}
                            <div className="flex items-center gap-2 pt-2">
                                <Input
                                    type="text"
                                    placeholder="Nhập tính năng mới rồi bấm Thêm..."
                                    value={newFeatureText}
                                    onChange={(e) => setNewFeatureText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddFeature();
                                        }
                                    }}
                                    className="flex-1 text-sm"
                                />
                                <Button
                                    type="button"
                                    variant="success"
                                    size="sm"
                                    icon={<Plus className="h-4 w-4" />}
                                    onClick={() => handleAddFeature()}
                                >
                                    Thêm Tính Năng
                                </Button>
                            </div>

                            {/* Suggestions */}
                            <div className="pt-2">
                                <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                                    Gợi ý tính năng nhanh (click để thêm):
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {DEFAULT_FEATURE_SUGGESTIONS.map((sug, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleAddFeature(sug)}
                                            className="rounded-md border border-dashed border-gray-300 bg-slate-50 px-2 py-1 text-xs text-gray-600 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                                        >
                                            + {sug}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Submit Action */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <Link href="/plans">
                                <Button variant="secondary" size="md">
                                    Hủy Bỏ
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                variant="success"
                                size="md"
                                isLoading={isSubmitting}
                                icon={<Save className="h-4 w-4" />}
                                className="shadow-sm hover:shadow-md transition-shadow"
                            >
                                Lưu Gói Cước Mới
                            </Button>
                        </div>
                    </div>

                    {/* Right: Live Preview Card (4 Cols) */}
                    <div className="space-y-4 lg:col-span-4">
                        <div className="sticky top-20 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                                    <Eye className="h-4 w-4 text-emerald-600" />
                                    Xem Trước Trực Quan (Live Preview)
                                </h3>
                            </div>

                            {/* Preview Pricing Card */}
                            <div
                                className={`rounded-2xl border p-6 shadow-sm transition-all ${
                                    isFeatured
                                        ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/30'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                {badgeText && (
                                    <div className="mb-3">
                                        <Badge variant={isFeatured ? 'active' : 'info'}>
                                            {badgeText}
                                        </Badge>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900">
                                            {name || 'Tên Gói Cước'}
                                        </h4>
                                        <p className="font-mono text-xs text-gray-400 mt-0.5">
                                            Mã: {code || 'plan_auto_code'}
                                        </p>
                                    </div>

                                    {/* Monthly Price Display */}
                                    <div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-extrabold text-gray-900">
                                                {parsedPrice === 0
                                                    ? 'Miễn phí'
                                                    : `${parsedPrice.toLocaleString('vi-VN')}đ`}
                                            </span>
                                            {parsedPrice > 0 && (
                                                <span className="text-xs font-semibold text-gray-500">
                                                    /{durationDays || 30} ngày
                                                </span>
                                            )}
                                        </div>

                                        {/* Yearly Option if set */}
                                        {parsedYearlyPrice > 0 && (
                                            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 text-xs text-emerald-900">
                                                <div className="font-semibold flex items-center justify-between">
                                                    <span>Hoặc mua trọn gói năm:</span>
                                                    <span className="font-extrabold text-emerald-700">
                                                        {parsedYearlyPrice.toLocaleString('vi-VN')}đ
                                                    </span>
                                                </div>
                                                {yearlySavingsPercent > 0 && (
                                                    <div className="mt-0.5 text-[11px] text-emerald-700">
                                                        💡 Tiết kiệm <strong>{yearlySavingsPercent}%</strong> so với thanh toán từng tháng!
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Limits */}
                                    <div className="space-y-1 rounded-lg border border-gray-100 bg-slate-50 p-3 text-xs text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5 text-gray-400" />
                                            <span>Sĩ số tối đa: <strong>{maxStudents ? `${maxStudents} HS` : 'Không giới hạn'}</strong></span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Layers className="h-3.5 w-3.5 text-gray-400" />
                                            <span>Lớp học tối đa: <strong>{maxClasses ? `${maxClasses} Lớp` : 'Không giới hạn'}</strong></span>
                                        </div>
                                    </div>

                                    {/* Features list */}
                                    <div className="border-t border-gray-100 pt-3">
                                        <p className="text-xs font-bold text-gray-900 mb-2">Bao gồm các tính năng:</p>
                                        <ul className="space-y-1.5 text-xs text-gray-700">
                                            {features.length === 0 ? (
                                                <li className="text-gray-400 italic">Chưa có tính năng</li>
                                            ) : (
                                                features.map((feat, i) => (
                                                    <li key={i} className="flex items-start gap-1.5">
                                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                        <span>{feat}</span>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
