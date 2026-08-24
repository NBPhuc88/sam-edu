import { Link, usePage } from '@inertiajs/react';
import {
    Check,
    HelpCircle,
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
    plan_type?: string | null;
}

interface ServicesProps {
    plans: Plan[];
}

export const Services: React.FC<ServicesProps> = ({ plans }) => {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const isAdvancedOrTrial = (plan: Plan) => {
        if (plan.plan_type) {
            return plan.plan_type === 'advanced' || plan.plan_type === 'trial';
        }
        return plan.code?.startsWith('advanced') || plan.code === 'trial';
    };

    const faqs = [
        {
            q: 'Gói 30 ngày dùng thử miễn phí có giới hạn tính năng không?',
            a: 'Không, gói dùng thử 30 ngày cho phép bạn trải nghiệm đầy đủ các tính năng cơ bản của hệ thống như quản lý 3 lớp học, điểm danh, lưu trữ học sinh và theo dõi học phí.',
        },
        {
            q: 'Hình thức đăng ký và kích hoạt dịch vụ như thế nào?',
            a: 'Bạn có thể đăng ký dùng thử 30 ngày hoàn toàn miễn phí hoặc liên hệ ban quản trị để được hướng dẫn kích hoạt gói dịch vụ một cách nhanh chóng.',
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
            title="Bảng Giá & Dịch Vụ SaaS - SAM Digital"
            description="Bảng giá các gói dịch vụ quản lý trung tâm giáo dục SAM Digital. Đăng ký dùng thử miễn phí 30 ngày hoặc chọn gói tiêu chuẩn linh hoạt."
            keywords="bảng giá phần mềm giáo dục, gói cước quản lý trung tâm, SaaS giáo dục, bảng giá SAM Digital"
        >
            {/* Hero Header */}
            <section className="border-b border-gray-100 bg-gradient-to-b from-emerald-50/50 via-white to-white py-12 text-center sm:py-20">
                <div className="mx-auto max-w-4xl space-y-4 px-4 sm:px-6 lg:px-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                        <Tag className="h-3.5 w-3.5" />
                        <span>Bảng Giá Minh Bạch &amp; Tiết Kiệm</span>
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                        Bảng Giá Gói Dịch Vụ Linh Hoạt
                    </h1>
                    <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-lg">
                        Chọn gói cước phù hợp nhất với quy mô trung tâm của
                        bạn. Tự động hóa điểm danh, xếp lịch và kết nối phụ
                        huynh tức thì.
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {plans &&
                        plans.map((plan) => (
                            <Card
                                key={plan.id}
                                className={`relative flex flex-col justify-between p-5 sm:p-8 transition-all hover:shadow-xl ${plan.is_featured
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
                                                    ? 'Đăng ký dùng thử 30 ngày'
                                                    : 'Đăng ký gói này'}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </Card>
                        ))}
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section className="border-t border-gray-200 bg-slate-50 py-12 sm:py-16">
                <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-2 text-center">
                        <h2 className="text-xl font-bold text-gray-900 sm:text-3xl">
                            So Sánh Chi Tiết Tính Năng
                        </h2>
                        <p className="text-xs text-gray-500">
                            Đối chiếu chi tiết tính năng hỗ trợ giữa các gói
                            phần mềm
                        </p>
                    </div>

                    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
                        <table className="w-full min-w-[620px] text-left text-xs">
                            <thead className="border-b border-gray-200 bg-gray-50 font-semibold text-gray-700">
                                <tr>
                                    <th className="p-4 sm:w-1/3">
                                        TÍNH NĂNG HỆ THỐNG
                                    </th>
                                    {plans &&
                                        plans.map((plan) => (
                                            <th
                                                key={plan.id}
                                                className={`p-4 text-center ${plan.is_featured
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
                                                        : `${plan.price.toLocaleString('vi-VN')}đ / ${plan.duration_days >=
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
                                {/* Category 1: Vận Hành & Học Vụ */}
                                <tr className="bg-slate-100/75">
                                    <td
                                        colSpan={(plans?.length || 0) + 1}
                                        className="px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-700"
                                    >
                                        1. Vận Hành &amp; Học Vụ Trung Tâm
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Giới hạn Lớp học &amp; Học sinh
                                    </td>
                                    {plans &&
                                        plans.map((plan) => (
                                            <td
                                                key={plan.id}
                                                className={`p-4 text-center ${
                                                    plan.is_featured
                                                        ? 'bg-emerald-50/30 font-bold text-emerald-700'
                                                        : 'font-medium'
                                                }`}
                                            >
                                                {plan.max_classes
                                                    ? `${plan.max_classes} Lớp`
                                                    : 'Không GH'}{' '}
                                                /{' '}
                                                {plan.max_students
                                                    ? `${plan.max_students} HS`
                                                    : 'Không GH'}
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Quản lý Giáo viên, Môn học &amp; Phòng học
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
                                        Hồ sơ Học sinh &amp; Điểm danh ca học
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
                                        Thời khóa biểu thông minh &amp; Đổi ca bù
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
                                        Quản lý Học phí &amp; Các đợt đóng tiền
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

                                {/* Category 2: Quản Lý Khảo Thí & Bài Thi Trực Tuyến */}
                                <tr className="bg-slate-100/75">
                                    <td
                                        colSpan={(plans?.length || 0) + 1}
                                        className="px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-700"
                                    >
                                        2. Quản Lý Đề Thi &amp; Bài Thi Trực Tuyến (Gói Nâng Cao &amp; Dùng Thử)
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Soạn thảo đề thi 9 dạng câu hỏi tương tác
                                        <div className="mt-0.5 text-[11px] font-normal text-gray-500">
                                            Trắc nghiệm, Điền từ, Ghép nối, Ghép hình, Sắp xếp, Tự luận...
                                        </div>
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
                                                {isAdvancedOrTrial(plan) ? (
                                                    <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <span className="text-gray-400 font-semibold">—</span>
                                                )}
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Phòng thi trực tuyến &amp; Tự động lưu câu trả lời
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
                                                {isAdvancedOrTrial(plan) ? (
                                                    <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <span className="text-gray-400 font-semibold">—</span>
                                                )}
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Chấm điểm tự động &amp; Chấm bài tự luận
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
                                                {isAdvancedOrTrial(plan) ? (
                                                    <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <span className="text-gray-400 font-semibold">—</span>
                                                )}
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Thi thử, luyện tập cá nhân &amp; Lời giải chi tiết
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
                                                {isAdvancedOrTrial(plan) ? (
                                                    <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <span className="text-gray-400 font-semibold">—</span>
                                                )}
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Xem lại bài làm, giải thích đáp án &amp; Phiếu điểm cá nhân
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
                                                {isAdvancedOrTrial(plan) ? (
                                                    <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <span className="text-gray-400 font-semibold">—</span>
                                                )}
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Thống kê kết quả thi, phổ điểm &amp; Bảng xếp hạng lớp
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
                                                {isAdvancedOrTrial(plan) ? (
                                                    <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <span className="text-gray-400 font-semibold">—</span>
                                                )}
                                            </td>
                                        ))}
                                </tr>

                                {/* Category 3: Tương Tác, Tiện Ích & Bảo Mật */}
                                <tr className="bg-slate-100/75">
                                    <td
                                        colSpan={(plans?.length || 0) + 1}
                                        className="px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-700"
                                    >
                                        3. Tương Tác, Tiện Ích &amp; Bảo Mật
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Nhóm Chat Lớp Học Trực Tuyến
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
                                                {isAdvancedOrTrial(plan) ? (
                                                    <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <span className="text-gray-400 font-semibold">—</span>
                                                )}
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Xuất danh sách Học sinh, Giáo viên (Excel / CSV)
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
                                                {isAdvancedOrTrial(plan) ? (
                                                    <Check className="mx-auto h-4 w-4 text-emerald-600" />
                                                ) : (
                                                    <span className="text-gray-400 font-semibold">—</span>
                                                )}
                                            </td>
                                        ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-semibold text-gray-900">
                                        Bảo mật đăng nhập 1 thiết bị &amp; Phân quyền quản trị
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
                                        Kênh hỗ trợ kỹ thuật
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
                            Giải đáp những thắc mắc phổ biến về gói cước và phương thức vận hành
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <Card key={idx} className="space-y-2 border-gray-200 p-5">
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
                        Bắt đầu trải nghiệm ngay 30 ngày dùng thử miễn phí hoặc liên hệ đội ngũ chuyên gia của chúng tôi để được tư vấn lộ trình phù hợp nhất.
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
