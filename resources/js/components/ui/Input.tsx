import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    showPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            icon,
            rightIcon,
            showPasswordToggle,
            className,
            id,
            type,
            ...props
        },
        ref
    ) => {
        const inputId = id || props.name;
        const [showPassword, setShowPassword] = useState(false);

        const isPasswordField = type === 'password';
        const enablePasswordToggle =
            isPasswordField && showPasswordToggle !== false;
        const effectiveType = enablePasswordToggle
            ? showPassword
                ? 'text'
                : 'password'
            : type;
        const hasRightElement = enablePasswordToggle || Boolean(rightIcon);

        return (
            <div className="w-full flex flex-col gap-1.5">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-sm font-medium text-gray-900"
                    >
                        {label}
                    </label>
                )}
                <div className="relative flex items-center w-full">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10 flex items-center justify-center">
                            {icon}
                        </div>
                    )}
                    <input
                        id={inputId}
                        ref={ref}
                        type={effectiveType}
                        className={clsx(
                            'ui-input',
                            icon && '!pl-10 has-icon',
                            hasRightElement && '!pr-10',
                            error &&
                                'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                            className
                        )}
                        {...props}
                    />
                    {enablePasswordToggle ? (
                        <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-md transition-colors"
                            title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    ) : rightIcon ? (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10 flex items-center justify-center">
                            {rightIcon}
                        </div>
                    ) : null}
                </div>
                {error && (
                    <span className="text-xs font-medium text-red-600">
                        {error}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
