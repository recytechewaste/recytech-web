
import React from 'react';
import styles from '../../styles/Reports.module.css';
import { MetricSkeleton } from '../../components/Skeleton';
import { Weight, Truck, Box, Award } from 'lucide-react';
import FilterScope from './FilterScope';
import InfoTooltip from '../../components/InfoTooltip';

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={styles.kpiLabel}>Estimated E-Waste Volume</span>
                        <InfoTooltip
                            title="Estimated E-Waste Volume"
                            content="Total weight of e-waste recycled during the selected period, calculated from standardized category benchmark weights across drop-offs and completed collections."
                            position="bottom"
                            width={260}
                        />
                    </div>
                    <Weight size={20} className={styles.kpiIcon} style={{ color: '#10b981' }} />
                </div>
                <h3 className={styles.kpiValue}>{totalKg} <span style={{ fontSize: '15px', fontWeight: 500, color: '#64748b' }}>kg</span></h3>
                <p className={styles.kpiSub}>Est. weight from category benchmarks</p>
                <FilterScope scope="volume" compact />
            </div>

            <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={styles.kpiLabel}>Collection Requests</span>
                        <InfoTooltip
                            title="Request Fulfillment"
                            content="Shows completed vs. total submitted collection requests and overall fulfillment percentage within the filtered date range."
                            position="bottom"
                            width={260}
                        />
                    </div>
                    <Truck size={20} className={styles.kpiIcon} style={{ color: '#3b82f6' }} />
                </div>
                <h3 className={styles.kpiValue}>{completedReqs} <span style={{ fontSize: '15px', fontWeight: 400, color: '#64748b' }}>/ {totalReqs} Completed</span></h3>
                <p className={styles.kpiSub}>{totalReqs > 0 ? `${Math.round((completedReqs / totalReqs) * 100)}% fulfillment rate` : 'No requests in period'}</p>
                <FilterScope scope="requests" compact />
            </div>

            <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={styles.kpiLabel}>Active Bins</span>
                        <InfoTooltip
                            title="Live Network Fleet"
                            content="Real-time count of functioning bins with active IoT sensor connectivity (reflects current hardware status regardless of date filters)."
                            position="bottom"
                            width={260}
                        />
                    </div>
                    <Box size={20} className={styles.kpiIcon} style={{ color: '#8b5cf6' }} />
                </div>
                <h3 className={styles.kpiValue}>{activeBins} <span style={{ fontSize: '15px', fontWeight: 400, color: '#64748b' }}>/ {totalBins} Operational</span></h3>
                <p className={styles.kpiSub}>Current network status (not time-based)</p>
                <FilterScope scope="bins" compact />
            </div>

            <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={styles.kpiLabel}>Total Points Awarded</span>
                        <InfoTooltip
                            title="Incentive Rewards"
                            content="Total reward points granted to participating residents for properly disposing e-waste, redeemable for incentive rewards."
                            position="bottom"
                            width={260}
                        />
                    </div>
                    <Award size={20} className={styles.kpiIcon} style={{ color: '#f59e0b' }} />
                </div>
                <h3 className={styles.kpiValue}>{totalPoints} <span style={{ fontSize: '15px', fontWeight: 400, color: '#64748b' }}>Pts</span></h3>
                <p className={styles.kpiSub}>Issued for recycling</p>
                <FilterScope scope="points" compact />
            </div>
        </div>
    );
};

export default ReportMetrics;
