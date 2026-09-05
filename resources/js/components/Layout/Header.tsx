import { markAsRead as markNotificationRead } from '@/actions/App/Http/Controllers/Api/NotificationController';
import { index as notificationsIndex } from '@/actions/App/Http/Controllers/Api/NotificationController';
import AppLogo from '@/components/common/AppLogo';
import { ROLE_SUPER_ADMIN } from '@/constants/enums';
import apiClient from '@/lib/axios';
import getEcho from '@/lib/echo';
import { index as chatGroupsIndex } from '@/routes/chats';
import { index as classChatIndex } from '@/routes/classes/chat';
import { Link, router, usePage } from '@inertiajs/react';
import { Bell, Building2, CreditCard, LogOut, Menu, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Button from '../ui/Button';

interface AuthUser {
    id: number;
    full_name: string;
    username: string;
    email: string | null;
    role: string;
    admin_role?: number | null;
    avatar?: string | null;
}

interface CenterData {
    id: number;
    code: string;
    name: string;
    subscription_plan_id?: number | null;
    expires_at?: string | null;
    is_expired?: boolean;
    expiring_soon?: boolean;
    expiring_1day?: boolean;
    days_remaining?: number;
}

interface NotificationItem {
    id: number;
    notification_id: number;
    is_chat?: boolean;
    chat_class_id?: number | null;
    title: string;
    content: string;
    type?: number | string | null;
    center_id?: number | null;
    center_name?: string | null;
    is_read: boolean;
    read_at?: string | null;
    created_at: string;
}

interface HeaderProps {
    user: AuthUser | null;
    role?: string | null;
    center?: CenterData | null;
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
    onOpenPayment?: () => void;
    centerExpired?: boolean;
    headerExtra?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
    user,
    role,
    center,
    sidebarOpen,
    onToggleSidebar,
    onOpenPayment,
    centerExpired,
    headerExtra,
}) => {
    const pageProps = usePage<any>().props;
    const initialNotifs: NotificationItem[] =
        pageProps.auth?.notifications ?? [];
    const initialUnreadCount: number =
        pageProps.auth?.unread_notifications_count ?? 0;

    const [notifications, setNotifications] =
        useState<NotificationItem[]>(initialNotifs);
    const [unreadCount, setUnreadCount] = useState<number>(initialUnreadCount);
    const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);

    useEffect(() => {
        setNotifications(pageProps.auth?.notifications ?? []);
        setUnreadCount(pageProps.auth?.unread_notifications_count ?? 0);
    }, [
        pageProps.auth?.notifications,
        pageProps.auth?.unread_notifications_count,
    ]);

    useEffect(() => {
        if (!user) return;
        let active = true;
        const timer = window.setInterval(async () => {
            if (document.visibilityState !== 'visible') return;
            try {
                const response = await apiClient.get(notificationsIndex.url());
                if (active && response.data.success) {
                    setNotifications(response.data.notifications);
                    setUnreadCount(response.data.unread_count);
                }
            } catch {
                // Keep the last successful notification state until the next refresh.
            }
        }, 15000);
        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, [user?.id, role]);

    // WebSocket Real-time Notification Listener (Reverb/Pusher)
    useEffect(() => {
        if (typeof window === 'undefined' || !user) {
            return;
        }

        const isSuper =
            (role === 'admin' || user.role === 'admin') &&
            user.admin_role === ROLE_SUPER_ADMIN;

        const echo = getEcho();

        if (isSuper) {
            const channel = echo.channel('super-admin-notifications');

            // 1. Nhận thông báo yêu cầu gia hạn dịch vụ từ Admin trung tâm
            channel.listen('.subscription.renewal_requested', (e: any) => {
                const newNotif: NotificationItem = {
                    id: e.id || Date.now(),
                    notification_id: e.notification_id || e.id,
                    is_chat: false,
                    title: e.title || 'Yêu cầu gia hạn mới',
                    content: e.content || '',
                    type: e.type || 'subscription_renewal',
                    center_id: e.center_id || null,
                    center_name: e.center_name || null,
                    is_read: false,
                    read_at: null,
                    created_at: e.created_at || 'Vừa xong',
                };

                setNotifications((prev) => [newNotif, ...prev]);
                setUnreadCount((prev) => prev + 1);
            });

            // 2. Nhận thông báo trung tâm mới đăng ký
            channel.listen('.center.registered', (e: any) => {
                const newNotif: NotificationItem = {
                    id: e.id || Date.now(),
                    notification_id: e.notification_id || e.id,
                    is_chat: false,
                    title: e.title || 'Trung tâm mới đăng ký',
                    content: e.content || '',
                    type: e.type || 'center_registration',
                    center_id: e.center_id || null,
                    center_name: e.center_name || null,
                    is_read: false,
                    read_at: null,
                    created_at: e.created_at || 'Vừa xong',
                };

                setNotifications((prev) => [newNotif, ...prev]);
                setUnreadCount((prev) => prev + 1);
            });

            return () => {
                echo.leave('super-admin-notifications');
            };
        } else {
            const roleKey = role === 'admin' ? 'admin' : role === 'teacher' ? 'teacher' : 'student';
            const channelName = `notifications.${roleKey}.${user.id}`;
            const privateChannel = echo.private(channelName);

            privateChannel.listen('.notification.sent', (e: any) => {
                const newNotif: NotificationItem = {
                    id: e.id || Date.now(),
                    notification_id: e.notification_id || e.id,
                    is_chat: Boolean(e.is_chat),
                    chat_class_id: e.chat_class_id ?? null,
                    title: e.title || 'Thông báo mới',
                    content: e.content || '',
                    type: e.type ?? null,
                    center_id: e.center_id ?? null,
                    center_name: e.center_name ?? null,
                    is_read: false,
                    read_at: null,
                    created_at: e.created_at || 'Vừa xong',
                };

                setNotifications((prev) => [newNotif, ...prev]);
                setUnreadCount((prev) => prev + 1);
            });

            return () => {
                echo.leave(channelName);
            };
        }
    }, [user?.id, role, user?.admin_role]);

    const handleMarkAsRead = async (id: number) => {
        try {
            const res = await apiClient.patch(`/api/notifications/${id}/read`);
            if (res.data?.success) {
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === id ? { ...n, is_read: true } : n,
                    ),
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
    };

    const handleNotificationClick = async (item: NotificationItem) => {
        if (item.is_chat) {
            try {
                if (!item.is_read) {
                    const response = await apiClient.patch(
                        markNotificationRead.url(item.id),
                    );
                    if (!response.data.success) return;
                }
                setIsPopoverOpen(false);
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
            await handleMarkAsRead(item.id);
        }
        setIsPopoverOpen(false);

        if (isSuperAdmin) {
            if (item.type === 'center_registration' || item.type === 6) {
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
                router.visit('/notifications');
            }
        } else {
            router.visit('/notifications');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await apiClient.post('/api/notifications/mark-all-read');
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true })),
            );
            setUnreadCount(0);
        } catch {
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true })),
            );
            setUnreadCount(0);
        }
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    // Hiển thị logo và tên Trung tâm ở chính giữa header cho: Admin phụ, Giáo viên, Học sinh
    const isSuperAdmin =
        (role === 'admin' || user?.role === 'admin') &&
        user?.admin_role === ROLE_SUPER_ADMIN;
    const isSubAdmin = role === 'admin' && !isSuperAdmin;
    const isTeacher = role === 'teacher';
    const isStudent = role === 'student';
    const showCenterBrand =
        (isSubAdmin || isTeacher || isStudent) && !!center?.name;

    const displayedNotifications = isSuperAdmin
        ? notifications.filter((item) => !item.is_chat)
        : notifications;


    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/95 px-4 shadow-xs backdrop-blur-md">
            {/* Left — Sidebar Toggle */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Toggle sidebar"
                >
                    {sidebarOpen ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Menu className="h-5 w-5" />
                    )}
                </button>

                {/* Breadcrumb brand mark (mobile) */}
                <div className="flex items-center gap-2 md:hidden">
                    <AppLogo withText={true} size="sm" />
                </div>
            </div>

            {/* Center — Logo của trung tâm / Custom Header Extra */}
            {headerExtra ? (
                <div className="flex items-center justify-center">
                    {headerExtra}
                </div>
            ) : showCenterBrand && center ? (
                <div className="flex max-w-[45%] items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-2.5 py-1 shadow-2xs sm:max-w-[55%] sm:gap-2.5 sm:px-3.5 md:max-w-[60%]">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                        <Building2 className="h-4 w-4" />
                    </div>
                    <div className="flex items-center overflow-hidden">
                        <span
                            className="truncate text-xs font-bold text-gray-900 sm:text-sm"
                            title={center.name}
                        >
                            {center.name}
                        </span>
                    </div>
                </div>
            ) : (
                <div />
            )}

            {/* Right — User info + actions */}
            <div className="flex items-center gap-3">
                {/* Gia hạn nhanh nếu sắp hết hạn */}
                {centerExpired && onOpenPayment && (
                    <Button
                        variant="success"
                        size="sm"
                        icon={<CreditCard className="h-3.5 w-3.5" />}
                        onClick={onOpenPayment}
                    >
                        <span className="hidden sm:inline">
                            Gia hạn dịch vụ
                        </span>
                    </Button>
                )}

                {/* Bell Notification Icon — Hiển thị cho tất cả người dùng */}
                {user && (
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsPopoverOpen((prev) => !prev)}
                            className="relative rounded-full p-2 text-gray-600 transition-colors hover:bg-slate-100 hover:text-gray-900 focus:outline-none"
                            title="Thông báo hệ thống"
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4 animate-pulse items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Dropdown Popover */}
                        {isPopoverOpen && (
                            <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-3 shadow-xl duration-150 sm:w-96">
                                <div className="flex items-center justify-between border-b border-gray-100 px-1 pb-2.5">
                                    <div className="flex items-center gap-2">
                                        <Bell className="h-4 w-4 text-emerald-600" />
                                        <span className="text-xs font-bold text-gray-900">
                                             Thông báo
                                        </span>
                                        {unreadCount > 0 && (
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                                {unreadCount} chưa đọc
                                            </span>
                                        )}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleMarkAllAsRead}
                                            className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                                        >
                                            Đã đọc tất cả
                                        </button>
                                    )}
                                </div>

                                <div className="mt-2 max-h-80 space-y-1.5 overflow-y-auto pr-0.5">
                                    {displayedNotifications.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-gray-400">
                                            Chưa có thông báo nào
                                        </div>
                                    ) : (
                                        displayedNotifications.map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() =>
                                                    handleNotificationClick(
                                                        item,
                                                    )
                                                }
                                                className={`cursor-pointer rounded-xl p-2.5 text-left transition-all ${
                                                    item.is_read
                                                        ? 'bg-white text-gray-600 hover:bg-slate-50'
                                                        : 'border border-emerald-100 bg-emerald-50/70 font-medium text-gray-900 hover:bg-emerald-50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className="text-xs leading-snug font-bold text-gray-900">
                                                        {item.title}
                                                    </span>
                                                    {!item.is_read && (
                                                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                                                    )}
                                                </div>
                                                <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                                                    {item.content}
                                                </p>
                                                <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
                                                    <span>
                                                        {item.center_name ??
                                                            'Hệ thống'}
                                                    </span>
                                                    <span>
                                                        {item.created_at}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="mt-2.5 border-t border-gray-100 pt-2 text-center">
                                    <Link
                                        href="/notifications"
                                        onClick={() => setIsPopoverOpen(false)}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                                    >
                                        Xem tất cả thông báo &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* User info link to Profile */}
                {user && (
                    <Link
                        href="/profile"
                        title="Xem và quản lý Thông Tin Tài Khoản"
                        className="group flex items-center gap-2.5 rounded-xl px-2 py-1 transition-all hover:bg-slate-100"
                    >
                        {/* Avatar */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 shadow-xs ring-2 ring-emerald-500/20 transition-transform group-hover:scale-105">
                            {user.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                        </div>
                        <div className="hidden flex-col text-left sm:flex">
                            <span className="text-xs font-bold text-gray-900 transition-colors group-hover:text-emerald-700">
                                {user.full_name ?? user.username}
                            </span>
                            <span className="text-2xs text-gray-400 capitalize">
                                {role === 'admin'
                                    ? isSuperAdmin
                                        ? 'Super Admin'
                                        : 'Admin'
                                    : role === 'teacher'
                                      ? 'Giáo viên'
                                      : 'Học sinh'}
                            </span>
                        </div>
                    </Link>
                )}

                {/* Logout */}
                <Button
                    variant="secondary"
                    size="sm"
                    icon={<LogOut className="h-4 w-4 text-gray-600" />}
                    onClick={handleLogout}
                >
                    <span className="hidden sm:inline">Đăng xuất</span>
                </Button>
            </div>
        </header>
    );
};

export default Header;
