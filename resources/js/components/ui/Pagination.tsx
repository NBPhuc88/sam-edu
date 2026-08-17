import { Link, router } from '@inertiajs/react';
import React from 'react';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginationProps {
    links: PaginationLink[];
    from?: number | null;
    to?: number | null;
    total: number;
    perPage?: number;
    onPerPageChange?: (perPage: number) => void;
    currentParams?: Record<string, any>;
    routeName?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
    links,
    from,
    to,
    total,
    perPage = 20,
    onPerPageChange,
    currentParams = {},
}) => {
    if (!links || links.length <= 1) {
        return null;
    }

    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = parseInt(e.target.value, 10);
        if (onPerPageChange) {
            onPerPageChange(newPerPage);
        } else {
            router.get(
                window.location.pathname,
                { ...currentParams, per_page: newPerPage, page: 1 },
                { preserveState: true }
            );
        }
    };

    return (
        <div className="flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
            <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>
                    Hiển thị <strong>{from ?? (total > 0 ? 1 : 0)}</strong> - <strong>{to ?? total}</strong> trên tổng số <strong>{total}</strong> bản ghi
                </span>

                <div className="flex items-center gap-1.5 ml-2">
                    <label htmlFor="per-page-select" className="text-xs text-gray-400">
                        Hiển thị:
                    </label>
                    <select
                        id="per-page-select"
                        value={perPage}
                        onChange={handlePerPageChange}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 shadow-2xs focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span className="text-xs text-gray-400">/ trang</span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                {links.map((link, idx) =>
                    link.url ? (
                        <Link
                            key={idx}
                            href={link.url}
                            className={`rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                                link.active
                                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                            dangerouslySetInnerHTML={{
                                __html: link.label,
                            }}
                        />
                    ) : (
                        <span
                            key={idx}
                            className="cursor-not-allowed rounded-lg border border-gray-100 bg-gray-50 px-3.5 py-1.5 text-sm font-semibold text-gray-400"
                            dangerouslySetInnerHTML={{
                                __html: link.label,
                            }}
                        />
                    )
                )}
            </div>
        </div>
    );
};

export default Pagination;
