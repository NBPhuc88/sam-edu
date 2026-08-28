import { clsx } from 'clsx';
import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'active' | 'expired' | 'pending' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'active', className, ...props }) => {
    const variantClasses = {
        active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        expired: 'bg-amber-50 text-amber-700 border-amber-200',
        pending: 'bg-blue-50 text-blue-700 border-blue-200',
        danger: 'bg-red-50 text-red-700 border-red-200',
        info: 'bg-gray-50 text-gray-700 border-gray-200',
    };

    return (
        <span
            className={clsx(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                variantClasses[variant],
                className
            )}
            {...props}
        >
            {children}
        </span>
    );
};

export default Badge;
