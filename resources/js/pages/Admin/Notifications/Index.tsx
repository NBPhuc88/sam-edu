import { Head, router } from '@inertiajs/react';
import {
    Bell,
    Building2,
    CheckCheck,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    Filter,
    MessageSquare,
    RotateCcw,
    Search,
} from 'lucide-react';
import React, { useState } from 'react';
import { markAsRead as markNotificationRead } from '@/actions/App/Http/Controllers/Api/NotificationController';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Pagination, { PaginationLink } from '@/components/ui/Pagination';
import {
    NOTIFICATION_TYPE_CENTER_REGISTRATION,
    NOTIFICATION_TYPE_SUBSCRIPTION_RENEWAL,
} from '@/constants/enums';
import AppLayout from '@/layouts/AppLayout';
import apiClient from '@/lib/axios';
import { index as chatGroupsIndex } from '@/routes/chats';
import { index as classChatIndex } from '@/routes/classes/chat';

export interface NotificationItem {
    id: number;
    notification_id: number;
    is_chat?: boolean;
    chat_class_id?: number | null;
    title: string;
    content: string;
    type: number | string;
    center_id?: number | null;
    center_name?: string | null;
    is_read: boolean;
    read_at?: string | null;
    created_at: string;
    full_created_at?: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
}

interface Props {
    notifications: PaginatedData<NotificationItem>;
    unread_count: number;
    filters: {
        keyword?: string;
        is_read?: number | string;
        type?: number | string;
    };
}

export default function NotificationsIndex({
    notifications,
    unread_count,
    filters = {},
}: Props) {
    const [keyword, setKeyword] = useState(filters.keyword || '');
    const [selectedStatus, setSelectedStatus] = useState<string>(
        filters.is_read !== undefined &&
            filters.is_read !== null &&
            filters.is_read !== ''
            ? String(filters.is_read)
            : '',
    );
    const [selectedType, setSelectedType] = useState<string>(
        filters.type !== undefined &&
            filters.type !== null &&
            filters.type !== ''
            ? String(filters.type)
            : '',
    );
    const [markingAll, setMarkingAll] = useState(false);
    const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(
        null,
    );

    // Apply Filter Function
    const handleFilter = (overrideParams: Record<string, any> = {}) => {
        const params: Record<string, any> = {
            keyword: keyword.trim() || undefined,
            is_read: selectedStatus ? Number(selectedStatus) : undefined,
            type: selectedType ? Number(selectedType) : undefined,
            ...overrideParams,
        };

        // Clean empty/undefined keys
        Object.keys(params).forEach((key) => {
            if (params[key] === undefined || params[key] === '') {
                delete params[key];
            }
        });

        router.get('/notifications', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilter();
    };

    const handleResetFilter = () => {
        setKeyword('');
        setSelectedStatus('');
        setSelectedType('');
        router.get(
            '/notifications',
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Mark single notification as read
    const handleMarkAsRead = async (
        item: NotificationItem,
        e?: React.MouseEvent,
    ) => {
        if (e) {
            e.stopPropagation();
        }

        if (item.is_read) {
            return;
        }

        try {
            await apiClient.patch(`/api/notifications/${item.id}/read`);
            router.reload({ only: ['notifications', 'unread_count'] });
        } catch {
            // Ignore error
        }
    };

    // Mark all notifications as read
    const handleMarkAllAsRead = async () => {
        if (unread_count === 0) {
            return;
        }

        setMarkingAll(true);
        try {
            await apiClient.post('/api/notifications/mark-all-read');
            router.reload({ only: ['notifications', 'unread_count'] });
        } catch {
            // Ignore error
        } finally {
            setMarkingAll(false);
        }
    };

    // Notification item click action (matching Bell Popover behavior)
    const handleNotificationClick = async (item: NotificationItem) => {
        if (item.is_chat) {
            try {
                if (!item.is_read) {
                    const response = await apiClient.patch(
                        markNotificationRead.url(item.id),
                    );
                    if (!response.data.success) return;
                }
                router.visit(
                    item.chat_class_id
                        ? classChatIndex(item.chat_class_id)
                        : chatGroupsIndex(),
                );
            } catch {
                return;
            }
            return;
        }

        if (!item.is_read) {
            await handleMarkAsRead(item);
        }

        const isCenterReg =
            Number(item.type) === NOTIFICATION_TYPE_CENTER_REGISTRATION ||
            item.type === 'center_registration' ||
            item.type === 'registration';

        if (isCenterReg) {
            if (item.center_id) {
                router.visit(
                    `/admins?action=create&center_id=${item.center_id}`,
                );
            } else {
                router.visit('/admins?action=create');
            }
        } else if (item.center_id) {
            router.visit(`/centers/${item.center_id}/edit`);
        } else {
            setSelectedNotif(item);
        }
    };

    // Helper: Notification Icon & Badge by Type
    const getNotificationTypeInfo = (type: number | string, isChat = false) => {
        const numType = Number(type);
        if (isChat) {
            return {
                label: 'Tin nhắn lớp học',
                icon: <MessageSquare className="h-4 w-4 text-emerald-600" />,
                badgeColor:
                    'bg-emerald-100 text-emerald-800 border-emerald-200',
            };
        }
        if (
            numType === NOTIFICATION_TYPE_CENTER_REGISTRATION ||
            type === 'center_registration'
        ) {
            return {
                label: 'Đăng ký trung tâm mới',
                icon: <Building2 className="h-4 w-4 text-emerald-600" />,
                badgeColor:
                    'bg-emerald-100 text-emerald-800 border-emerald-200',
            };
        }
        if (
            numType === NOTIFICATION_TYPE_SUBSCRIPTION_RENEWAL ||
            type === 'subscription_renewal'
        ) {
            return {
                label: 'Yêu cầu gia hạn gói',
                icon: <CreditCard className="h-4 w-4 text-amber-600" />,
                badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
            };
        }

        return {
            label: 'Thông báo hệ thống',
            icon: <Bell className="h-4 w-4 text-sky-600" />,
            badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
        };
    };

    return (
        <AppLayout>
            <Head title="Thông Báo Hệ Thống" />

            <div className="space-y-6">
                {/* ── Page Header ─────────────────────────────────────────── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shadow-xs">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                                    Thông Báo Hệ Thống
                                </h1>
                                <p className="text-xs text-gray-500">
                                    Theo dõi các thông báo đăng ký trung tâm mới
                                    và yêu cầu gia hạn gói dịch vụ
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {unread_count > 0 && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                isLoading={markingAll}
                                icon={
                                    <CheckCheck className="h-4 w-4 text-emerald-600" />
                                }
                                className="!border-emerald-200 !text-emerald-700 hover:!bg-emerald-50"
                            >
                                Đã đọc tất cả ({unread_count})
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Filter & Search Toolbar ─────────────────────────────── */}
                <Card className="border-gray-200 p-4 shadow-xs">
                    <form onSubmit={handleSearchSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Search Keyword */}
                            <div className="lg:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-gray-700">
                                    Tìm kiếm
                                </label>
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        value={keyword}
                                        onChange={(e) =>
                                            setKeyword(e.target.value)
                                        }
                                        placeholder="Tìm theo tên trung tâm, email, SĐT, nội dung..."
                                        className="!pl-9 !text-sm"
                                    />
                                </div>
                            </div>

                            {/* Status Filter (1: Đã đọc, 2: Chưa đọc) */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-700">
                                    Trạng thái đọc
                                </label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedStatus(val);
                                        handleFilter({
                                            is_read: val
                                                ? Number(val)
                                                : undefined,
                                        });
                                    }}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="2">Chưa đọc</option>
                                    <option value="1">Đã đọc</option>
                                </select>
                            </div>

                            {/* Type Filter */}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-700">
                                    Loại thông báo
                                </label>
                                <select
                                    value={selectedType}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedType(val);
                                        handleFilter({
                                            type: val || undefined,
                                        });
                                    }}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                                >
                                    <option value="">
                                        Tất cả loại thông báo
                                    </option>
                                    <option
                                        value={String(
                                            NOTIFICATION_TYPE_CENTER_REGISTRATION,
                                        )}
                                    >
                                        Đăng ký trung tâm mới
                                    </option>
                                    <option
                                        value={String(
                                            NOTIFICATION_TYPE_SUBSCRIPTION_RENEWAL,
                                        )}
                                    >
                                        Yêu cầu gia hạn gói dịch vụ
                                    </option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedStatus('');
                                        handleFilter({ is_read: undefined });
                                    }}
                                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                                        selectedStatus === ''
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Tất cả ({notifications.total})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedStatus('2');
                                        handleFilter({ is_read: 2 });
                                    }}
                                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                                        selectedStatus === '2'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Chưa đọc{' '}
                                    {unread_count > 0 && `(${unread_count})`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedStatus('1');
                                        handleFilter({ is_read: 1 });
                                    }}
                                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                                        selectedStatus === '1'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Đã đọc
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {(keyword ||
                                    selectedStatus ||
                                    selectedType) && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleResetFilter}
                                        icon={
                                            <RotateCcw className="h-3.5 w-3.5" />
                                        }
                                    >
                                        Đặt lại
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    variant="success"
                                    size="sm"
                                    icon={<Filter className="h-3.5 w-3.5" />}
                                >
                                    Lọc
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>

                {/* ── Notification List ───────────────────────────────────── */}
                {notifications.data.length === 0 ? (
                    <Card className="border-gray-200 p-12 text-center shadow-xs">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Bell className="h-7 w-7" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-gray-900">
                            Không có thông báo nào
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                            {keyword || selectedStatus || selectedType
                                ? 'Không tìm thấy thông báo phù hợp với bộ lọc.'
                                : 'Bạn chưa có thông báo nào trong hệ thống.'}
                        </p>
                        {(keyword || selectedStatus || selectedType) && (
                            <div className="mt-4">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleResetFilter}
                                >
                                    Xóa bộ lọc
                                </Button>
                            </div>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {notifications.data.map((item) => {
                            const typeInfo = getNotificationTypeInfo(
                                item.type,
                                item.is_chat,
                            );

                            return (
                                <div
                                    key={item.id}
                                    onClick={() =>
                                        handleNotificationClick(item)
                                    }
                                    className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-150 ${
                                        item.is_read
                                            ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xs'
                                            : 'border-emerald-200 bg-emerald-50/50 shadow-xs hover:border-emerald-300 hover:bg-emerald-50/80'
                                    }`}
                                >
                                    <div className="flex items-start gap-3.5">
                                        {/* Icon Type */}
                                        <div
                                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                                                item.is_read
                                                    ? 'border-gray-200 bg-gray-50 text-gray-500'
                                                    : 'border-emerald-200 bg-white text-emerald-600 shadow-xs'
                                            }`}
                                        >
                                            {typeInfo.icon}
                                        </div>

                                        {/* Content Area */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-sm font-bold ${
                                                            item.is_read
                                                                ? 'text-gray-900'
                                                                : 'font-extrabold text-emerald-950'
                                                        }`}
                                                    >
                                                        {item.title}
                                                    </span>

                                                    {/* Unread indicator */}
                                                    {!item.is_read && (
                                                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600 shadow-xs ring-2 ring-emerald-300" />
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${typeInfo.badgeColor}`}
                                                    >
                                                        {typeInfo.label}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400">
                                                        {item.created_at}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-600">
                                                {item.content}
                                            </p>

                                            {/* Footer metadata */}
                                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100/80 pt-2 text-[11px] text-gray-400">
                                                <div className="flex items-center gap-3">
                                                    {item.center_name && (
                                                        <span className="flex items-center gap-1 font-medium text-gray-600">
                                                            <Building2 className="h-3 w-3 text-gray-400" />
                                                            {item.center_name}
                                                        </span>
                                                    )}
                                                    {item.full_created_at && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {
                                                                item.full_created_at
                                                            }
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 opacity-90 group-hover:opacity-100">
                                                    {!item.is_read && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) =>
                                                                handleMarkAsRead(
                                                                    item,
                                                                    e,
                                                                )
                                                            }
                                                            className="flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                                                        >
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Đánh dấu đã đọc
                                                        </button>
                                                    )}
                                                    <span className="flex items-center gap-0.5 font-semibold text-emerald-700 transition-transform group-hover:translate-x-0.5">
                                                        Xem chi tiết
                                                        <ExternalLink className="ml-0.5 h-3 w-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* ── Pagination Footer ───────────────────────────── */}
                        <div className="pt-4">
                            <Pagination
                                links={notifications.links}
                                total={notifications.total}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Notification Detail Modal ─────────────────────────────── */}
            {selectedNotif && (
                <Modal
                    isOpen={!!selectedNotif}
                    onClose={() => setSelectedNotif(null)}
                    title="Chi Tiết Thông Báo"
                    maxWidth="md"
                >
                    <div className="space-y-4 py-2">
                        <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                                    Tiêu đề
                                </span>
                                <span className="text-[11px] text-gray-400">
                                    {selectedNotif.full_created_at ||
                                        selectedNotif.created_at}
                                </span>
                            </div>
                            <h3 className="mt-1 text-sm font-bold text-gray-900">
                                {selectedNotif.title}
                            </h3>
                        </div>

                        <div>
                            <span className="mb-1 block text-xs font-bold tracking-wider text-gray-500 uppercase">
                                Nội dung chi tiết
                            </span>
                            <div className="rounded-xl border border-gray-200 bg-white p-4 text-xs leading-relaxed whitespace-pre-line text-gray-700 shadow-xs">
                                {selectedNotif.content}
                            </div>
                        </div>

                        {selectedNotif.center_name && (
                            <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-slate-50 px-3 py-2 text-xs text-gray-600">
                                <span className="font-medium">
                                    Trung tâm liên quan:
                                </span>
                                <strong className="text-gray-900">
                                    {selectedNotif.center_name}
                                </strong>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setSelectedNotif(null)}
                            >
                                Đóng
                            </Button>
                            {selectedNotif.center_id && (
                                <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => {
                                        const cId = selectedNotif.center_id;
                                        setSelectedNotif(null);
                                        router.visit(`/centers/${cId}/edit`);
                                    }}
                                    icon={
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    }
                                >
                                    Đến trung tâm
                                </Button>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </AppLayout>
    );
}
