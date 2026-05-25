import { useState, useEffect } from 'react';
import api from '../../api/client';

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
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, completed: 0 });
    const [filters, setFilters] = useState({
        status: '',
        wasteType: '',
        assignment: ''
    });

    const fetchData = async () => {
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
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setFilteredRequests(filterRequests(requests, filters));
    }, [filters, requests]);

    const handleClearFilters = () => {
        setFilters({ status: '', wasteType: '', assignment: '' });
    };

    return {
        requests, filteredRequests,
        collectors, wasteCategories,
        stats, filters, setFilters,
        handleClearFilters, fetchData
    };
};