import { useEffect, useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import DistributionCharts from '../features/dashboard/DistributionCharts';
import EWasteMetrics from '../features/dashboard/EWasteMetrics';
import PredictiveInsights from '../features/dashboard/PredictiveInsights';
import RecentRequestsTable from '../features/dashboard/RecentRequestsTable';
import SchedulingPanel from '../features/scheduling/SchedulingPanel';
import styles from '../styles/Dashboard.module.css';
import { MetricSkeleton } from '../components/Skeleton';
import ErrorBoundary from '../components/ErrorBoundary';

const Dashboard = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const firstName = userInfo.firstName || 'User';

    const [stats, setStats] = useState({
        pending: 0,
        completed: 0,
        completionRate: 0,
        totalItems: 0,
        totalPayout: 0,
        totalResidents: 0
    });
    const [roleData, setRoleData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [predictiveInsights, setPredictiveInsights] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/analytics/dashboard?role=${userInfo.role}`);
                const requestStats = data.summary?.requests || {};
                const payoutStats = data.summary?.payouts || {};
                const residentStats = data.summary?.residents || {};

                setStats({
                    pending: requestStats.pendingRequests || 0,
                    completed: requestStats.completedRequests || 0,
                    completionRate: requestStats.completionRate || 0,
                    totalItems: requestStats.totalCompletedItems || 0,
                    totalPayout: payoutStats.totalPayout || 0,
                    totalResidents: residentStats.totalResidents || 0
                });
                setMonthlyData(data.monthlyTrends || []);
                setCategoryData(data.categoryDistribution || []);
                setRoleData(data.roleDistribution || []);
                setRecentActivity(data.recentRequests || []);
                setPredictiveInsights(data.predictiveAnalytics || {});
            } catch (error) {
                console.error('Error fetching stats', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className={styles.container}>
            <Sidebar activePage="Dashboard" />

            <div className={styles.main}>
                <div className={styles.dashboardHeader}>
                    <h1 className={styles.pageTitle}>System Dashboard</h1>
                    <p className={styles.subTitle}>Welcome back, {firstName}. Here is your operational overview.</p>
                </div>

                {loading ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        <MetricSkeleton />
                        <MetricSkeleton />
                        <MetricSkeleton />
                        <MetricSkeleton />
                    </div>
                ) : (
                    <ErrorBoundary>
                        <EWasteMetrics stats={stats} monthlyData={monthlyData} />
                    </ErrorBoundary>
                )}
                <ErrorBoundary>
                    <PredictiveInsights predictiveInsights={predictiveInsights} />
                </ErrorBoundary>
                <ErrorBoundary>
                    <SchedulingPanel />
                </ErrorBoundary>
                <ErrorBoundary>
                    <DistributionCharts categoryData={categoryData} roleData={roleData} />
                </ErrorBoundary>
                <ErrorBoundary>
                    <RecentRequestsTable requests={recentActivity} />
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default Dashboard;
