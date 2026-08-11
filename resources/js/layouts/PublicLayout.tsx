import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    LayoutDashboard,
    Mail,
    MapPin,
    Phone,
    Sparkles,
} from 'lucide-react';
import React from 'react';
import Button from '../components/ui/Button';

interface PublicLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    keywords?: string;
    canonicalUrl?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
    children,
    title,
    description,
    keywords,
    canonicalUrl,
}) => {
    const { auth, seo } = usePage().props as any;
    const user = auth?.user;

    const pageTitle =
        title ||
        seo?.title ||
        'Giải Pháp Quản Lý Giáo Dục - Hệ thống Quản lý Giáo dục Sam';
    const pageDescription =
        description ||
        seo?.description ||
        'Giải Pháp Quản Lý Giáo Dục Đa Trung Tâm tối ưu hóa quy trình quản lý học sinh, điểm danh thông minh, xếp lịch học và tự động gia hạn gói dịch vụ qua ZaloPay QR Code v2.';
    const pageKeywords =
        keywords ||
        seo?.keywords ||
        'Giải Pháp Quản Lý Giáo Dục, phần mềm quản lý trung tâm, quản lý học sinh, điểm danh thông minh, Giáo dục Sam, Sam Edu, ZaloPay';
    const pageCanonical =
        canonicalUrl || seo?.canonical_url || 'https://sam-edu.test';

    // JSON-LD Structured Data for Google Search Engine Optimization
    const schemaData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Hệ thống Quản lý Giáo dục Sam',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'Web',
        description: pageDescription,
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'VND',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Công ty Cổ phần Giáo dục Sam',
            url: pageCanonical,
        },
    };

    return (
        <div className="flex min-h-screen flex-col bg-white font-sans text-gray-900">
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <meta name="keywords" content={pageKeywords} />
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href={pageCanonical} />

                {/* Open Graph Tags */}
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={pageCanonical} />
                <meta property="og:site_name" content="Giáo dục Sam" />

                {/* Twitter Cards */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={pageDescription} />

                {/* Structured Data JSON-LD */}
                <script type="application/ld+json">
                    {JSON.stringify(schemaData)}
                </script>
            </Head>

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-2xs">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Brand Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-lg font-black text-white shadow-xs">
                            SAM
                        </div>
                        <div>
                            <span className="block text-base leading-tight font-extrabold text-gray-900">
                                Giáo dục Sam
                            </span>
                            <span className="block text-xs text-gray-500">
                                Hệ thống Quản lý Giáo dục Sam
                            </span>
                        </div>
                    </Link>

                    {/* Nav Links */}
                    <nav className="hidden items-center gap-8 text-sm font-medium text-gray-700 md:flex">
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
                    <div className="flex items-center gap-3">
                        {user ? (
                            <Link href="/dashboard">
                                <Button
                                    variant="success"
                                    size="sm"
                                    icon={
                                        <LayoutDashboard className="h-4 w-4" />
                                    }
                                >
                                    Trang của tôi
                                </Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="secondary" size="sm">
                                        Đăng nhập
                                    </Button>
                                </Link>
                                <Link href="/contact">
                                    <Button
                                        variant="success"
                                        size="sm"
                                        icon={<Sparkles className="h-4 w-4" />}
                                    >
                                        Dùng thử miễn phí
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Body */}
            <main className="flex-1">{children}</main>

            {/* Public Footer */}
            <footer className="border-t border-gray-800 bg-slate-900 pt-12 pb-8 text-white">
                <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        {/* Company Info */}
                        <div className="space-y-3 md:col-span-2">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                                    SAM
                                </div>
                                <span className="text-lg font-bold text-white">
                                    Công ty Cổ phần Giáo dục Sam
                                </span>
                            </div>
                            <p className="max-w-md text-xs leading-relaxed text-gray-400">
                                Nền tảng quản lý giáo dục đa trung tâm hàng đầu,
                                tối ưu hóa quy trình điểm danh, sĩ số học sinh,
                                xếp lịch và gia hạn tự động qua ZaloPay QR Code
                                v2.
                            </p>
                            <div className="space-y-1.5 pt-2 text-xs text-gray-300">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 shrink-0 text-emerald-400" />
                                    <span>
                                        Tòa nhà Sam Tower, Số 100 Phố Giáo Dục,
                                        Q. Cầu Giấy, Hà Nội
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 shrink-0 text-emerald-400" />
                                    <span>Hotline: 0988.123.456</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 shrink-0 text-emerald-400" />
                                    <span>Email: hotro@giaoducsam.vn</span>
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
                                Cổng Thanh Toán
                            </h4>
                            <p className="text-xs text-gray-400">
                                Tích hợp thanh toán gia hạn trung tâm tức thì
                                bằng ứng dụng ZaloPay QR Code v2.
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
                        © 2026 Hệ thống Quản lý Giáo dục Sam. Tất cả quyền được
                        bảo lưu.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
