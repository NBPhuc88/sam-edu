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

interface Props {
    centers: Center[];
    errors?: Record<string, string>;
}

export default function ExamTypeCreate({ centers = [], errors = {} }: Props) {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';
    const userCenterId = auth?.user?.center_id;

    const [centerId, setCenterId] = useState<string>(
        !isSuperAdmin && userCenterId ? String(userCenterId) : '',
    );
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [status, setStatus] = useState<string>('active');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/exam-types',
            {
                center_id: centerId ? Number(centerId) : null,
                name,
                description: description || undefined,
                status,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title="Thêm Loại Đề Thi Mới - Hệ Thống Giáo Dục Sam">
            <Head title="Thêm Loại Đề Thi Mới" />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Header Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/exam-types">
                            <Button variant="secondary" size="md" icon={<ArrowLeft className="h-5 w-5" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Thêm Loại Đề Thi Mới</h1>
                            <p className="text-sm text-gray-500">
                                Định nghĩa loại đề thi chuẩn hóa cho ngân hàng đề và các bài kiểm tra.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="p-6 sm:p-8 bg-white border border-gray-200 shadow-sm space-y-6">
                        {/* Center Selection (Super Admin only) */}
                        {isSuperAdmin && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                    Trung Tâm Đào Tạo <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={centerId}
                                    onChange={(e) => setCenterId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="">-- Chọn Trung Tâm --</option>
                                    {centers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            🏫 {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.center_id && <p className="text-xs text-red-600 mt-1">{errors.center_id}</p>}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                    Tên Loại Đề Thi <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Ví dụ: IELTS Mock Test, Kiểm Tra Giữa Kỳ, HSK Cấp 4..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="text-gray-900"
                                    required
                                />
                                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                            </div>

                            {/* Code */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                    Mã Loại Đề
                                </label>
                                <Input
                                    type="text"
                                    value="[Hệ thống tự động sinh mã]"
                                    disabled
                                    className="bg-gray-100 text-gray-500 font-mono text-sm cursor-not-allowed border-dashed"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                    Trạng Thái Hoạt Động
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="active">Đang hoạt động</option>
                                    <option value="inactive">Tạm ngưng / Ẩn</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
                                Mô Tả Chi Tiết / Quy Chuẩn Đề
                            </label>
                            <textarea
                                rows={4}
                                placeholder="Ghi chú về định dạng đề thi, tiêu chuẩn kỹ năng hoặc mục đích bài kiểm tra..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                            />
                            {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
                        </div>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link href="/exam-types">
                            <Button variant="secondary" size="lg" disabled={isSubmitting}>
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
                            Lưu Loại Đề Thi
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
