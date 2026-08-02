import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';

export const useReports = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        timeframe: 'month',
        wasteType: 'All',
        lguId: 'All'
    });

    const fetchReportData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                timeframe: filters.timeframe,
                ...(filters.wasteType !== 'All' && { wasteType: filters.wasteType }),
                ...(filters.lguId !== 'All' && { lguId: filters.lguId })
            };
            const response = await api.get('/analytics/reports', { params });
            setReportData(response.data);
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const handleClearFilters = () => {
        setFilters({
            timeframe: 'month',
            wasteType: 'All',
            lguId: 'All'
        });
    };

    // Extract unique waste types for filter dropdown
    const wasteTypes = reportData?.summaryByWasteType?.map(item => item._id) || [];

    // LGU accounts for filter dropdown (returned from the API)
    const lguAccounts = reportData?.lguAccounts || [];

    return {
        loading,
        filters,
        setFilters,
        handleClearFilters,
        reportData,
        wasteTypes,
        lguAccounts
    };
};