import { clsx } from 'clsx';
import { AnimatePresence,motion } from 'framer-motion';
import { X } from 'lucide-react';
import React from 'react';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | string;
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = 'lg',
    className = '',
}) => {
    const maxWidthClasses: Record<string, string> = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl',
        'max-w-sm': 'max-w-sm',
        'max-w-md': 'max-w-md',
        'max-w-lg': 'max-w-lg',
        'max-w-xl': 'max-w-xl',
        'max-w-2xl': 'max-w-2xl',
        'max-w-3xl': 'max-w-3xl',
        'max-w-4xl': 'max-w-4xl',
        'max-w-5xl': 'max-w-5xl',
    };

    const resolvedMaxWidth = maxWidthClasses[maxWidth] || (typeof maxWidth === 'string' && maxWidth.startsWith('max-w-') ? maxWidth : 'max-w-lg');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs"
                    />

                    {/* Modal Content Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', duration: 0.3 }}
                        className={clsx(
                            'relative w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-10 my-8',
                            resolvedMaxWidth,
                            className,
                        )}
                    >
                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100 bg-slate-50/50">
                                <h3 className="text-base font-bold text-gray-900">{title}</h3>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-700 rounded-lg p-1.5 hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}

                        {/* Body */}
                        <div className="p-6">{children}</div>

                        {/* Footer */}
                        {footer && (
                            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50/80 border-t border-gray-100">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
