import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    Building2,
    CreditCard,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import apiClient from '../lib/axios';

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
    children,
    title = 'Hệ thống Quản lý Giáo dục Sam',
}) => {
    const { auth, center } = usePage().props as any;

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isLoadingPayment, setIsLoadingPayment] = useState(false);

    const user = auth?.user;
    const role = auth?.role || 'admin';

    const handleLogout = () => {
        router.post('/logout');
    };

    const handleZaloPayRenew = async () => {
        setIsLoadingPayment(true);

        try {
            const response = await apiClient.post(
                '/api/payments/zalopay/create',
                {
                    center_id: center?.id || 1,
                    plan_code: 'standard',
                    plan_name: 'Gia hạn gói Chuẩn (12 Tháng)',
                    amount: 1500000,
                    duration_months: 12,
                },
            );

            if (response.data?.order_url) {
                window.location.href = response.data.order_url;
            } else {
                alert('Tạo đơn hàng ZaloPay thất bại. Vui lòng thử lại!');
            }
        } catch (error: any) {
            alert(
                error.response?.data?.message ||
                    'Có lỗi xảy ra khi gọi cổng ZaloPay.',
            );
        } finally {
            setIsLoadingPayment(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-gray-900">
            <Head title={title} />

            {/* Top Banner Alert if Center Expired / Expiring Soon */}
            {center && (center.is_expired || center.expiring_soon) && (
                <div className="flex items-center justify-between bg-amber-500 px-4 py-2 text-xs font-medium text-white shadow-xs sm:text-sm">
                    <div className="container mx-auto flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>
                            Trung tâm <strong>{center.name}</strong> (
                            {center.code}) - Gói:{' '}
                            <span className="font-bold uppercase">
                                {center.subscription_plan || 'Basic'}
                            </span>
                            {center.expires_at
                                ? ` (Hạn dùng: ${new Date(center.expires_at).toLocaleDateString('vi-VN')})`
                                : ''}
                            {center.is_expired
                                ? ' - ĐÃ HẾT HẠN DỊCH VỤ!'
                                : ' - SẮP HẾT HẠN DÙNG THỬ (CẦN GIA HẠN)'}
                        </span>
                    </div>
                    <Button
                        variant="success"
                        size="sm"
                        icon={<CreditCard className="h-3.5 w-3.5" />}
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="shrink-0 border-none bg-white text-emerald-800 shadow-xs hover:bg-emerald-50"
                    >
                        Gia hạn ZaloPay
                    </Button>
                </div>
            )}

            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white shadow-sm">
                            SAM
                        </div>
                        <div>
                            <h1 className="text-base leading-tight font-bold text-gray-900">
                                Giáo dục Sam
                            </h1>
                            <p className="text-xs text-gray-500">
                                Hệ thống Quản lý Giáo dục Sam
                            </p>
                        </div>
                    </div>

                    {/* Nav Links */}
                    <nav className="hidden items-center gap-6 text-sm font-medium text-gray-700 md:flex">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 transition-colors hover:text-emerald-700"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>
                        <Link
                            href="/statistics"
                            className="flex items-center gap-2 font-semibold text-emerald-700"
                        >
                            <BarChart3 className="h-4 w-4" />
                            <span>Thống kê Sĩ số</span>
                        </Link>
                        {role === 'admin' && (
                            <Link
                                href="/statistics"
                                className="flex items-center gap-2 transition-colors hover:text-emerald-700"
                            >
                                <Building2 className="h-4 w-4" />
                                <span>Trung tâm</span>
                            </Link>
                        )}
                        <span className="flex cursor-not-allowed items-center gap-2 text-gray-500 opacity-60">
                            <GraduationCap className="h-4 w-4" />
                            <span>Học sinh</span>
                        </span>
                        <span className="flex cursor-not-allowed items-center gap-2 text-gray-500 opacity-60">
                            <Users className="h-4 w-4" />
                            <span>Giáo viên</span>
                        </span>
                    </nav>

                    {/* Right User Bar */}
                    <div className="flex items-center gap-4">
                        <div className="hidden text-right sm:block">
                            <div className="text-sm font-semibold text-gray-900">
                                {user?.full_name || 'Người dùng'}
                            </div>
                            <div className="mt-0.5 flex items-center justify-end gap-1.5">
                                <Badge
                                    variant={
                                        role === 'admin'
                                            ? 'active'
                                            : role === 'teacher'
                                              ? 'pending'
                                              : 'info'
                                    }
                                >
                                    {role.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<LogOut className="h-4 w-4 text-gray-600" />}
                            onClick={handleLogout}
                        >
                            Đăng xuất
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
                <div className="mx-auto max-w-7xl px-4">
                    © 2026 Hệ thống Quản lý Giáo dục Sam. Clean White Design
                    Architecture.
                </div>
            </footer>

            {/* ZaloPay Renewal Modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Gia hạn gói dịch vụ qua ZaloPay"
                footer={
                    <>
                        <Button
                            variant="secondary"
                            onClick={() => setIsPaymentModalOpen(false)}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="success"
                            isLoading={isLoadingPayment}
                            icon={<CreditCard className="h-4 w-4" />}
                            onClick={handleZaloPayRenew}
                        >
                            Thanh toán ZaloPay (1.500.000đ)
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Thanh toán gia hạn <strong>12 tháng sử dụng</strong> cho
                        trung tâm <strong>{center?.name}</strong>. Sau khi bấm
                        thanh toán, hệ thống sẽ mở cổng ZaloPay QR Code để bạn
                        quét mã thanh toán tức thì.
                    </p>
                    <div className="space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
                        <div className="font-semibold text-emerald-900">
                            Chi tiết gói gia hạn:
                        </div>
                        <div>• Thời gian: 12 Tháng</div>
                        <div>• Giá gói: 1.500.000 VNĐ</div>
                        <div>• Cổng thanh toán: ZaloPay QR Code v2</div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AppLayout;
