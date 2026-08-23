import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    Calendar,
    CheckCircle2,
    FileCheck2,
    Heart,
    Layers,
    Lock,
    MessageSquare,
    ShieldCheck,
    Sliders,
    Sparkles,
    Target,
    XCircle,
    Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PublicLayout from '../../layouts/PublicLayout';

interface AboutProps {
    company?: {
        name?: string;
        address?: string;
    };
}

export const About: React.FC<AboutProps> = ({ company }) => {
    const { contactInfo } = usePage().props as any;
    const companyName =
        company?.name ||
        contactInfo?.company_name ||
        'Công ty Cổ phần Giáo dục Sam';

    // Interactive Pillars State
    const [activePillar, setActivePillar] = useState<number>(0);

    // Interactive ROI Calculator State
    const [classesCount, setClassesCount] = useState<number>(10);
    const [studentsCount, setStudentsCount] = useState<number>(250);

    // Dynamic Calculations
    const savedAdminHours = Math.round(classesCount * 4.5 + studentsCount * 0.12);
    const suggestedPlan =
        classesCount <= 5
            ? 'Gói Nâng Cao (5 Lớp)'
            : classesCount <= 20
              ? 'Gói Nâng Cao (20 Lớp)'
              : 'Gói Doanh Nghiệp Tùy Chỉnh';

    const pillars = [
        {
            id: 0,
            icon: <Calendar className="h-5 w-5" />,
            title: 'Học Vụ & Xếp Lịch Thông Minh',
            subtitle: 'Tự động hóa 100% lịch học, ca học và lịch nghỉ lễ',
            badge: 'GÓI CƠ BẢN & NÂNG CAO',
            description:
                'Hệ thống tự động sinh toàn bộ ca học trong kỳ, tự động nhận diện và loại trừ các ngày nghỉ lễ toàn quốc, hỗ trợ giáo viên báo nghỉ, đổi lịch và sắp xếp dạy bù chống trùng lịch phòng học.',
            highlights: [
                'Tự động sinh chuỗi ca học theo thứ trong tuần',
                'Tích hợp lịch nghỉ lễ Việt Nam tự động',
                'Điểm danh đa trạng thái (Có mặt / Vắng / Đi trễ)',
                'Ghi chú cá nhân và theo dõi chuyên cần học sinh',
            ],
            color: 'emerald',
        },
        {
            id: 1,
            icon: <FileCheck2 className="h-5 w-5" />,
            title: 'Hệ Thống Khảo Thí 9 Dạng Câu Hỏi',
            subtitle: 'Ngân hàng đề thi & phòng thi trực tuyến đa dạng',
            badge: 'GÓI NÂNG CAO',
            description:
                'Đột phá với 9 dạng câu hỏi toàn diện đáp ứng mọi bộ môn: Trắc nghiệm, điền từ, kéo thả từ, ghép nối chữ, ghép nối hình ảnh, sắp xếp thứ tự, phát hiện lỗi sai, câu hỏi âm thanh và tự luận chuyên sâu.',
            highlights: [
                'Phòng thi trực tuyến tự động lưu bài làm',
                'Chấm điểm tự động và giao diện chấm tự luận giáo viên',
                'Xem lại bài thi trực quan với dây nối và khối màu đối chiếu',
                'Kho đề thi thử và luyện tập không giới hạn',
            ],
            color: 'teal',
        },
        {
            id: 2,
            icon: <MessageSquare className="h-5 w-5" />,
            title: 'Nhóm Chat Lớp Học Trực Tuyến',
            subtitle: 'Trao đổi thuận tiện & thông báo bài học kịp thời',
            badge: 'GÓI NÂNG CAO',
            description:
                'Tích hợp phòng chat riêng cho từng lớp học, cho phép Quản trị viên, Giáo viên và Học sinh gửi tin nhắn nhanh chóng và ghim các thông báo bài học quan trọng.',
            highlights: [
                'Trao đổi tin nhắn trực tiếp trong từng lớp học',
                'Ghim tin nhắn bài tập, tài liệu và lịch kiểm tra',
                'Phân quyền gửi tin nhắn an toàn theo vai trò',
                'Lịch sử tin nhắn lưu trữ bảo mật trong trung tâm',
            ],
            color: 'blue',
        },
        {
            id: 3,
            icon: <ShieldCheck className="h-5 w-5" />,
            title: 'Bảo Mật & Quản Trị Đa Trung Tâm',
            subtitle: 'Đăng Nhập 1 Thiết Bị & Phân Quyền Chi Tiết',
            badge: 'BẢO MẬT DOANH NGHIỆP',
            description:
                'Phân quyền rõ ràng giữa Quản trị viên, Giáo viên và Học sinh. Cơ chế giới hạn 1 thiết bị đăng nhập giúp bảo vệ tài khoản và quản trị trung tâm an toàn.',
            highlights: [
                'Tự động khóa phiên đăng nhập trên thiết bị cũ',
                'Phân quyền chi nhánh, quản trị viên phụ độc lập',
                'Quản lý môn học, phòng học theo từng trung tâm',
                'Xuất danh sách Excel & Xem phiếu điểm cá nhân',
            ],
            color: 'purple',
        },
    ];

    const comparisonItems = [
        {
            feature: 'Quản Lý Sĩ Số & Hồ Sơ',
            traditional: 'Excel rời rạc, dễ thất lạc dữ liệu khi đổi nhân sự',
            samEdu: 'Dữ liệu tập trung, phân quyền đa chi nhánh, lưu vết chi tiết',
        },
        {
            feature: 'Thời Khóa Biểu & Ca Học',
            traditional: 'Xếp lịch thủ công, dễ trùng phòng học và trùng giáo viên',
            samEdu: 'Tự động sinh ca, tự trừ ngày lễ, báo nghỉ & đổi lịch 1 chạm',
        },
        {
            feature: 'Điểm Danh & Học Phí',
            traditional: 'Sổ giấy hoặc bảng tính, khó theo dõi nợ và đợt đóng tiền',
            samEdu: 'Điểm danh trực quan trên web, theo dõi công nợ & phiếu thu từng đợt',
        },
        {
            feature: 'Tổ Chức Kiểm Tra & Thi Cử',
            traditional: 'In giấy tốn kém, mất nhiều ngày chấm bài thủ công',
            samEdu: 'Phòng thi online 9 dạng câu hỏi, Auto-save & chấm tự động tức thì',
        },
        {
            feature: 'Trao Đổi Với Học Sinh',
            traditional: 'Nhóm chat trôi tin, học sinh dễ bỏ lỡ thông báo bài tập',
            samEdu: 'Chat nhóm lớp học thời gian thực có tính năng Ghim thông báo',
        },
        {
            feature: 'Bảo Mật & Phiên Đăng Nhập',
            traditional: 'Dễ lộ mật khẩu, đăng nhập nhiều nơi không thể kiểm soát',
            samEdu: 'Cơ chế Single Device Login tự động khóa phiên đăng nhập cũ',
        },
    ];

    return (
        <PublicLayout
            title="Về Chúng Tôi - Đột Phá Quản Trị Giáo Dục Sam Edu"
            description="Tìm hiểu tầm nhìn, sứ mệnh và nền tảng công nghệ quản lý giáo dục đa trung tâm đột phá của Sam Edu. Hệ sinh thái toàn diện từ học vụ, khảo thí 9 dạng câu hỏi đến chat thời gian thực."
            keywords="Về Sam Edu, Giáo dục Sam, phần mềm quản lý trung tâm, giải pháp giáo dục 2026, khảo thí trực tuyến"
        >
            {/* ─── Hero Section ────────────────────────────────────────── */}
            <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-emerald-900 via-slate-900 to-slate-950 py-14 text-white sm:py-24 lg:py-28">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.18),transparent_50%)]" />
                <div className="relative mx-auto max-w-7xl space-y-5 sm:space-y-6 px-4 text-center sm:px-6 lg:px-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 sm:px-4 sm:py-1.5 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30 backdrop-blur-sm">
                        <Sparkles className="h-4 w-4" />
                        <span>Kiến Tạo Chuẩn Mực Quản Trị Giáo Dục Số 2026</span>
                    </div>

                    <h1 className="mx-auto max-w-4xl text-2xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-6xl">
                        Đơn Giản Hóa Quản Trị, <br className="hidden sm:inline" />
                        <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                            Nâng Tầm Chất Lượng Giáo Dục
                        </span>
                    </h1>

                    <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-lg">
                        {companyName} ra đời với sứ mệnh xóa bỏ gánh nặng sổ sách hành chính thủ công cho các trung tâm đào tạo, mang đến nền tảng chuyển đổi số toàn diện kết hợp giữa <strong>Quản Lý Học Vụ Chuẩn Hóa</strong> và <strong>Hệ Thống Khảo Thí Đột Phá</strong>.
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-3 max-w-sm mx-auto sm:max-w-none">
                        <a href="#roi-calculator" className="w-full sm:w-auto">
                            <Button variant="success" size="lg" className="w-full justify-center" icon={<Sliders className="h-5 w-5" />}>
                                Tính Hiệu Quả Cho Trung Tâm
                            </Button>
                        </a>
                        <Link href="/contact" className="w-full sm:w-auto">
                            <Button variant="secondary" size="lg" className="w-full justify-center" icon={<ArrowRight className="h-5 w-5" />}>
                                Đăng Ký Tư Vấn Ngay
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ─── Core Values Grid ────────────────────────────────────────── */}
            <section className="bg-white py-12 sm:py-16 lg:py-20">
                <div className="mx-auto max-w-7xl space-y-8 sm:space-y-12 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-2 text-center">
                        <h2 className="text-xl font-bold text-gray-900 sm:text-3xl">
                            Kim Chỉ Nam &amp; Giá Trị Cốt Lõi
                        </h2>
                        <p className="mx-auto max-w-xl text-xs sm:text-sm text-gray-500">
                            Những nguyên tắc định hình văn hóa sản phẩm và sự cam kết của Sam Edu
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
                        <Card className="group relative space-y-3.5 border-gray-200 p-5 sm:p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl">
                            <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 transition-transform group-hover:scale-110">
                                <Target className="h-6 w-6 sm:h-7 sm:w-7" />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                Tầm Nhìn 2026 - 2030
                            </h3>
                            <p className="text-xs leading-relaxed text-gray-600">
                                Trở thành hệ thống quản lý giáo dục đa trung tâm được tin cậy nhất tại Việt Nam, đồng hành cùng hơn 1.000 cơ sở đào tạo chuẩn hóa quy trình vận hành.
                            </p>
                        </Card>

                        <Card className="group relative space-y-3.5 border-gray-200 p-5 sm:p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-teal-300 hover:shadow-xl">
                            <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 transition-transform group-hover:scale-110">
                                <Heart className="h-6 w-6 sm:h-7 sm:w-7" />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                Sứ Mệnh Vì Giáo Dục
                            </h3>
                            <p className="text-xs leading-relaxed text-gray-600">
                                Giải phóng giáo viên và cán bộ quản lý khỏi các công việc ghi chép vụn vặt, để năng lượng và thời gian quý báu được dồn trọn vẹn vào trải nghiệm học tập của học sinh.
                            </p>
                        </Card>

                        <Card className="group relative space-y-3.5 border-gray-200 p-5 sm:p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl">
                            <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 transition-transform group-hover:scale-110">
                                <Award className="h-6 w-6 sm:h-7 sm:w-7" />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900">
                                Cam Kết Chất Lượng
                            </h3>
                            <p className="text-xs leading-relaxed text-gray-600">
                                An toàn dữ liệu tối đa, phân quyền chi tiết, tốc độ xử lý siêu tốc và luôn lắng nghe phản hồi của người dùng để cập nhật tính năng mới mỗi tuần.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ─── Interactive Pillars Section ───────────────────────────── */}
            <section className="border-t border-b border-gray-200 bg-slate-50 py-12 sm:py-16 lg:py-24">
                <div className="mx-auto max-w-7xl space-y-8 sm:space-y-12 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-2 sm:space-y-3 text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                            <Layers className="h-3.5 w-3.5" />
                            <span>Khám Phá Chi Tiết</span>
                        </div>
                        <h2 className="text-xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                            4 Trụ Cột Đột Phá Của Sam Edu
                        </h2>
                        <p className="mx-auto max-w-2xl text-xs sm:text-sm text-gray-600">
                            Chọn từng trụ cột bên dưới để khám phá sức mạnh công nghệ mà Sam Edu trang bị cho trung tâm của bạn:
                        </p>
                    </div>

                    {/* Interactive Tab Switcher */}
                    <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-gray-200/80 p-1.5 sm:grid-cols-4 sm:gap-3">
                        {pillars.map((pillar, idx) => (
                            <button
                                key={pillar.id}
                                type="button"
                                onClick={() => setActivePillar(idx)}
                                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-xl py-2.5 px-2 sm:py-3 sm:px-3 text-[11px] sm:text-xs font-bold transition-all text-center sm:text-left ${
                                    activePillar === idx
                                        ? 'bg-white text-emerald-800 shadow-md ring-1 ring-black/5'
                                        : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                                }`}
                            >
                                <span
                                    className={`shrink-0 ${
                                        activePillar === idx
                                            ? 'text-emerald-600'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    {pillar.icon}
                                </span>
                                <span className="line-clamp-2 sm:line-clamp-1">{pillar.title}</span>
                            </button>
                        ))}
                    </div>

                    {/* Active Pillar Detail Card */}
                    <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-200 bg-white p-5 sm:p-8 lg:p-10 shadow-lg">
                        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
                            <div className="space-y-4 sm:space-y-5 lg:col-span-7">
                                <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    {pillars[activePillar].badge}
                                </div>
                                <h3 className="text-lg font-extrabold text-gray-900 sm:text-2xl lg:text-3xl">
                                    {pillars[activePillar].title}
                                </h3>
                                <p className="text-xs sm:text-sm font-medium text-emerald-700">
                                    {pillars[activePillar].subtitle}
                                </p>
                                <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
                                    {pillars[activePillar].description}
                                </p>

                                <div className="space-y-2.5 pt-2">
                                    <h4 className="text-xs font-bold tracking-wider text-gray-900 uppercase">
                                        Điểm nhấn nổi bật:
                                    </h4>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        {pillars[activePillar].highlights.map(
                                            (item, hIdx) => (
                                                <div
                                                    key={hIdx}
                                                    className="flex items-start gap-2 text-xs text-gray-700"
                                                >
                                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                                                    <span>{item}</span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Visual Metric & CTA Box */}
                            <div className="space-y-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 sm:p-6 text-white lg:col-span-5">
                                <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                                    <span className="text-xs font-semibold text-gray-400">
                                        Chuẩn Hóa Trải Nghiệm
                                    </span>
                                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                                        Tự Động Hóa 100%
                                    </span>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-300">
                                            Thời gian tiết kiệm hàng tuần
                                        </span>
                                        <span className="font-bold text-emerald-400">
                                            ~15 Giờ / Tuần
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                        <div className="h-full w-[85%] bg-emerald-500" />
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-300">
                                            Tỉ lệ chính xác đối soát học phí
                                        </span>
                                        <span className="font-bold text-emerald-400">
                                            99.9%
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                        <div className="h-full w-[99%] bg-emerald-500" />
                                    </div>

                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-300">
                                            Tốc độ ra đề &amp; trả điểm thi
                                        </span>
                                        <span className="font-bold text-emerald-400">
                                            Tức Thì &amp; Tự Động
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                                        <div className="h-full w-[95%] bg-emerald-500" />
                                    </div>
                                </div>

                                <div className="pt-3 sm:pt-4">
                                    <Link href="/services" className="block w-full">
                                        <Button
                                            variant="success"
                                            size="sm"
                                            className="w-full justify-center"
                                            icon={<ArrowRight className="h-4 w-4" />}
                                        >
                                            Xem Các Gói Dịch Vụ
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Comparison Matrix: Traditional vs Sam Edu ─────────────── */}
            <section className="bg-white py-12 sm:py-16 lg:py-24">
                <div className="mx-auto max-w-7xl space-y-8 sm:space-y-12 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-2 sm:space-y-3 text-center">
                        <h2 className="text-xl font-extrabold text-gray-900 sm:text-3xl lg:text-4xl">
                            Khác Biệt Vượt Trội So Với Quản Lý Truyền Thống
                        </h2>
                        <p className="mx-auto max-w-2xl text-xs sm:text-sm text-gray-600">
                            Vì sao các trung tâm đào tạo hiện đại đang nhanh chóng chuyển dịch sang hệ sinh thái số Sam Edu?
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-xs">
                        <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-[540px] text-left text-xs sm:text-sm">
                                <thead className="bg-slate-100 text-gray-900">
                                    <tr>
                                        <th className="py-3.5 px-3.5 font-bold sm:py-4 sm:px-6">
                                            Hạng Mục Vận Hành
                                        </th>
                                        <th className="py-3.5 px-3.5 font-bold text-red-700 sm:py-4 sm:px-6">
                                            Quản Lý Bằng Excel / Sổ Sách
                                        </th>
                                        <th className="py-3.5 px-3.5 font-bold text-emerald-800 bg-emerald-50 sm:py-4 sm:px-6">
                                            Hệ Sinh Thái Sam Edu
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {comparisonItems.map((item, idx) => (
                                        <tr
                                            key={idx}
                                            className="transition-colors hover:bg-gray-50/80"
                                        >
                                            <td className="py-3.5 px-3.5 font-semibold text-gray-900 sm:py-4 sm:px-6">
                                                {item.feature}
                                            </td>
                                            <td className="py-3.5 px-3.5 text-gray-600 sm:py-4 sm:px-6">
                                                <div className="flex items-start gap-2 text-rose-700">
                                                    <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                    <span>{item.traditional}</span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-3.5 font-medium text-emerald-950 bg-emerald-50/40 sm:py-4 sm:px-6">
                                                <div className="flex items-start gap-2 text-emerald-800">
                                                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                                                    <span>{item.samEdu}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Interactive ROI / Value Estimator ───────────────────────── */}
            <section
                id="roi-calculator"
                className="border-t border-gray-200 bg-gradient-to-b from-slate-900 to-slate-950 py-12 sm:py-16 lg:py-24 text-white scroll-mt-16"
            >
                <div className="mx-auto max-w-7xl space-y-8 sm:space-y-12 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-2 sm:space-y-3 text-center">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                            <Zap className="h-3.5 w-3.5" />
                            <span>Công Cụ Tương Tác Trực Tuyến</span>
                        </div>
                        <h2 className="text-xl font-extrabold text-white sm:text-3xl lg:text-4xl">
                            Ước Tính Hiệu Quả Cho Trung Tâm Của Bạn
                        </h2>
                        <p className="mx-auto max-w-2xl text-xs sm:text-sm text-gray-400">
                            Kéo thanh trượt để xem ngay số giờ hành chính bạn sẽ tiết kiệm và gói dịch vụ phù hợp nhất:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 rounded-2xl sm:rounded-3xl border border-gray-800 bg-slate-900/90 p-5 sm:p-8 lg:p-10 shadow-2xl lg:grid-cols-12">
                        {/* Sliders Input Column */}
                        <div className="space-y-6 sm:space-y-8 lg:col-span-6">
                            {/* Classes Slider */}
                            <div className="space-y-2.5 sm:space-y-3">
                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                    <span className="font-semibold text-gray-300">
                                        Số lượng lớp học đang vận hành:
                                    </span>
                                    <span className="rounded-lg bg-emerald-500/20 px-2.5 py-0.5 sm:px-3 sm:py-1 text-sm sm:text-base font-extrabold text-emerald-400 ring-1 ring-emerald-500/30">
                                        {classesCount} Lớp
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="40"
                                    step="1"
                                    value={classesCount}
                                    onChange={(e) =>
                                        setClassesCount(parseInt(e.target.value, 10))
                                    }
                                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-emerald-500"
                                />
                                <div className="flex justify-between text-[11px] text-gray-500">
                                    <span>1 Lớp</span>
                                    <span>20 Lớp (Phổ biến)</span>
                                    <span>40+ Lớp</span>
                                </div>
                            </div>

                            {/* Students Slider */}
                            <div className="space-y-2.5 sm:space-y-3">
                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                    <span className="font-semibold text-gray-300">
                                        Tổng số học sinh trung tâm:
                                    </span>
                                    <span className="rounded-lg bg-teal-500/20 px-2.5 py-0.5 sm:px-3 sm:py-1 text-sm sm:text-base font-extrabold text-teal-300 ring-1 ring-teal-500/30">
                                        {studentsCount} Học sinh
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="20"
                                    max="1000"
                                    step="10"
                                    value={studentsCount}
                                    onChange={(e) =>
                                        setStudentsCount(parseInt(e.target.value, 10))
                                    }
                                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-teal-400"
                                />
                                <div className="flex justify-between text-[11px] text-gray-500">
                                    <span>20 Học sinh</span>
                                    <span>500 Học sinh</span>
                                    <span>1.000+ Học sinh</span>
                                </div>
                            </div>
                        </div>

                        {/* Calculated Results Column */}
                        <div className="space-y-5 sm:space-y-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-5 sm:p-8 lg:col-span-6">
                            <div className="space-y-1 border-b border-emerald-500/20 pb-3 sm:pb-4">
                                <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                                    Giá Trị Ước Tính Thu Được Mỗi Tháng
                                </div>
                                <div className="text-2xl sm:text-4xl font-extrabold text-white">
                                    Tiết kiệm ~{savedAdminHours} Giờ
                                </div>
                                <p className="text-xs text-gray-300">
                                    Tương đương cắt giảm 70% thời gian điểm danh, soạn đề, chấm bài và đối soát học phí.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs">
                                <div className="rounded-xl bg-slate-900/80 p-3 sm:p-3.5 border border-gray-800">
                                    <div className="text-gray-400">Giảm sai sót học phí</div>
                                    <div className="mt-1 text-base sm:text-lg font-bold text-emerald-400">98%</div>
                                </div>
                                <div className="rounded-xl bg-slate-900/80 p-3 sm:p-3.5 border border-gray-800">
                                    <div className="text-gray-400">Tốc độ trả điểm thi</div>
                                    <div className="mt-1 text-base sm:text-lg font-bold text-teal-300">Tức thì</div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-slate-900/90 p-3.5 sm:p-4 border border-emerald-500/40">
                                <div className="text-[11px] font-semibold text-gray-400 uppercase">
                                    Gói dịch vụ khuyến nghị tối ưu:
                                </div>
                                <div className="mt-1 text-sm sm:text-base font-extrabold text-white">
                                    {suggestedPlan}
                                </div>
                            </div>

                            <div className="pt-1 sm:pt-2">
                                <Link href="/services" className="block w-full">
                                    <Button
                                        variant="success"
                                        size="sm"
                                        className="w-full justify-center py-2.5"
                                        icon={<ArrowRight className="h-4 w-4" />}
                                    >
                                        Bắt Đầu Dùng Thử 30 Ngày
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Service Standards & Commitments ─────────────────────── */}
            <section className="bg-white py-12 sm:py-16 lg:py-20">
                <div className="mx-auto max-w-7xl space-y-8 sm:space-y-12 px-4 sm:px-6 lg:px-8">
                    <div className="space-y-2 text-center">
                        <h2 className="text-xl font-bold text-gray-900 sm:text-3xl">
                            Cam Kết &amp; Tiêu Chuẩn Vận Hành
                        </h2>
                        <p className="mx-auto max-w-xl text-xs sm:text-sm text-gray-500">
                            Đảm bảo tính liên tục, an toàn dữ liệu và trải nghiệm mượt mà cho mọi trung tâm đào tạo
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                        <Card className="space-y-2.5 border-gray-100 bg-slate-50/60 p-4 sm:p-5 text-center transition-all hover:bg-white hover:border-emerald-200 hover:shadow-xs">
                            <div className="mx-auto flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">
                                Bảo Mật Dữ Liệu
                            </h4>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Mỗi trung tâm hoạt động độc lập, thông tin học sinh và học phí luôn được lưu trữ an toàn.
                            </p>
                        </Card>

                        <Card className="space-y-2.5 border-gray-100 bg-slate-50/60 p-4 sm:p-5 text-center transition-all hover:bg-white hover:border-blue-200 hover:shadow-xs">
                            <div className="mx-auto flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">
                                Vận Hành Ổn Định
                            </h4>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Hệ thống hoạt động thông suốt, tốc độ phản hồi nhanh, không làm gián đoạn việc giảng dạy.
                            </p>
                        </Card>

                        <Card className="space-y-2.5 border-gray-100 bg-slate-50/60 p-4 sm:p-5 text-center transition-all hover:bg-white hover:border-teal-200 hover:shadow-xs">
                            <div className="mx-auto flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">
                                Dễ Dàng Sử Dụng
                            </h4>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Giao diện tiếng Việt tinh gọn, giáo viên và học sinh có thể sử dụng ngay không cần đào tạo phức tạp.
                            </p>
                        </Card>

                        <Card className="space-y-2.5 border-gray-100 bg-slate-50/60 p-4 sm:p-5 text-center transition-all hover:border-amber-200 hover:shadow-xs">
                            <div className="mx-auto flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                                <Lock className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">
                                Đăng Nhập 1 Thiết Bị
                            </h4>
                            <p className="text-xs leading-relaxed text-gray-500">
                                Tự động bảo vệ tài khoản khi có đăng nhập mới và khóa phiên đăng nhập trên thiết bị cũ.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* ─── Final CTA Banner ────────────────────────────────────────── */}
            <section className="bg-emerald-700 py-12 sm:py-16 text-white text-center">
                <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6 px-4 sm:px-6 lg:px-8">
                    <h2 className="text-xl font-extrabold sm:text-3xl lg:text-4xl">
                        Sẵn Sàng Đồng Hành Cùng Giáo Dục Sam?
                    </h2>
                    <p className="text-xs sm:text-base text-emerald-100">
                        Khởi tạo trung tâm và trải nghiệm miễn phí 30 ngày đầy đủ tính năng ngay hôm nay. Không cần thẻ tín dụng, kích hoạt trong 30 giây.
                    </p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2 max-w-sm mx-auto sm:max-w-none">
                        <Link href="/register-center?plan=trial" className="w-full sm:w-auto">
                            <Button variant="secondary" size="lg" className="w-full justify-center" icon={<Sparkles className="h-5 w-5" />}>
                                Đăng Ký Dùng Thử 30 Ngày
                            </Button>
                        </Link>
                        <Link href="/contact" className="w-full sm:w-auto">
                            <Button variant="edit" size="lg" className="w-full justify-center" icon={<ArrowRight className="h-5 w-5" />}>
                                Liên Hệ Ban Tư Vấn
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
};

export default About;
