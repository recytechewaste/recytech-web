import { useState, useEffect } from 'react';
import api from '../../api/client';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';

export const useCollectors = () => {
    const [collectors, setCollectors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const fetchCollectors = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get('/collectors');
            setCollectors(data || []);
        } catch (error) {
            console.error("Error fetching collectors", error);
            setError(error.message || "Failed to fetch collectors");
        } finally {
            setLoading(false);
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

    const { currentData: paginatedCollectors, currentPage, totalPages, setPage } = usePagination(filteredCollectors, 10);

    return {
        collectors, 
        filteredCollectors, 
        fetchCollectors,
        paginatedCollectors,
        loading, 
        error,
        searchTerm, 
        setSearchTerm,
        statusFilter, 
        setStatusFilter,
        vehicleTypeFilter, 
        setVehicleTypeFilter,
        handleClearFilters,
        currentPage, 
        totalPages, 
        setPage,
    };
};