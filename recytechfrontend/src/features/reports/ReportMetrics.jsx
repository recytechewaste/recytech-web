
import React from 'react';
import styles from '../../styles/Reports.module.css';
import { MetricSkeleton } from '../../components/Skeleton';

const ReportMetrics = ({ summary, loading }) => {
    if (loading) {
        return (
            <div className={styles.kpiGrid}>
                <MetricSkeleton count={4} />
            </div>
        );
    }

    return (
        <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>Total Dropoffs</span>
                <h3 className={styles.kpiValue}>{summary.totalDropoffs.toLocaleString()}</h3>
                <p className={styles.kpiSub}>Completed & Rejected</p>
            </div>
            <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>Success Rate</span>
                <h3 className={styles.kpiValue}>{summary.successRate.toFixed(1)}%</h3>
                <p className={styles.kpiSub}>Completed vs. Total</p>
            </div>
            <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>Total Points Awarded</span>
                <h3 className={styles.kpiValue}>{summary.totalPoints.toLocaleString()}</h3>
                <p className={styles.kpiSub}>From completed drop-offs</p>
            </div>
            <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>Unique Residents</span>
                <h3 className={styles.kpiValue}>{summary.uniqueResidents.toLocaleString()}</h3>
                <p className={styles.kpiSub}>Participated in period</p>
            </div>
        </div>
    );
};

export default ReportMetrics;
