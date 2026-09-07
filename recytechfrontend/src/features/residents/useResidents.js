import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../context/ToastContext';

export const useResidents = () => {
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const { showToast } = useToast();

    const fetchResidents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/residents', { params: { limit: 1000 } });
            setResidents(res.data.residents || res.data || []);
        } catch (error) {
            console.error('Error fetching residents:', error);
            showToast('Failed to fetch registered users.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchResidents();
    }, [fetchResidents]);

    const filteredResidents = residents.filter((resident) => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = (
            resident.email?.toLowerCase().includes(search) ||
            resident.firstName?.toLowerCase().includes(search) ||
            resident.lastName?.toLowerCase().includes(search) ||
            resident.phone?.toLowerCase().includes(search)
        );
        const matchesStatus = statusFilter ? resident.status === statusFilter : true;
        return matchesSearch && matchesStatus;
    });

    const { currentData: paginatedResidents, currentPage, totalPages, setPage } = usePagination(filteredResidents, 10);

    return {
        loading, 
        searchTerm, setSearchTerm, 
        statusFilter, setStatusFilter, 
        filteredResidents, paginatedResidents, 
        fetchResidents,
        currentPage, totalPages, setPage
    };
};