import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';

export const useReports = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        timeframe: 'month',
        wasteType: 'All'
    });

    const fetchReportData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                timeframe: filters.timeframe,
                ...(filters.wasteType !== 'All' && { wasteType: filters.wasteType })
            };
            const response = await api.get('/analytics/reports', { params });
            setReportData(response.data);
        } catch (error) {
            console.error("Error fetching report data:", error);
            // Handle error state in UI if necessary
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
            wasteType: 'All'
        });
    };

    // Extract unique waste types for filter dropdown
    // This could be fetched from a dedicated endpoint in a real app
    const wasteTypes = reportData?.summaryByWasteType?.map(item => item._id) || [];

    return {
        loading,
        filters,
        setFilters,
        handleClearFilters,
        reportData,
        wasteTypes
    };
};