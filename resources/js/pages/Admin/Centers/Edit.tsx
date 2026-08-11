import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import CenterForm from '../../../components/Center/CenterForm';
import Toast from '../../../components/ui/Toast';
import AppLayout from '../../../layouts/AppLayout';

interface EditProps {
    center: any;
    subscriptionPlans: any[];
    errors?: Record<string, string>;
}

export const Edit: React.FC<EditProps> = ({
    center,
    subscriptionPlans,
    errors,
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ isOpen: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({
        isOpen: false,
        message: '',
        type: 'info',
    });

    const handleUpdate = (changedPayload: any) => {
        if (Object.keys(changedPayload).length === 0) {
            setToast({
                isOpen: true,
                message: 'Không có trường thông tin nào thay đổi.',
                type: 'warning',
            });

            return;
        }

        setIsLoading(true);
        router.patch(`/centers/${center.id}`, changedPayload, {
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <AppLayout title={`Chỉnh sửa Trung Tâm: ${center.name} - Giáo dục Sam`}>
            <Head title={`Sửa Trung Tâm: ${center.name}`} />

            <Toast
                isOpen={toast.isOpen}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast((prev) => ({ ...prev, isOpen: false }))}
            />

            <div className="mx-auto max-w-4xl space-y-6">
                <CenterForm
                    mode="edit"
                    initialValues={center}
                    subscriptionPlans={subscriptionPlans}
                    onSubmit={handleUpdate}
                    isLoading={isLoading}
                    errors={errors}
                />
            </div>
        </AppLayout>
    );
};

export default Edit;
