import { useState, useEffect } from 'react';
import api from '../../api/client';

export const usePayoutHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });

    const fetchTransactions = async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/transactions?page=${page}&limit=10`);
            setTransactions(res.data.transactions || res.data || []);
            if (res.data.pagination) setPagination(res.data.pagination);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(pagination.page); }, [pagination.page]);

    const filteredTransactions = transactions.filter(t => 
        t.resident?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return { loading, searchTerm, setSearchTerm, pagination, setPagination, filteredTransactions };
};