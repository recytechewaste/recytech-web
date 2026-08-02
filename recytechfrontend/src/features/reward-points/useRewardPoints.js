import { useState, useEffect } from 'react';
import api from '../../api/client';
import { usePagination } from '../../hooks/usePagination';

export const useRewardPoints = () => {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPoints = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reward-points', { params: { includeInactive: true } });
            setPoints(res.data.points || []);
        } catch (error) {
            console.error("Error fetching reward points:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoints();
    }, []);

    const { currentData: paginatedPoints, currentPage, totalPages, setPage } = usePagination(points, 10);

    return { 
        points: paginatedPoints, 
        loading, 
        fetchPoints,
        currentPage, 
        totalPages, 
        setPage 
    };
};
