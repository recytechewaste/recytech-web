import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/client';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../context/ToastContext';

export const useResidents = () => {
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const { showToast } = useToast();

    const fetchResidents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/residents', { params: { limit: 1000 } });
            setResidents(res.data.residents || res.data || []);
        } catch (error) {
            console.error('Error fetching residents:', error);
            showToast(error.response?.data?.message || 'Failed to fetch registered users.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchResidents();
    }, [fetchResidents]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setSourceFilter('');
    };

    const addResident = async (residentData) => {
        try {
            await api.post('/residents', residentData);
            showToast('New resident account created successfully.', 'success');
            await fetchResidents();
            return true;
        } catch (error) {
            console.error('Error creating resident:', error);
            showToast(error.response?.data?.message || 'Failed to create resident.', 'error');
            return false;
        }
    };

    const updateResident = async (id, updatedData) => {
        try {
            await api.put(`/residents/${id}`, updatedData);
            showToast('Resident profile updated successfully.', 'success');
            await fetchResidents();
            return true;
        } catch (error) {
            console.error('Error updating resident:', error);
            showToast(error.response?.data?.message || 'Failed to update resident.', 'error');
            return false;
        }
    };

    const deleteResident = async (id, hardDelete = false) => {
        try {
            await api.delete(`/residents/${id}`, { params: { hardDelete } });
            showToast(hardDelete ? 'Resident permanently deleted.' : 'Resident deactivated successfully.', 'success');
            await fetchResidents();
            return true;
        } catch (error) {
            console.error('Error deleting resident:', error);
            showToast(error.response?.data?.message || 'Failed to delete resident.', 'error');
            return false;
        }
    };

    const filteredResidents = useMemo(() => {
        return residents.filter((resident) => {
            const search = searchTerm.toLowerCase();
            const fullName = `${resident.firstName || ''} ${resident.lastName || ''}`.toLowerCase();
            const matchesSearch = (
                resident.email?.toLowerCase().includes(search) ||
                fullName.includes(search) ||
                resident.phone?.toLowerCase().includes(search) ||
                resident.address?.toLowerCase().includes(search)
            );
            const matchesStatus = statusFilter ? resident.status === statusFilter : true;
            const matchesSource = sourceFilter ? resident.source === sourceFilter : true;
            return matchesSearch && matchesStatus && matchesSource;
        });
    }, [residents, searchTerm, statusFilter, sourceFilter]);

    const stats = useMemo(() => {
        const total = residents.length;
        const active = residents.filter(r => r.status === 'Active').length;
        const points = residents.reduce((sum, r) => sum + (r.pointsBalance || r.totalPoints || 0), 0);
        const requests = residents.reduce((sum, r) => sum + (r.requestCount || 0), 0);
        return { total, active, points, requests };
    }, [residents]);

    const { currentData: paginatedResidents, currentPage, totalPages, setPage } = usePagination(filteredResidents, 10);

    return {
        loading, 
        searchTerm, setSearchTerm, 
        statusFilter, setStatusFilter, 
        sourceFilter, setSourceFilter,
        handleClearFilters,
        filteredResidents, paginatedResidents, 
        fetchResidents,
        addResident, updateResident, deleteResident,
        stats,
        currentPage, totalPages, setPage
    };
};