import BackButton from '@/components/ui/BackButton';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import ScrollableSelect from '@/components/ui/ScrollableSelect';
import {
EQUIPMENT_STATUS_BROKEN,
EQUIPMENT_STATUS_GOOD,
EQUIPMENT_STATUS_LABELS,
EQUIPMENT_STATUS_MAINTENANCE,
ROOM_STATUS_ACTIVE,
ROOM_STATUS_CLOSED,
ROOM_STATUS_LABELS,
ROOM_STATUS_PAUSED,
} from '@/constants/enums';
import { usePermission } from '@/hooks/usePermission';
import AppLayout from '@/layouts/AppLayout';
import { Head,router,usePage } from '@inertiajs/react';
import {
Armchair,
DoorOpen,
Monitor,
Plus,
Save,
Trash2,
Tv,
Wind,
} from 'lucide-react';
import React,{ useState } from 'react';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface EquipmentRow {
    name: string;
    quantity: number;
    unit: string;
    status: number;
    note: string;
}

interface Props {
    centers: Center[];
    errors?: Record<string, string>;
}

const QUICK_PRESETS = [
    { name: 'Bộ bàn ghế học sinh', quantity: 30, unit: 'bộ', icon: Armchair },
    { name: 'Điều hòa không khí', quantity: 1, unit: 'chiếc', icon: Wind },
    { name: 'Máy chiếu / Tivi', quantity: 1, unit: 'bộ', icon: Tv },
    { name: 'Bộ máy tính để bàn', quantity: 30, unit: 'bộ', icon: Monitor },
];

export default function RoomCreate({ centers = [], errors = {} }: Props) {
    const { isSuperAdmin } = usePermission();
    const { auth } = usePage<any>().props;
    const userCenterId = auth?.user?.center_id;

    const [centerId, setCenterId] = useState<string>(
        !isSuperAdmin && userCenterId ? String(userCenterId) : (centers.length > 0 ? String(centers[0].id) : '')
    );
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [capacity, setCapacity] = useState('');
    const [location, setLocation] = useState<string>('');
    const [status, setStatus] = useState<number>(ROOM_STATUS_ACTIVE);
    const [equipments, setEquipments] = useState<EquipmentRow[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddEquipment = (preset?: { name: string; quantity: number; unit: string }) => {
        setEquipments([
            ...equipments,
            {
                name: preset?.name || '',
                quantity: preset?.quantity || 1,
                unit: preset?.unit || 'bộ',
                status: EQUIPMENT_STATUS_GOOD,
                note: '',
            },
        ]);
    };

    const handleRemoveEquipment = (index: number) => {
        setEquipments(equipments.filter((_, i) => i !== index));
    };

    const handleEquipmentChange = (
        index: number,
        field: keyof EquipmentRow,
        value: any,
    ) => {
        const updated = [...equipments];
        updated[index] = { ...updated[index], [field]: value };
        setEquipments(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post(
            '/rooms',
            {
                center_id: centerId ? Number(centerId) : null,
                name: name.trim(),
                code: code.trim(),
                capacity: capacity ? Number(capacity) : null,
                location: location.trim() || null,
                status,
                equipments: equipments
                    .filter((eq) => eq.name.trim() !== '')
                    .map((eq) => ({
                        name: eq.name.trim(),
                        quantity: Number(eq.quantity) || 1,
                        unit: eq.unit.trim() || null,
                        status: eq.status,
                        note: eq.note.trim() || null,
                    })),
            },
            {
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    return (
        <AppLayout title="Thêm Phòng Học Mới - SAM Digital">
            <Head title="Thêm Phòng Học Mới" />

            <div className="mx-auto max-w-5xl space-y-6">
                {/* Top Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BackButton fallbackUrl="/rooms" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Thêm Phòng Học Mới
                            </h1>
                            <p className="text-sm text-gray-500">
                                Khai báo thông tin phòng học, sức chứa chỗ ngồi và trang thiết bị vật chất.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Card 1: Basic Info */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-5">
                            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                                <DoorOpen className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    1. Thông Tin Cơ Bản Phòng Học
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Điền thông tin định danh và vị trí của phòng học
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
                            {/* Center Selection (Super Admin only) */}
                            {isSuperAdmin && (
                                <div className="md:col-span-2">
                                    <label className="mb-2 block text-sm font-semibold text-gray-800">
                                        Trung Tâm Đào Tạo <span className="text-red-500">*</span>
                                    </label>
                                    <ScrollableSelect
                                        value={centerId}
                                        onChange={(val) => setCenterId(val)}
                                        placeholder="-- Chọn Trung tâm --"
                                        disabled={centers.length === 0}
                                        options={centers.map((c) => ({
                                            value: String(c.id),
                                            label: `${c.name} (${c.code})`,
                                        }))}
                                        error={errors.center_id}
                                    />
                                </div>
                            )}

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
                                    Mã Phòng Học
                                </label>
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Để trống để tự sinh mã (VD: R000000001)"
                                    className="!py-3 !text-sm uppercase font-mono"
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
                                <ScrollableSelect
                                    value={status}
                                    onChange={(val) => setStatus(Number(val))}
                                    options={[
                                        { value: ROOM_STATUS_ACTIVE, label: ROOM_STATUS_LABELS[ROOM_STATUS_ACTIVE] },
                                        { value: ROOM_STATUS_PAUSED, label: ROOM_STATUS_LABELS[ROOM_STATUS_PAUSED] },
                                        { value: ROOM_STATUS_CLOSED, label: ROOM_STATUS_LABELS[ROOM_STATUS_CLOSED] },
                                    ]}
                                    error={errors.status}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Card 2: Equipment & Facilities Management */}
                    <Card className="border-gray-200 bg-white p-6 shadow-xs sm:p-8">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5">
                            <div>
                                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                                    <Armchair className="h-6 w-6 text-purple-600" />
                                    2. Danh Sách Trang Thiết Bị & Cơ Sở Vật Chất
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    Quản lý số lượng bàn ghế, điều hòa, máy chiếu, máy tính... của phòng học
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                icon={<Plus className="h-4 w-4 text-emerald-600" />}
                                onClick={() => handleAddEquipment()}
                            >
                                Thêm Thiết Bị
                            </Button>
                        </div>

                        {/* Quick Presets Buttons */}
                        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80">
                            <span className="text-xs font-semibold text-gray-600">Thêm nhanh:</span>
                            {QUICK_PRESETS.map((preset, idx) => {
                                const Icon = preset.icon;

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => handleAddEquipment(preset)}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-2xs hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors"
                                    >
                                        <Icon className="h-3.5 w-3.5 text-emerald-600" />
                                        <span>+ {preset.name} ({preset.quantity} {preset.unit})</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Equipment Rows */}
                        {equipments.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center bg-gray-50/50">
                                <Armchair className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="mt-2 text-sm font-semibold text-gray-700">
                                    Chưa có thiết bị nào được gán cho phòng này
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Bấm &quot;Thêm Thiết Bị&quot; hoặc chọn các mẫu gợi ý nhanh ở trên.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {equipments.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-slate-50 p-4 sm:flex-row sm:items-start"
                                    >
                                        {/* Number Badge */}
                                        <div className="flex flex-col items-center">
                                            <span className="mb-1.5 hidden text-xs font-semibold text-transparent select-none sm:block">
                                                &nbsp;
                                            </span>
                                            <div className="flex h-[42px] w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-800">
                                                {index + 1}
                                            </div>
                                        </div>

                                        {/* Name */}
                                        <div className="flex-2">
                                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                Tên Thiết Bị / Tài Sản (*)
                                            </label>
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleEquipmentChange(index, 'name', e.target.value)}
                                                placeholder="VD: Bàn ghế học sinh, Điều hòa Daikin..."
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                                required
                                            />
                                        </div>

                                        {/* Quantity */}
                                        <div className="w-full sm:w-24">
                                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                Số Lượng (*)
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(e) => handleEquipmentChange(index, 'quantity', e.target.value)}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 text-center font-bold shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                                required
                                            />
                                        </div>

                                        {/* Unit */}
                                        <div className="w-full sm:w-24">
                                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                Đơn Vị
                                            </label>
                                            <input
                                                type="text"
                                                value={item.unit}
                                                onChange={(e) => handleEquipmentChange(index, 'unit', e.target.value)}
                                                placeholder="bộ, chiếc"
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>

                                        {/* Status */}
                                        <div className="w-full sm:w-36">
                                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                Tình Trạng
                                            </label>
                                            <select
                                                value={item.status}
                                                onChange={(e) => handleEquipmentChange(index, 'status', Number(e.target.value))}
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                            >
                                                <option value={EQUIPMENT_STATUS_GOOD}>{EQUIPMENT_STATUS_LABELS[EQUIPMENT_STATUS_GOOD]}</option>
                                                <option value={EQUIPMENT_STATUS_MAINTENANCE}>{EQUIPMENT_STATUS_LABELS[EQUIPMENT_STATUS_MAINTENANCE]}</option>
                                                <option value={EQUIPMENT_STATUS_BROKEN}>{EQUIPMENT_STATUS_LABELS[EQUIPMENT_STATUS_BROKEN]}</option>
                                            </select>
                                        </div>

                                        {/* Note */}
                                        <div className="flex-1">
                                            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                                Ghi Chú
                                            </label>
                                            <input
                                                type="text"
                                                value={item.note}
                                                onChange={(e) => handleEquipmentChange(index, 'note', e.target.value)}
                                                placeholder="Model, thông số..."
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>

                                        {/* Remove Button */}
                                        <div className="flex flex-col">
                                            <span className="mb-1.5 hidden text-xs font-semibold text-transparent select-none sm:block">
                                                &nbsp;
                                            </span>
                                            <Button
                                                type="button"
                                                variant="danger"
                                                size="sm"
                                                icon={<Trash2 className="h-4 w-4" />}
                                                onClick={() => handleRemoveEquipment(index)}
                                                title="Xóa thiết bị này"
                                                className="!h-[42px]"
                                            >
                                                Xóa
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Submit Action Buttons */}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                        <BackButton fallbackUrl="/rooms" size="lg" />
                        <Button
                            type="submit"
                            variant="success"
                            size="lg"
                            isLoading={isSubmitting}
                            icon={<Save className="h-5 w-5" />}
                        >
                            Lưu Phòng Học
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
