import { Link } from '@inertiajs/react';
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
    duration_months: number;
    max_students: number | null;
    max_classes: number | null;
    features: string[] | null;
    badge_text: string | null;
    is_featured: boolean;
}

export const Index: React.FC<any> = ({ hero, promotionBanner, plans }) => {
    return (
        <PublicLayout title="Trang Chủ - Hệ thống Quản lý Giáo dục Sam">
            {/* Promotion Alert Banner */}
            {promotionBanner && (
                <div className="bg-amber-500 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs">
                    <Tag className="w-4 h-4 shrink-0" />
                    <span>{promotionBanner}</span>
                </div>
            )}

            {/* Hero Section */}
            <section className="bg-gradient-to-b from-emerald-50/50 via-white to-white py-16 sm:py-24 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Nền tảng Quản lý Giáo dục Đa trung tâm 2026</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
                        {hero?.title || 'Giải Pháp Quản Lý Giáo Dục'}
                    </h1>

                    <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        {hero?.subtitle || 'Hệ thống tối ưu hóa quy trình quản lý học sinh, sắp xếp lịch học, điểm danh thông minh và tự động gia hạn gói dịch vụ qua ZaloPay QR Code.'}
                    </p>

                    <div className="flex items-center justify-center gap-4 flex-wrap pt-4">
                        <Link href="/contact">
                            <Button variant="success" size="lg" icon={<Sparkles className="w-5 h-5" />}>
                                Dùng thử miễn phí 14 ngày
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="secondary" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
                                Đăng nhập Hệ thống
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Core Features Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Tính Năng Đột Phá Cho Trung Tâm</h2>
                        <p className="text-sm text-gray-500 max-w-xl mx-auto">
                            Đầy đủ công cụ vận hành từ quản lý lớp học, giáo viên đến thanh toán tự động
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="p-6 space-y-3 border-gray-200 hover:border-emerald-300 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Quản Lý Đa Trung Tâm</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Quản lý phân quyền chính xác cho nhiều cơ sở đào tạo trên một tài khoản duy nhất.
                            </p>
                        </Card>

                        <Card className="p-6 space-y-3 border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 transition-all relative">
                            <div className="absolute top-3 right-3">
                                <Badge variant="active">Tính Năng Nổi Bật</Badge>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Nhóm Chat Lớp Trực Tuyến</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Trao đổi thông tin tức thì giữa Quản lý, Giáo viên và Học sinh trong từng lớp học với tính năng ghim thông báo quan trọng.
                            </p>
                        </Card>

                        <Card className="p-6 space-y-3 border-gray-200 hover:border-blue-300 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Điểm Danh & Học Sinh</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Theo dõi sĩ số học sinh từng lớp, lưu thông tin phụ huynh và xuất nhập danh sách dễ dàng qua file Excel/CSV.
                            </p>
                        </Card>

                        <Card className="p-6 space-y-3 border-gray-200 hover:border-amber-300 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Thanh Toán ZaloPay</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Thanh toán và tự động gia hạn dịch vụ nhanh chóng qua cổng quét mã ZaloPay QR Code tiện lợi.
                            </p>
                        </Card>

                        <Card className="p-6 space-y-3 border-gray-200 hover:border-purple-300 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                                <BarChart3 className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Biểu Đồ Thống Kê</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Báo cáo biểu đồ trực quan phân tích số lượng học sinh, hiệu quả giảng dạy và biểu đồ tăng trưởng trung tâm.
                            </p>
                        </Card>

                        <Card className="p-6 space-y-3 border-gray-200 hover:border-rose-300 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                                <Search className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Tìm Kiếm Thông Minh Siêu Tốc</h3>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Tra cứu thông tin học sinh, giáo viên, phụ huynh và lịch học tức thì chỉ với một từ khóa.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Pricing Section (Dynamically loaded from Database) */}
            <section className="py-16 bg-slate-50 border-t border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Gói Cước & Dịch Vụ Phần Mềm</h2>
                        <p className="text-sm text-gray-500 max-w-xl mx-auto">
                            Lựa chọn gói phù hợp với quy mô trung tâm của bạn với chi phí tối ưu nhất
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans && plans.map((plan: Plan) => (
                            <div
                                key={plan.id}
                                className={`ui-card p-6 flex flex-col justify-between relative transition-all ${plan.is_featured ? 'border-2 border-emerald-600 shadow-md ring-2 ring-emerald-500/20' : 'border-gray-200'
                                    }`}
                            >
                                {plan.badge_text && (
                                    <div className="absolute -top-3.5 right-4">
                                        <Badge variant={plan.is_featured ? 'active' : 'info'}>{plan.badge_text}</Badge>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                                        <div className="mt-2 flex items-baseline flex-wrap gap-1">
                                            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                                                {plan.price === 0 ? 'Miễn phí' : `${plan.price.toLocaleString('vi-VN')}đ`}
                                            </span>
                                            {plan.price > 0 && (
                                                <span className="text-xs text-gray-500 font-medium">
                                                    {plan.duration_months === 12 ? '/ năm' : '/ tháng'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <ul className="space-y-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                                        {plan.features && plan.features.map((feature: string, idx: number) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="pt-6">
                                    <Link href="/contact">
                                        <Button
                                            variant={plan.is_featured ? 'success' : 'secondary'}
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
