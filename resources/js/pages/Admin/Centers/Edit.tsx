import {
    PLAN_TYPE_LABELS,
    SUBSCRIPTION_STATUS_ACTIVE,
    SUBSCRIPTION_STATUS_CANCELLED,
    SUBSCRIPTION_STATUS_EXPIRED,
    SUBSCRIPTION_STATUS_LABELS,
    SUBSCRIPTION_STATUS_PENDING,
} from '@/constants/enums';
import { usePermission } from '@/hooks/usePermission';
import { formatDate } from '@/lib/date';
import { notify } from '@/lib/toast';
import { Head, router } from '@inertiajs/react';
import { Edit2, History, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import CenterForm from '../../../components/Center/CenterForm';
import EditSubscriptionModal, { SubscriptionRecord } from '../../../components/Center/EditSubscriptionModal';
import RenewSubscriptionModal from '../../../components/Center/RenewSubscriptionModal';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import AppLayout from '../../../layouts/AppLayout';

interface EditProps {
    center: any;
    subscriptionPlans: any[];
    subscriptions?: SubscriptionRecord[];
    errors?: Record<string, string>;
}

export const Edit: React.FC<EditProps> = ({
    center,
    subscriptionPlans,
    subscriptions = [],
    errors,
}) => {
    const { isSuperAdmin } = usePermission();
    const [isLoading, setIsLoading] = useState(false);
    const [renewModalOpen, setRenewModalOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<SubscriptionRecord | null>(null);
    const [deletingSub, setDeletingSub] = useState<SubscriptionRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const handleUpdate = (formData: any) => {
        if (!formData || Object.keys(formData).length === 0) {
            notify.info('Không có thông tin nào thay đổi để cập nhật.');
            return;
        }

        setIsLoading(true);
        router.patch(`/centers/${center.id}`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsLoading(false);
                notify.success('Cập nhật thông tin trung tâm thành công!');
            },
            onError: (errs) => {
                setIsLoading(false);
                const firstErr = errs && Object.values(errs)[0];
                notify.error(typeof firstErr === 'string' ? firstErr : 'Có lỗi xảy ra khi cập nhật. Vui lòng kiểm tra lại.');
            },
        });
    };

    const handleDeleteSub = () => {
        if (!deletingSub) return;
        setIsDeleting(true);
        router.delete(`/centers/${center.id}/subscriptions/${deletingSub.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                setDeletingSub(null);
                notify.success('Đã xóa bản ghi gói cước và tính toán lại thông số trung tâm thành công!');
            },
            onError: () => {
                setIsDeleting(false);
                notify.error('Có lỗi xảy ra khi xóa bản ghi gói cước.');
            },
        });
    };

    return (
        <AppLayout title={`Chỉnh sửa Trung Tâm: ${center.name} - SAM Digital`}>
            <Head title={`Chỉnh sửa Trung Tâm - ${center.name}`} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Super Admin Quick Renew Action Bar */}
                {isSuperAdmin && (
                    <Card className="p-5 border-l-4 border-l-emerald-600 bg-gradient-to-r from-emerald-50/50 to-white">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-emerald-600" />
                                    Quản Lý Gói Cước SaaS Trung Tâm
                                </h3>
                                <p className="mt-1 text-xs text-gray-600">
                                    {(() => {
                                        const matchedPlan = subscriptionPlans?.find(
                                            (p: any) => p.id === center.subscription_plan_id,
                                        );
                                        const planType = center.plan_type ?? matchedPlan?.plan_type;
                                        const planName = matchedPlan?.name || PLAN_TYPE_LABELS[planType] || `Gói #${center.subscription_plan_id}`;
                                        return (
                                            <>
                                                Gói hiện tại: <strong className="text-emerald-700">{planName}</strong> • Hạn dùng: <strong>{center.expires_at ? formatDate(center.expires_at) : 'Vô thời hạn'}</strong>
                                            </>
                                        );
                                    })()}
                                </p>
                            </div>
                            <Button
                                variant="success"
                                size="md"
                                icon={<RefreshCw className="h-4.5 w-4.5" />}
                                onClick={() => setRenewModalOpen(true)}
                            >
                                Gia Hạn / Đổi Gói Cước
                            </Button>
                        </div>
                    </Card>
                )}

                <CenterForm
                    mode="edit"
                    initialValues={center}
                    subscriptionPlans={subscriptionPlans}
                    onSubmit={handleUpdate}
                    isLoading={isLoading}
                    errors={errors}
                />

                {/* Subscription History Section */}
                <Card className="p-6">
                    <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-emerald-600" />
                            <h3 className="text-lg font-bold text-gray-900">
                                Lịch Sử Gia Hạn &amp; Đổi Gói Cước
                            </h3>
                        </div>
                        {isSuperAdmin && (
                            <span className="text-xs text-gray-500">
                                💡 Super Admin có thể chỉnh sửa hoặc xóa từng bản ghi để tự động tính toán lại thông số.
                            </span>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-gray-700">
                                <tr>
                                    <th className="px-4 py-3">ID Gói</th>
                                    <th className="px-4 py-3">Tên Gói Cước</th>
                                    <th className="px-4 py-3">Giá Tiền</th>
                                    <th className="px-4 py-3">Thời Hạn</th>
                                    <th className="px-4 py-3">Ngày Bắt Đầu</th>
                                    <th className="px-4 py-3">Ngày Kết Thúc</th>
                                    <th className="px-4 py-3">Trạng Thái</th>
                                    {isSuperAdmin && (
                                        <th className="px-4 py-3 text-right">Thao Tác</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {subscriptions && subscriptions.length > 0 ? (
                                    subscriptions.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-gray-800">
                                                #{sub.plan_id}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-gray-900">
                                                {sub.plan_name}
                                            </td>
                                            <td className="px-4 py-3 text-emerald-700 font-semibold">
                                                {Number(sub.price) === 0
                                                    ? 'Miễn phí'
                                                    : `${Number(sub.price).toLocaleString('vi-VN')}đ`}
                                            </td>
                                            <td className="px-4 py-3">
                                                {sub.duration_days} ngày
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                {formatDate(sub.starts_at)}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-semibold text-gray-800">
                                                {formatDate(sub.ends_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={
                                                        sub.status === SUBSCRIPTION_STATUS_ACTIVE
                                                            ? 'active'
                                                            : sub.status === SUBSCRIPTION_STATUS_EXPIRED
                                                              ? 'danger'
                                                              : sub.status === SUBSCRIPTION_STATUS_CANCELLED
                                                                ? 'info'
                                                                : 'expired'
                                                    }
                                                >
                                                    {SUBSCRIPTION_STATUS_LABELS[sub.status] || sub.status}
                                                </Badge>
                                            </td>
                                            {isSuperAdmin && (
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Button
                                                            variant="edit"
                                                            size="sm"
                                                            className="!p-1.5"
                                                            title="Chỉnh sửa bản ghi gói cước"
                                                            onClick={() => setEditingSub(sub)}
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            className="!p-1.5"
                                                            title="Xóa bản ghi gói cước"
                                                            onClick={() => setDeletingSub(sub)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isSuperAdmin ? 8 : 7} className="py-8 text-center text-xs text-gray-400">
                                            Chưa có lịch sử gia hạn/đổi gói nào cho trung tâm này.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Renew Modal */}
            <RenewSubscriptionModal
                isOpen={renewModalOpen}
                onClose={() => setRenewModalOpen(false)}
                center={center}
                subscriptionPlans={subscriptionPlans}
            />

            {/* Edit Subscription Modal */}
            <EditSubscriptionModal
                isOpen={!!editingSub}
                onClose={() => setEditingSub(null)}
                centerId={center.id}
                subscription={editingSub}
                subscriptionPlans={subscriptionPlans}
            />

            {/* Confirm Delete Subscription Modal */}
            <Modal
                isOpen={!!deletingSub}
                onClose={() => setDeletingSub(null)}
                title="Xác Nhận Xóa Bản Ghi Lịch Sử Gói Cước"
                maxWidth="sm"
            >
                <div className="space-y-4 text-sm text-gray-700">
                    <p>
                        Bạn có chắc chắn muốn xóa bản ghi gói cước{' '}
                        <strong className="text-gray-900">
                            #{deletingSub?.id} - {deletingSub?.plan_name}
                        </strong>{' '}
                        khỏi lịch sử trung tâm?
                    </p>
                    <div className="rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200 leading-relaxed">
                        ⚠️ <strong>Cảnh báo:</strong> Sau khi xóa, hệ thống sẽ tự động tính toán lại Ngày Hết Hạn (`expires_at`), Giới Hạn Học Sinh và Giới Hạn Lớp của Trung tâm dựa trên các gói cước còn lại.
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                        <Button variant="secondary" onClick={() => setDeletingSub(null)} disabled={isDeleting}>
                            Hủy Bỏ
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDeleteSub}
                            disabled={isDeleting}
                            icon={<Trash2 className="h-4 w-4" />}
                        >
                            {isDeleting ? 'Đang Xóa...' : 'Xác Nhận Xóa'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
};

export default Edit;

