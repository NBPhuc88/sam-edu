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
    yearly_price?: number | null;
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
            title="Giải Pháp Quản Lý Trung Tâm Giáo Dục - SAM Digital"
            description="Giải Pháp Quản Lý Trung Tâm Giáo Dục đột phá 2026. Tối ưu hóa quy trình quản lý học sinh, xếp lịch học, điểm danh thông minh, khảo thí 9 dạng câu hỏi và chat lớp học thời gian thực."
            keywords="Giải Pháp Quản Lý Giáo Dục, phần mềm quản lý trung tâm, quản lý học sinh, điểm danh thông minh, khảo thí trực tuyến, SAM Digital"
        >
            {/* Promotion Alert Banner */}
            {promotionBanner && (
                <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2.5 text-center text-xs font-semibold text-white shadow-xs sm:text-sm">
                    <Tag className="h-4 w-4 shrink-0" />
                    <span>{promotionBanner}</span>
                </div>
            )}

            {/* Hero Section */}
            <section className="border-b border-gray-100 bg-gradient-to-b from-emerald-50/50 via-white to-white py-12 sm:py-20 lg:py-24">
                <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6 px-4 text-center sm:px-6 lg:px-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Nền tảng Quản lý Trung tâm Giáo dục 2026</span>
                    </div>

                    <h1 className="mx-auto max-w-4xl text-2xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                        {hero?.title || 'Giải Pháp Quản Lý Giáo Dục'}
                    </h1>

                    <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-lg">
                        {hero?.subtitle ||
                            'Hệ thống tối ưu hóa quy trình quản lý học sinh, sắp xếp lịch học, điểm danh thông minh, khảo thí 9 dạng câu hỏi và chat lớp học trực tuyến.'}
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-3 max-w-sm mx-auto sm:max-w-none">
                        {user ? (
                            <Link href="/dashboard" className="w-full sm:w-auto">
                                <Button
                                    variant="success"
                                    size="lg"
                                    className="w-full justify-center"
                                    icon={
                                        <LayoutDashboard className="h-5 w-5" />
                                    }
                                >
                                    Truy cập Trang Quản trị (Dashboard)
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/contact" className="w-full sm:w-auto">
                                    <Button
                                        variant="success"
                                        size="lg"
                                        className="w-full justify-center"
                                        icon={<Sparkles className="h-5 w-5" />}
                                    >
                                        Dùng thử miễn phí 30 ngày
                                    </Button>
                                </Link>
                                <Link href="/login" className="w-full sm:w-auto">
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        className="w-full justify-center"
                                        icon={
                                            <ArrowRight className="h-5 w-5" />
                                        }
                                    >
                                        Đăng nhập Hệ thống
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Core Features Section (Phân tầng theo Gói Cước & Dịch Vụ) */}
            <section className="bg-white py-12 sm:py-20 lg:py-24">
                <div className="mx-auto max-w-7xl space-y-10 sm:space-y-12 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-2 sm:space-y-3 text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Hệ Thống Tính Năng Chuẩn Hóa 2026</span>
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                            Tính Năng Đột Phá Cho Trung Tâm
                        </h2>
                        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-600">
                            Được thiết kế theo kiến trúc module hóa linh hoạt: Từ chuẩn hóa vận hành học vụ đến hệ thống khảo thí trực tuyến 9 dạng câu hỏi và chat lớp học thời gian thực.
                        </p>
                    </div>

                    {/* Feature Categories Showcase */}
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                        {/* Column 1: Gói Cơ Bản - Vận Hành & Học Vụ */}
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                                        <Building2 className="h-3.5 w-3.5" />
                                        GÓI CƠ BẢN
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Vận Hành &amp; Học Vụ Chuẩn Hóa
                                    </h3>
                                </div>
                                <span className="text-xs font-semibold text-gray-500">
                                    Từ 250.000đ/tháng
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Card className="space-y-2.5 border-gray-100 bg-slate-50/60 p-4.5 shadow-none transition-all hover:bg-white hover:border-emerald-200 hover:shadow-xs">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900">
                                        Đa Cơ Sở &amp; Phân Quyền
                                    </h4>
                                    <p className="text-xs leading-relaxed text-gray-500">
                                        Quản lý tập trung học sinh, giáo viên, phòng học và môn học theo từng trung tâm độc lập.
                                    </p>
                                </Card>

                                <Card className="space-y-2.5 border-gray-100 bg-slate-50/60 p-4.5 shadow-none transition-all hover:bg-white hover:border-emerald-200 hover:shadow-xs">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                        <Tag className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900">
                                        Thời Khóa Biểu Thông Minh
                                    </h4>
                                    <p className="text-xs leading-relaxed text-gray-500">
                                        Tự động sinh ca học định kỳ, tự động loại trừ ngày lễ và hỗ trợ báo nghỉ/đổi lịch/dạy bù linh hoạt.
                                    </p>
                                </Card>

                                <Card className="space-y-2.5 border-gray-100 bg-slate-50/60 p-4.5 shadow-none transition-all hover:bg-white hover:border-emerald-200 hover:shadow-xs">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                                        <GraduationCap className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900">
                                        Điểm Danh &amp; Chuyên Cần
                                    </h4>
                                    <p className="text-xs leading-relaxed text-gray-500">
                                        Điểm danh nhanh theo ca học, theo dõi tỉ lệ vắng mặt và gửi nhận xét cá nhân tới học sinh.
                                    </p>
                                </Card>

                                <Card className="space-y-2.5 border-gray-100 bg-slate-50/60 p-4.5 shadow-none transition-all hover:bg-white hover:border-emerald-200 hover:shadow-xs">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900">
                                        Học Phí &amp; Đóng Từng Đợt
                                    </h4>
                                    <p className="text-xs leading-relaxed text-gray-500">
                                        Theo dõi mức học phí từng lớp, ghi nhận các đợt đóng tiền của học sinh và quản lý công nợ rõ ràng.
                                    </p>
                                </Card>
                            </div>
                        </div>

                        {/* Column 2: Gói Nâng Cao - Khảo Thí & Tương Tác */}
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-700">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        GÓI NÂNG CAO · TOÀN DIỆN
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Khảo Thí Trực Tuyến &amp; Tương Tác
                                    </h3>
                                </div>
                                <span className="text-xs font-bold text-teal-700">
                                    Bao gồm toàn bộ Gói Cơ Bản
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Card className="space-y-2.5 border-gray-100 bg-slate-50/60 p-4.5 shadow-none transition-all hover:bg-white hover:border-teal-200 hover:shadow-xs">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                                        <Search className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900">
                                        Đề Thi 9 Dạng Câu Hỏi
                                    </h4>
                                    <p className="text-xs leading-relaxed text-gray-500">
                                        Trắc nghiệm, điền từ, kéo thả từ, nối chữ, nối hình ảnh, sắp xếp thứ tự, phát hiện lỗi sai, nghe âm thanh &amp; tự luận.
                                    </p>
                                </Card>

                                <Card className="space-y-2.5 border-gray-100 bg-slate-50/60 p-4.5 shadow-none transition-all hover:bg-white hover:border-teal-200 hover:shadow-xs">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                                        <BarChart3 className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900">
                                        Phòng Thi Trực Tuyến &amp; Thi Thử
                                    </h4>
                                    <p className="text-xs leading-relaxed text-gray-500">
                                        Học sinh làm bài trực tuyến, tự động lưu câu trả lời chống mất dữ liệu, chấm điểm tự động và chấm bài tự luận.
                                    </p>
                                </Card>

                                <Card className="space-y-2.5 border-gray-100 bg-slate-50/60 p-4.5 shadow-none transition-all hover:bg-white hover:border-teal-200 hover:shadow-xs">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                                        <MessageSquare className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900">
                                        Nhóm Chat Lớp Trực Tuyến
                                    </h4>
                                    <p className="text-xs leading-relaxed text-gray-500">
                                        Trao đổi tin nhắn thuận tiện giữa Quản trị viên, Giáo viên và Học sinh trong từng lớp học, ghim thông báo bài học.
                                    </p>
                                </Card>

                                <Card className="space-y-2.5 border-gray-100 bg-slate-50/60 p-4.5 shadow-none transition-all hover:bg-white hover:border-teal-200 hover:shadow-xs">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                        <ArrowRight className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900">
                                        Xuất Danh Sách &amp; Phiếu Điểm
                                    </h4>
                                    <p className="text-xs leading-relaxed text-gray-500">
                                        Xuất danh sách học sinh, giáo viên ra file Excel/CSV và xem phiếu điểm cá nhân của học sinh.
                                    </p>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section (Dynamically loaded from Database) */}
            <section id="pricing-section" className="border-t border-b border-gray-200 bg-slate-50 py-12 sm:py-16 scroll-mt-16">
                <div className="mx-auto max-w-7xl space-y-8 sm:space-y-12 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-2 text-center">
                        <h2 className="text-xl font-bold text-gray-900 sm:text-3xl">
                            Gói Cước &amp; Dịch Vụ Phần Mềm
                        </h2>
                        <p className="mx-auto max-w-xl text-xs sm:text-sm text-gray-500">
                            Lựa chọn gói phù hợp với quy mô trung tâm của bạn
                            với chi phí tối ưu nhất
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {plans &&
                            plans.map((plan: Plan) => (
                                <Card
                                    key={plan.id}
                                    className={`relative flex flex-col justify-between p-5 sm:p-6 transition-all hover:shadow-lg ${plan.is_featured
                                            ? 'border-2 border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/20'
                                            : 'border-gray-200 bg-white'
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
                                                        / tháng
                                                    </span>
                                                )}
                                            </div>

                                            {plan.yearly_price && plan.yearly_price > 0 ? (
                                                <div className="mt-2 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                                                    Mua theo năm: <strong>{plan.yearly_price.toLocaleString('vi-VN')}đ/năm</strong>{' '}
                                                    {plan.price > 0 && (
                                                        <span className="text-emerald-700">
                                                            (Tiết kiệm ~{Math.round((1 - plan.yearly_price / (plan.price * 12)) * 100)}%)
                                                        </span>
                                                    )}
                                                </div>
                                            ) : null}
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
                                </Card>
                            ))}
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
};

export default Index;
