import React, { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from '@inertiajs/react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface Props {
    title: string;
    subtitle?: string;
    breadcrumbs?: BreadcrumbItem[];
    actions?: ReactNode;
    badge?: ReactNode;
}

export default function PageHeader({
    title,
    subtitle,
    breadcrumbs,
    actions,
    badge,
}: Props) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="space-y-1">
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                        {breadcrumbs.map((item, idx) => {
                            const isLast = idx === breadcrumbs.length - 1;
                            return (
                                <React.Fragment key={idx}>
                                    {idx > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
                                    {item.href && !isLast ? (
                                        <Link
                                            href={item.href}
                                            className="hover:text-emerald-700 transition-colors font-medium"
                                        >
                                            {item.label}
                                        </Link>
                                    ) : (
                                        <span className={isLast ? 'text-gray-900 font-semibold' : ''}>
                                            {item.label}
                                        </span>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </nav>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                        {title}
                    </h1>
                    {badge}
                </div>

                {subtitle && (
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">
                        {subtitle}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
