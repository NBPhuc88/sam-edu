import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import { getAccountLabel, getNavigationItems } from '../../config/navigation';
import type { NavItem } from '../../config/navigation';

interface SidebarProps {
    role: string | null;
    adminRole?: string | null;
    fullName?: string | null;
    open: boolean;
    onClose?: () => void;
}

/** Active path detection */
function isActivePath(path: string, currentUrl: string): boolean {
    if (path === '/dashboard' || path.endsWith('/dashboard')) {
        return currentUrl === path;
    }

    return currentUrl.startsWith(path);
}

/** Single nav link */
const NavLink: React.FC<{
    item: NavItem;
    currentUrl: string;
    onClose?: () => void;
}> = ({ item, currentUrl, onClose }) => {
    const active = item.path ? isActivePath(item.path, currentUrl) : false;
    const Icon = item.icon;

    if (!item.path) {
        return null;
    }

    const handleClick = () => {
        if (
            typeof window !== 'undefined' &&
            window.innerWidth < 768 &&
            onClose
        ) {
            onClose();
        }
    };

    return (
        <Link
            href={item.path}
            onClick={handleClick}
            className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                active
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            {Icon && <Icon className="h-4.5 w-4.5 shrink-0" />}
            <span className="truncate">{item.label}</span>
        </Link>
    );
};

/** Expandable nav group */
const NavGroup: React.FC<{
    item: NavItem;
    currentUrl: string;
    onClose?: () => void;
}> = ({ item, currentUrl, onClose }) => {
    const groupActive =
        item.children?.some(
            (child) => child.path && isActivePath(child.path, currentUrl),
        ) ?? false;

    const [expanded, setExpanded] = useState(groupActive);
    const Icon = item.icon;

    return (
        <div>
            <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className={`flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    groupActive
                        ? 'bg-emerald-50 text-emerald-900'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <Icon className="h-4.5 w-4.5 shrink-0 text-gray-500" />
                    )}
                    <span>{item.label}</span>
                </div>
                <ChevronDown
                    className={`h-4.5 w-4.5 shrink-0 transition-transform duration-200 ${
                        expanded
                            ? 'rotate-180 text-emerald-700'
                            : 'text-gray-400'
                    }`}
                />
            </button>

            {expanded && item.children && (
                <div className="mt-1 space-y-1 pl-7">
                    {item.children.map((child) => (
                        <NavLink
                            key={child.path ?? child.label}
                            item={child}
                            currentUrl={currentUrl}
                            onClose={onClose}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/** Main Sidebar */
export const Sidebar: React.FC<SidebarProps> = ({
    role,
    adminRole,
    fullName,
    open,
    onClose,
}) => {
    const { url } = usePage();
    const navItems = getNavigationItems(role, adminRole);
    const accountLabel = getAccountLabel(role, adminRole);

    // Avatar character or a simple letter placeholder
    const avatarChar = fullName?.charAt(0)?.toUpperCase() ?? '?';

    return (
        <>
            {/* Overlay for mobile */}
            {open && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
                    aria-hidden="true"
                />
            )}

            {/* Sidebar panel */}
            <aside
                className={`shrink-0 border-r border-gray-200 bg-white transition-all duration-300 ease-in-out ${
                    open
                        ? 'w-64 opacity-100'
                        : 'pointer-events-none w-0 overflow-hidden border-r-0 border-transparent opacity-0'
                } fixed inset-y-0 left-0 z-40 h-full shadow-xl md:static md:z-auto md:shadow-none ${
                    open
                        ? 'translate-x-0'
                        : '-translate-x-full md:translate-x-0'
                }`}
            >
                {/* Fixed width container to prevent text warping during transition */}
                <div className="flex h-full w-64 flex-col">
                    {/* Brand header */}
                    <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm">
                            SAM
                        </div>
                        <div>
                            <div className="text-sm leading-tight font-bold text-gray-900">
                                Giáo dục Sam
                            </div>
                            <div className="text-xs text-gray-400">
                                Quản lý Giáo dục
                            </div>
                        </div>
                    </div>

                    {/* Account info block */}
                    <div className="border-b border-gray-100 px-4 py-3">
                        <div className="flex items-center gap-2.5">
                            <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                    role === 'admin'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : role === 'teacher'
                                          ? 'bg-violet-100 text-violet-700'
                                          : 'bg-amber-100 text-amber-700'
                                }`}
                            >
                                {avatarChar}
                            </div>
                            <div className="min-w-0">
                                <div className="truncate text-sm font-bold text-gray-900">
                                    {fullName && fullName !== 'Admin'
                                        ? fullName
                                        : (adminRole === 'super_admin' ? 'Quản trị Tối cao' : 'Quản trị viên')}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {accountLabel}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                        {navItems.map((item) =>
                            item.children ? (
                                <NavGroup
                                    key={item.label}
                                    item={item}
                                    currentUrl={url}
                                    onClose={onClose}
                                />
                            ) : (
                                <NavLink
                                    key={item.path ?? item.label}
                                    item={item}
                                    currentUrl={url}
                                    onClose={onClose}
                                />
                            ),
                        )}
                    </nav>

                    {/* Footer */}
                    <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
                        © 2026 Giáo dục Sam · v1.0
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
