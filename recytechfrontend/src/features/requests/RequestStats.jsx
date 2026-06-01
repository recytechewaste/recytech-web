import styles from '../../styles/RequestManagement.module.css';
import Skeleton from '../../components/Skeleton';

const STAT_ITEMS = [
    { key: 'total', label: 'Total Requests' },
    { key: 'pending', label: 'Pending Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'completed', label: 'Completed' }
];

const RequestStats = ({ stats, loading }) => (
    <div className={styles.metricsGrid}>
        {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
                <div key={`skeleton-${i}`} className={styles.metricCard}>
                    <Skeleton width="60%" height="14px" style={{ marginBottom: '8px' }} />
                    <Skeleton width="40%" height="32px" />
                </div>
            ))
        ) : (
            STAT_ITEMS.map((item) => (
                <div key={item.key} className={styles.metricCard}>
                    <span className={styles.metricLabel}>{item.label}</span>
                    <h3 className={styles.metricValue}>{stats[item.key]}</h3>
                </div>
            ))
        )}
    </div>
);

export default RequestStats;
