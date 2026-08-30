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

import { Head,router,usePage } from '@inertiajs/react';
import React,{ useEffect,useState } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import ScrollToTop from '../components/ui/ScrollToTop';
import Toast from '../components/ui/Toast';
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

    const [toast, setToast] = useState<{
        isOpen: boolean;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        key: number;
    }>({
        isOpen: false,
        message: '',
        type: 'info',
        key: 0,
    });

    const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        if (!message) {
            return;
        }
        setToast({
            isOpen: true,
            message,
            type,
            key: Date.now() + Math.random(),
        });
    };

    // Lắng nghe sự kiện toàn cục từ Inertia router và custom app events
    useEffect(() => {
        // 1. Lắng nghe lỗi validation khi submit form (kích hoạt mỗi lần có lỗi 422 kể cả trùng lặp)
        const removeErrorListener = router.on('error', (errorsPayload: any) => {
            const errorObj = errorsPayload?.detail?.errors || errorsPayload;
            if (errorObj && typeof errorObj === 'object') {
                const errorValues = Object.values(errorObj);
                if (errorValues.length > 0) {
                    const firstError = Array.isArray(errorValues[0]) ? errorValues[0][0] : errorValues[0];
                    if (typeof firstError === 'string') {
                        showToast(firstError, 'error');
                    }
                }
            }
        });

        // 2. Lắng nghe lỗi HTTP exception / network error
        const removeExceptionListener = router.on('httpException', (event: any) => {
            const response = event?.detail?.response;
            const message = response?.data?.message || 'Có lỗi xảy ra trong quá trình xử lý.';
            showToast(message, 'error');
        });

        // 3. Lắng nghe thông báo flash khi request thành công
        const removeSuccessListener = router.on('success', (event: any) => {
            const pageFlash = event?.detail?.page?.props?.flash;
            if (pageFlash?.success) {
                showToast(pageFlash.success, 'success');
            } else if (pageFlash?.error) {
                showToast(pageFlash.error, 'error');
            } else if (pageFlash?.warning) {
                showToast(pageFlash.warning, 'warning');
            } else if (pageFlash?.info) {
                showToast(pageFlash.info, 'info');
            }
        });

        // 4. Lắng nghe custom event từ các component con (vd: client-side validation)
        const handleCustomToast = (event: Event) => {
            const customEvent = event as CustomEvent<{ message: string; type?: 'success' | 'error' | 'warning' | 'info' }>;
            if (customEvent.detail?.message) {
                showToast(customEvent.detail.message, customEvent.detail.type || 'info');
            }
        };

        window.addEventListener('app:toast', handleCustomToast);

        return () => {
            removeErrorListener();
            removeExceptionListener();
            removeSuccessListener();
            window.removeEventListener('app:toast', handleCustomToast);
        };
    }, []);

    // Hiển thị flash hoặc errors khi tải trang lần đầu
    useEffect(() => {
        if (flash?.success) {
            showToast(flash.success, 'success');
        } else if (flash?.error) {
            showToast(flash.error, 'error');
        } else if (flash?.warning) {
            showToast(flash.warning, 'warning');
        } else if (flash?.info) {
            showToast(flash.info, 'info');
        } else if (errors && Object.keys(errors).length > 0) {
            const firstError = Object.values(errors)[0];
            if (typeof firstError === 'string') {
                showToast(firstError, 'error');
            }
        }
    }, [flash, errors]);

    /** Handle subscription renewal email request */
    const handleZaloPayRenew = async (
        planCode: string,
        durationType: 'monthly' | 'yearly' = 'yearly',
    ): Promise<void> => {
        const plans: any[] = subscription_plans ?? [];
        const targetPlan = plans.find((p: any) => p.code === planCode) ?? plans[0];

        try {
            const response = await apiClient.post('/api/payments/request-renewal', {
                center_id: center?.id,
                plan_code: targetPlan?.code ?? 'yearly',
                duration_type: durationType,
            });

            if (response.data?.success) {
                showToast(
                    response.data.message ||
                        'Đã gửi yêu cầu gia hạn tới Quản trị viên hệ thống thành công!',
                    'success',
                );
            } else {
                showToast(
                    response.data?.message ||
                        'Không thể gửi yêu cầu gia hạn. Vui lòng thử lại!',
                    'error',
                );
            }
        } catch (err: any) {
            showToast(
                err?.response?.data?.message ||
                    'Có lỗi xảy ra khi gửi yêu cầu gia hạn.',
                'error',
            );
        }
    };

    return (
        <>
            <Head title={title} />
            <Toast
                key={toast.key}
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
