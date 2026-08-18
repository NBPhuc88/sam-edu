import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    CreditCard,
    HelpCircle,
    LayoutDashboard,
    ShieldCheck,
    Sparkles,
    Tag,
    Zap,
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

interface ServicesProps {
    plans: Plan[];
}

export const Services: React.FC<ServicesProps> = ({ plans }) => {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const faqs = [
        {
            q: 'Gói 14 ngày dùng thử miễn phí có giới hạn tính năng không?',
            a: 'Không, gói dùng thử 14 ngày cho phép bạn trải nghiệm đầy đủ các tính năng cơ bản của hệ thống như quản lý 3 lớp học, điểm danh, lưu trữ học sinh và theo dõi học phí.',
        },
        {
            q: 'Hình thức thanh toán và gia hạn dịch vụ như thế nào?',
            a: 'Hệ thống tích hợp thanh toán trực tiếp qua ZaloPay QR Code v2. Bạn có thể quét mã QR thanh toán nhanh và hệ thống sẽ tự động kích hoạt/gia hạn dịch vụ ngay lập tức.',
        },
        {
            q: 'Tôi có thể nâng cấp từ gói Hàng Tháng lên gói Theo Năm được không?',
            a: 'Hoàn toàn được! Bạn có thể chủ động chuyển sang Gói Theo Năm bất kỳ lúc nào để hưởng mức ưu đãi tiết kiệm 20% chi phí.',
        },
        {
            q: 'Hệ thống có hỗ trợ sao lưu dữ liệu và bảo mật không?',
            a: 'Dữ liệu trung tâm của bạn được lưu trữ trên nền tảng điện toán đám mây bảo mật cao, tự động sao lưu hàng ngày và mã hóa mật khẩu theo chuẩn mã hóa hiện đại.',
        },
    ];

    return (
        <PublicLayout
            title="Bảng Giá & Dịch Vụ SaaS - Giáo Dục Sam"
            description="Bảng giá các gói dịch vụ quản lý trung tâm giáo dục Sam Edu. Đăng ký dùng thử miễn phí 14 ngày hoặc chọn gói tiêu chuẩn linh hoạt."
            keywords="bảng giá phần mềm giáo dục, gói cước quản lý trung tâm, SaaS giáo dục, bảng giá Sam Edu"
        >
            {/* Hero Header */}
                <section className="border-b border-gray-100 bg-gradient-to-b from-emerald-50/50 via-white to-white py-16 text-center sm:py-20">
                    <div className="mx-auto max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            <Tag className="h-3.5 w-3.5" />
                            <span>Bảng Giá Minh Bạch & Tiết Kiệm</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                            Bảng Giá Gói Dịch Vụ Linh Hoạt
                        </h1>
                        <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
                            Chọn gói cước phù hợp nhất với quy mô trung tâm của
                            bạn. Tự động hóa điểm danh, xếp lịch và kết nối phụ
                            huynh tức thì.
                        </p>
                    </div>
                </section>

                {/* Pricing Cards */}
                <section className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {plans &&
                            plans.map((plan) => (
                                <Card
                                    key={plan.id}
                                    className={`relative flex flex-col justify-between p-8 transition-all hover:shadow-xl ${
                                        plan.is_featured
                                            ? 'border-2 border-emerald-600 shadow-lg ring-2 ring-emerald-500/20'
                                            : 'border-gray-200 bg-white'
                                    }`}
                                >
                                    {plan.badge_text && (
                                        <div className="absolute -top-3.5 right-6">
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

                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {plan.name}
                                            </h3>
                                            <div className="mt-3 flex flex-wrap items-baseline gap-1">
                                                <span className="text-3xl font-black text-gray-900 sm:text-4xl">
                                                    {plan.price === 0
                                                        ? 'Miễn phí'
                                                        : `${plan.price.toLocaleString('vi-VN')}đ`}
                                                </span>
                                                {plan.price > 0 && (
                                                    <span className="text-xs font-semibold text-gray-500">
                                                        / tháng
                                                    </span>
                                                )}
                                            </div>

                                            {plan.yearly_price && plan.yearly_price > 0 ? (
                                                <div className="mt-2.5 rounded-lg bg-emerald-50 p-2.5 text-xs font-medium text-emerald-900 border border-emerald-200">
                                                    <div className="font-semibold text-emerald-800">
                                                        Mua trọn gói năm: {plan.yearly_price.toLocaleString('vi-VN')}đ/năm
                                                    </div>
                                                    {plan.price > 0 && (
                                                        <div className="text-[11px] text-emerald-700 mt-0.5">
                                                            💡 Tiết kiệm ~{Math.round((1 - plan.yearly_price / (plan.price * 12)) * 100)}% so với trả từng tháng
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="space-y-1 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-600">
                                            <div>
                                                • Sĩ số tối đa:{' '}
                                                <strong>
                                                    {plan.max_students ??
                                                        'Không giới hạn'}
                                                </strong>{' '}
                                                học sinh
                                            </div>
                                            <div>
                                                • Lớp học tối đa:{' '}
                                                <strong>
                                                    {plan.max_classes ??
                                                        'Không giới hạn'}
                                                </strong>{' '}
                                                lớp
                                            </div>
                                        </div>

                                        <ul className="space-y-3 border-t border-gray-100 pt-4 text-xs leading-relaxed text-gray-700">
                                            {plan.features &&
                                                plan.features.map(
                                                    (feature, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="flex items-start gap-2.5"
                                                        >
                                                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                                            <span>
                                                                {feature}
                                                            </span>
                                                        </li>
                                                    ),
                                                )}
                                        </ul>
                                    </div>

                                    <div className="pt-8">
                                        {user ? (
                                            <Link href="/dashboard">
                                                <Button
                                                    variant={
                                                        plan.is_featured
                                                            ? 'success'
                                                            : 'secondary'
                                                    }
                                                    className="w-full justify-center py-2.5"
                                                >
                                                    Vào Dashboard Gia Hạn
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Link href={`/register-center?plan=${plan.code}`}>
                                                <Button
                                                    variant={
                                                        plan.is_featured
                                                            ? 'success'
                                                            : 'secondary'
                                                    }
                                                    className="w-full justify-center py-2.5"
                                                    icon={<Sparkles className="h-4 w-4" />}
                                                >
                                                    {plan.price === 0
                                                        ? 'Đăng ký dùng thử 14 ngày'
                                                        : 'Đăng ký gói này'}
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </Card>
                            ))}
                    </div>
                </section>

                {/* ZaloPay Banner Section */}
            <section className="bg-slate-900 py-12 text-white">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 lg:flex-row lg:px-8">
                    <div className="flex items-center gap-4 text-center lg:text-left">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                            <CreditCard className="h-7 w-7" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white sm:text-xl">
                                Tự Động Gia Hạn Qua ZaloPay QR Code v2
                            </h3>
                            <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                                Quét mã QR tiện lợi, xử lý giao dịch tức thì
                                24/7 không cần chờ duyệt thủ công.
                            </p>
                        </div>
                    </div>
                    {user ? (
                        <Link href="/dashboard">
                            <Button
                                variant="success"
                                size="lg"
                                icon={<LayoutDashboard className="h-5 w-5" />}
                            >
                                Gia hạn ngay
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/contact">
                            <Button
                                variant="success"
                                size="lg"
                                icon={<ArrowRight className="h-5 w-5" />}
                            >
                                Liên hệ tư vấn ZaloPay
                            </Button>
                        </Link>
                    )}
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section className="border-t border-gray-200 bg-slate-50 py-16">
                <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-2 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                            So Sánh Chi Tiết Tính Năng
                        </h2>
                        <p className="text-xs text-gray-500">
                            Đối chiếu chi tiết tính năng hỗ trợ giữa các gói
                            phần mềm
                        </p>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-gray-200 bg-gray-50 font-semibold text-gray-700">
                                <tr>
                                    <th className="p-4 sm:w-1/3">
                                        TÍNH NĂNG HỆ THỐNG
                                    </th>
                                    {plans &&
                                        plans.map((plan) => (
                                            <th
                                                key={plan.id}
                                                className={`p-4 text-center ${
                                                    plan.is_featured
                                                        ? 'bg-emerald-50/80 font-bold text-emerald-900'
                                                        : ''
                                                }`}
                                            >
                                                <div className="font-extrabold uppercase">
                                                    {plan.name}
                                                </div>
                                                <div className="mt-1 text-xs font-bold text-emerald-700">
                                                    {plan.price === 0
                                                        ? 'Miễn phí'
                                                        : `${plan.price.toLocaleString('vi-VN')}đ / ${
                                                              plan.duration_days >=
                                                              365
                                                                  ? 'năm'
                                                                  : plan.duration_days >=
                                                                      30
                                                                    ? 'tháng'
                                                                    : `${plan.duration_days} ngày`
                                                          }`}
                                                </div>
                                            </th>
                                        ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Quản lý trung tâm
                                    </td>
                                    {plans &&
                                        plans.map((plan) => (
                                            <td
                                                key={plan.id}
                                                className={`p-4 text-center ${
                                                    plan.is_featured
                                                        ? 'bg-emerald-50/30 font-bold text-emerald-700'
                                                        : ''
                                                }`}
                                            >
                                                {plan.code === 'yearly'
                                                    ? 'Đa trung tâm'
                                                    : '1 Trung tâm'}
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Giới hạn Học sinh &amp; Lớp học
                                    </td>
                                    {plans &&
                                        plans.map((plan) => (
                                            <td
                                                key={plan.id}
                                                className={`p-4 text-center ${
                                                    plan.is_featured
                                                        ? 'bg-emerald-50/30 font-bold text-emerald-700'
                                                        : ''
                                                }`}
                                            >
                                                {plan.max_students
                                                    ? `${plan.max_students} HS`
                                                    : 'Không GH'}{' '}
                                                /{' '}
                                                {plan.max_classes
                                                    ? `${plan.max_classes} Lớp`
                                                    : 'Không GH'}
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Điểm danh &amp; Hồ sơ học sinh
                                    </td>
                                    {plans &&
                                        plans.map((plan) => (
                                            <td
                                                key={plan.id}
                                                className={`p-4 text-center ${
                                                    plan.is_featured
                                                        ? 'bg-emerald-50/30'
                                                        : ''
                                                }`}
                                            >
                                                <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Nhóm Chat Lớp Trực Tuyến
                                    </td>
                                    {plans &&
                                        plans.map((plan) => (
                                            <td
                                                key={plan.id}
                                                className={`p-4 text-center ${
                                                    plan.is_featured
                                                        ? 'bg-emerald-50/30'
                                                        : ''
                                                }`}
                                            >
                                                {plan.price > 0 ? (
                                                    <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Thanh toán ZaloPay QR Code v2
                                    </td>
                                    {plans &&
                                        plans.map((plan) => (
                                            <td
                                                key={plan.id}
                                                className={`p-4 text-center ${
                                                    plan.is_featured
                                                        ? 'bg-emerald-50/30'
                                                        : ''
                                                }`}
                                            >
                                                {plan.price > 0 ? (
                                                    <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Biểu đồ thống kê Recharts
                                    </td>
                                    {plans &&
                                        plans.map((plan) => (
                                            <td
                                                key={plan.id}
                                                className={`p-4 text-center ${
                                                    plan.is_featured
                                                        ? 'bg-emerald-50/30'
                                                        : ''
                                                }`}
                                            >
                                                {plan.code === 'yearly' ? (
                                                    <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Hỗ trợ kỹ thuật
                                    </td>
                                    {plans &&
                                        plans.map((plan) => (
                                            <td
                                                key={plan.id}
                                                className={`p-4 text-center ${
                                                    plan.is_featured
                                                        ? 'bg-emerald-50/30 font-bold text-emerald-700'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                {plan.price === 0
                                                    ? 'Email'
                                                    : plan.code === 'yearly'
                                                      ? 'Ưu tiên VIP 24/7'
                                                      : 'Hotline 24/7'}
                                            </td>
                                        ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="bg-white py-16">
                <div className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-2 text-center">
                        <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                            <HelpCircle className="h-7 w-7 text-emerald-600" />
                            Câu Hỏi Thường Gặp
                        </h2>
                        <p className="text-xs text-gray-500">
                            Giải đáp những thắc mắc phổ biến về gói cước và
                            phương thức vận hành
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <Card
                                key={idx}
                                className="space-y-2 border-gray-200 p-5"
                            >
                                <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                                    <Zap className="h-4 w-4 shrink-0 text-emerald-600" />
                                    {faq.q}
                                </h3>
                                <p className="pl-6 text-xs leading-relaxed text-gray-600">
                                    {faq.a}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final Call to Action */}
            <section className="bg-emerald-600 py-12 text-white">
                <div className="mx-auto max-w-5xl space-y-4 px-4 text-center sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-extrabold sm:text-3xl">
                        Sẵn Sàng Tối Ưu Hóa Quản Lý Trung Tâm Của Bạn?
                    </h2>
                    <p className="mx-auto max-w-xl text-xs text-emerald-100 sm:text-sm">
                        Bắt đầu trải nghiệm ngay 14 ngày dùng thử miễn phí hoặc
                        liên hệ đội ngũ chuyên gia của chúng tôi để được tư vấn
                        lộ trình phù hợp nhất.
                    </p>
                    <div className="flex justify-center gap-4 pt-2">
                        <Link href="/contact">
                            <Button
                                variant="secondary"
                                size="lg"
                                icon={<ShieldCheck className="h-5 w-5" />}
                            >
                                Đăng ký tư vấn ngay
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
};

export default Services;
