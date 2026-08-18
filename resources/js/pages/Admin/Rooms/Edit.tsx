import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save, DoorOpen } from 'lucide-react';
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

interface Room {
    id: number;
    center_id: number;
    code: string;
    name: string;
    capacity: number | null;
    location: string | null;
    status: 'active' | 'inactive';
}

interface Props {
    room: Room;
    centers: Center[];
    errors?: Record<string, string>;
}

export default function RoomEdit({ room, centers = [], errors = {} }: Props) {
    const [centerId, setCenterId] = useState<string>(String(room.center_id));
    const [name, setName] = useState(room.name || '');
    const [code, setCode] = useState(room.code || '');
    const [capacity, setCapacity] = useState(room.capacity ? String(room.capacity) : '');
    const [location, setLocation] = useState(room.location || '');
    const [status, setStatus] = useState<'active' | 'inactive'>(room.status || 'active');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.patch(
            `/rooms/${room.id}`,
            {
                center_id: centerId ? Number(centerId) : null,
                name: name.trim(),
                code: code.trim(),
                capacity: capacity ? Number(capacity) : null,
                location: location.trim() || null,
                status,
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title={`Chỉnh Sửa Phòng Học: ${room.name} - Hệ Thống Giáo Dục Sam`}>
            <Head title={`Chỉnh Sửa Phòng Học: ${room.name}`} />

            <div className="mx-auto max-w-4xl space-y-6">
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/rooms">
                            <Button
                                variant="secondary"
                                size="sm"
                                icon={<ArrowLeft className="h-4 w-4" />}
                            >
                                Quay Lại
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Chỉnh Sửa Phòng Học: {room.name}
                            </h1>
                            <p className="text-sm text-gray-500">
                                Cập nhật thông tin phòng học, sức chứa chỗ ngồi hoặc trạng thái sử dụng.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
                            <div className="rounded-lg bg-amber-50 p-3 text-amber-700">
                                <DoorOpen className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Thông Tin Phòng Học
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Mã phòng học: <span className="font-mono font-bold text-gray-700">{room.code}</span>
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
                            {/* Center Selection */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Trung Tâm Đào Tạo <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={centerId}
                                    onChange={(e) => setCenterId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    {centers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                                {errors.center_id && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.center_id}</p>
                                )}
                            </div>

                            {/* Room Name */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Tên Phòng Học <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ví dụ: Phòng Lý Thuyết 101, Lab Tin Học 02"
                                    className="!py-3 !text-sm"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Room Code */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Mã Phòng Học <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Ví dụ: P101, LAB-02, P-VIP"
                                    className="!py-3 !text-sm uppercase font-mono"
                                    required
                                />
                                {errors.code && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.code}</p>
                                )}
                            </div>

                            {/* Capacity */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Sức Chứa Chỗ Ngồi (Số học sinh)
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                    placeholder="Ví dụ: 30"
                                    className="!py-3 !text-sm"
                                />
                                {errors.capacity && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.capacity}</p>
                                )}
                            </div>

                            {/* Location */}
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Vị Trí / Tầng / Tòa Nhà
                                </label>
                                <Input
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Ví dụ: Tầng 2 - Tòa nhà A, Khu B"
                                    className="!py-3 !text-sm"
                                />
                                {errors.location && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.location}</p>
                                )}
                            </div>

                            {/* Status */}
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-semibold text-gray-800">
                                    Trạng Thái Hoạt Động <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    required
                                >
                                    <option value="active">Đang sử dụng (Active)</option>
                                    <option value="inactive">Tạm dừng bảo trì (Inactive)</option>
                                </select>
                                {errors.status && (
                                    <p className="mt-1.5 text-sm text-red-600">{errors.status}</p>
                                )}
                            </div>
                        </div>

                        {/* Form Action Buttons */}
                        <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
                            <Link href="/rooms">
                                <Button
                                    variant="secondary"
                                    size="lg"
                                    icon={<ArrowLeft className="h-5 w-5" />}
                                >
                                    Quay Lại
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                variant="edit"
                                size="lg"
                                isLoading={isSubmitting}
                                icon={<Save className="h-5 w-5" />}
                            >
                                Lưu Thay Đổi
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
