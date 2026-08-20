import { useState, useEffect, useMemo } from 'react';
import api from '../../api/client';
import { usePagination } from '../../hooks/usePagination';

const ITEMS_PER_PAGE = 6;

export const useRewardPoints = () => {
    const [allPoints, setAllPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

    const fetchPoints = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reward-points', { params: { includeInactive: true } });
            setAllPoints(res.data.points || []);
        } catch (error) {
            console.error("Error fetching reward points:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoints();
    }, []);

    const filteredPoints = useMemo(() => {
        return allPoints.filter(p => {
            const matchesSearch = !searchTerm || 
                p.wasteType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = 
                statusFilter === 'all' ||
                (statusFilter === 'active' && p.isActive) ||
                (statusFilter === 'inactive' && !p.isActive);
            return matchesSearch && matchesStatus;
        });
    }, [allPoints, searchTerm, statusFilter]);

    const { currentData: paginatedPoints, currentPage, totalPages, setPage } = usePagination(filteredPoints, ITEMS_PER_PAGE);

    // Reset to page 1 whenever filters change
    useEffect(() => { setPage(1); }, [searchTerm, statusFilter]);

    return { 
        points: paginatedPoints,
        allPoints,
        filteredTotal: filteredPoints.length,
        loading, 
        fetchPoints,
        currentPage, 
        totalPages, 
        setPage,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
    };
};
