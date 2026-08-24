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

interface Subject {
    id: number;
    center_id: number;
    code: string;
    name: string;
    description: string | null;
    total_sessions: number | null;
    duration_minutes: number | null;
    tuition_fee: number | string | null;
    status: string;
    center?: Center;
}

interface EditProps {
    subject: Subject;
    centers: Center[];
    errors?: Record<string, string>;
}

export default function SubjectEdit({ subject, centers = [], errors = {} }: EditProps) {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';

    const [centerId, setCenterId] = useState<string>(String(subject.center_id));
    const [name, setName] = useState<string>(subject.name || '');
    const code = subject.code || '';
    const [totalSessions, setTotalSessions] = useState<string>(
        subject.total_sessions !== null && subject.total_sessions !== undefined ? String(subject.total_sessions) : '',
    );
    const [durationMinutes, setDurationMinutes] = useState<string>(
        subject.duration_minutes !== null && subject.duration_minutes !== undefined ? String(subject.duration_minutes) : '',
    );
    const [tuitionFee, setTuitionFee] = useState<string>(
        subject.tuition_fee !== null && subject.tuition_fee !== undefined ? String(subject.tuition_fee) : '',
    );
    const [status, setStatus] = useState<string>(subject.status || 'active');
    const [description, setDescription] = useState<string>(subject.description || '');

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.patch(
            `/subjects/${subject.id}`,
            {
                center_id: centerId ? Number(centerId) : undefined,
                name,
                code,
                total_sessions: totalSessions ? Number(totalSessions) : null,
                duration_minutes: durationMinutes ? Number(durationMinutes) : null,
                tuition_fee: tuitionFee ? Number(tuitionFee) : null,
                status,
                description: description || null,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title={`Chỉnh Sửa Môn Học: ${subject.name} - SAM Digital`}>
            <Head title={`Chỉnh Sửa Môn Học: ${subject.name}`} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Top bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/subjects">
                            <Button variant="secondary" size="md" icon={<ArrowLeft className="h-5 w-5" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Chỉnh Sửa Môn Học: {subject.name}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Cập nhật thông tin đào tạo, số buổi học hoặc học phí theo trung tâm.
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
                                    className="!py-3 !text-sm"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Subject Code */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mã Môn Học
                                </label>
                                <Input
                                    value={code}
                                    disabled
                                    className="cursor-not-allowed bg-slate-50 font-mono !py-3 !text-sm text-gray-600"
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
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="active">Đang mở dạy</option>
                                    <option value="inactive">Tạm dừng</option>
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
                            variant="edit"
                            size="lg"
                            isLoading={isSubmitting}
                            icon={<Save className="h-5 w-5" />}
                        >
                            Cập Nhật Môn Học
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
