import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import CenterForm from '../../../components/Center/CenterForm';
import AppLayout from '../../../layouts/AppLayout';

interface CreateProps {
    subscriptionPlans: any[];
    errors?: Record<string, string>;
}

export const Create: React.FC<CreateProps> = ({
    subscriptionPlans,
    errors,
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = (payload: any) => {
        setIsLoading(true);
        router.post('/centers', payload, {
            onFinish: () => setIsLoading(false),
        });
    };

    return (
        <AppLayout title="Thêm Trung Tâm Mới - SAM Digital">
            <Head title="Thêm Trung Tâm Mới" />

            <div className="mx-auto max-w-4xl space-y-6">
                <CenterForm
                    mode="create"
                    subscriptionPlans={subscriptionPlans}
                    onSubmit={handleCreate}
                    isLoading={isLoading}
                    errors={errors}
                />
            </div>
        </AppLayout>
    );
};

export default Create;
