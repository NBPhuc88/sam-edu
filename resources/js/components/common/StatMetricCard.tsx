import React, { ReactNode } from 'react';
import Card from '@/components/ui/Card';

interface Props {
    title: string;
    value: string | number;
    icon: ReactNode;
    iconBgColor?: string;
    iconTextColor?: string;
    changeText?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    subtitle?: string;
}

export default function StatMetricCard({
    title,
    value,
    icon,
    iconBgColor = 'bg-emerald-50',
    iconTextColor = 'text-emerald-700',
    changeText,
    changeType = 'neutral',
    subtitle,
}: Props) {
    return (
        <Card className="p-5 border border-gray-200 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                    <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 block">
                        {title}
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                        {value}
                    </div>

                    {(changeText || subtitle) && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold pt-1">
                            {changeText && (
                                <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-2xs font-bold ${
                                        changeType === 'positive'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : changeType === 'negative'
                                            ? 'bg-rose-100 text-rose-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                    {changeText}
                                </span>
                            )}
                            {subtitle && <span className="text-gray-500">{subtitle}</span>}
                        </div>
                    )}
                </div>

                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBgColor} ${iconTextColor} shadow-2xs`}>
                    {icon}
                </div>
            </div>
        </Card>
    );
}
