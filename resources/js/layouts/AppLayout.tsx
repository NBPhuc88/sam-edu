/**
 * AppLayout - Wrapper over DashboardLayout for Inertia.js pages.
 *
 * Pages import AppLayout như cũ — không cần thay đổi gì ở các page files.
 * AppLayout lấy auth, center, subscription_plans từ Inertia shared props
 * và chuyển xuống DashboardLayout.
 *
 * Cấu trúc layout: Sidebar (dynamic nav) + Header + main content
 * Xem: .agents/AGENTS.md - Mục 6.1
 */

import { Head, usePage } from '@inertiajs/react';
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import Toast from '../components/ui/Toast';
import ScrollToTop from '../components/ui/ScrollToTop';
import apiClient from '../lib/axios';

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
    headerExtra?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({
    children,
    title = 'SAM Digital - Hệ thống Quản lý Trung Tâm Giáo Dục',
    headerExtra,
}) => {
    const { auth, center, subscription_plans, flash } = usePage().props as any;

    const user = auth?.user ?? null;
    const role = auth?.role ?? null;

    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({
        isOpen: false,
        message: '',
        type: 'info',
    });

    useEffect(() => {
        if (flash?.success) {
            setToast({
                isOpen: true,
                message: flash.success,
                type: 'success',
            });
        } else if (flash?.error) {
            setToast({
                isOpen: true,
                message: flash.error,
                type: 'error',
            });
        } else if (flash?.warning) {
            setToast({
                isOpen: true,
                message: flash.warning,
                type: 'warning',
            });
        } else if (flash?.info) {
            setToast({
                isOpen: true,
                message: flash.info,
                type: 'info',
            });
        }
    }, [flash]);

    /** Handle ZaloPay renewal */
    const handleZaloPayRenew = async (planCode: string): Promise<void> => {
        const plans: any[] = subscription_plans ?? [];
        const targetPlan = plans.find((p: any) => p.code === planCode) ?? plans[0];

        try {
            const response = await apiClient.post('/api/payments/zalopay/create', {
                center_id: center?.id ?? 1,
                plan_code: targetPlan?.code ?? 'yearly',
                plan_name: targetPlan?.name ?? 'Gói Theo Năm (Tiết kiệm 20%)',
                amount: targetPlan?.price ?? 4800000,
                duration_days: targetPlan?.duration_days ?? 365,
            });

            if (response.data?.order_url) {
                window.location.assign(response.data.order_url);
            } else {
                setToast({
                    isOpen: true,
                    message: 'Tạo đơn hàng ZaloPay thất bại. Vui lòng thử lại!',
                    type: 'error',
                });
            }
        } catch {
            setToast({
                isOpen: true,
                message: 'Có lỗi xảy ra khi tạo đơn hàng ZaloPay.',
                type: 'error',
            });
        }
    };

    return (
        <>
            <Head title={title} />
            <Toast
                isOpen={toast.isOpen}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
            />
            <DashboardLayout
                user={user}
                role={role}
                center={center ?? null}
                subscriptionPlans={subscription_plans ?? []}
                onZaloPayRenew={center ? handleZaloPayRenew : undefined}
                headerExtra={headerExtra}
            >
                {children}
            </DashboardLayout>
            <ScrollToTop />
        </>
    );
};

export default AppLayout;
