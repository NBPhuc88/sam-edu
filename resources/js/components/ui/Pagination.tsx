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

    const cleanParams = (params: Record<string, any>) => {
        const cleaned: Record<string, any> = {};
        Object.entries(params).forEach(([key, val]) => {
            if (val !== undefined && val !== null && val !== '' && val !== '') {
                cleaned[key] = val;
            }
        });
        return cleaned;
    };

    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = parseInt(e.target.value, 10);
        if (onPerPageChange) {
            onPerPageChange(newPerPage);
        } else {
            const params = cleanParams(currentParams);
            if (newPerPage !== 20) {
                params.per_page = newPerPage;
            } else {
                delete params.per_page;
            }
            router.get(
                window.location.pathname,
                params,
                { preserveState: true }
            );
        }
    };

    const cleanLinkUrl = (url: string | null): string | null => {
        if (!url) return null;
        try {
            const parsed = new URL(url, window.location.origin);

            // Build the set of keys controlled by currentParams
            const controlledKeys = new Set(
                currentParams ? Object.keys(currentParams) : []
            );

            // Merge search parameters from current URL — only for keys NOT controlled by currentParams
            if (typeof window !== 'undefined' && window.location.search) {
                const currentSearch = new URLSearchParams(window.location.search);
                currentSearch.forEach((value, key) => {
                    if (key !== 'page' && !parsed.searchParams.has(key) && !controlledKeys.has(key)) {
                        parsed.searchParams.set(key, value);
                    }
                });
            }

            // Merge currentParams — these always override (authoritative source of truth)
            if (currentParams && typeof currentParams === 'object') {
                Object.entries(currentParams).forEach(([key, val]) => {
                    if (key !== 'page') {
                        if (val !== undefined && val !== null && val !== '' && val !== '') {
                            parsed.searchParams.set(key, String(val));
                        } else {
                            // Explicitly remove params that currentParams says should not be present
                            parsed.searchParams.delete(key);
                        }
                    }
                });
            }

            const keysToDelete: string[] = [];
            parsed.searchParams.forEach((value, key) => {
                if (value === '' || value === 'null' || value === 'undefined') {
                    keysToDelete.push(key);
                }
            });
            keysToDelete.forEach((key) => parsed.searchParams.delete(key));
            return parsed.pathname + (parsed.search ? parsed.search : '');
        } catch {
            return url;
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
                {links.map((link, idx) => {
                    const cleanedUrl = cleanLinkUrl(link.url);
                    return cleanedUrl ? (
                        <Link
                            key={idx}
                            href={cleanedUrl}
                            preserveState
                            preserveScroll
                            className={`rounded-lg border px-3.5 py-1.5 text-sm font-semibold transition-colors ${link.active
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
                    );
                })}
            </div>
        </div>
    );
};

export default Pagination;
