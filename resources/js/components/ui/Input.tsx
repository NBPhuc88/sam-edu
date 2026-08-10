import React from 'react';
import { clsx } from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className, id, ...props }, ref) => {
        const inputId = id || props.name;

        return (
            <div className="w-full flex flex-col gap-1.5">
                {label && (
                    <label htmlFor={inputId} className="text-sm font-medium text-gray-900">
                        {label}
                    </label>
                )}
                <div className="relative flex items-center">
                    {icon && <div className="absolute left-3 text-gray-400 pointer-events-none">{icon}</div>}
                    <input
                        id={inputId}
                        ref={ref}
                        className={clsx(
                            'ui-input',
                            icon && 'pl-10',
                            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && <span className="text-xs font-medium text-red-600">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
