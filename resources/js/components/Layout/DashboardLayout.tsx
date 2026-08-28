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
import Footer from './Footer';
import { formatDate } from '@/lib/date';

interface AuthUser {
    id: number;
    full_name: string;
    username: string;
    email: string | null;
    role: string;
    admin_role?: 'super_admin' | 'admin' | null;
    avatar?: string | null;
}

interface SubscriptionPlan {
    id: number;
    code: string;
    name: string;
    price: number;
    yearly_price?: number | null;
    duration_days: number;
    max_students: number;
    max_classes: number;
    badge_text?: string | null;
}

interface CenterData {
    id: number;
    code: string;
    name: string;
    subscription_plan?: number | null;
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
    onZaloPayRenew?: (
        planCode: string,
        durationType: 'monthly' | 'yearly',
    ) => Promise<void>;
    headerExtra?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    user,
    role,
    center,
    subscriptionPlans = [],
    onZaloPayRenew,
    headerExtra,
}) => {
    // Default sidebar to closed on Mobile (< 768px), open on Desktop (>= 768px)
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768;
        }

        return false;
    });

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isLoadingPayment, setIsLoadingPayment] = useState(false);
    const [durationType, setDurationType] = useState<'monthly' | 'yearly'>('yearly');

    const paidPlans = subscriptionPlans.filter((p) => p.price > 0);

    const [selectedPlanCode, setSelectedPlanCode] = useState<string>(
        () => {
            const found = paidPlans.find((p) => p.id === center?.subscription_plan || p.code === String(center?.subscription_plan));
            return found?.code || paidPlans[0]?.code || 'basic_5';
        },
    );

    useEffect(() => {
        if (paidPlans.length > 0 && !paidPlans.some((p) => p.code === selectedPlanCode)) {
            const matched = paidPlans.find((p) => p.id === center?.subscription_plan || p.code === String(center?.subscription_plan));
            const defaultCode = matched ? matched.code : paidPlans[0].code;
            setSelectedPlanCode(defaultCode);
        }
    }, [subscriptionPlans, center]);

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

    const showBanner =
        role === 'admin' &&
        center &&
        (center.is_expired || center.expiring_soon || center.expiring_1day);

    const getPlanPrice = (plan: SubscriptionPlan): number => {
        if (durationType === 'yearly') {
            return plan.yearly_price ?? plan.price * 12;
        }

        return plan.price;
    };

    const selectedPlan =
        paidPlans.find((p) => p.code === selectedPlanCode) ?? paidPlans[0];
    const currentTotalPrice = selectedPlan ? getPlanPrice(selectedPlan) : 0;

    const handleZaloPayRenew = async () => {
        if (!onZaloPayRenew) {
            return;
        }

        setIsLoadingPayment(true);

        try {
            await onZaloPayRenew(selectedPlanCode, durationType);
            setIsPaymentModalOpen(false);
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
            <div className="flex min-w-0 flex-1 flex-col">
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
                                    ? ` · Hạn dùng: ${formatDate(center!.expires_at)}`
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
                            Gia hạn dịch vụ
                        </Button>
                    </div>
                )}

                {/* Header */}
                <Header
                    user={user}
                    role={role}
                    center={center}
                    sidebarOpen={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
                    onOpenPayment={
                        showBanner && role === 'admin'
                            ? () => setIsPaymentModalOpen(true)
                            : undefined
                    }
                    centerExpired={role === 'admin' && center?.is_expired}
                    headerExtra={headerExtra}
                />

                {/* Page Content */}
                <main className="flex-1 p-6">{children}</main>

                {/* Footer */}
                <Footer />
            </div>

            {/* ── Renewal Request Modal ─────────────────────────────────── */}
            {onZaloPayRenew && role === 'admin' && (
                <Modal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setIsPaymentModalOpen(false)}
                    title="Gửi Yêu Cầu Gia Hạn Gói Dịch Vụ"
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
                                Gửi yêu cầu gia hạn {durationType === 'yearly' ? '1 năm' : '1 tháng'} (
                                {currentTotalPrice.toLocaleString('vi-VN')}đ)
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Chọn gói gia hạn cho trung tâm{' '}
                            <strong>{center?.name}</strong>. Hệ thống sẽ tự động gửi Email thông báo yêu cầu gia hạn tới Quản trị viên hệ thống.
                        </p>

                        {/* Thời hạn gia hạn selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-gray-700 uppercase">
                                Thời Hạn Gia Hạn
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDurationType('yearly')}
                                    className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all ${
                                        durationType === 'yearly'
                                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="text-xs">Gia Hạn 1 Năm</span>
                                    <span className="mt-0.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                                        ⚡ Tiết kiệm 20%
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDurationType('monthly')}
                                    className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all ${
                                        durationType === 'monthly'
                                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="text-xs">Gia Hạn 1 Tháng</span>
                                    <span className="mt-0.5 text-[10px] text-gray-500">Thanh toán từng tháng</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-wider text-gray-700 uppercase">
                                Chọn Gói Cước
                            </label>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {paidPlans.map((plan) => {
                                    const planPrice = getPlanPrice(plan);
                                    return (
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
                                                {planPrice.toLocaleString('vi-VN')}
                                                đ{' '}
                                                <span className="text-[10px] font-normal text-gray-500">
                                                    /{' '}
                                                    {durationType === 'yearly'
                                                        ? 'năm'
                                                        : 'tháng'}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-[11px] text-gray-500">
                                                Tối đa {plan.max_students} HS ·{' '}
                                                {plan.max_classes} lớp
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-1 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
                            <div className="font-semibold text-emerald-900">
                                Thông tin gửi yêu cầu gia hạn:
                            </div>
                            <div>
                                • Khi bấm "Gửi yêu cầu gia hạn", hệ thống sẽ tự động gửi Email thông báo tới Quản trị viên hệ thống.
                            </div>
                            <div>
                                • Quản trị viên hệ thống sẽ nhận được thông tin gói cước và thời hạn bạn chọn để hỗ trợ gia hạn cho bạn.
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default DashboardLayout;
