import React, { useEffect } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    isOpen: boolean;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'info',
    isOpen,
    onClose,
    duration = 4000,
}) => {
    useEffect(() => {
        if (isOpen && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen) {
        return null;
    }

    const typeStyles = {
        success: {
            bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
        },
        error: {
            bg: 'bg-red-50 border-red-200 text-red-800',
            icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
        },
        warning: {
            bg: 'bg-amber-50 border-amber-200 text-amber-800',
            icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        },
        info: {
            bg: 'bg-blue-50 border-blue-200 text-blue-800',
            icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
        },
    };

    const currentStyle = typeStyles[type];

    return (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200 max-w-md">
            <div
                className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all',
                    currentStyle.bg
                )}
            >
                {currentStyle.icon}
                <p className="text-sm font-medium leading-relaxed">{message}</p>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
