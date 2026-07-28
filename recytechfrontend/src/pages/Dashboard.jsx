import Sidebar from '../components/Sidebar';
import DistributionCharts from '../features/dashboard/DistributionCharts';
import EWasteMetrics from '../features/dashboard/EWasteMetrics';
import PredictiveInsights from '../features/dashboard/PredictiveInsights';
import RecentRequestsTable from '../features/dashboard/RecentRequestsTable';
import styles from '../styles/Dashboard.module.css';
import { MetricSkeleton } from '../components/Skeleton';
import ErrorBoundary from '../components/ErrorBoundary';
import { useDashboardAnalytics } from '../features/dashboard/useDashboardAnalytics';

const Dashboard = () => {
    const { stats, categoryData, monthlyData, recentDropoffs, predictiveInsights, loading, error } = useDashboardAnalytics();
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const firstName = userInfo.firstName || 'User';

    return (
        <div className={styles.container}>
            <Sidebar activePage="Dashboard" />

            <main className={styles.main}>
                <header className={styles.dashboardHeader}>
                    <h1 className={styles.pageTitle}>Operations Dashboard</h1>
                    <p className={styles.subTitle}>Welcome back, {firstName}. Here is your bin network overview.</p>
                </header>

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
