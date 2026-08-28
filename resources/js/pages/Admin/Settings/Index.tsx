import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    Globe,
    Info,
    LayoutTemplate,
    Mail,
    MapPin,
    Megaphone,
    Phone,
    Save,
    Search,
    Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { MediaUploader } from '@/components/ui/MediaUploader';
import AppLayout from '@/layouts/AppLayout';

interface SeoItem {
    id?: number;
    route_name: string;
    title: string;
    description?: string | null;
    keywords?: string | null;
    og_image?: string | null;
    canonical_url?: string | null;
}

interface Props {
    settings: Record<string, string | null>;
    seo: SeoItem[];
}

const SEO_PAGES: { route: string; name: string; description: string }[] = [
    {
        route: 'home',
        name: 'Trang Chủ',
        description: 'Trang thông tin giới thiệu tổng quan hệ thống và giải pháp SaaS.',
    },
    {
        route: 'services',
        name: 'Bảng Giá & Gói Cước',
        description: 'Trang danh sách các gói cước, bảng giá dịch vụ và đăng ký dùng thử.',
    },
    {
        route: 'about',
        name: 'Về Chúng Tôi',
        description: 'Trang giới thiệu công ty, sứ mệnh giáo dục và tầm nhìn phát triển.',
    },
    {
        route: 'contact',
        name: 'Liên Hệ & Hỗ Trợ',
        description: 'Trang gửi yêu cầu tư vấn, giải đáp thắc mắc và kết nối trung tâm.',
    },
];

export default function SettingsIndex({ settings = {}, seo = [] }: Props) {
    const { flash } = usePage<any>().props;
    const [activeTab, setActiveTab] = useState<'company' | 'homepage' | 'seo'>('company');
    const [selectedSeoRoute, setSelectedSeoRoute] = useState<string>('home');

    // Khởi tạo map SEO theo route_name để dễ quản lý state
    const initialSeoMap: Record<string, SeoItem> = {};
    SEO_PAGES.forEach((page) => {
        const found = seo.find((item) => item.route_name === page.route);
        initialSeoMap[page.route] = found || {
            route_name: page.route,
            title: '',
            description: '',
            keywords: '',
            og_image: '',
            canonical_url: '',
        };
    });

    const { data, setData, post, processing, errors } = useForm({
        settings: {
            company_name: settings.company_name ?? '',
            contact_address: settings.contact_address ?? '',
            contact_phone: settings.contact_phone ?? '',
            contact_email: settings.contact_email ?? '',
            hero_title: settings.hero_title ?? '',
            hero_subtitle: settings.hero_subtitle ?? '',
            promo_banner_text: settings.promo_banner_text ?? '',
        },
        seo: initialSeoMap,
    });

    const handleSettingChange = (field: string, value: string) => {
        setData('settings', {
            ...data.settings,
            [field]: value,
        });
    };

    const handleSeoChange = (route: string, field: string, value: string) => {
        setData('seo', {
            ...data.seo,
            [route]: {
                ...data.seo[route],
                [field]: value,
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/settings', {
            preserveScroll: true,
        });
    };

    const activeSeoItem = data.seo[selectedSeoRoute] || {
        route_name: selectedSeoRoute,
        title: '',
        description: '',
        keywords: '',
        og_image: '',
        canonical_url: '',
    };

    return (
        <AppLayout>
            <Head title="Cài Đặt Hệ Thống" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                <PageHeader
                    title="Cài Đặt Hệ Thống"
                    subtitle="Quản lý cấu hình thông tin doanh nghiệp, banner trang chủ, thông tin liên hệ và thẻ SEO toàn hệ thống."
                    breadcrumbs={[
                        { label: 'Trang Chủ', href: '/dashboard' },
                        { label: 'Cài Đặt Hệ Thống' },
                    ]}
                    badge={
                        <Badge variant="active" className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Toàn cục
                        </Badge>
                    }
                    actions={
                        <Button
                            type="button"
                            variant="success"
                            onClick={handleSubmit}
                            disabled={processing}
                            className="flex items-center gap-2 shadow-sm"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                        </Button>
                    }
                />

                {/* Tabs điều hướng cấu hình */}
                <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-px">
                    <button
                        type="button"
                        onClick={() => setActiveTab('company')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                            activeTab === 'company'
                                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                        }`}
                    >
                        <Building2 className="h-4 w-4" />
                        Thông Tin Doanh Nghiệp & Liên Hệ
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('homepage')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                            activeTab === 'homepage'
                                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                        }`}
                    >
                        <LayoutTemplate className="h-4 w-4" />
                        Trang Chủ & Khuyến Mãi
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('seo')}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                            activeTab === 'seo'
                                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                        }`}
                    >
                        <Globe className="h-4 w-4" />
                        Cấu Hình SEO Metadata
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* TAB 1: DOANH NGHIỆP & LIÊN HỆ */}
                    {activeTab === 'company' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="p-6 space-y-5">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">
                                            Thông Tin Pháp Nhân & Doanh Nghiệp
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Hiển thị trên hóa đơn, email xác thực và chân trang landing page.
                                        </p>
                                    </div>
                                </div>

                                <Input
                                    label="Tên Doanh Nghiệp / Đơn Vị Quản Lý"
                                    id="company_name"
                                    name="company_name"
                                    value={data.settings.company_name}
                                    onChange={(e) => handleSettingChange('company_name', e.target.value)}
                                    placeholder="VD: Công ty Cổ phần SAM Digital"
                                    icon={<Building2 className="h-4 w-4 text-gray-400" />}
                                    error={errors['settings.company_name']}
                                />

                                <Input
                                    label="Địa Chỉ Trụ Sở Chính"
                                    id="contact_address"
                                    name="contact_address"
                                    value={data.settings.contact_address}
                                    onChange={(e) => handleSettingChange('contact_address', e.target.value)}
                                    placeholder="VD: Tòa nhà Sam Tower, Số 100 Phố Giáo Dục, Hà Nội"
                                    icon={<MapPin className="h-4 w-4 text-gray-400" />}
                                    error={errors['settings.contact_address']}
                                />
                            </Card>

                            <Card className="p-6 space-y-5">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">
                                            Kênh Tiếp Nhận & Hỗ Trợ Khách Hàng
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Kênh liên hệ trực tiếp dành cho khách hàng đăng ký mở trung tâm.
                                        </p>
                                    </div>
                                </div>

                                <Input
                                    label="Hotline Tư Vấn & CSKH"
                                    id="contact_phone"
                                    name="contact_phone"
                                    value={data.settings.contact_phone}
                                    onChange={(e) => handleSettingChange('contact_phone', e.target.value)}
                                    placeholder="VD: 0988.123.456"
                                    icon={<Phone className="h-4 w-4 text-gray-400" />}
                                    error={errors['settings.contact_phone']}
                                />

                                <Input
                                    label="Email Tiếp Nhận & Hỗ Trợ Kỹ Thuật"
                                    id="contact_email"
                                    name="contact_email"
                                    type="email"
                                    value={data.settings.contact_email}
                                    onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                                    placeholder="VD: support@sam-edu.vn"
                                    icon={<Mail className="h-4 w-4 text-gray-400" />}
                                    error={errors['settings.contact_email']}
                                />
                            </Card>
                        </div>
                    )}

                    {/* TAB 2: TRANG CHỦ & KHUYẾN MÃI */}
                    {activeTab === 'homepage' && (
                        <div className="space-y-6">
                            <Card className="p-6 space-y-5">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <LayoutTemplate className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">
                                            Banner Giới Thiệu Chính (Hero Section)
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Nội dung khối mở đầu trên trang chủ marketing của hệ thống.
                                        </p>
                                    </div>
                                </div>

                                <Input
                                    label="Tiêu Đề Banner Chính (Hero Title)"
                                    id="hero_title"
                                    name="hero_title"
                                    value={data.settings.hero_title}
                                    onChange={(e) => handleSettingChange('hero_title', e.target.value)}
                                    placeholder="VD: SAM Digital - Hệ thống Quản lý Trung Tâm Giáo Dục"
                                    error={errors['settings.hero_title']}
                                />

                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="hero_subtitle" className="text-sm font-medium text-gray-900">
                                        Mô Tả Chi Tiết Banner (Hero Subtitle)
                                    </label>
                                    <textarea
                                        id="hero_subtitle"
                                        name="hero_subtitle"
                                        rows={3}
                                        value={data.settings.hero_subtitle}
                                        onChange={(e) => handleSettingChange('hero_subtitle', e.target.value)}
                                        placeholder="Nhập đoạn mô tả ngắn gọn, thu hút về tính năng và ưu điểm nổi bật..."
                                        className="ui-input resize-y"
                                    />
                                    {errors['settings.hero_subtitle'] && (
                                        <span className="text-xs font-medium text-red-600">
                                            {errors['settings.hero_subtitle']}
                                        </span>
                                    )}
                                </div>
                            </Card>

                            <Card className="p-6 space-y-5">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                                        <Megaphone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900">
                                            Thanh Thông Báo Khuyến Mãi Đầu Trang (Announcement Banner)
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Dải thông báo ưu đãi hiển thị trên đầu toàn bộ trang landing page.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="promo_banner_text" className="text-sm font-medium text-gray-900">
                                        Nội Dung Khuyến Mãi / Thông Báo
                                    </label>
                                    <textarea
                                        id="promo_banner_text"
                                        name="promo_banner_text"
                                        rows={2}
                                        value={data.settings.promo_banner_text}
                                        onChange={(e) => handleSettingChange('promo_banner_text', e.target.value)}
                                        placeholder="VD: Chương trình Khuyến Mãi 2026 - Giảm 30% khi đăng ký gói 1 năm + 14 ngày trải nghiệm dùng thử..."
                                        className="ui-input resize-y"
                                    />
                                    {errors['settings.promo_banner_text'] && (
                                        <span className="text-xs font-medium text-red-600">
                                            {errors['settings.promo_banner_text']}
                                        </span>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* TAB 3: SEO METADATA */}
                    {activeTab === 'seo' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Cột chọn trang */}
                            <div className="lg:col-span-4 space-y-3">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider px-1">
                                    Chọn Trang Cần Cấu Hình SEO
                                </h3>
                                <div className="space-y-2">
                                    {SEO_PAGES.map((page) => {
                                        const isSelected = selectedSeoRoute === page.route;
                                        return (
                                            <button
                                                key={page.route}
                                                type="button"
                                                onClick={() => setSelectedSeoRoute(page.route)}
                                                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3 ${
                                                    isSelected
                                                        ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                                                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div
                                                    className={`p-2 rounded-lg mt-0.5 ${
                                                        isSelected
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-gray-100 text-gray-500'
                                                    }`}
                                                >
                                                    <Globe className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span
                                                            className={`text-sm font-bold truncate ${
                                                                isSelected ? 'text-emerald-950' : 'text-gray-900'
                                                            }`}
                                                        >
                                                            {page.name}
                                                        </span>
                                                        <Badge variant={isSelected ? 'active' : 'info'} className="text-[10px]">
                                                            /{page.route === 'home' ? '' : page.route}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                                                        {page.description}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 space-y-1 mt-4">
                                    <div className="flex items-center gap-1.5 font-bold">
                                        <Info className="h-4 w-4 text-blue-600 shrink-0" />
                                        <span>Gợi Ý Chuẩn SEO 2026:</span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-0.5 text-blue-700 pl-1">
                                        <li>Tiêu đề (Title) nên từ 50 - 65 ký tự.</li>
                                        <li>Mô tả (Description) nên từ 120 - 160 ký tự.</li>
                                        <li>Ảnh chia sẻ (OG Image) tỷ lệ chuẩn 1200x630 px.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Form cấu hình SEO cho trang đang chọn */}
                            <div className="lg:col-span-8">
                                <Card className="p-6 space-y-5">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                        <div>
                                            <h2 className="text-base font-bold text-gray-900">
                                                Cấu Hình Thẻ SEO: {SEO_PAGES.find((p) => p.route === selectedSeoRoute)?.name}
                                            </h2>
                                            <p className="text-xs text-gray-500">
                                                Đường dẫn chuẩn: <span className="font-mono text-emerald-700">/{selectedSeoRoute === 'home' ? '' : selectedSeoRoute}</span>
                                            </p>
                                        </div>
                                        <Badge variant="pending">
                                            Route: {selectedSeoRoute}
                                        </Badge>
                                    </div>

                                    <Input
                                        label="Tiêu Đề Trang (Meta Title)"
                                        id={`seo_${selectedSeoRoute}_title`}
                                        value={activeSeoItem.title ?? ''}
                                        onChange={(e) => handleSeoChange(selectedSeoRoute, 'title', e.target.value)}
                                        placeholder="VD: Giải Pháp Quản Lý Trung Tâm Giáo Dục - SAM Digital"
                                        icon={<Globe className="h-4 w-4 text-gray-400" />}
                                    />

                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <label htmlFor={`seo_${selectedSeoRoute}_desc`} className="text-sm font-medium text-gray-900">
                                                Thẻ Mô Tả (Meta Description)
                                            </label>
                                            <span className="text-[11px] text-gray-400">
                                                {(activeSeoItem.description ?? '').length} ký tự
                                            </span>
                                        </div>
                                        <textarea
                                            id={`seo_${selectedSeoRoute}_desc`}
                                            rows={3}
                                            value={activeSeoItem.description ?? ''}
                                            onChange={(e) => handleSeoChange(selectedSeoRoute, 'description', e.target.value)}
                                            placeholder="Tóm tắt ngắn gọn nội dung trang phục vụ hiển thị kết quả tìm kiếm Google..."
                                            className="ui-input resize-y"
                                        />
                                    </div>

                                    <Input
                                        label="Từ Khóa Tìm Kiếm (Meta Keywords - Phân cách bằng dấu phẩy)"
                                        id={`seo_${selectedSeoRoute}_keywords`}
                                        value={activeSeoItem.keywords ?? ''}
                                        onChange={(e) => handleSeoChange(selectedSeoRoute, 'keywords', e.target.value)}
                                        placeholder="VD: quản lý trung tâm, học sinh, điểm danh, thời khóa biểu"
                                        icon={<Search className="h-4 w-4 text-gray-400" />}
                                    />

                                    <MediaUploader
                                        label="Ảnh Đại Diện Chia Sẻ Mạng Xã Hội (OG Image - Khuyên dùng 1200x630px)"
                                        value={activeSeoItem.og_image ?? ''}
                                        onChange={(url) => handleSeoChange(selectedSeoRoute, 'og_image', url)}
                                        objectType="seo"
                                        objectId={selectedSeoRoute}
                                        folder="seo/og_images"
                                        placeholder="Chọn tải ảnh lên từ máy hoặc dán link URL..."
                                    />

                                    <Input
                                        label="Đường Dẫn Chuẩn Tối Ưu Tìm Kiếm (Canonical URL)"
                                        id={`seo_${selectedSeoRoute}_canonical`}
                                        value={activeSeoItem.canonical_url ?? ''}
                                        onChange={(e) => handleSeoChange(selectedSeoRoute, 'canonical_url', e.target.value)}
                                        placeholder="VD: https://sam-edu.vn"
                                    />
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Thanh nút Lưu cố định dưới chân form */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <Button
                            type="submit"
                            variant="success"
                            disabled={processing}
                            className="flex items-center gap-2 shadow-sm px-6 py-2.5"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Đang lưu cài đặt...' : 'Lưu Toàn Bộ Cài Đặt'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
