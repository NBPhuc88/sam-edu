import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Phone, Mail, MapPin, Sparkles } from 'lucide-react';
import React from 'react';
import Button from '../components/ui/Button';

interface PublicLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({
    children,
    title = 'Hệ thống Quản lý Giáo dục Sam',
}) => {
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
            <Head title={title} />

            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-2xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Brand Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-xs">
                            SAM
                        </div>
                        <div>
                            <span className="text-base font-extrabold text-gray-900 leading-tight block">Giáo dục Sam</span>
                            <span className="text-xs text-gray-500 block">Hệ thống Quản lý Giáo dục Sam</span>
                        </div>
                    </Link>

                    {/* Nav Links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
                        <Link href="/" className="hover:text-emerald-700 transition-colors">
                            Trang chủ
                        </Link>
                        <Link href="/about" className="hover:text-emerald-700 transition-colors">
                            Về chúng tôi
                        </Link>
                        <Link href="/contact" className="hover:text-emerald-700 transition-colors">
                            Liên hệ tư vấn
                        </Link>
                    </nav>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-3">
                        <Link href="/login">
                            <Button variant="secondary" size="sm">
                                Đăng nhập
                            </Button>
                        </Link>
                        <Link href="/contact">
                            <Button variant="success" size="sm" icon={<Sparkles className="w-4 h-4" />}>
                                Dùng thử miễn phí
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content Body */}
            <main className="flex-1">{children}</main>

            {/* Public Footer */}
            <footer className="bg-slate-900 text-white pt-12 pb-8 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Company Info */}
                        <div className="md:col-span-2 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                                    SAM
                                </div>
                                <span className="text-lg font-bold text-white">Công ty Cổ phần Giáo dục Sam</span>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-md">
                                Nền tảng quản lý giáo dục đa trung tâm hàng đầu, tối ưu hóa quy trình điểm danh, sĩ số học sinh, xếp lịch và gia hạn tự động qua ZaloPay QR Code v2.
                            </p>
                            <div className="space-y-1.5 text-xs text-gray-300 pt-2">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>Tòa nhà Sam Tower, Số 100 Phố Giáo Dục, Q. Cầu Giấy, Hà Nội</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>Hotline: 0988.123.456</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span>Email: hotro@giaoducsam.vn</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-white">Điều hướng chính</h4>
                            <ul className="space-y-2 text-xs text-gray-400">
                                <li>
                                    <Link href="/" className="hover:text-white transition-colors">
                                        Trang chủ Marketing
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/about" className="hover:text-white transition-colors">
                                        Giới thiệu Công ty
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/contact" className="hover:text-white transition-colors">
                                        Liên hệ tư vấn & Dùng thử
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/login" className="hover:text-white transition-colors">
                                        Cổng Đăng nhập Hệ thống
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Service Highlights */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-white">Cổng Thanh Toán</h4>
                            <p className="text-xs text-gray-400">
                                Tích hợp thanh toán gia hạn trung tâm tức thì bằng ứng dụng ZaloPay QR Code v2.
                            </p>
                            <div className="pt-2">
                                <Link href="/login">
                                    <Button variant="success" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                                        Truy cập Portal
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
                        © 2026 Hệ thống Quản lý Giáo dục Sam. Tất cả quyền được bảo lưu.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
