/**
 * DashboardLayout - Shared layout cho tất cả account types.
 *
 * Tất cả 4 account types (admin, center, teacher, student) dùng CÙNG layout này.
 * Sidebar thay đổi nội dung dựa trên role + adminRole.
 *
 * Xem: .agents/AGENTS.md - Mục 6.1 DashboardLayout Component
 */

import { router } from '@inertiajs/react';
import { AlertTriangle, CreditCard } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Header from './Header';
import Sidebar from './Sidebar';

interface AuthUser {
    id: number;
    full_name: string;
    username: string;
    email: string | null;
    role: string;
    admin_role?: string | null;
    avatar?: string | null;
}

interface SubscriptionPlan {
    id: number;
    code: string;
    name: string;
    price: number;
    duration_days: number;
    max_students: number;
    max_classes: number;
    badge_text?: string | null;
}

interface CenterData {
    id: number;
    code: string;
    name: string;
    subscription_plan?: string | null;
    expires_at?: string | null;
    is_expired?: boolean;
    expiring_soon?: boolean;
    expiring_1day?: boolean;
    days_remaining?: number;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    user: AuthUser | null;
    role: string | null;
    center?: CenterData | null;
    subscriptionPlans?: SubscriptionPlan[];
    onZaloPayRenew?: (planCode: string) => Promise<void>;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    user,
    role,
    center,
    subscriptionPlans = [],
    onZaloPayRenew,
}) => {
    // Default sidebar to closed on Mobile (< 768px), open on Desktop (>= 768px)
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768;
        }

        return true;
    });

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isLoadingPayment, setIsLoadingPayment] = useState(false);
    const [selectedPlanCode, setSelectedPlanCode] = useState<string>('yearly');

    // Auto close sidebar on Mobile (< 768px) whenever an Inertia page navigation completes
    useEffect(() => {
        const removeListener = router.on('navigate', () => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
                setSidebarOpen(false);
            }
        });

        return () => {
            removeListener();
        };
    }, []);

    const paidPlans = subscriptionPlans.filter((p) => p.price > 0);
    const showBanner =
        center &&
        (center.is_expired || center.expiring_soon || center.expiring_1day);

    const handleZaloPayRenew = async () => {
        if (!onZaloPayRenew) {
            return;
        }

        setIsLoadingPayment(true);

        try {
            await onZaloPayRenew(selectedPlanCode);
        } finally {
            setIsLoadingPayment(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-gray-900">
            {/* ── Sidebar ─────────────────────────────────────────────── */}
            <Sidebar
                role={role}
                adminRole={user?.admin_role}
                fullName={user?.full_name}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* ── Main Column ──────────────────────────────────────────── */}
            <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
                {/* Subscription Expiry Banner */}
                {showBanner && (
                    <div
                        className={`flex items-center justify-between px-4 py-2 text-xs font-medium text-white ${
                            center!.is_expired
                                ? 'bg-rose-600'
                                : center!.expiring_1day
                                  ? 'animate-pulse bg-amber-600'
                                  : 'bg-amber-500'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>
                                Trung tâm <strong>{center!.name}</strong> (
                                {center!.code})
                                {center!.expires_at
                                    ? ` · Hạn dùng: ${new Date(center!.expires_at).toLocaleDateString('vi-VN')}`
                                    : ''}
                                {center!.is_expired
                                    ? ' — ĐÃ HẾT HẠN DỊCH VỤ!'
                                    : center!.expiring_1day
                                      ? ' — CÒN 1 NGÀY (CẦN GIA HẠN GẤP!)'
                                      : ' — SẮP HẾT HẠN'}
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

                {/* Header */}
                <Header
                    user={user}
                    role={role}
                    sidebarOpen={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                    onOpenPayment={
                        showBanner
                            ? () => setIsPaymentModalOpen(true)
                            : undefined
                    }
                    centerExpired={center?.is_expired}
                />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>

            {/* ── ZaloPay Renewal Modal ─────────────────────────────────── */}
            {onZaloPayRenew && (
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
                                Thanh toán ZaloPay (
                                {(
                                    paidPlans.find(
                                        (p) => p.code === selectedPlanCode,
                                    )?.price ?? 4800000
                                ).toLocaleString('vi-VN')}
                                đ)
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Chọn gói gia hạn cho trung tâm{' '}
                            <strong>{center?.name}</strong>. Hệ thống sẽ mở cổng
                            ZaloPay QR Code v2 sau khi xác nhận.
                        </p>

                        {center?.subscription_plan === 'monthly' && (
                            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                                <span className="shrink-0 text-sm">💡</span>
                                <div>
                                    <strong>Khuyên dùng:</strong> Nâng lên{' '}
                                    <strong>Gói Theo Năm (4.800.000đ)</strong> —
                                    tiết kiệm 20% (chỉ 400.000đ/tháng).
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-gray-700 uppercase">
                                Chọn Gói Cước
                            </label>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {paidPlans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        onClick={() =>
                                            setSelectedPlanCode(plan.code)
                                        }
                                        className={`cursor-pointer rounded-lg border p-3 transition-all ${
                                            selectedPlanCode === plan.code
                                                ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-900">
                                                {plan.name}
                                            </span>
                                            {plan.badge_text && (
                                                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                                    {plan.badge_text}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 text-sm font-extrabold text-emerald-700">
                                            {plan.price.toLocaleString('vi-VN')}
                                            đ{' '}
                                            <span className="text-[10px] font-normal text-gray-500">
                                                /{' '}
                                                {plan.duration_days >= 365
                                                    ? 'năm'
                                                    : plan.duration_days >= 30
                                                      ? 'tháng'
                                                      : `${plan.duration_days} ngày`}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-[11px] text-gray-500">
                                            Tối đa {plan.max_students} HS ·{' '}
                                            {plan.max_classes} lớp
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
                            <div className="font-semibold text-emerald-900">
                                Chi tiết thanh toán ZaloPay:
                            </div>
                            <div>• Cổng thanh toán: ZaloPay QR Code v2</div>
                            <div>
                                • Tự động kích hoạt &amp; gia hạn ngay sau khi
                                thanh toán thành công.
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default DashboardLayout;
