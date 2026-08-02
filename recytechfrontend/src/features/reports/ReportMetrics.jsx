
import React from 'react';
import styles from '../../styles/Reports.module.css';
import { MetricSkeleton } from '../../components/Skeleton';
import { Weight, Truck, Box, Award } from 'lucide-react';

const ReportMetrics = ({ summary = {}, loading }) => {
    if (loading) {
        return (
            <div className={styles.kpiGrid}>
                <MetricSkeleton count={4} />
            </div>
        );
    }

    const totalKg = (summary.totalKilograms || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const totalPoints = (summary.totalPoints || 0).toLocaleString();
    const completedReqs = summary.completedRequests || 0;
    const totalReqs = summary.totalRequests || 0;
    const activeBins = summary.activeBins || summary.operationalBins || 0;
    const totalBins = summary.totalBins || 0;

    return (
        <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Total E-Waste Volume</span>
                    <Weight size={20} className={styles.kpiIcon} style={{ color: '#10b981' }} />
                </div>
                <h3 className={styles.kpiValue}>{totalKg} <span style={{ fontSize: '15px', fontWeight: 500, color: '#64748b' }}>kg</span></h3>
                <p className={styles.kpiSub}>E-waste weight recycled</p>
            </div>

            <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Collection Requests</span>
                    <Truck size={20} className={styles.kpiIcon} style={{ color: '#3b82f6' }} />
                </div>
                <h3 className={styles.kpiValue}>{completedReqs} <span style={{ fontSize: '15px', fontWeight: 400, color: '#64748b' }}>/ {totalReqs} Completed</span></h3>
                <p className={styles.kpiSub}>{totalReqs > 0 ? `${Math.round((completedReqs / totalReqs) * 100)}% fulfillment rate` : 'No requests in period'}</p>
            </div>

            <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Active Bins</span>
                    <Box size={20} className={styles.kpiIcon} style={{ color: '#8b5cf6' }} />
                </div>
                <h3 className={styles.kpiValue}>{activeBins} <span style={{ fontSize: '15px', fontWeight: 400, color: '#64748b' }}>/ {totalBins} Operational</span></h3>
                <p className={styles.kpiSub}>Operational in network</p>
            </div>

            <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Total Points Awarded</span>
                    <Award size={20} className={styles.kpiIcon} style={{ color: '#f59e0b' }} />
                </div>
                <h3 className={styles.kpiValue}>{totalPoints} <span style={{ fontSize: '15px', fontWeight: 400, color: '#64748b' }}>Pts</span></h3>
                <p className={styles.kpiSub}>Issued for recycling</p>
            </div>
        </div>
    );
};

export default ReportMetrics;
