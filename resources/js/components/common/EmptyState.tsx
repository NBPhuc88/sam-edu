import { Inbox } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
}

export default function EmptyState({
    title = 'Chưa có dữ liệu',
    description = 'Hiện tại chưa có dữ liệu nào trong danh sách này.',
    icon,
    action,
    className = '',
}: Props) {
    return (
        <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-gray-300 bg-slate-50/50 ${className}`}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-gray-200 text-gray-400 shadow-2xs mb-4">
                {icon || <Inbox className="h-7 w-7" />}
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">
                {title}
            </h3>

            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
                {description}
            </p>

            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    );
}
