import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';

export const useRequests = (itemsPerPage = 10) => {
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter and search state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);

    const fetchRequests = useCallback(async (page, limit, search, status, type) => {
        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page,
                limit,
                search,
                status,
                type,
            });
            const response = await api.get(`/requests?${params.toString()}`);

            setRequests(Array.isArray(response.data.requests) ? response.data.requests : []);
            setTotalPages(response.data.totalPages || 1);
            setTotalRequests(response.data.totalRequests || 0);
            setCurrentPage(response.data.currentPage || 1);

        } catch (err) {
            console.error("Error fetching collection requests:", err);
            setError("Failed to fetch collection requests. Please ensure the server is running and you are logged in.");
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests(currentPage, itemsPerPage, debouncedSearchTerm, statusFilter, typeFilter);
    }, [fetchRequests, currentPage, itemsPerPage, debouncedSearchTerm, statusFilter, typeFilter]);

    const setPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setTypeFilter('');
        setCurrentPage(1);
    };

    return { 
        requests, 
        isLoading, 
        error,
        paginatedRequests: requests, // For compatibility with older components if needed

        // Filters
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        typeFilter, setTypeFilter,
        handleClearFilters,

        // Pagination
        currentPage,
        totalPages,
        totalRequests,
        setPage,

        refetchRequests: () => fetchRequests(currentPage, itemsPerPage, debouncedSearchTerm, statusFilter, typeFilter) 
    };
};