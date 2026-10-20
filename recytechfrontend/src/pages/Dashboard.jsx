import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DistributionCharts from '../features/dashboard/DistributionCharts';
import EWasteMetrics from '../features/dashboard/EWasteMetrics';
import PredictiveInsights from '../features/dashboard/PredictiveInsights';
import RecentRequestsTable from '../features/dashboard/RecentRequestsTable';
import styles from '../styles/Dashboard.module.css';
import { MetricSkeleton } from '../components/Skeleton';
import ErrorBoundary from '../components/ErrorBoundary';
import { useDashboardAnalytics } from '../features/dashboard/useDashboardAnalytics';
import PageHeader from '../components/PageHeader';
import { LayoutDashboard } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const { stats, categoryData, monthlyData, recentDropoffs, predictiveInsights, loading, error } = useDashboardAnalytics();
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const firstName = userInfo.firstName || 'User';
    const initials = `${(userInfo.firstName || 'U').charAt(0)}${(userInfo.lastName || '').charAt(0)}`.toUpperCase();

    return (
        <div className={styles.container}>
            <Sidebar activePage="Dashboard" />

            <main className={styles.main}>
                <PageHeader
                    icon={<LayoutDashboard size={24} />}
                    title="Operations Dashboard"
                    tooltipTitle="Operations Command Center"
                    tooltipContent="Centralized monitoring of municipality-wide e-waste collection metrics, hardware status, and predictive operational insights."
                    subtitle={`Welcome back, ${firstName}. Here is your bin network overview.`}
                    actions={
                        <div
                            className={styles.userPill}
                            onClick={() => navigate('/settings')}
                            style={{ cursor: 'pointer' }}
                            title="Click to manage account settings"
                        >
                            <div className={styles.userAvatar}>{initials}</div>
                            <div className={styles.userMeta}>
                                <span className={styles.userName}>{`${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() || 'User'}</span>
                                <span className={styles.userRole}>{userInfo.role || 'Admin'}</span>
                            </div>
                        </div>
                    }
                />

                {error && <div className={styles.errorState}>Failed to load dashboard data. Please try again later.</div>}

                {loading ? (
                    <div className={styles.kpiGrid}>
                        <MetricSkeleton count={4} />
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
                    <DistributionCharts categoryData={categoryData} />
                </ErrorBoundary>
                <ErrorBoundary>
                    <RecentRequestsTable dropoffs={recentDropoffs} />
                </ErrorBoundary>
            </main>
        </div>
    );
};

export default Dashboard;
