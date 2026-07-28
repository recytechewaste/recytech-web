import { useState, useEffect } from 'react';
import api from '../../api/client';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';

export const useEducation = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const { page, limit, pages, total, goToPage, updatePaginationInfo, hasNextPage, hasPrevPage } = usePagination([], 1, 8); // Pass empty array to prevent crash
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const fetchMaterials = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const res = await api.get('/education');
            setMaterials(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error fetching materials", error);
            setFetchError("Unable to connect to the server. Please ensure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const filteredMaterials = materials.filter(m => 
        m?.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) &&
        (categoryFilter === '' || m?.category === categoryFilter)
    );

    // Sync client-side filtered data length with pagination hook
    useEffect(() => {
        updatePaginationInfo({
            total: filteredMaterials.length,
            pages: Math.ceil(filteredMaterials.length / limit) || 1
        });
    }, [filteredMaterials.length, limit, updatePaginationInfo]);

    const paginatedMaterials = filteredMaterials.slice((page - 1) * limit, page * limit);

    return {
        materials, filteredMaterials, loading, fetchError, fetchMaterials,
        paginatedMaterials,
        searchTerm, setSearchTerm, categoryFilter, setCategoryFilter,
        page, limit, pages, total, goToPage, hasNextPage, hasPrevPage
    };
};