import { router, useForm } from '@inertiajs/react';
import {
    Edit,
    Plus,
    Search,
    Shield,
    Trash2,
    UserCheck,
    AlertCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import AppLayout from '../../../layouts/AppLayout';

interface Center {
    id: number;
    name: string;
    code: string;
}

interface AdminItem {
    id: number;
    username: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    role: 'super_admin' | 'admin';
    status: string;
    admin_code: string;
    created_at: string;
    centers: Center[];
}

interface IndexProps {
    admins: {
        data: AdminItem[];
        links: any[];
        total: number;
    };
    centers: Center[];
    hasSuperAdmin?: boolean;
    filters: {
        search: string;
        role: string;
    };
}

export default function AdminsIndex({ admins, centers, hasSuperAdmin = true, filters }: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null);

    // Delete modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deletingAdmin, setDeletingAdmin] = useState<AdminItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form cho tạo mới & cập nhật
    const form = useForm({
        username: '',
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'admin' as 'super_admin' | 'admin',
        center_ids: [] as number[],
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admins',
            { search, role: roleFilter },
            { preserveState: true },
        );
    };

    const handleOpenCreateModal = () => {
        form.reset();
        setEditingAdmin(null);
        setIsCreateModalOpen(true);
    };

    const handleOpenEditModal = (admin: AdminItem) => {
        setEditingAdmin(admin);
        form.setData({
            username: admin.username,
            full_name: admin.full_name,
            email: admin.email ?? '',
            phone: admin.phone ?? '',
            password: '',
            role: admin.role,
            center_ids: admin.centers.map((c) => c.id),
        });
        setIsCreateModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingAdmin) {
            form.patch(`/admins/${editingAdmin.id}`, {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    form.reset();
                },
            });
        } else {
            form.post('/admins', {
                onSuccess: () => {
                    setIsCreateModalOpen(false);
                    form.reset();
                },
            });
        }
    };

    const openDeleteModal = (admin: AdminItem) => {
        setDeletingAdmin(admin);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingAdmin) return;
        setIsDeleting(true);
        router.delete(`/admins/${deletingAdmin.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteModalOpen(false);
                setDeletingAdmin(null);
            },
        });
    };

    const toggleCenterSelection = (centerId: number) => {
        const current = [...form.data.center_ids];
        const index = current.indexOf(centerId);

        if (index > -1) {
            current.splice(index, 1);
        } else {
            current.push(centerId);
        }

        form.setData('center_ids', current);
    };

    return (
        <AppLayout title="Quản lý Quản trị viên Systems - Giáo dục Sam">
            <div className="space-y-6">
                {/* Header Title */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-black text-gray-900">
                            <Shield className="h-7 w-7 text-emerald-600" />
                            Quản lý Tài khoản Quản trị viên
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Quản lý toàn bộ tài khoản Super Admin và Admin phân công quản lý trung tâm.
                        </p>
                    </div>

                    <Button
                        variant="success"
                        size="md"
                        icon={<Plus className="h-4.5 w-4.5" />}
                        onClick={handleOpenCreateModal}
                    >
                        Tạo Admin Mới
                    </Button>
                </div>

                {/* Filter & Search Bar */}
                <Card className="border-gray-200 p-5">
                    <form
                        onSubmit={handleSearch}
                        className="flex flex-col gap-3 sm:flex-row sm:items-center"
                    >
                        <div className="relative flex-1">
                            <Input
                                placeholder="Tìm kiếm theo tên, username, email, sđt..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                icon={<Search className="h-5 w-5 text-gray-400" />}
                                className="!py-2.5 !text-sm"
                            />
                        </div>

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
                        >
                            <option value="">-- Tất cả vai trò --</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="admin">Admin Trung tâm</option>
                        </select>

                        <Button variant="secondary" size="md" type="submit" className="px-5">
                            Lọc danh sách
                        </Button>
                    </form>
                </Card>

                {/* Admins Data Table */}
                <Card className="overflow-hidden border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b border-gray-200 bg-slate-50 text-xs font-bold text-gray-700 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Quản trị viên</th>
                                    <th className="px-6 py-4">Vai trò</th>
                                    <th className="px-6 py-4">Liên hệ</th>
                                    <th className="px-6 py-4">
                                        Trung tâm Phân công
                                    </th>
                                    <th className="px-6 py-4 text-right">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {admins.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="p-8 text-center text-sm text-gray-400"
                                        >
                                            Chưa có tài khoản Quản trị viên nào.
                                        </td>
                                    </tr>
                                ) : (
                                    admins.data.map((admin) => (
                                        <tr
                                            key={admin.id}
                                            className="transition-colors hover:bg-slate-50/80"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                                                            admin.role ===
                                                            'super_admin'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                    >
                                                        {admin.full_name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">
                                                            {admin.full_name}
                                                        </div>
                                                        <div className="text-xs font-mono text-gray-400">
                                                            @{admin.username} ·{' '}
                                                            {admin.admin_code}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {admin.role ===
                                                'super_admin' ? (
                                                    <Badge variant="active">
                                                        Super Admin
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="info">
                                                        Admin
                                                    </Badge>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-gray-900">
                                                    {admin.email ?? '---'}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {admin.phone ?? '---'}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {admin.role ===
                                                'super_admin' ? (
                                                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                                                        <UserCheck className="h-4 w-4" />
                                                        Tất cả Trung tâm
                                                    </span>
                                                ) : admin.centers.length ===
                                                  0 ? (
                                                    <span className="text-sm text-gray-400 italic">
                                                        Chưa phân công
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {admin.centers.map(
                                                            (c) => (
                                                                <span
                                                                    key={c.id}
                                                                    className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                                                                >
                                                                    {c.name}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="edit"
                                                        size="sm"
                                                        icon={
                                                            <Edit className="h-4 w-4" />
                                                        }
                                                        onClick={() =>
                                                            handleOpenEditModal(
                                                                admin,
                                                            )
                                                        }
                                                    >
                                                        Sửa
                                                    </Button>
                                                    {admin.role === 'super_admin' ? (
                                                        <span
                                                            className="rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed select-none"
                                                            title="Tài khoản Quản trị viên tối cao (Super Admin) không thể bị xóa"
                                                        >
                                                            Không thể xóa
                                                        </span>
                                                    ) : (
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            icon={
                                                                <Trash2 className="h-4 w-4" />
                                                            }
                                                            onClick={() =>
                                                                openDeleteModal(admin)
                                                            }
                                                        >
                                                            Xóa
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Modal Thêm mới / Chỉnh sửa Admin */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title={
                        editingAdmin
                            ? `Chỉnh sửa Admin: ${editingAdmin.full_name}`
                            : 'Tạo tài khoản Quản trị viên Mới'
                    }
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Họ và Tên (*)
                            </label>
                            <Input
                                placeholder="Nhập họ và tên đầy đủ"
                                value={form.data.full_name}
                                onChange={(e) =>
                                    form.setData('full_name', e.target.value)
                                }
                                error={form.errors.full_name}
                                className="!py-3 !text-sm"
                            />
                        </div>

                        {!editingAdmin && (
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Tên đăng nhập (Username) (*)
                                </label>
                                <Input
                                    placeholder="Nhập username"
                                    value={form.data.username}
                                    onChange={(e) =>
                                        form.setData('username', e.target.value)
                                    }
                                    error={form.errors.username}
                                    className="!py-3 !text-sm"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    placeholder="admin@example.com"
                                    value={form.data.email}
                                    onChange={(e) =>
                                        form.setData('email', e.target.value)
                                    }
                                    error={form.errors.email}
                                    className="!py-3 !text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Số điện thoại
                                </label>
                                <Input
                                    placeholder="0912..."
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData('phone', e.target.value)
                                    }
                                    error={form.errors.phone}
                                    className="!py-3 !text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                {editingAdmin
                                    ? 'Mật khẩu mới (Bỏ trống nếu giữ nguyên)'
                                    : 'Mật khẩu (*)'}
                            </label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={form.data.password}
                                onChange={(e) =>
                                    form.setData('password', e.target.value)
                                }
                                error={form.errors.password}
                                className="!py-3 !text-sm"
                            />
                        </div>

                        {/* Vai trò */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700">
                                Vai trò Admin (*)
                            </label>
                            <div className="mt-2 flex flex-col gap-2">
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="admin"
                                            checked={form.data.role === 'admin'}
                                            disabled={editingAdmin?.role === 'super_admin'}
                                            onChange={() =>
                                                form.setData('role', 'admin')
                                            }
                                            className="text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                                        />
                                        Admin (Phân công theo Trung tâm)
                                    </label>
                                    <label className={`flex items-center gap-2 text-sm font-semibold cursor-pointer ${
                                        (hasSuperAdmin || admins.data.some(a => a.role === 'super_admin')) && editingAdmin?.role !== 'super_admin'
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-gray-800'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="role"
                                            value="super_admin"
                                            checked={
                                                form.data.role === 'super_admin'
                                            }
                                            disabled={(hasSuperAdmin || admins.data.some(a => a.role === 'super_admin')) && editingAdmin?.role !== 'super_admin'}
                                            onChange={() =>
                                                form.setData('role', 'super_admin')
                                            }
                                            className="text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                                        />
                                        Super Admin (Toàn hệ thống)
                                    </label>
                                </div>
                                {((hasSuperAdmin || admins.data.some(a => a.role === 'super_admin')) && editingAdmin?.role !== 'super_admin') && (
                                    <p className="text-xs text-amber-600 italic">
                                        * Hệ thống đã có 1 Super Admin. Chỉ duy nhất 1 Super Admin được tồn tại.
                                    </p>
                                )}
                                {editingAdmin?.role === 'super_admin' && (
                                    <p className="text-xs text-emerald-600 italic">
                                        * Tài khoản Quản trị viên tối cao (Super Admin) không thể bị hạ cấp hoặc xóa.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Phân công Trung tâm (Chỉ chọn khi role = admin) */}
                        {form.data.role === 'admin' && (
                            <div className="space-y-2 pt-2">
                                <label className="block text-sm font-bold text-gray-700">
                                    Phân công Trung tâm quản lý:
                                </label>
                                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 p-3.5 space-y-2">
                                    {centers.map((center) => (
                                        <label
                                            key={center.id}
                                            className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form.data.center_ids.includes(
                                                    center.id,
                                                )}
                                                onChange={() =>
                                                    toggleCenterSelection(
                                                        center.id,
                                                    )
                                                }
                                                className="rounded-sm text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span>
                                                {center.name} ({center.code})
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2.5 pt-4">
                            <Button
                                variant="secondary"
                                size="md"
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                variant="success"
                                size="md"
                                type="submit"
                                disabled={form.processing}
                            >
                                {editingAdmin
                                    ? 'Cập nhật Admin'
                                    : 'Tạo tài khoản Admin'}
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* Modal Xác nhận Xóa Admin */}
                <Modal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    title="Xác Nhận Xóa Quản Trị Viên"
                    footer={
                        <>
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
                                onClick={confirmDelete}
                                isLoading={isDeleting}
                                icon={<Trash2 className="h-5 w-5" />}
                            >
                                Xác Nhận Xóa
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-red-600">
                            <AlertCircle className="h-6 w-6 shrink-0" />
                            <p className="text-base font-semibold">
                                Bạn có chắc chắn muốn xóa tài khoản Quản trị viên "{deletingAdmin?.full_name}" (@{deletingAdmin?.username})?
                            </p>
                        </div>
                        <p className="text-sm text-gray-500">
                            Tài khoản này sẽ mất quyền truy cập vào hệ thống quản trị ngay lập tức.
                        </p>
                    </div>
                </Modal>
            </div>
        </AppLayout>
    );
}
