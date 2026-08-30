import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';
import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'success' | 'edit' | 'danger' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    variant = 'success',
    size = 'md',
    isLoading = false,
    disabled,
    icon,
    type = 'button',
    ...props
}) => {
    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
    };

    const variantClasses = {
        success: 'btn-success',
        edit: 'btn-edit',
        danger: 'btn-danger',
        secondary: 'btn-secondary',
        outline: 'btn-outline',
    };

    return (
        <button
            type={type}
            disabled={disabled || isLoading}
            className={clsx(
                'btn-base inline-flex items-center justify-center gap-2 whitespace-nowrap',
                variantClasses[variant],
                sizeClasses[size],
                className,
            )}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : icon ? (
                <span className="shrink-0 inline-flex items-center">{icon}</span>
            ) : null}
            {children ? <span className="inline-flex items-center">{children}</span> : null}
        </button>
    );
};

export default Button;
