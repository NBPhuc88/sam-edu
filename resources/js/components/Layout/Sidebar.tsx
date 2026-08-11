import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import {
    getAccountLabel,
    getNavigationItems
    
} from '../../config/navigation';
import type {NavItem} from '../../config/navigation';

interface SidebarProps {
    role: string | null;
    adminRole?: string | null;
    fullName?: string | null;
    open: boolean;
}

/** Active path detection */
function isActivePath(path: string, currentUrl: string): boolean {
    if (path === '/dashboard' || path.endsWith('/dashboard')) {
        return currentUrl === path;
    }

    return currentUrl.startsWith(path);
}

/** Single nav link */
const NavLink: React.FC<{ item: NavItem; currentUrl: string }> = ({
    item,
    currentUrl,
}) => {
    if (!item.path) {
return null;
}

    const isActive = isActivePath(item.path, currentUrl);

    return (
        <Link
            href={item.path}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
        >
            {item.icon && (
                <item.icon
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}
                />
            )}
            <span>{item.label}</span>
            {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
        </Link>
    );
};

/** Group nav item (có children — expandable) */
const NavGroup: React.FC<{ item: NavItem; currentUrl: string }> = ({
    item,
    currentUrl,
}) => {
    const isAnyChildActive = item.children?.some(
        (child) => child.path && isActivePath(child.path, currentUrl),
    );
    const [open, setOpen] = useState(isAnyChildActive ?? false);

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isAnyChildActive
                        ? 'text-emerald-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
                {item.icon && (
                    <item.icon
                        className={`h-4 w-4 shrink-0 ${isAnyChildActive ? 'text-emerald-600' : 'text-gray-400'}`}
                    />
                )}
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                    className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Children list */}
            {open && (
                <div className="mt-0.5 ml-4 space-y-0.5 border-l border-gray-100 pl-3">
                    {item.children?.map((child) => {
                        if (!child.path) {
return null;
}

                        const isActive = isActivePath(child.path, currentUrl);

                        return (
                            <Link
                                key={child.path}
                                href={child.path}
                                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-all ${
                                    isActive
                                        ? 'font-semibold text-emerald-700'
                                        : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                <span
                                    className={`h-1 w-1 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                />
                                {child.label}
                            </Link>
                        );
                    })}
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
                    className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm md:hidden"
                    aria-hidden="true"
                />
            )}

            {/* Sidebar panel */}
            <aside
                className={`fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-white shadow-lg transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none ${
                    open ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Brand header */}
                <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm">
                        SAM
                    </div>
                    <div>
                        <div className="text-sm font-bold leading-tight text-gray-900">
                            Giáo dục Sam
                        </div>
                        <div className="text-[11px] text-gray-400">
                            Quản lý Giáo dục
                        </div>
                    </div>
                </div>

                {/* Account info block */}
                <div className="border-b border-gray-100 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                role === 'admin'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : role === 'center'
                                      ? 'bg-blue-100 text-blue-700'
                                      : role === 'teacher'
                                        ? 'bg-violet-100 text-violet-700'
                                        : 'bg-amber-100 text-amber-700'
                            }`}
                        >
                            {avatarChar}
                        </div>
                        <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-gray-900">
                                {fullName ?? 'Người dùng'}
                            </div>
                            <div className="text-[11px] text-gray-500">
                                {accountLabel}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
                    {navItems.map((item) =>
                        item.children ? (
                            <NavGroup
                                key={item.label}
                                item={item}
                                currentUrl={url}
                            />
                        ) : (
                            <NavLink
                                key={item.path ?? item.label}
                                item={item}
                                currentUrl={url}
                            />
                        ),
                    )}
                </nav>

                {/* Footer */}
                <div className="border-t border-gray-100 px-4 py-3 text-[10px] text-gray-400">
                    © 2026 Giáo dục Sam · v1.0
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
