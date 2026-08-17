import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save, BookOpen, Building2, Clock, DollarSign, FileText } from 'lucide-react';
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
    const [centerId, setCenterId] = useState<string>(centers[0]?.id ? String(centers[0].id) : '');
    const [name, setName] = useState<string>('');
    const [code, setCode] = useState<string>('');
    const [totalSessions, setTotalSessions] = useState<string>('24');
    const [durationMinutes, setDurationMinutes] = useState<string>('90');
    const [tuitionFee, setTuitionFee] = useState<string>('');
    const [status, setStatus] = useState<string>('active');
    const [description, setDescription] = useState<string>('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto generate code from name
    const handleNameChange = (val: string) => {
        setName(val);
        if (!code) {
            const clean = val
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/g, 'd')
                .replace(/Đ/g, 'd')
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .slice(0, 10);
            if (clean) {
                setCode(clean);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/subjects',
            {
                center_id: Number(centerId),
                name,
                code: code || undefined,
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
        <AppLayout title="Thêm Môn Học Mới - Hệ Thống Giáo Dục Sam">
            <Head title="Thêm Môn Học Mới" />

            <div className="mx-auto max-w-3xl space-y-6">
                {/* Header Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/subjects">
                            <Button variant="secondary" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Thêm Môn Học Mới</h1>
                            <p className="text-xs text-gray-500">
                                Thiết lập chương trình môn học, số buổi học và học phí theo trung tâm.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* Center Selection */}
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Trung Tâm Đào Tạo (*)
                                </label>
                                <select
                                    value={centerId}
                                    onChange={(e) => setCenterId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="">-- Chọn Trung tâm --</option>
                                    {centers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.center_id && (
                                    <p className="mt-1 text-xs text-red-600">{errors.center_id}</p>
                                )}
                            </div>

                            {/* Subject Name */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Tên Môn Học / Khóa Học (*)
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="Ví dụ: Toán 12 Nâng Cao"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Subject Code */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Mã Môn Học (Để trống để tự sinh mã)
                                </label>
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Ví dụ: TOAN12NC"
                                />
                                {errors.code && (
                                    <p className="mt-1 text-xs text-red-600">{errors.code}</p>
                                )}
                            </div>

                            {/* Total Sessions */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Tổng Số Buổi Học
                                </label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={totalSessions}
                                    onChange={(e) => setTotalSessions(e.target.value)}
                                    placeholder="Ví dụ: 24"
                                />
                            </div>

                            {/* Duration Minutes */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Thời Lượng Mỗi Buổi (Phút)
                                </label>
                                <Input
                                    type="number"
                                    min="15"
                                    step="15"
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(e.target.value)}
                                    placeholder="Ví dụ: 90"
                                />
                            </div>

                            {/* Tuition Fee */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Học Phí Mặc Định (VNĐ)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={tuitionFee}
                                    onChange={(e) => setTuitionFee(e.target.value)}
                                    placeholder="Ví dụ: 3500000"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Trạng Thái
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="active">Đang mở dạy</option>
                                    <option value="inactive">Tạm dừng</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Mô Tả Chi Tiết Môn Học
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Nội dung tóm tắt giáo trình, mục tiêu đào tạo..."
                                    className="w-full rounded-lg border border-gray-300 p-3 text-xs text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href="/subjects">
                            <Button variant="secondary" size="md">
                                Hủy Bỏ
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            variant="success"
                            size="md"
                            isLoading={isSubmitting}
                            icon={<Save className="h-4 w-4" />}
                        >
                            Lưu Môn Học
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
