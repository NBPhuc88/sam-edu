import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Headphones, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
    const { contactInfo } = usePage().props as any;
    const currentYear = new Date().getFullYear();

    const companyName = contactInfo?.company_name || 'Hệ thống Quản lý Giáo dục Sam';
    const phone = contactInfo?.phone || '0988.123.456';
    const email = contactInfo?.email || 'phucstt01@gmail.com';

    return (
        <footer className="mt-auto border-t border-gray-200 bg-white px-4 py-4 text-xs text-gray-500 sm:px-6">
            <div className="mx-auto flex flex-col items-center justify-between gap-3 sm:flex-row">
                {/* Left: System Info & Copyright */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-center sm:justify-start sm:text-left">
                    <span className="font-semibold text-gray-800">
                        {companyName}
                    </span>
                    <span className="hidden text-gray-300 sm:inline">•</span>
                    <span>© {currentYear} Sam Edu. Bảo lưu mọi quyền.</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        v1.0.0
                    </span>
                </div>

                {/* Right: Quick Support & External Links */}
                <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
                    <a
                        href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                        className="inline-flex items-center gap-1 text-gray-600 transition-colors hover:text-emerald-700"
                        title="Hotline hỗ trợ kỹ thuật"
                    >
                        <Headphones className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Hotline: {phone}</span>
                    </a>

                    <span className="hidden text-gray-300 sm:inline">•</span>

                    <a
                        href={`mailto:${email}`}
                        className="text-gray-600 transition-colors hover:text-emerald-700"
                        title="Email hỗ trợ"
                    >
                        Hỗ trợ kỹ thuật
                    </a>

                    <span className="hidden text-gray-300 sm:inline">•</span>

                    <Link
                        href="/"
                        target="_blank"
                        className="inline-flex items-center gap-1 text-gray-600 transition-colors hover:text-emerald-700"
                        title="Xem trang chủ"
                    >
                        <span>Trang chủ</span>
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
