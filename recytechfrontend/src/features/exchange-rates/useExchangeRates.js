import { useState, useEffect } from 'react';
import api from '../../api/client';
import { usePagination } from '../../hooks/usePagination';

export const useExchangeRates = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const { page, limit, pages, total, goToPage, updatePaginationInfo, hasNextPage, hasPrevPage } = usePagination(1, 10);

    const fetchRates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/exchange-rates', { params: { includeInactive: true } });
            setRates(res.data.rates || []);
        } catch (error) {
            console.error("Error fetching exchange rates:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);
    
    // Sync total counts
    useEffect(() => {
        updatePaginationInfo({
            total: rates.length,
            pages: Math.ceil(rates.length / limit) || 1
        });
    }, [rates.length, limit, updatePaginationInfo]);
    
    // Create the page slice
    const paginatedRates = rates.slice((page - 1) * limit, page * limit);

    return { rates, paginatedRates, loading, fetchRates,
             page, limit, pages, total, goToPage, hasNextPage, hasPrevPage };
};