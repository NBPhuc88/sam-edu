import React from 'react';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
    columns,
    data,
    emptyMessage = 'Không có dữ liệu',
}: DataTableProps<T>) {
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="ui-table">
                <thead>
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx}>{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                {columns.map((col, colIdx) => (
                                    <td key={colIdx}>
                                        {col.cell
                                            ? col.cell(row)
                                            : col.accessorKey
                                              ? (row[col.accessorKey] as React.ReactNode)
                                              : null}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-8 text-gray-500 text-sm">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default DataTable;
