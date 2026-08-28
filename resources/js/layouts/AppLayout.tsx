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
    const { auth, center, subscription_plans, flash, errors } = usePage().props as any;

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
        } else if (errors && Object.keys(errors).length > 0) {
            const firstError = Object.values(errors)[0];
            if (typeof firstError === 'string') {
                setToast({
                    isOpen: true,
                    message: firstError,
                    type: 'error',
                });
            }
        }
    }, [flash, errors]);

    /** Handle subscription renewal email request */
    const handleZaloPayRenew = async (planCode: string): Promise<void> => {
        const plans: any[] = subscription_plans ?? [];
        const targetPlan = plans.find((p: any) => p.code === planCode) ?? plans[0];

        try {
            const response = await apiClient.post('/api/payments/request-renewal', {
                center_id: center?.id,
                plan_code: targetPlan?.code ?? 'yearly',
            });

            if (response.data?.success) {
                setToast({
                    isOpen: true,
                    message:
                        response.data.message ||
                        'Đã gửi yêu cầu gia hạn tới Quản trị viên hệ thống thành công!',
                    type: 'success',
                });
            } else {
                setToast({
                    isOpen: true,
                    message:
                        response.data?.message ||
                        'Không thể gửi yêu cầu gia hạn. Vui lòng thử lại!',
                    type: 'error',
                });
            }
        } catch (err: any) {
            setToast({
                isOpen: true,
                message:
                    err?.response?.data?.message ||
                    'Có lỗi xảy ra khi gửi yêu cầu gia hạn.',
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
                onZaloPayRenew={
                    role === 'admin' && center ? handleZaloPayRenew : undefined
                }
                headerExtra={headerExtra}
            >
                {children}
            </DashboardLayout>
            <ScrollToTop />
        </>
    );
};

export default AppLayout;
