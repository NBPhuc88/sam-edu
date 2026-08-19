import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    DoorOpen,
    Plus,
    Search,
    Edit2,
    Trash2,
    AlertCircle,
    Filter,
    Users,
    CheckCircle2,
    XCircle,
    Building2,
    MapPin,
    Armchair,
    Eye,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import AppLayout from '@/layouts/AppLayout';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface RoomEquipment {
    id: number;
    room_id: number;
    name: string;
    quantity: number;
    unit: string | null;
    status: 'good' | 'maintenance' | 'broken';
    note: string | null;
}

interface Room {
    id: number;
    center_id: number;
    code: string;
    name: string;
    capacity: number | null;
    location: string | null;
    status: 'active' | 'inactive';
    created_at?: string;
    center?: Center;
    equipments?: RoomEquipment[];
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    rooms: PaginatedData<Room>;
    centers: Center[];
    stats?: {
        total: number;
        active: number;
        inactive: number;
        total_capacity: number;
    };
    filters: {
        search?: string;
        center_id?: number | null;
        status?: string;
    };
}

export default function RoomIndex({ rooms, centers = [], stats, filters }: Props) {
    const { auth } = usePage<any>().props;
    const isSuperAdmin = auth?.user?.admin_role === 'super_admin';

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCenterId, setSelectedCenterId] = useState<string>(
        filters.center_id ? String(filters.center_id) : '',
    );
    const [selectedStatus, setSelectedStatus] = useState<string>(
        filters.status || 'all',
    );

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Equipment detail modal state
    const [viewEquipmentModalOpen, setViewEquipmentModalOpen] = useState(false);
    const [selectedRoomEquipment, setSelectedRoomEquipment] = useState<Room | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/rooms',
            {
                search: search || undefined,
                center_id: selectedCenterId || undefined,
                status: selectedStatus !== 'all' ? selectedStatus : undefined,
            },
            { preserveState: true },
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedCenterId('');
        setSelectedStatus('all');
        router.get('/rooms', {}, { preserveState: true });
    };

    const openDeleteModal = (room: Room) => {
        setDeletingRoom(room);
        setDeleteModalOpen(true);
    };

    const openEquipmentModal = (room: Room) => {
        setSelectedRoomEquipment(room);
        setViewEquipmentModalOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingRoom) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/rooms/${deletingRoom.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setDeletingRoom(null);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="active">Đang sử dụng</Badge>;
            case 'inactive':
                return <Badge variant="expired">Tạm dừng</Badge>;
            default:
                return <Badge variant="info">{status}</Badge>;
        }
    };

    const getEquipmentStatusBadge = (status: string) => {
        switch (status) {
            case 'good':
                return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-2xs font-semibold text-emerald-700 border border-emerald-200">Tốt</span>;
            case 'maintenance':
                return <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-2xs font-semibold text-amber-700 border border-amber-200">Bảo trì</span>;
            case 'broken':
                return <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-2xs font-semibold text-red-700 border border-red-200">Hỏng</span>;
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    return (
        <AppLayout title="Quản Lý Phòng Học - Hệ Thống Giáo Dục Sam">
            <Head title="Quản Lý Phòng Học" />

            <div className="space-y-6">
                {/* Header Top Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
                            <DoorOpen className="h-7 w-7 text-emerald-600" />
                            Quản Lý Phòng Học
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Danh sách phòng học, sức chứa chỗ ngồi, trang thiết bị vật chất và trạng thái hoạt động theo từng trung tâm.
                        </p>
                    </div>

                    <Link href="/rooms/create">
                        <Button
                            variant="success"
                            size="md"
                            icon={<Plus className="h-4.5 w-4.5" />}
                        >
                            Thêm Phòng Học Mới
                        </Button>
                    </Link>
                </div>

                {/* KPI Stat Cards */}
                {stats && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-gray-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Tổng Số Phòng
                                    </p>
                                    <p className="mt-1.5 text-2xl font-extrabold text-gray-900">
                                        {stats.total}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                    <DoorOpen className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>

                        <Card className="border-gray-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Đang Sử Dụng
                                    </p>
                                    <p className="mt-1.5 text-2xl font-extrabold text-emerald-600">
                                        {stats.active}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>

                        <Card className="border-gray-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Tạm Dừng
                                    </p>
                                    <p className="mt-1.5 text-2xl font-extrabold text-amber-600">
                                        {stats.inactive}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                                    <XCircle className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>

                        <Card className="border-gray-200 bg-white p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Tổng Sức Chứa (Chỗ)
                                    </p>
                                    <p className="mt-1.5 text-2xl font-extrabold text-purple-600">
                                        {stats.total_capacity}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                                    <Users className="h-6 w-6" />
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Filter Box */}
                <Card className="border-gray-200 bg-white p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 items-start">
                            {/* Search Keyword */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Tìm kiếm
                                </label>
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tên phòng, mã phòng, vị trí..."
                                    icon={<Search className="h-4 w-4 text-gray-400" />}
                                    className="!py-2 !text-sm"
                                />
                            </div>

                            {/* Center Filter */}
                            {isSuperAdmin && centers.length > 0 && (
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                        Trung Tâm Đào Tạo
                                    </label>
                                    <select
                                        value={selectedCenterId}
                                        onChange={(e) => setSelectedCenterId(e.target.value)}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="">-- Tất cả Trung Tâm --</option>
                                        {centers.map((center) => (
                                            <option key={center.id} value={center.id}>
                                                {center.name} ({center.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Status Filter */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                                    Trạng thái
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="active">Đang sử dụng</option>
                                    <option value="inactive">Tạm dừng</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={handleResetFilter}
                            >
                                Đặt Lại
                            </Button>
                            <Button
                                type="submit"
                                variant="success"
                                size="sm"
                                icon={<Filter className="h-4 w-4" />}
                            >
                                Áp Dụng Lọc
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Data Table */}
                <Card className="overflow-hidden border-gray-200 bg-white shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="ui-table">
                            <thead>
                                <tr>
                                    <th className="w-12 text-center">STT</th>
                                    <th>Mã Phòng</th>
                                    <th>Tên Phòng Học</th>
                                    <th>Trung Tâm</th>
                                    <th>Sức Chứa</th>
                                    <th>Thiết Bị & Cơ Sở Vật Chất</th>
                                    <th>Vị Trí / Tầng</th>
                                    <th>Trạng Thái</th>
                                    <th className="text-right">Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <DoorOpen className="h-10 w-10 text-gray-300" />
                                                <p className="mt-3 font-semibold text-gray-700">
                                                    Không tìm thấy phòng học nào
                                                </p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    Thử thay đổi bộ lọc hoặc thêm phòng học mới vào hệ thống.
                                                </p>
                                                <div className="mt-4">
                                                    <Link href="/rooms/create">
                                                        <Button variant="success" size="sm" icon={<Plus className="h-4 w-4" />}>
                                                            Thêm Phòng Mới Ngay
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    rooms.data.map((room, idx) => (
                                        <tr key={room.id} className="transition-colors hover:bg-slate-50/60">
                                            <td className="text-center font-medium text-gray-500 text-xs">
                                                {(rooms.current_page - 1) * 15 + (idx + 1)}
                                            </td>
                                            <td>
                                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 font-mono text-xs font-bold text-emerald-800 border border-emerald-200/60">
                                                    {room.code}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="font-bold text-gray-900">
                                                    {room.name}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                                    <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                    <span>{room.center?.name || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {room.capacity ? (
                                                    <div className="flex items-center gap-1 text-sm font-semibold text-gray-800">
                                                        <Users className="h-3.5 w-3.5 text-purple-600" />
                                                        <span>{room.capacity}</span>
                                                        <span className="text-xs font-normal text-gray-500">học sinh</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Chưa thiết lập</span>
                                                )}
                                            </td>
                                            {/* Equipments Column */}
                                            <td>
                                                {room.equipments && room.equipments.length > 0 ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEquipmentModal(room)}
                                                        className="group flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50/50 px-2.5 py-1 text-left text-xs font-medium text-purple-900 hover:bg-purple-100/70 transition-colors"
                                                    >
                                                        <Armchair className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                                                        <span className="max-w-[180px] truncate">
                                                            {room.equipments.length} loại thiết bị ({room.equipments.reduce((acc, cur) => acc + Number(cur.quantity), 0)} món)
                                                        </span>
                                                        <Eye className="h-3 w-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Chưa có thiết bị</span>
                                                )}
                                            </td>
                                            <td>
                                                {room.location ? (
                                                    <div className="flex items-center gap-1 text-xs text-gray-700">
                                                        <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                        <span>{room.location}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Chưa ghi chú</span>
                                                )}
                                            </td>
                                            <td>
                                                {getStatusBadge(room.status)}
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/rooms/${room.id}/edit`}>
                                                        <Button
                                                            variant="edit"
                                                            size="sm"
                                                            icon={<Edit2 className="h-3.5 w-3.5" />}
                                                            title="Chỉnh sửa phòng học"
                                                        >
                                                            Sửa
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        type="button"
                                                        variant="danger"
                                                        size="sm"
                                                        icon={<Trash2 className="h-3.5 w-3.5" />}
                                                        onClick={() => openDeleteModal(room)}
                                                        title="Xóa phòng học"
                                                    >
                                                        Xóa
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {rooms.last_page > 1 && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 bg-white px-6 py-4 sm:flex-row">
                            <p className="text-xs text-gray-500">
                                Hiển thị từ <span className="font-semibold text-gray-800">{rooms.from || 0}</span> đến{' '}
                                <span className="font-semibold text-gray-800">{rooms.to || 0}</span> trong tổng số{' '}
                                <span className="font-semibold text-gray-800">{rooms.total}</span> phòng học
                            </p>
                            <div className="flex items-center gap-1">
                                {rooms.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        preserveState
                                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                                            link.active
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : link.url
                                                  ? 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                  : 'cursor-not-allowed text-gray-300'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Equipment Details Quick View Modal */}
            <Modal
                isOpen={viewEquipmentModalOpen}
                onClose={() => setViewEquipmentModalOpen(false)}
                title={`Danh Sách Thiết Bị: ${selectedRoomEquipment?.name} (${selectedRoomEquipment?.code})`}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                            <Armchair className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-bold text-gray-800">
                                Chi Tiết Cơ Sở Vật Chất & Thiết Bị Phòng
                            </span>
                        </div>
                        <span className="text-xs text-gray-500">
                            {selectedRoomEquipment?.center?.name}
                        </span>
                    </div>

                    {selectedRoomEquipment?.equipments && selectedRoomEquipment.equipments.length > 0 ? (
                        <div className="max-h-80 overflow-y-auto space-y-2">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50 font-semibold text-gray-700">
                                        <th className="py-2 px-3">Tên thiết bị</th>
                                        <th className="py-2 px-3 text-center">Số lượng</th>
                                        <th className="py-2 px-3">Tình trạng</th>
                                        <th className="py-2 px-3">Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedRoomEquipment.equipments.map((eq, i) => (
                                        <tr key={i} className="hover:bg-slate-50/70">
                                            <td className="py-2.5 px-3 font-semibold text-gray-900">
                                                {eq.name}
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-bold text-purple-700">
                                                {eq.quantity} {eq.unit || ''}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                {getEquipmentStatusBadge(eq.status)}
                                            </td>
                                            <td className="py-2.5 px-3 text-gray-500 italic">
                                                {eq.note || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center text-xs text-gray-500 py-6">
                            Phòng học này chưa có thông tin thiết bị nào.
                        </p>
                    )}

                    <div className="flex justify-end pt-3 border-t border-gray-100">
                        <Link href={`/rooms/${selectedRoomEquipment?.id}/edit`}>
                            <Button variant="edit" size="sm" icon={<Edit2 className="h-4 w-4" />}>
                                Chỉnh Sửa Thiết Bị
                            </Button>
                        </Link>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Xác Nhận Xóa Phòng Học"
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertCircle className="h-8 w-8 shrink-0" />
                        <div>
                            <p className="font-bold text-gray-900">
                                Bạn có chắc chắn muốn xóa phòng học này?
                            </p>
                            <p className="text-sm text-gray-500">
                                Phòng học: <span className="font-semibold text-gray-800">{deletingRoom?.name}</span> ({deletingRoom?.code})
                            </p>
                        </div>
                    </div>

                    <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
                        Lưu ý: Các ca học hoặc lịch học liên kết với phòng này sẽ không còn gán phòng. Danh sách thiết bị và dữ liệu phòng học sẽ được xóa mềm an toàn.
                    </p>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            Hủy Bỏ
                        </Button>
                        <Button
                            variant="danger"
                            size="md"
                            isLoading={isDeleting}
                            onClick={confirmDelete}
                        >
                            Xóa Phòng Học
                        </Button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
