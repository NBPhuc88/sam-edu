import { router } from '@inertiajs/react';
import { CreditCard, LogOut, Menu, X } from 'lucide-react';
import React from 'react';
import Button from '../ui/Button';

interface AuthUser {
    id: number;
    full_name: string;
    username: string;
    email: string | null;
    role: string;
    admin_role?: string | null;
    avatar?: string | null;
}

interface HeaderProps {
    user: AuthUser | null;
    sidebarOpen: boolean;
    onToggleSidebar: () => void;
    onOpenPayment?: () => void;
    centerExpired?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    user,
    sidebarOpen,
    onToggleSidebar,
    onOpenPayment,
    centerExpired,
}) => {
    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
                        SAM
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                        Giáo dục Sam
                    </span>
                </div>
            </div>

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
                        <span className="hidden sm:inline">Gia hạn ZaloPay</span>
                    </Button>
                )}

                {/* User info */}
                {user && (
                    <div className="hidden items-center gap-2.5 sm:flex">
                        {/* Avatar */}
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs">
                            {user.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                        </div>
                        <span className="text-xs font-bold text-gray-900">
                            {user.full_name ?? user.username}
                        </span>
                    </div>
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
