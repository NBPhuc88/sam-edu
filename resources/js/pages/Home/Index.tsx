import { Link, usePage } from '@inertiajs/react';
import {
    Sparkles,
    Building2,
    GraduationCap,
    CreditCard,
    BarChart3,
    Check,
    ArrowRight,
    Tag,
    MessageSquare,
    Search,
    LayoutDashboard,
} from 'lucide-react';
import React from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PublicLayout from '../../layouts/PublicLayout';

interface Plan {
    id: number;
    code: string;
    name: string;
    price: number;
    duration_days: number;
    max_students: number | null;
    max_classes: number | null;
    features: string[] | null;
    badge_text: string | null;
    is_featured: boolean;
}

export const Index: React.FC<any> = ({ hero, promotionBanner, plans }) => {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    return (
        <PublicLayout
            title="Giải Pháp Quản Lý Giáo Dục Đa Trung Tâm - Giáo Dục Sam"
            description="Giải Pháp Quản Lý Giáo Dục Đa Trung Tâm đột phá 2026. Tối ưu hóa quy trình quản lý học sinh, xếp lịch học, điểm danh thông minh và tự động gia hạn gói dịch vụ qua ZaloPay QR Code v2."
            keywords="Giải Pháp Quản Lý Giáo Dục, phần mềm quản lý trung tâm, quản lý học sinh, điểm danh thông minh, Sam Edu, Giáo dục Sam, ZaloPay"
        >
            {/* Promotion Alert Banner */}
            {promotionBanner && (
                <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2.5 text-center text-xs font-semibold text-white shadow-xs sm:text-sm">
                    <Tag className="h-4 w-4 shrink-0" />
                    <span>{promotionBanner}</span>
                </div>
            )}

            {/* Hero Section */}
            <section className="border-b border-gray-100 bg-gradient-to-b from-emerald-50/50 via-white to-white py-16 sm:py-24">
                <div className="mx-auto max-w-7xl space-y-6 px-4 text-center sm:px-6 lg:px-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Nền tảng Quản lý Giáo dục Đa trung tâm 2026</span>
                    </div>

                    <h1 className="mx-auto max-w-4xl text-3xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                        {hero?.title || 'Giải Pháp Quản Lý Giáo Dục'}
                    </h1>

                    <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
                        {hero?.subtitle ||
                            'Hệ thống tối ưu hóa quy trình quản lý học sinh, sắp xếp lịch học, điểm danh thông minh và tự động gia hạn gói dịch vụ qua ZaloPay QR Code.'}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                        {user ? (
                            <Link href="/dashboard">
                                <Button
                                    variant="success"
                                    size="lg"
                                    icon={<LayoutDashboard className="h-5 w-5" />}
                                >
                                    Truy cập Trang Quản trị (Dashboard)
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/contact">
                                    <Button
                                        variant="success"
                                        size="lg"
                                        icon={<Sparkles className="h-5 w-5" />}
                                    >
                                        Dùng thử miễn phí 14 ngày
                                    </Button>
                                </Link>
                                <Link href="/login">
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        icon={<ArrowRight className="h-5 w-5" />}
                                    >
                                        Đăng nhập Hệ thống
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Core Features Section */}
            <section className="bg-white py-16">
                <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                            Tính Năng Đột Phá Cho Trung Tâm
                        </h2>
                        <p className="mx-auto max-w-xl text-sm text-gray-500">
                            Đầy đủ công cụ vận hành từ quản lý lớp học, giáo
                            viên đến thanh toán tự động
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Card className="space-y-3 border-gray-200 p-6 transition-all hover:border-emerald-300">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">
                                Quản Lý Đa Trung Tâm
                            </h3>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Quản lý phân quyền chính xác cho nhiều cơ sở đào
                                tạo trên một tài khoản duy nhất.
                            </p>
                        </Card>

                        <Card className="relative space-y-3 border-emerald-200 bg-emerald-50/30 p-6 transition-all hover:border-emerald-400">
                            <div className="absolute top-3 right-3">
                                <Badge variant="active">
                                    Tính Năng Nổi Bật
                                </Badge>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">
                                Nhóm Chat Lớp Trực Tuyến
                            </h3>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Trao đổi thông tin tức thì giữa Quản lý, Giáo
                                viên và Học sinh trong từng lớp học với tính
                                năng ghim thông báo quan trọng.
                            </p>
                        </Card>

                        <Card className="space-y-3 border-gray-200 p-6 transition-all hover:border-blue-300">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">
                                Điểm Danh & Học Sinh
                            </h3>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Theo dõi sĩ số học sinh từng lớp, lưu thông tin
                                phụ huynh và xuất nhập danh sách dễ dàng qua
                                file Excel/CSV.
                            </p>
                        </Card>

                        <Card className="space-y-3 border-gray-200 p-6 transition-all hover:border-amber-300">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <CreditCard className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">
                                Thanh Toán ZaloPay
                            </h3>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Thanh toán và tự động gia hạn dịch vụ nhanh
                                chóng qua cổng quét mã ZaloPay QR Code tiện lợi.
                            </p>
                        </Card>

                        <Card className="space-y-3 border-gray-200 p-6 transition-all hover:border-purple-300">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                                <BarChart3 className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">
                                Biểu Đồ Thống Kê
                            </h3>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Báo cáo biểu đồ trực quan phân tích số lượng học
                                sinh, hiệu quả giảng dạy và biểu đồ tăng trưởng
                                trung tâm.
                            </p>
                        </Card>

                        <Card className="space-y-3 border-gray-200 p-6 transition-all hover:border-rose-300">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                                <Search className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">
                                Tìm Kiếm Thông Minh Siêu Tốc
                            </h3>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Tra cứu thông tin học sinh, giáo viên, phụ huynh
                                và lịch học tức thì chỉ với một từ khóa.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Pricing Section (Dynamically loaded from Database) */}
            <section className="border-t border-b border-gray-200 bg-slate-50 py-16">
                <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                            Gói Cước & Dịch Vụ Phần Mềm
                        </h2>
                        <p className="mx-auto max-w-xl text-sm text-gray-500">
                            Lựa chọn gói phù hợp với quy mô trung tâm của bạn
                            với chi phí tối ưu nhất
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {plans &&
                            plans.map((plan: Plan) => (
                                <div
                                    key={plan.id}
                                    className={`ui-card relative flex flex-col justify-between p-6 transition-all ${
                                        plan.is_featured
                                            ? 'border-2 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    {plan.badge_text && (
                                        <div className="absolute -top-3.5 right-4">
                                            <Badge
                                                variant={
                                                    plan.is_featured
                                                        ? 'active'
                                                        : 'info'
                                                }
                                            >
                                                {plan.badge_text}
                                            </Badge>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {plan.name}
                                            </h3>
                                            <div className="mt-2 flex flex-wrap items-baseline gap-1">
                                                <span className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
                                                    {plan.price === 0
                                                        ? 'Miễn phí'
                                                        : `${plan.price.toLocaleString('vi-VN')}đ`}
                                                </span>
                                                {plan.price > 0 && (
                                                    <span className="text-xs font-medium text-gray-500">
                                                        {plan.duration_days >= 365
                                                            ? '/ năm'
                                                            : plan.duration_days >= 30
                                                              ? '/ tháng'
                                                              : `/${plan.duration_days} ngày`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <ul className="space-y-2 border-t border-gray-100 pt-2 text-xs text-gray-600">
                                            {plan.features &&
                                                plan.features.map(
                                                    (
                                                        feature: string,
                                                        idx: number,
                                                    ) => (
                                                        <li
                                                            key={idx}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                                                            <span>
                                                                {feature}
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                        </ul>
                                    </div>

                                    <div className="pt-6">
                                        <Link href="/contact">
                                            <Button
                                                variant={
                                                    plan.is_featured
                                                        ? 'success'
                                                        : 'secondary'
                                                }
                                                className="w-full justify-center"
                                            >
                                                Đăng ký gói
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
};

export default Index;
