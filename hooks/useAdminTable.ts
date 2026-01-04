// =============================================
// useAdminTable Hook - خطاف إدارة جداول Admin
// =============================================

import { useState, useMemo, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface UseAdminTableOptions<T> {
    data: T[];
    itemsPerPage?: number;
    searchFields?: (keyof T)[];
    initialFilters?: Record<string, string>;
}

export interface UseAdminTableReturn<T> {
    // Data
    filteredData: T[];
    paginatedData: T[];
    totalItems: number;

    // Search
    search: string;
    setSearch: (value: string) => void;

    // Pagination
    currentPage: number;
    totalPages: number;
    setPage: (page: number) => void;
    goToNextPage: () => void;
    goToPrevPage: () => void;

    // Filters
    filters: Record<string, string>;
    setFilter: (key: string, value: string) => void;
    clearFilters: () => void;

    // Selection (optional)
    selectedIds: Set<string>;
    toggleSelect: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    isSelected: (id: string) => boolean;

    // Modal states
    editModalOpen: boolean;
    deleteModalOpen: boolean;
    selectedItem: T | null;
    openEditModal: (item: T) => void;
    closeEditModal: () => void;
    openDeleteModal: (item: T) => void;
    closeDeleteModal: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// HOOK IMPLEMENTATION
// ═══════════════════════════════════════════════════════════════════════════

export function useAdminTable<T extends { id: string }>({
    data,
    itemsPerPage = 10,
    searchFields = [],
    initialFilters = {},
}: UseAdminTableOptions<T>): UseAdminTableReturn<T> {
    // Search state
    const [search, setSearch] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);

    // Filters state
    const [filters, setFilters] = useState<Record<string, string>>(initialFilters);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Modal states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<T | null>(null);

    // ═══════════════════════════════════════════════════════════════════════
    // COMPUTED VALUES
    // ═══════════════════════════════════════════════════════════════════════

    const filteredData = useMemo(() => {
        return data.filter((item) => {
            // Search filter
            if (search && searchFields.length > 0) {
                const searchLower = search.toLowerCase();
                const matchesSearch = searchFields.some((field) => {
                    const value = item[field];
                    if (typeof value === 'string') {
                        return value.toLowerCase().includes(searchLower);
                    }
                    return false;
                });
                if (!matchesSearch) return false;
            }

            // Custom filters
            for (const [key, filterValue] of Object.entries(filters)) {
                if (filterValue && filterValue !== 'all') {
                    const itemValue = item[key as keyof T];
                    if (String(itemValue) !== filterValue) {
                        return false;
                    }
                }
            }

            return true;
        });
    }, [data, search, searchFields, filters]);

    const totalPages = useMemo(() =>
        Math.ceil(filteredData.length / itemsPerPage),
        [filteredData.length, itemsPerPage]
    );

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    // ═══════════════════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════════════════

    const setPage = useCallback((page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    }, [totalPages]);

    const goToNextPage = useCallback(() => {
        setPage(currentPage + 1);
    }, [currentPage, setPage]);

    const goToPrevPage = useCallback(() => {
        setPage(currentPage - 1);
    }, [currentPage, setPage]);

    const setFilter = useCallback((key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset to first page when filter changes
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
        setSearch('');
        setCurrentPage(1);
    }, []);

    // Selection actions
    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(paginatedData.map((item) => item.id)));
    }, [paginatedData]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isSelected = useCallback((id: string) => {
        return selectedIds.has(id);
    }, [selectedIds]);

    // Modal actions
    const openEditModal = useCallback((item: T) => {
        setSelectedItem(item);
        setEditModalOpen(true);
    }, []);

    const closeEditModal = useCallback(() => {
        setEditModalOpen(false);
        setSelectedItem(null);
    }, []);

    const openDeleteModal = useCallback((item: T) => {
        setSelectedItem(item);
        setDeleteModalOpen(true);
    }, []);

    const closeDeleteModal = useCallback(() => {
        setDeleteModalOpen(false);
        setSelectedItem(null);
    }, []);

    // Reset page when search changes
    const handleSearch = useCallback((value: string) => {
        setSearch(value);
        setCurrentPage(1);
    }, []);

    return {
        // Data
        filteredData,
        paginatedData,
        totalItems: filteredData.length,

        // Search
        search,
        setSearch: handleSearch,

        // Pagination
        currentPage,
        totalPages,
        setPage,
        goToNextPage,
        goToPrevPage,

        // Filters
        filters,
        setFilter,
        clearFilters,

        // Selection
        selectedIds,
        toggleSelect,
        selectAll,
        clearSelection,
        isSelected,

        // Modals
        editModalOpen,
        deleteModalOpen,
        selectedItem,
        openEditModal,
        closeEditModal,
        openDeleteModal,
        closeDeleteModal,
    };
}
