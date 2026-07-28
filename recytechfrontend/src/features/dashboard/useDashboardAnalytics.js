import { useState, useEffect } from 'react';
import api from '../../api/client';

export const useDashboardAnalytics = () => {
    const [stats, setStats] = useState({
        totalDropoffs: 0,
        totalKilograms: 0,
        totalPoints: 0,
        totalBins: 0,
        operationalBins: 0,
        binsNearCapacity: 0,
        activeResidents: 0
    });
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [recentDropoffs, setRecentDropoffs] = useState([]);
    const [predictiveInsights, setPredictiveInsights] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
                const { data } = await api.get(`/analytics/dashboard?role=${userInfo.role}`);

                setStats({
                    totalDropoffs: data.summary?.totalDropoffs || 0,
                    totalKilograms: data.summary?.totalKilograms || 0,
                    totalPoints: data.summary?.totalPoints || 0,
                    totalBins: data.summary?.totalBins || 0,
                    operationalBins: data.summary?.operationalBins || 0,
                    binsNearCapacity: data.summary?.binsNearCapacity || 0,
                    activeResidents: data.summary?.activeResidents || 0
                });
                setMonthlyData(data.monthlyTrends || []);
                setCategoryData(data.categoryDistribution || []);
                setRecentDropoffs(data.recentDropoffs || []);
                setPredictiveInsights(data.predictiveAnalytics || {});
                setError(null);
            } catch (err) {
                console.error('Error fetching dashboard analytics', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    return { stats, categoryData, monthlyData, recentDropoffs, predictiveInsights, loading, error };
};
