import { useState, useCallback } from 'react';

export const usePagination = (initialPage = 1, initialLimit = 10) => {
    const [pagination, setPagination] = useState({
        page: initialPage,
        limit: initialLimit,
        total: 0,
        pages: 1
    });

    const goToPage = useCallback((newPage) => {
        setPagination((prev) => {
            if (newPage < 1 || newPage > prev.pages) return prev;
            return { ...prev, page: newPage };
        });
    }, []);

    const updatePaginationInfo = useCallback((apiPaginationData) => {
        if (apiPaginationData) {
            setPagination((prev) => {
                const nextPages = apiPaginationData.pages !== undefined ? apiPaginationData.pages : prev.pages;
                // If filters reduce the total pages below our current page, safely fallback to the max available page
                const safePage = prev.page > nextPages && nextPages > 0 ? nextPages : prev.page;
                
                return { ...prev, ...apiPaginationData, page: safePage };
            });
        }
    }, []);

    return {
        ...pagination,
        goToPage,
        updatePaginationInfo,
        hasNextPage: pagination.page < pagination.pages,
        hasPrevPage: pagination.page > 1
    };
};