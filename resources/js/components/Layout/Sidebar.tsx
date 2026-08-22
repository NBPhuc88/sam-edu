import { Link, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { getNavigationItems } from '../../config/navigation';
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

/** Single top-level nav link */
const TopNavLink: React.FC<{
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
            className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                active
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
        >
            {Icon && (
                <Icon
                    className={`h-4.5 w-4.5 shrink-0 transition-transform duration-150 ${
                        active ? 'text-white' : 'text-gray-500 group-hover:text-gray-800'
                    }`}
                />
            )}
            <span className="truncate">{item.label}</span>
        </Link>
    );
};

/** Sub nav link inside an expandable group */
const SubNavLink: React.FC<{
    item: NavItem;
    currentUrl: string;
    onClose?: () => void;
}> = ({ item, currentUrl, onClose }) => {
    const active = item.path ? isActivePath(item.path, currentUrl) : false;

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
            className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all ${
                active
                    ? 'bg-emerald-50 text-emerald-800 font-bold border-l-2 border-emerald-600 pl-2.5'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
            }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full transition-colors shrink-0 ${
                    active
                        ? 'bg-emerald-600'
                        : 'bg-gray-300 group-hover:bg-gray-400'
                }`}
            />
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

    // Keep expanded if URL changes to a child
    useEffect(() => {
        if (groupActive) {
            setExpanded(true);
        }
    }, [groupActive]);

    return (
        <div className="space-y-0.5">
            <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                    groupActive
                        ? 'text-emerald-900 bg-emerald-50/60 font-bold'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <Icon
                            className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                                groupActive ? 'text-emerald-600' : 'text-gray-500 group-hover:text-gray-800'
                            }`}
                        />
                    )}
                    <span>{item.label}</span>
                </div>
                <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                        expanded
                            ? 'rotate-180 text-emerald-600'
                            : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                />
            </button>

            {expanded && item.children && (
                <div className="my-1 ml-4 border-l border-gray-200 pl-2 space-y-0.5 py-0.5">
                    {item.children.map((child) => (
                        <SubNavLink
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
    const { url, props } = usePage<any>();
    const permissions: string[] = props.auth?.permissions || [];
    const navItems = getNavigationItems(role, adminRole, permissions);

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
                } fixed inset-y-0 left-0 z-40 h-full shadow-xl md:sticky md:top-0 md:h-screen md:z-auto md:shadow-none ${
                    open
                        ? 'translate-x-0'
                        : '-translate-x-full md:translate-x-0'
                }`}
            >
                {/* Fixed width container to prevent text warping during transition */}
                <div className="flex h-full w-64 flex-col justify-between">
                    {/* Top Section: Brand header */}
                    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-sm font-black text-white shadow-xs">
                            SAM
                        </div>
                        <div>
                            <div className="text-sm leading-tight font-extrabold text-gray-900">
                                Giáo dục Sam
                            </div>
                            <div className="text-2xs text-gray-400 font-medium">
                                Quản lý Giáo dục
                            </div>
                        </div>
                    </div>

                    {/* Middle Section: Navigation scrollable list */}
                    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
                        {navItems.map((item) =>
                            item.children ? (
                                <NavGroup
                                    key={item.label}
                                    item={item}
                                    currentUrl={url}
                                    onClose={onClose}
                                />
                            ) : (
                                <TopNavLink
                                    key={item.path ?? item.label}
                                    item={item}
                                    currentUrl={url}
                                    onClose={onClose}
                                />
                            ),
                        )}
                    </nav>

                    {/* Bottom Section: Footer pinned to bottom */}
                    <div className="shrink-0 border-t border-gray-100 px-4 py-3 text-2xs text-gray-400">
                        © 2026 Giáo dục Sam · v1.0
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
