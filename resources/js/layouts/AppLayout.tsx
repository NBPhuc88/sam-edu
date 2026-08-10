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

export const AppLayout: React.FC<AppLayoutProps> = ({ children, title = 'Hệ thống Quản lý Giáo dục Sam' }) => {
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
            const response = await apiClient.post('/api/payments/zalopay/create', {
                center_id: center?.id || 1,
                plan_code: 'standard',
                plan_name: 'Gia hạn gói Chuẩn (12 Tháng)',
                amount: 1500000,
                duration_months: 12,
            });

            if (response.data?.order_url) {
                window.location.href = response.data.order_url;
            } else {
                alert('Tạo đơn hàng ZaloPay thất bại. Vui lòng thử lại!');
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Có lỗi xảy ra khi gọi cổng ZaloPay.');
        } finally {
            setIsLoadingPayment(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900">
            <Head title={title} />

            {/* Top Banner Alert if Center Expired / Expiring Soon */}
            {center && (
                <div className="bg-amber-500 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2 container mx-auto">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                            Trung tâm <strong>{center.name}</strong> ({center.code}) - Gói:{' '}
                            <span className="uppercase font-bold">{center.subscription_plan || 'Basic'}</span>
                            {center.expires_at ? ` (Hạn dùng: ${new Date(center.expires_at).toLocaleDateString('vi-VN')})` : ''}
                        </span>
                    </div>
                    <Button
                        variant="success"
                        size="sm"
                        icon={<CreditCard className="w-3.5 h-3.5" />}
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="shrink-0 bg-white text-emerald-800 hover:bg-emerald-50 border-none shadow-xs"
                    >
                        Gia hạn ZaloPay
                    </Button>
                </div>
            )}

            {/* Top Navigation Bar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            SAM
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-gray-900 leading-tight">Giáo dục Sam</h1>
                            <p className="text-xs text-gray-500">Hệ thống Quản lý Giáo dục Sam</p>
                        </div>
                    </div>

                    {/* Nav Links */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
                        <Link href="/dashboard" className="flex items-center gap-2 hover:text-emerald-700 transition-colors">
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                        </Link>
                        <Link href="/statistics" className="flex items-center gap-2 text-emerald-700 font-semibold">
                            <BarChart3 className="w-4 h-4" />
                            <span>Thống kê Sĩ số</span>
                        </Link>
                        <span className="flex items-center gap-2 text-gray-500 cursor-not-allowed opacity-60">
                            <Building2 className="w-4 h-4" />
                            <span>Trung tâm</span>
                        </span>
                        <span className="flex items-center gap-2 text-gray-500 cursor-not-allowed opacity-60">
                            <GraduationCap className="w-4 h-4" />
                            <span>Học sinh</span>
                        </span>
                        <span className="flex items-center gap-2 text-gray-500 cursor-not-allowed opacity-60">
                            <Users className="w-4 h-4" />
                            <span>Giáo viên</span>
                        </span>
                    </nav>

                    {/* Right User Bar */}
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-semibold text-gray-900">{user?.full_name || 'Người dùng'}</div>
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                <Badge variant={role === 'admin' ? 'active' : role === 'teacher' ? 'pending' : 'info'}>
                                    {role.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            icon={<LogOut className="w-4 h-4 text-gray-600" />}
                            onClick={handleLogout}
                        >
                            Đăng xuất
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
                <div className="max-w-7xl mx-auto px-4">
                    © 2026 Hệ thống Quản lý Giáo dục Sam. Clean White Design Architecture.
                </div>
            </footer>

            {/* ZaloPay Renewal Modal */}
            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title="Gia hạn gói dịch vụ qua ZaloPay"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
                            Hủy bỏ
                        </Button>
                        <Button
                            variant="success"
                            isLoading={isLoadingPayment}
                            icon={<CreditCard className="w-4 h-4" />}
                            onClick={handleZaloPayRenew}
                        >
                            Thanh toán ZaloPay (1.500.000đ)
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Thanh toán gia hạn <strong>12 tháng sử dụng</strong> cho trung tâm <strong>{center?.name}</strong>. Sau khi bấm thanh toán, hệ thống sẽ mở cổng ZaloPay QR Code để bạn quét mã thanh toán tức thì.
                    </p>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-xs text-emerald-800 space-y-1">
                        <div className="font-semibold text-emerald-900">Chi tiết gói gia hạn:</div>
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
