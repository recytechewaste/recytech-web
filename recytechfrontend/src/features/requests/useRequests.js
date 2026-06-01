import { useState, useEffect } from 'react';
import api from '../../api/client';
import { usePagination } from '../../hooks/usePagination';

const calculateStats = (requests) => ({
    total: requests.length,
    pending: requests.filter((request) => request.status === 'Pending').length,
    approved: requests.filter((request) => request.status === 'Approved').length,
    completed: requests.filter((request) => request.status === 'Completed').length
});

const filterRequests = (requests, filters) => {
    let result = [...requests];

    if (filters.status) {
        result = result.filter((request) => request.status === filters.status);
    }

    if (filters.wasteType) {
        result = result.filter((request) => request.wasteType === filters.wasteType);
    }

    if (filters.assignment === 'assigned') {
        result = result.filter((request) => Boolean(request.assignedCollector));
    } else if (filters.assignment === 'unassigned') {
        result = result.filter((request) => !request.assignedCollector);
    } else if (filters.assignment === 'scheduled') {
        result = result.filter((request) => Boolean(request.scheduledAt));
    } else if (filters.assignment === 'unscheduled') {
        result = result.filter((request) => !request.scheduledAt);
    }

    return result;
};

export const useRequests = () => {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [collectors, setCollectors] = useState([]);
    const [wasteCategories, setWasteCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, completed: 0 });
    const [filters, setFilters] = useState({
        status: '',
        wasteType: '',
        assignment: ''
    });

    const { page, limit, pages, total, goToPage, updatePaginationInfo, hasNextPage, hasPrevPage } = usePagination(1, 10);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reqData, colData, rateData] = await Promise.all([
                api.get('/requests'),
                api.get('/collectors'),
                api.get('/exchange-rates')
            ]);

            setRequests(reqData.data);
            setFilteredRequests(filterRequests(reqData.data, filters));
            setCollectors(colData.data);
            setWasteCategories((rateData.data.rates || []).map((rate) => rate.wasteType));
            setStats(calculateStats(reqData.data));
        } catch (error) {
            console.error('Error fetching requests data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setFilteredRequests(filterRequests(requests, filters));
    }, [filters, requests]);

    useEffect(() => {
        updatePaginationInfo({
            total: filteredRequests.length,
            pages: Math.ceil(filteredRequests.length / limit) || 1
        });
    }, [filteredRequests.length, limit, updatePaginationInfo]);

    const paginatedRequests = filteredRequests.slice((page - 1) * limit, page * limit);

    const handleClearFilters = () => {
        setFilters({ status: '', wasteType: '', assignment: '' });
    };

    return {
        requests, filteredRequests, paginatedRequests, loading,
        collectors, wasteCategories,
        stats, filters, setFilters,
        handleClearFilters, fetchData,
        page, limit, pages, total, goToPage, hasNextPage, hasPrevPage
    };
};