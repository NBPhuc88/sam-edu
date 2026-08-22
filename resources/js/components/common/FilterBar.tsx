import React, { ReactNode } from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Props {
    search?: string;
    onSearchChange?: (val: string) => void;
    searchPlaceholder?: string;
    filters?: ReactNode;
    onReset?: () => void;
    isFiltering?: boolean;
    actions?: ReactNode;
}

export default function FilterBar({
    search,
    onSearchChange,
    searchPlaceholder = 'Tìm kiếm nhanh...',
    filters,
    onReset,
    isFiltering = false,
    actions,
}: Props) {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs space-y-3 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Search & Custom Filter Inputs */}
                <div className="flex flex-1 flex-wrap items-center gap-3">
                    {onSearchChange !== undefined && (
                        <div className="relative min-w-[240px] flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={search || ''}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full rounded-xl border border-gray-300 bg-slate-50/50 pl-10 pr-4 py-2 text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all"
                            />
                        </div>
                    )}

                    {filters}

                    {onReset && isFiltering && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Đặt lại</span>
                        </button>
                    )}
                </div>

                {/* Right Side Extra Actions */}
                {actions && (
                    <div className="flex items-center gap-2 shrink-0">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
