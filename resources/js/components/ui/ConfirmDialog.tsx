import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, Trash2 } from 'lucide-react';
import Button from './Button';

export interface ConfirmDialogProps {
    isOpen: boolean;
    onClose?: () => void;
    onCancel?: () => void;
    onConfirm: () => void;
    title?: string;
    message: string | React.ReactNode;
    confirmText?: string;
    confirmLabel?: string;
    cancelText?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    variant?: 'danger' | 'warning' | 'info' | 'success';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onCancel,
    onConfirm,
    title,
    message,
    confirmText,
    confirmLabel,
    cancelText,
    cancelLabel,
    type,
    variant,
    isLoading = false,
    icon,
}) => {
    const handleClose = onClose || onCancel || (() => {});
    const resolvedConfirmText = confirmText || confirmLabel || 'Xác nhận';
    const resolvedCancelText = cancelText || cancelLabel || 'Hủy bỏ';
    const resolvedType = type || variant || 'danger';
    const config = {
        danger: {
            defaultTitle: 'Xác nhận xóa',
            iconBg: 'bg-red-100 text-red-600',
            confirmVariant: 'danger' as const,
            defaultIcon: <Trash2 className="w-6 h-6" />,
        },
        warning: {
            defaultTitle: 'Cảnh báo',
            iconBg: 'bg-amber-100 text-amber-600',
            confirmVariant: 'edit' as const,
            defaultIcon: <AlertTriangle className="w-6 h-6" />,
        },
        info: {
            defaultTitle: 'Thông báo',
            iconBg: 'bg-blue-100 text-blue-600',
            confirmVariant: 'success' as const,
            defaultIcon: <Info className="w-6 h-6" />,
        },
        success: {
            defaultTitle: 'Thành công',
            iconBg: 'bg-emerald-100 text-emerald-600',
            confirmVariant: 'success' as const,
            defaultIcon: <CheckCircle2 className="w-6 h-6" />,
        },
    }[resolvedType];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                    />

                    {/* Dialog Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: 'spring', duration: 0.25 }}
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-10 p-6"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl shrink-0 ${config.iconBg}`}>
                                {icon || config.defaultIcon}
                            </div>

                            <div className="space-y-1.5 flex-1 min-w-0">
                                <h3 className="text-base font-bold text-gray-900 leading-tight">
                                    {title || config.defaultTitle}
                                </h3>
                                <div className="text-sm text-gray-600 leading-relaxed">
                                    {message}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                {resolvedCancelText}
                            </Button>

                            <Button
                                type="button"
                                variant={config.confirmVariant}
                                size="md"
                                onClick={onConfirm}
                                isLoading={isLoading}
                            >
                                {resolvedConfirmText}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
