import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import CenterForm from '../../../components/Center/CenterForm';
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

    const handleUpdate = (changedPayload: any) => {
        // If no fields changed, alert user or complete
        if (Object.keys(changedPayload).length === 0) {
            alert('Không có trường thông tin nào thay đổi.');

            return;
        }

        setIsLoading(true);
        // Send PATCH request with ONLY changed fields payload
        router.patch(`/centers/${center.id}`, changedPayload, {
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <AppLayout title={`Chỉnh sửa Trung Tâm: ${center.name} - Giáo dục Sam`}>
            <Head title={`Sửa Trung Tâm: ${center.name}`} />

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
