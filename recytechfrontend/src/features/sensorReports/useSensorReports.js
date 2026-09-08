import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSensorReports = () => {
    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        critical: 0
    });
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [severityFilter, setSeverityFilter] = useState('All');
    const [sensorTypeFilter, setSensorTypeFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const { showToast } = useToast();

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/sensor-incidents`, {
                headers: getAuthHeaders(),
                withCredentials: true
            });
            if (res.data?.success) {
                setReports(res.data.data || []);
            }
        } catch (err) {
            console.error('Error loading sensor reports:', err);
            showToast(err.response?.data?.message || 'Failed to load sensor incident reports.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/sensor-incidents/summary`, {
                headers: getAuthHeaders(),
                withCredentials: true
            });
            if (res.data?.success && res.data.stats) {
                setStats(res.data.stats);
            }
        } catch (err) {
            console.error('Error fetching report stats:', err);
        }
    }, []);

    useEffect(() => {
        fetchReports();
        fetchStats();
    }, [fetchReports, fetchStats]);

    const updateStatus = async (reportId, newStatus, resolutionNotes, restoreBinStatus = true) => {
        try {
            const res = await axios.patch(
                `${API_BASE_URL}/api/sensor-incidents/${reportId}/status`,
                { status: newStatus, resolutionNotes, restoreBinStatus },
                {
                    headers: getAuthHeaders(),
                    withCredentials: true
                }
            );

            if (res.data?.success) {
                showToast(res.data.message || `Status updated to ${newStatus}`, 'success');
                // Refresh both reports & stats
                fetchReports();
                fetchStats();
                return { success: true, data: res.data.data };
            }
            return { success: false, message: 'Update failed' };
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Failed to update report status.';
            showToast(errorMsg, 'error');
            return { success: false, message: errorMsg };
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('All');
        setSeverityFilter('All');
        setSensorTypeFilter('All');
        setCurrentPage(1);
    };

    // Filter reports
    const filteredReports = useMemo(() => {
        return reports.filter((item) => {
            const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
            const matchesSeverity = severityFilter === 'All' || item.severity === severityFilter;
            const matchesType = sensorTypeFilter === 'All' || item.sensorType === sensorTypeFilter;

            const searchLower = searchTerm.toLowerCase().trim();
            const binName = item.binId?.name?.toLowerCase() || '';
            const binAddress = item.binId?.address?.toLowerCase() || '';
            const orgName = item.partnerOrgId?.name?.toLowerCase() || '';
            const reporterName = item.reportedBy?.name?.toLowerCase() || '';
            const reporterEmail = item.reportedBy?.email?.toLowerCase() || '';
            const desc = item.issueDescription?.toLowerCase() || '';

            const matchesSearch =
                !searchLower ||
                binName.includes(searchLower) ||
                binAddress.includes(searchLower) ||
                orgName.includes(searchLower) ||
                reporterName.includes(searchLower) ||
                reporterEmail.includes(searchLower) ||
                desc.includes(searchLower);

            return matchesStatus && matchesSeverity && matchesType && matchesSearch;
        });
    }, [reports, statusFilter, severityFilter, sensorTypeFilter, searchTerm]);

    // Pagination
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;
    const paginatedReports = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredReports.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredReports, currentPage, itemsPerPage]);

    const setPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return {
        reports,
        filteredReports,
        paginatedReports,
        stats,
        loading,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        severityFilter,
        setSeverityFilter,
        sensorTypeFilter,
        setSensorTypeFilter,
        handleClearFilters,
        fetchReports,
        fetchStats,
        updateStatus,
        currentPage,
        totalPages,
        setPage
    };
};
