import { useState, useEffect } from 'react';
import api from '../../api/client';
import { usePagination } from '../../hooks/usePagination';

export const useResidents = () => {
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const { page, limit, pages, total, goToPage, updatePaginationInfo, hasNextPage, hasPrevPage } = usePagination(1, 10);

    const fetchResidents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/residents', { params: { limit: 1000 } });
            setResidents(res.data.residents || res.data || []);
        } catch (error) {
            console.error('Error fetching residents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResidents();
    }, []);

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

    useEffect(() => {
        updatePaginationInfo({
            total: filteredResidents.length,
            pages: Math.ceil(filteredResidents.length / limit) || 1
        });
    }, [filteredResidents.length, limit, updatePaginationInfo]);

    const paginatedResidents = filteredResidents.slice((page - 1) * limit, page * limit);

    return {
        loading, searchTerm, setSearchTerm, statusFilter, setStatusFilter, filteredResidents, paginatedResidents, fetchResidents,
        page, limit, pages, total, goToPage, hasNextPage, hasPrevPage
    };
};