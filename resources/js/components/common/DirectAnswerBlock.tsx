import React from 'react';

export interface TableColumn {
    key: string;
    header: string;
}

export interface DirectAnswerBlockProps {
    title: string;
    summary: string;
    keyTakeaways?: string[];
    tableData?: {
        columns: TableColumn[];
        rows: Record<string, string | number>[];
    };
    className?: string;
}

export const DirectAnswerBlock: React.FC<DirectAnswerBlockProps> = ({
    title,
    summary,
    keyTakeaways = [],
    tableData,
    className = '',
}) => {
    return (
        <section
            aria-label={title}
            className={`my-6 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-600 rounded-r-xl shadow-sm ${className}`}
        >
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <svg
                    className="w-5 h-5 text-emerald-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
                <span>{title}</span>
            </h3>

            {/* Direct Answer Summary Box (40-60 words format for AI Overviews) */}
            <p className="text-slate-800 text-sm md:text-base leading-relaxed font-medium mb-3">
                {summary}
            </p>

            {/* Key Bullet Points List */}
            {keyTakeaways.length > 0 && (
                <ul className="space-y-1.5 mb-3 text-sm text-slate-700">
                    {keyTakeaways.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{point}</span>
                        </li>
                    ))}
                </ul>
            )}

            {/* Structured Table (Parsed by Googlebot & AI LLMs) */}
            {tableData && tableData.columns.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                        <thead className="bg-slate-100 font-semibold text-slate-700">
                            <tr>
                                {tableData.columns.map((col) => (
                                    <th key={col.key} className="px-4 py-2">
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                            {tableData.rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-slate-50">
                                    {tableData.columns.map((col) => (
                                        <td key={col.key} className="px-4 py-2">
                                            {row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
};

export default DirectAnswerBlock;
