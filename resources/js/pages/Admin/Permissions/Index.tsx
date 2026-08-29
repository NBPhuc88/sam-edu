import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import {
    ROLE_ADMIN,
    ROLE_STUDENT,
    ROLE_SUPER_ADMIN,
    ROLE_TEACHER,
} from '@/constants/enums';
import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import {
    CheckSquare,
    ChevronDown,
    ChevronRight,
    Info,
    Lock,
    RefreshCw,
    RotateCcw,
    Save,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Square,
    Undo2,
    User,
    UserCheck,
    Users,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface PermissionAction {
    id: number;
    code: string;
    name: string;
    action: string;
    description: string | null;
}

interface PermissionModule {
    key: string;
    name: string;
    module_order: number;
    permissions: PermissionAction[];
}

interface RoleInfo {
    key: number;
    name: string;
    description: string;
}

interface Props {
    modules: PermissionModule[];
    roleGrants: Record<number | string, string[]>;
    roles: RoleInfo[];
}

const ACTION_BADGES: Record<string, { label: string; color: string }> = {
    index:  { label: 'Xem', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    create: { label: 'Thêm', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    edit:   { label: 'Sửa', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    delete: { label: 'Xóa', color: 'bg-red-100 text-red-800 border-red-200' },
    save:   { label: 'Ghi', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    grade:  { label: 'Chấm', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
};

const ROLE_ICONS: Record<number, React.ReactNode> = {
    [ROLE_SUPER_ADMIN]: <ShieldAlert className="h-5 w-5 text-purple-600" />,
    [ROLE_ADMIN]:       <ShieldCheck className="h-5 w-5 text-emerald-600" />,
    [ROLE_TEACHER]:     <UserCheck className="h-5 w-5 text-blue-600" />,
    [ROLE_STUDENT]:     <User className="h-5 w-5 text-amber-600" />,
};

export default function PermissionIndex({ modules = [], roleGrants = {}, roles = [] }: Props) {
    const [selectedRole, setSelectedRole] = useState<number>(ROLE_ADMIN);
    const [search, setSearch] = useState<string>('');
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        modules.forEach((m) => {
            initial[m.key] = true;
        });
        return initial;
    });

    // Quản lý state quyền của các role (đồng bộ hai chiều với props server)
    const [currentGrants, setCurrentGrants] = useState<Record<number | string, string[]>>(roleGrants);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);
    const [isResetting, setIsResetting] = useState<boolean>(false);

    // Tự động đồng bộ lại currentGrants khi props roleGrants từ server cập nhật (sau save, reset, sync)
    useEffect(() => {
        setCurrentGrants(roleGrants);
    }, [roleGrants]);

    // Tự động mở rộng các module mới khi danh sách modules được cập nhật sau khi đồng bộ
    useEffect(() => {
        setExpandedModules((prev) => {
            const next = { ...prev };
            modules.forEach((m) => {
                if (next[m.key] === undefined) {
                    next[m.key] = true;
                }
            });
            return next;
        });
    }, [modules]);

    const isSuperAdminRole = Number(selectedRole) === ROLE_SUPER_ADMIN;

    // Danh sách quyền hiện tại của role đang chọn
    const activeRolePermissions = currentGrants[selectedRole] || [];

    // Tổng số quyền trong hệ thống
    const totalPermissionsCount = useMemo(() => {
        return modules.reduce((acc, m) => acc + m.permissions.length, 0);
    }, [modules]);

    // Kiểm tra xem dữ liệu có thay đổi so với server
    const isDirty = useMemo(() => {
        const serverCodes = [...(roleGrants[selectedRole] || [])].sort();
        const currentCodes = [...(currentGrants[selectedRole] || [])].sort();
        return JSON.stringify(serverCodes) !== JSON.stringify(currentCodes);
    }, [roleGrants, currentGrants, selectedRole]);

    // Lọc modules theo tìm kiếm
    const filteredModules = useMemo(() => {
        if (!search.trim()) {
            return modules;
        }
        const query = search.toLowerCase().trim();
        return modules
            .map((m) => {
                const matchModule = m.name.toLowerCase().includes(query);
                const filteredPermissions = m.permissions.filter(
                    (p) =>
                        matchModule ||
                        p.name.toLowerCase().includes(query) ||
                        p.code.toLowerCase().includes(query) ||
                        (p.description && p.description.toLowerCase().includes(query))
                );
                return {
                    ...m,
                    permissions: filteredPermissions,
                };
            })
            .filter((m) => m.permissions.length > 0);
    }, [modules, search]);

    const toggleModuleExpand = (moduleKey: string) => {
        setExpandedModules((prev) => ({
            ...prev,
            [moduleKey]: !prev[moduleKey],
        }));
    };

    const handleTogglePermission = (code: string) => {
        if (isSuperAdminRole) {
            return;
        }

        setCurrentGrants((prev) => {
            const currentList = prev[selectedRole] || [];
            const exists = currentList.includes(code);
            const updated = exists
                ? currentList.filter((c) => c !== code)
                : [...currentList, code];

            return {
                ...prev,
                [selectedRole]: updated,
            };
        });
    };

    const handleToggleModuleAll = (moduleKey: string, selectAll: boolean) => {
        if (isSuperAdminRole) {
            return;
        }

        const targetModule = modules.find((m) => m.key === moduleKey);
        if (!targetModule) {
            return;
        }

        const moduleCodes = targetModule.permissions.map((p) => p.code);

        setCurrentGrants((prev) => {
            const currentList = prev[selectedRole] || [];
            let updated: string[];

            if (selectAll) {
                // Thêm tất cả code chưa có
                const toAdd = moduleCodes.filter((c) => !currentList.includes(c));
                updated = [...currentList, ...toAdd];
            } else {
                // Xóa tất cả code thuộc module này
                updated = currentList.filter((c) => !moduleCodes.includes(c));
            }

            return {
                ...prev,
                [selectedRole]: updated,
            };
        });
    };

    const handleSelectAllRole = () => {
        if (isSuperAdminRole) {
            return;
        }
        const allCodes = modules.flatMap((m) => m.permissions.map((p) => p.code));
        setCurrentGrants((prev) => ({
            ...prev,
            [selectedRole]: allCodes,
        }));
    };

    const handleDeselectAllRole = () => {
        if (isSuperAdminRole) {
            return;
        }
        setCurrentGrants((prev) => ({
            ...prev,
            [selectedRole]: [],
        }));
    };

    const handleDiscardChanges = () => {
        setCurrentGrants((prev) => ({
            ...prev,
            [selectedRole]: [...(roleGrants[selectedRole] || [])],
        }));
    };

    const handleSave = () => {
        if (isSuperAdminRole) {
            return;
        }

        setIsSaving(true);
        router.post(
            '/permissions',
            {
                role: selectedRole,
                permissions: currentGrants[selectedRole] || [],
            },
            {
                preserveScroll: true,
                onFinish: () => setIsSaving(false),
            }
        );
    };

    const handleReset = () => {
        setIsResetting(true);
        router.post(
            '/permissions/reset',
            { role: selectedRole },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setResetModalOpen(false);
                },
                onFinish: () => setIsResetting(false),
            }
        );
    };

    const handleSync = () => {
        setIsSyncing(true);
        router.post(
            '/permissions/sync',
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsSyncing(false),
            }
        );
    };

    return (
        <AppLayout>
            <Head title="Quản Lý Phân Quyền Hệ Thống" />

            <div className="space-y-6">
                {/* Header Page */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Quản Lý Phân Quyền Hệ Thống
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Phân quyền động theo vai trò (Super Admin, Admin phụ, Giáo viên, Học sinh)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="secondary"
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>Đồng Bộ Quyền Mới</span>
                        </Button>

                        <Button
                            variant="danger"
                            onClick={() => setResetModalOpen(true)}
                            className="flex items-center gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            <span>Khôi Phục Mặc Định</span>
                        </Button>

                        {isDirty && !isSuperAdminRole && (
                            <Button
                                variant="secondary"
                                onClick={handleDiscardChanges}
                                disabled={isSaving}
                                className="flex items-center gap-2"
                            >
                                <Undo2 className="h-4 w-4 text-gray-500" />
                                <span>Hoàn Tác</span>
                            </Button>
                        )}

                        <Button
                            variant="success"
                            onClick={handleSave}
                            disabled={isSaving || isSuperAdminRole || !isDirty}
                            className="flex items-center gap-2 shadow-sm"
                        >
                            <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
                            <span>{isDirty ? 'Lưu Thay Đổi (*)' : 'Lưu Thay Đổi'}</span>
                        </Button>
                    </div>
                </div>

                {/* Role Tabs */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {roles.map((role) => {
                        const isSelected = selectedRole === role.key;
                        const grantsCount =
                            role.key === ROLE_SUPER_ADMIN
                                ? totalPermissionsCount
                                : (currentGrants[role.key] || []).length;

                        return (
                            <button
                                key={role.key}
                                type="button"
                                onClick={() => setSelectedRole(role.key)}
                                className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                                    isSelected
                                        ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <div className="flex w-full items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-xs border border-gray-200">
                                            {ROLE_ICONS[role.key] || <Users className="h-5 w-5 text-gray-600" />}
                                        </div>
                                        <span className="font-bold text-gray-900">{role.name}</span>
                                    </div>
                                    <Badge
                                        variant={
                                            role.key === ROLE_SUPER_ADMIN
                                                ? 'active'
                                                : grantsCount > 0
                                                ? 'pending'
                                                : 'info'
                                        }
                                    >
                                        {grantsCount}/{totalPermissionsCount}
                                    </Badge>
                                </div>
                                <p className="mt-2 text-xs text-gray-500 line-clamp-2">
                                    {role.description}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Role Status Banner */}
                {isSuperAdminRole ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-4 text-purple-900 shadow-xs">
                        <Lock className="h-5 w-5 shrink-0 text-purple-600" />
                        <div className="text-sm">
                            <strong className="font-semibold">Super Admin có toàn quyền hệ thống:</strong> Vai trò này luôn được cấp tất cả {totalPermissionsCount} quyền và không thể hủy bỏ.
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Info className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                            <span>
                                Đang phân quyền cho: <strong className="text-gray-900">{roles.find((r) => r.key === selectedRole)?.name}</strong> — Đã cấp <strong>{activeRolePermissions.length}</strong> / {totalPermissionsCount} quyền
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSelectAllRole}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                                <CheckSquare className="h-3.5 w-3.5" />
                                <span>Chọn tất cả</span>
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                                type="button"
                                onClick={handleDeselectAllRole}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <Square className="h-3.5 w-3.5" />
                                <span>Bỏ chọn tất cả</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm module hoặc tên quyền (ví dụ: học sinh, thêm đề thi, lớp học)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                        />
                    </div>
                </div>

                {/* Modules Accordion List */}
                <div className="space-y-4">
                    {filteredModules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
                            <Shield className="h-12 w-12 text-gray-300" />
                            <h3 className="mt-3 text-base font-semibold text-gray-900">Không tìm thấy quyền phù hợp</h3>
                            <p className="mt-1 text-sm text-gray-500">Thử thay đổi từ khóa tìm kiếm</p>
                        </div>
                    ) : (
                        filteredModules.map((mod) => {
                            const isExpanded = expandedModules[mod.key] ?? true;
                            const moduleCodes = mod.permissions.map((p) => p.code);
                            const grantedCount = isSuperAdminRole
                                ? mod.permissions.length
                                : moduleCodes.filter((c) => activeRolePermissions.includes(c)).length;
                            const isAllSelected = grantedCount === mod.permissions.length;
                            const isIndeterminate = grantedCount > 0 && grantedCount < mod.permissions.length;

                            return (
                                <Card key={mod.key} className="overflow-hidden border border-gray-200 bg-white shadow-xs">
                                    {/* Module Header */}
                                    <div
                                        className="flex items-center justify-between border-b border-gray-100 bg-slate-50/70 px-5 py-3.5 cursor-pointer select-none hover:bg-slate-100/70 transition-colors"
                                        onClick={() => toggleModuleExpand(mod.key)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                className="text-gray-500 hover:text-gray-800"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4.5 w-4.5" />
                                                ) : (
                                                    <ChevronRight className="h-4.5 w-4.5" />
                                                )}
                                            </button>

                                            <div>
                                                <span className="text-base font-bold text-gray-900">
                                                    {mod.name}
                                                </span>
                                                <span className="ml-2 text-xs font-semibold text-gray-500">
                                                    ({grantedCount}/{mod.permissions.length} quyền)
                                                </span>
                                            </div>
                                        </div>

                                        <div
                                            className="flex items-center gap-3"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {!isSuperAdminRole && (
                                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 hover:text-gray-900">
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllSelected}
                                                        ref={(el) => {
                                                            if (el) el.indeterminate = isIndeterminate;
                                                        }}
                                                        onChange={(e) =>
                                                            handleToggleModuleAll(mod.key, e.target.checked)
                                                        }
                                                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <span>Chọn tất cả module</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Permissions Table */}
                                    {isExpanded && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="border-b border-gray-200 bg-white text-xs font-bold uppercase text-gray-500">
                                                    <tr>
                                                        <th scope="col" className="px-5 py-3 w-16 text-center">
                                                            Cấp quyền
                                                        </th>
                                                        <th scope="col" className="px-5 py-3 w-28">
                                                            Hành động
                                                        </th>
                                                        <th scope="col" className="px-5 py-3 min-w-[220px]">
                                                            Tên tính năng / Quyền
                                                        </th>
                                                        <th scope="col" className="px-5 py-3 min-w-[200px] text-gray-400">
                                                            Mã quyền (Code)
                                                        </th>
                                                        <th scope="col" className="px-5 py-3 text-gray-500">
                                                            Mô tả chi tiết
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                    {mod.permissions.map((perm) => {
                                                        const isChecked = isSuperAdminRole || activeRolePermissions.includes(perm.code);
                                                        const actionBadge = ACTION_BADGES[perm.action] || {
                                                            label: perm.action,
                                                            color: 'bg-gray-100 text-gray-800 border-gray-200',
                                                        };

                                                        return (
                                                            <tr
                                                                key={perm.code}
                                                                onClick={() => handleTogglePermission(perm.code)}
                                                                className={`cursor-pointer transition-colors ${
                                                                    isChecked
                                                                        ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                                                                        : 'hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                <td
                                                                    className="px-5 py-3.5 text-center"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        disabled={isSuperAdminRole}
                                                                        onChange={() => handleTogglePermission(perm.code)}
                                                                        className="h-4.5 w-4.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-75 cursor-pointer"
                                                                    />
                                                                </td>

                                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                                    <span
                                                                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${actionBadge.color}`}
                                                                    >
                                                                        {actionBadge.label}
                                                                    </span>
                                                                </td>

                                                                <td className="px-5 py-3.5 font-semibold text-gray-900">
                                                                    {perm.name}
                                                                </td>

                                                                <td className="px-5 py-3.5 font-mono text-xs text-gray-500">
                                                                    {perm.code}
                                                                </td>

                                                                <td className="px-5 py-3.5 text-xs text-gray-500">
                                                                    {perm.description || '—'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Bottom Action Bar */}
                {filteredModules.length > 0 && (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
                        <div className="text-sm text-gray-600">
                            Đang cấu hình: <strong className="text-gray-900">{roles.find((r) => r.key === selectedRole)?.name}</strong> — Đã chọn <strong>{activeRolePermissions.length}</strong> / {totalPermissionsCount} quyền
                            {isDirty && (
                                <span className="ml-2 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                    Có thay đổi chưa lưu
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <Button
                                variant="secondary"
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                <span>Đồng Bộ Quyền Mới</span>
                            </Button>

                            <Button
                                variant="danger"
                                onClick={() => setResetModalOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                <span>Khôi Phục Mặc Định</span>
                            </Button>

                            {isDirty && !isSuperAdminRole && (
                                <Button
                                    variant="secondary"
                                    onClick={handleDiscardChanges}
                                    disabled={isSaving}
                                    className="flex items-center gap-2"
                                >
                                    <Undo2 className="h-4 w-4 text-gray-500" />
                                    <span>Hoàn Tác</span>
                                </Button>
                            )}

                            <Button
                                variant="success"
                                onClick={handleSave}
                                disabled={isSaving || isSuperAdminRole || !isDirty}
                                className="flex items-center gap-2 shadow-sm"
                            >
                                <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
                                <span>{isDirty ? 'Lưu Thay Đổi (*)' : 'Lưu Thay Đổi'}</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Reset Confirmation Modal */}
                <Modal
                    isOpen={resetModalOpen}
                    onClose={() => setResetModalOpen(false)}
                    title="Khôi Phục Phân Quyền Mặc Định"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Bạn có chắc chắn muốn khôi phục phân quyền mặc định từ hệ thống cho vai trò{' '}
                            <strong className="text-gray-900">
                                {roles.find((r) => r.key === selectedRole)?.name}
                            </strong>
                            ?
                        </p>
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
                            ⚠️ Hành động này sẽ ghi đè toàn bộ cấu hình phân quyền hiện tại về trạng thái chuẩn ban đầu.
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="secondary"
                                onClick={() => setResetModalOpen(false)}
                                disabled={isResetting}
                            >
                                Hủy bỏ
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleReset}
                                disabled={isResetting}
                            >
                                {isResetting ? 'Đang khôi phục...' : 'Xác nhận khôi phục'}
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AppLayout>
    );
}
