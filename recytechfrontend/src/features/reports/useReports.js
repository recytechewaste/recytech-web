import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';

export const useReports = () => {
    const [reportData, setReportData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [wasteTypes, setWasteTypes] = useState([]);
    const [filters, setFilters] = useState({
        dateRange: 'Last 30 Days',
        wasteType: 'All Waste Types',
        status: 'All'
    });
    const [stats, setStats] = useState({
        total: 0,
        successRate: 0,
        topItem: 'N/A',
        totalPayout: 0,
        uniqueResidents: 0
    });

    const buildChartData = (data) => {
        const dates = {};
        data.forEach(item => {
            const date = new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            dates[date] = (dates[date] || 0) + 1;
        });
        return Object.keys(dates).map(key => ({ name: key, collections: dates[key] }));
    };

    const buildPieData = (data) => {
        const typeCounts = {};
        data.forEach(item => {
            typeCounts[item.wasteType] = (typeCounts[item.wasteType] || 0) + 1;
        });
        return Object.keys(typeCounts).map(key => ({ name: key, value: typeCounts[key] }));
    };

    const updateReportState = useCallback((dataToProcess, currentFilters) => {
        let result = [...dataToProcess];

        if (currentFilters.status !== 'All') result = result.filter(r => r.status === currentFilters.status);
        if (currentFilters.wasteType !== 'All Waste Types') result = result.filter(r => r.wasteType === currentFilters.wasteType);

        if (currentFilters.dateRange !== 'All Time') {
            const days = currentFilters.dateRange === 'Last 7 Days' ? 7 : currentFilters.dateRange === 'Last 90 Days' ? 90 : 30;
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - days);
            result = result.filter(r => new Date(r.updatedAt) >= fromDate);
        }

        result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setFilteredData(result);

        const total = result.length;
        const completed = result.filter(r => r.status === 'Completed').length;
        const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const newPieData = buildPieData(result);
        const newBarData = buildChartData(result);

        const residentsSet = new Set(result.map(item => item.residentEmail || item.residentName || item._id));
        const totalPayout = result.reduce((sum, item) => sum + (item.monetaryValue || 0), 0);
        const topItem = newPieData.length > 0 ? newPieData.reduce((a, b) => (a.value > b.value ? a : b)).name : 'N/A';

        setStats({ total, successRate, topItem, totalPayout, uniqueResidents: residentsSet.size });
        setChartData(newBarData);
        setPieData(newPieData);
    }, []);

    useEffect(() => {
        api.get('/requests').then(({ data }) => {
            const archived = data.filter(r => r.status === 'Completed' || r.status === 'Rejected');
            setReportData(archived);
            setWasteTypes(Array.from(new Set(archived.map(item => item.wasteType).filter(Boolean))));
            updateReportState(archived, filters);
        }).catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (reportData.length) updateReportState(reportData, filters);
    }, [filters, reportData, updateReportState]);

    const handleClearFilters = () => setFilters({ dateRange: 'Last 30 Days', wasteType: 'All Waste Types', status: 'All' });

    return { filteredData, chartData, pieData, wasteTypes, filters, setFilters, stats, handleClearFilters };
};