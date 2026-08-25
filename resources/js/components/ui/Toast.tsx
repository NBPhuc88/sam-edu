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
            bg: 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-900/15',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
        },
        error: {
            bg: 'bg-red-50/95 border-red-300 text-red-950 shadow-red-900/15',
            icon: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
        },
        warning: {
            bg: 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-900/15',
            icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        },
        info: {
            bg: 'bg-blue-50/95 border-blue-300 text-blue-950 shadow-blue-900/15',
            icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
        },
    };

    const currentStyle = typeStyles[type];

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
            <div
                className={clsx(
                    'pointer-events-auto flex items-center justify-between gap-3 px-5 py-3.5 rounded-xl border shadow-xl transition-all backdrop-blur-xs',
                    currentStyle.bg
                )}
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {currentStyle.icon}
                    <p className="text-sm font-semibold leading-relaxed text-gray-900">{message}</p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-black/5 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;
