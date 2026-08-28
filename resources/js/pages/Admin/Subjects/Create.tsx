import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import AppLayout from '@/layouts/AppLayout';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface CreateProps {
    centers: Center[];
    errors?: Record<string, string>;
}

export default function SubjectCreate({ centers = [], errors = {} }: CreateProps) {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';
    const userCenterId = auth?.user?.center_id;

    const [centerId, setCenterId] = useState<string>(
        !isSuperAdmin && userCenterId ? String(userCenterId) : (centers[0]?.id ? String(centers[0].id) : '')
    );
    const [name, setName] = useState<string>('');
    const [totalSessions, setTotalSessions] = useState<string>('24');
    const [durationMinutes, setDurationMinutes] = useState<string>('90');
    const [tuitionFee, setTuitionFee] = useState<string>('');
    const [status, setStatus] = useState<number>(1);
    const [description, setDescription] = useState<string>('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/subjects',
            {
                center_id: centerId ? Number(centerId) : undefined,
                name,
                total_sessions: totalSessions ? Number(totalSessions) : undefined,
                duration_minutes: durationMinutes ? Number(durationMinutes) : undefined,
                tuition_fee: tuitionFee ? Number(tuitionFee) : undefined,
                status,
                description: description || undefined,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title="Thêm Môn Học Mới - SAM Digital">
            <Head title="Thêm Môn Học Mới" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/subjects">
                            <Button variant="secondary" size="md" icon={<ArrowLeft className="h-5 w-5" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Thêm Môn Học Mới</h1>
                            <p className="text-sm text-gray-500">
                                Thiết lập chương trình môn học, số buổi học và học phí theo trung tâm.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
                            {/* Center Selection (Super Admin only) */}
                            {isSuperAdmin && (
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                                        Trung Tâm Đào Tạo <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={centerId}
                                        onChange={(e) => setCenterId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                        required
                                        disabled={centers.length === 0}
                                    >
                                        <option value="">-- Chọn Trung tâm --</option>
                                        {centers.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.code})
                                            </option>
                                        ))}
                                    </select>
                                    {centers.length === 0 && (
                                        <p className="mt-1.5 text-sm text-amber-600">
                                            Không tìm thấy trung tâm hoạt động hoặc tài khoản của bạn chưa được phân quyền quản lý trung tâm nào.
                                        </p>
                                    )}
                                    {errors.center_id && (
                                        <p className="mt-1.5 text-sm text-red-600">{errors.center_id}</p>
                                    )}
                                </div>
                            )}

                            {/* Subject Name */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Tên Môn Học / Khóa Học <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ví dụ: Toán 12 Nâng Cao"
                                    className="!py-3 !text-sm"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Subject Code (Auto Generated) */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mã Môn Học
                                </label>
                                <Input
                                    value="Hệ thống tự động sinh mã (VD: S0000001)"
                                    disabled
                                    className="cursor-not-allowed bg-slate-50 !py-3 !text-sm text-gray-500 italic"
                                />
                            </div>

                            {/* Total Sessions */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Tổng Số Buổi Học
                                </label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={totalSessions}
                                    onChange={(e) => setTotalSessions(e.target.value)}
                                    placeholder="Ví dụ: 24"
                                    className="!py-3 !text-sm"
                                />
                            </div>

                            {/* Duration Minutes */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Thời Lượng Mỗi Buổi (Phút)
                                </label>
                                <Input
                                    type="number"
                                    min="15"
                                    step="15"
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(e.target.value)}
                                    placeholder="Ví dụ: 90"
                                    className="!py-3 !text-sm"
                                />
                            </div>

                            {/* Tuition Fee */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Học Phí Mặc Định (VNĐ)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={tuitionFee}
                                    onChange={(e) => setTuitionFee(e.target.value)}
                                    placeholder="Ví dụ: 3500000"
                                    className="!py-3 !text-sm"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Trạng Thái
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(Number(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value={1}>Đang mở dạy</option>
                                    <option value={0}>Tạm dừng</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mô Tả Chi Tiết Môn Học
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Nội dung tóm tắt giáo trình, mục tiêu đào tạo..."
                                    className="w-full rounded-lg border border-gray-300 p-3.5 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href="/subjects">
                            <Button variant="secondary" size="lg">
                                Hủy Bỏ
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            variant="success"
                            size="lg"
                            isLoading={isSubmitting}
                            icon={<Save className="h-5 w-5" />}
                        >
                            Lưu Môn Học
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
