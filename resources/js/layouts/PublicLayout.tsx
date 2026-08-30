import { Link,usePage } from '@inertiajs/react';
import {
ArrowRight,
LayoutDashboard,
Mail,
MapPin,
Menu,
Phone,
Sparkles,
X,
} from 'lucide-react';
import React,{ useState } from 'react';
import AppLogo from '../components/common/AppLogo';
import SeoHead from '../components/common/SeoHead';
import Button from '../components/ui/Button';
import ScrollToTop from '../components/ui/ScrollToTop';
import { generateOrganizationSchema,generateWebSiteSchema } from '../utils/schemaGenerator';

interface PublicLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    keywords?: string;
    canonicalUrl?: string;
    schemaJson?: object | object[];
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
    children,
    title,
    description,
    keywords,
    canonicalUrl,
    schemaJson,
}) => {
    const { auth, seo, contactInfo } = usePage().props as any;
    const user = auth?.user;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const pageTitle =
        seo?.title ||
        title ||
        'Giải Pháp Quản Lý Giáo Dục - SAM Digital';
    const pageDescription =
        seo?.description ||
        description ||
        'Giải Pháp Quản Lý Trung Tâm Giáo Dục toàn diện: tối ưu hóa quy trình quản lý học sinh, điểm danh thông minh, xếp lịch học, khảo thí 9 dạng câu hỏi và chat lớp học thời gian thực.';
    const pageKeywords =
        seo?.keywords ||
        keywords ||
        'Giải Pháp Quản Lý Giáo Dục, phần mềm quản lý trung tâm, quản lý học sinh, điểm danh thông minh, khảo thí trực tuyến, SAM Digital';
    const pageCanonical =
        seo?.canonical_url || canonicalUrl || 'https://www.samedu.io.vn';
    const pageOgImage =
        seo?.og_image || 'https://www.samedu.io.vn/og-banner.png';

    const defaultSchemas = [
        generateOrganizationSchema({ url: 'https://www.samedu.io.vn' }),
        generateWebSiteSchema('https://www.samedu.io.vn'),
        ...(Array.isArray(schemaJson) ? schemaJson : schemaJson ? [schemaJson] : []),
    ];

    return (
        <div className="flex min-h-screen flex-col bg-white font-sans text-gray-900">
            <SeoHead
                title={pageTitle}
                description={pageDescription}
                keywords={pageKeywords}
                canonical={pageCanonical}
                ogImage={pageOgImage}
                schemaJson={defaultSchemas}
            />

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-xs shadow-2xs">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8">
                    {/* Brand Logo */}
                    <Link
                        href="/"
                        className="flex shrink-0 items-center min-w-0 mr-2"
                    >
                        <AppLogo
                            withText={true}
                            brandName="SAM Digital"
                            subtitle="Hệ thống Quản lý Trung Tâm Giáo Dục"
                            size="md"
                            hideSubtitleOnMobile={true}
                        />
                    </Link>

                    {/* Nav Links */}
                    <nav className="hidden items-center gap-6 lg:gap-8 text-sm font-medium text-gray-700 md:flex">
                        <Link
                            href="/"
                            className="transition-colors hover:text-emerald-700"
                        >
                            Trang chủ
                        </Link>
                        <Link
                            href="/services"
                            className="transition-colors hover:text-emerald-700"
                        >
                            Gói cước &amp; Dịch vụ
                        </Link>
                        <Link
                            href="/about"
                            className="transition-colors hover:text-emerald-700"
                        >
                            Về chúng tôi
                        </Link>
                        <Link
                            href="/contact"
                            className="transition-colors hover:text-emerald-700"
                        >
                            Liên hệ tư vấn
                        </Link>
                    </nav>

                    {/* Right Action Buttons */}
                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                        {user ? (
                            <Link href="/dashboard">
                                <Button
                                    variant="success"
                                    size="sm"
                                    icon={
                                        <LayoutDashboard className="h-4 w-4" />
                                    }
                                >
                                    <span className="hidden xs:inline">Trang của tôi</span>
                                    <span className="xs:hidden">Portal</span>
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="secondary" size="sm" className="px-2.5 sm:px-3 text-xs sm:text-sm">
                                        Đăng nhập
                                    </Button>
                                </Link>
                                <Link
                                    href="/register-center?plan=trial"
                                    className="hidden sm:inline-flex"
                                >
                                    <Button
                                        variant="success"
                                        size="sm"
                                        icon={<Sparkles className="h-4 w-4" />}
                                    >
                                        Dùng thử 1 tháng
                                    </Button>
                                </Link>
                            </>
                        )}

                        {/* Hamburger Mobile Toggle Icon */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((prev) => !prev)}
                            className="rounded-lg p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 md:hidden transition-colors"
                            aria-label="Toggle Navigation Menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="h-6 w-6 text-gray-800" />
                            ) : (
                                <Menu className="h-6 w-6 text-gray-800" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Navigation Drawer */}
                {mobileMenuOpen && (
                    <div className="animate-in slide-in-from-top-2 border-b border-gray-200 bg-white px-4 pt-3 pb-6 shadow-xl md:hidden">
                        <nav className="flex flex-col space-y-1 text-sm font-semibold text-gray-700">
                            <Link
                                href="/"
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg px-3 py-2.5 transition-colors hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100"
                            >
                                Trang chủ
                            </Link>
                            <Link
                                href="/services"
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg px-3 py-2.5 transition-colors hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100"
                            >
                                Gói cước &amp; Dịch vụ
                            </Link>
                            <Link
                                href="/about"
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg px-3 py-2.5 transition-colors hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100"
                            >
                                Về chúng tôi
                            </Link>
                            <Link
                                href="/contact"
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg px-3 py-2.5 transition-colors hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100"
                            >
                                Liên hệ tư vấn
                            </Link>
                        </nav>
                        {!user && (
                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                <Link
                                    href="/register-center?plan=trial"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block w-full"
                                >
                                    <Button
                                        variant="success"
                                        size="sm"
                                        className="w-full justify-center py-2.5"
                                        icon={<Sparkles className="h-4 w-4" />}
                                    >
                                        Dùng thử miễn phí 30 ngày
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Main Content Body */}
            <main className="flex-1 w-full overflow-x-hidden">{children}</main>

            {/* Public Footer */}
            <footer className="border-t border-gray-800 bg-slate-900 pt-12 pb-8 text-white">
                <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        {/* Company Info */}
                        <div className="space-y-3 md:col-span-2">
                            <AppLogo
                                withText={true}
                                brandName={contactInfo?.company_name || 'Công ty Cổ phần SAM Digital'}
                                textColor="light"
                                size="sm"
                            />
                            <p className="max-w-md text-xs leading-relaxed text-gray-400">
                                Hệ sinh thái chuyển đổi số trung tâm giáo dục toàn diện: Chuẩn hóa vận hành học vụ, tự động xếp lịch &amp; điểm danh, tích hợp khảo thí trực tuyến 9 dạng câu hỏi, chat nhóm lớp học trực tuyến và quản trị phân quyền an toàn, hiệu quả.
                            </p>
                            <div className="space-y-1.5 pt-2 text-xs text-gray-300">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 shrink-0 text-emerald-400" />
                                    <span>
                                        {contactInfo?.address ||
                                            'Tòa nhà Sam Tower, Số 100 Phố Giáo Dục, Q. Cầu Giấy, Hà Nội'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 shrink-0 text-emerald-400" />
                                    <a
                                        href={`tel:${(contactInfo?.phone || '0988.123.456').replace(/[^0-9+]/g, '')}`}
                                        className="transition-colors hover:text-emerald-400"
                                    >
                                        Hotline: {contactInfo?.phone || '0988.123.456'}
                                    </a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 shrink-0 text-emerald-400" />
                                    <a
                                        href={`mailto:${contactInfo?.email || 'phucstt01@gmail.com'}`}
                                        className="transition-colors hover:text-emerald-400"
                                    >
                                        Email: {contactInfo?.email || 'phucstt01@gmail.com'}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-white">
                                Điều hướng chính
                            </h4>
                            <ul className="space-y-2 text-xs text-gray-400">
                                <li>
                                    <Link
                                        href="/"
                                        className="transition-colors hover:text-white"
                                    >
                                        Trang chủ Marketing
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/about"
                                        className="transition-colors hover:text-white"
                                    >
                                        Giới thiệu Công ty
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/contact"
                                        className="transition-colors hover:text-white"
                                    >
                                        Liên hệ tư vấn & Dùng thử
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/login"
                                        className="transition-colors hover:text-white"
                                    >
                                        Cổng Đăng nhập Hệ thống
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Service Highlights */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-white">
                                Hỗ Trợ Gia Hạn
                            </h4>
                            <p className="text-xs text-gray-400">
                                Hệ thống sẽ tự động gửi email thông báo trước 7 ngày khi gói dịch vụ sắp hết hạn.
                            </p>
                            <div className="pt-2">
                                <Link href="/login">
                                    <Button
                                        variant="success"
                                        size="sm"
                                        icon={
                                            <ArrowRight className="h-4 w-4" />
                                        }
                                    >
                                        Truy cập Portal
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
                        © 2026 SAM Digital - Hệ thống Quản lý Trung Tâm Giáo Dục. Tất cả quyền được
                        bảo lưu.
                    </div>
                </div>
            </footer>
            <ScrollToTop />
        </div>
    );
};

export default PublicLayout;
