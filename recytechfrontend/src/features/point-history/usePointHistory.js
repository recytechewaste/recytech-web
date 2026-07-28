import { useState, useEffect } from 'react';
import api from '../../api/client';
import { usePagination } from '../../hooks/usePagination';

export const usePointHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const { page, limit, pages, total, goToPage, updatePaginationInfo, hasNextPage, hasPrevPage } = usePagination(1, 10);

    const fetchTransactions = async (currentPage) => {
        setLoading(true);
        try {
            const res = await api.get(`/transactions?page=${currentPage}&limit=${limit}`);
            setTransactions(res.data.transactions || res.data || []);
            
            // Update the hook's internal tracking with the API response
            updatePaginationInfo(res.data.pagination);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(page); }, [page, limit]);

    const filteredTransactions = transactions.filter(t => 
        t.resident?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return { 
        loading, 
        searchTerm, setSearchTerm, 
        filteredTransactions,
        // Pagination exports
        page, limit, pages, total, 
        goToPage, hasNextPage, hasPrevPage 
    };
};