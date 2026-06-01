import { useState, useEffect } from 'react';
import api from '../../api/client';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';

export const useCollectors = () => {
    const [collectors, setCollectors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const { page, limit, pages, total, goToPage, updatePaginationInfo, hasNextPage, hasPrevPage } = usePagination(1, 10);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const fetchCollectors = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/collectors');
            setCollectors(data);
        } catch (error) {
            console.error("Error fetching collectors", error);
            setError(error.message || "Failed to fetch collectors");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCollectors();
    }, []);

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setVehicleTypeFilter('');
    };

    const filteredCollectors = collectors.filter(c => {
        const matchesSearch = c.firstName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                             c.lastName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                             c.vehiclePlate.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const matchesStatus = statusFilter ? c.status === statusFilter : true;
        const matchesVehicleType = vehicleTypeFilter ? c.vehicleType === vehicleTypeFilter : true;
        return matchesSearch && matchesStatus && matchesVehicleType;
    });

    // Update pagination metadata whenever the filtered list changes
    useEffect(() => {
        updatePaginationInfo({
            total: filteredCollectors.length,
            pages: Math.ceil(filteredCollectors.length / limit) || 1
        });
    }, [filteredCollectors.length, limit, updatePaginationInfo]);

    // Apply pagination slice for client-side rendering
    const paginatedCollectors = filteredCollectors.slice((page - 1) * limit, page * limit);

    return {
        collectors, filteredCollectors, fetchCollectors,
        paginatedCollectors,
        isLoading, error,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        vehicleTypeFilter, setVehicleTypeFilter,
        handleClearFilters,
        page, limit, pages, total, goToPage, hasNextPage, hasPrevPage
    };
};