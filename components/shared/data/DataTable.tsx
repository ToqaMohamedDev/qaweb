/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                       DATA TABLE - جدول البيانات                         ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// 1. TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Column<T> {
    key: string;
    header: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (value: unknown, row: T, index: number) => React.ReactNode;
    sortable?: boolean;
}

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyField: keyof T;
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
    selectedRows?: string[];
    onSelectRow?: (id: string, selected: boolean) => void;
    onSelectAll?: (selected: boolean) => void;
    selectable?: boolean;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (field: string) => void;
    className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function DataTable<T extends Record<string, unknown>>({
    columns,
    data,
    keyField,
    isLoading,
    emptyMessage = 'لا توجد بيانات',
    onRowClick,
    selectedRows = [],
    onSelectRow,
    onSelectAll,
    selectable = false,
    sortField,
    sortOrder,
    onSort,
    className = '',
}: DataTableProps<T>) {
    const allSelected = data.length > 0 && selectedRows.length === data.length;
    const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

    return (
        <div className={`data-table-container ${className}`}>
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            {selectable && (
                                <th className="data-table-checkbox-cell">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={el => {
                                            if (el) el.indeterminate = someSelected;
                                        }}
                                        onChange={(e) => onSelectAll?.(e.target.checked)}
                                        className="data-table-checkbox"
                                    />
                                </th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    style={{ width: column.width }}
                                    className={`data-table-header-cell ${column.align ? `text-${column.align}` : ''} ${column.sortable ? 'sortable' : ''}`}
                                    onClick={() => column.sortable && onSort?.(column.key)}
                                >
                                    <span className="header-content">
                                        {column.header}
                                        {column.sortable && sortField === column.key && (
                                            <span className="sort-indicator">
                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="data-table-loading">
                                    <div className="spinner"></div>
                                    <span>جاري التحميل...</span>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} className="data-table-empty">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => {
                                const rowId = String(row[keyField]);
                                const isSelected = selectedRows.includes(rowId);

                                return (
                                    <tr
                                        key={rowId}
                                        className={`data-table-row ${isSelected ? 'selected' : ''} ${onRowClick ? 'clickable' : ''}`}
                                        onClick={() => onRowClick?.(row)}
                                    >
                                        {selectable && (
                                            <td className="data-table-checkbox-cell">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        onSelectRow?.(rowId, e.target.checked);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="data-table-checkbox"
                                                />
                                            </td>
                                        )}
                                        {columns.map((column) => (
                                            <td
                                                key={column.key}
                                                className={`data-table-cell ${column.align ? `text-${column.align}` : ''}`}
                                            >
                                                {column.render
                                                    ? column.render(row[column.key], row, index)
                                                    : String(row[column.key] ?? '')
                                                }
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .data-table-container {
                    background-color: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.75rem;
                    overflow: hidden;
                }
                
                :global(.dark) .data-table-container {
                    background-color: #1f2937;
                    border-color: #374151;
                }
                
                .data-table-wrapper {
                    overflow-x: auto;
                }
                
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }
                
                .data-table thead {
                    background-color: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                :global(.dark) .data-table thead {
                    background-color: #111827;
                    border-color: #374151;
                }
                
                .data-table-header-cell {
                    padding: 0.75rem 1rem;
                    font-weight: 600;
                    color: #6b7280;
                    text-align: right;
                    white-space: nowrap;
                }
                
                :global(.dark) .data-table-header-cell {
                    color: #9ca3af;
                }
                
                .data-table-header-cell.sortable {
                    cursor: pointer;
                    user-select: none;
                }
                
                .data-table-header-cell.sortable:hover {
                    color: #3b82f6;
                }
                
                .header-content {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                
                .sort-indicator {
                    font-size: 0.75rem;
                }
                
                .data-table-checkbox-cell {
                    width: 3rem;
                    padding: 0.75rem;
                    text-align: center;
                }
                
                .data-table-checkbox {
                    width: 1rem;
                    height: 1rem;
                    cursor: pointer;
                    accent-color: #3b82f6;
                }
                
                .data-table-row {
                    border-bottom: 1px solid #e5e7eb;
                    transition: background-color 0.15s ease;
                }
                
                :global(.dark) .data-table-row {
                    border-color: #374151;
                }
                
                .data-table-row:last-child {
                    border-bottom: none;
                }
                
                .data-table-row:hover {
                    background-color: #f9fafb;
                }
                
                :global(.dark) .data-table-row:hover {
                    background-color: #111827;
                }
                
                .data-table-row.selected {
                    background-color: rgba(59, 130, 246, 0.05);
                }
                
                :global(.dark) .data-table-row.selected {
                    background-color: rgba(59, 130, 246, 0.1);
                }
                
                .data-table-row.clickable {
                    cursor: pointer;
                }
                
                .data-table-cell {
                    padding: 0.75rem 1rem;
                    color: #1f2937;
                }
                
                :global(.dark) .data-table-cell {
                    color: #f9fafb;
                }
                
                .text-left { text-align: left; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                
                .data-table-loading,
                .data-table-empty {
                    padding: 3rem;
                    text-align: center;
                    color: #6b7280;
                }
                
                .data-table-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                }
                
                .spinner {
                    width: 2rem;
                    height: 2rem;
                    border: 3px solid #e5e7eb;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
