import { useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Info } from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

const EWasteMetrics = ({ stats, monthlyData }) => {
    const [showVolumeTooltip, setShowVolumeTooltip] = useState(false);

    return (
    <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>Bin Network Overview</h2>
        <p className={styles.sectionSubtext}>Drop-off activity and bin status at a glance.</p>

        <div className={styles.kpiGrid}>
            <div className={`${styles.kpiCard} ${stats.binsNearCapacity > 3 ? styles.kpiDanger : ''}`}>
                <span className={styles.kpiLabel}>Operational Bins</span>
                <span className={styles.kpiValue}>{stats.operationalBins} <span className={styles.kpiSub}>/ {stats.totalBins}</span></span>
            </div>
            <div className={`${styles.kpiCard} ${stats.binsNearCapacity > 0 ? styles.kpiWarning : ''}`}>
                <span className={styles.kpiLabel}>Bins Near Capacity</span>
                <span className={styles.kpiValue}>{stats.binsNearCapacity}</span>
            </div>
            <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>Total Drop-offs</span>
                <span className={styles.kpiValue}>{stats.totalDropoffs.toLocaleString()}</span>
            </div>
            <div className={styles.kpiCard}>
                <span className={styles.kpiLabel}>Total Points Awarded</span>
                <span className={styles.kpiValue}>{stats.totalPoints.toLocaleString()}</span>
            </div>
        </div>

        <div className={styles.chartCard}>
            <div className={styles.chartCardHeader}>
                <h3 className={styles.chartTitle}>Monthly Drop-off Volume</h3>
                <div
                    style={{ position: 'relative', cursor: 'help', color: '#9CA3AF', display: 'flex' }}
                    onMouseEnter={() => setShowVolumeTooltip(true)}
                    onMouseLeave={() => setShowVolumeTooltip(false)}
                >
                    <Info size={18} />
                    {showVolumeTooltip && (
                        <div className={styles.tooltip}>Shows the number of bin drop-offs and total kilograms collected per month.</div>
                    )}
                </div>
            </div>
            {monthlyData && monthlyData.some(d => d.dropoffs > 0 || d.kilograms > 0) ? (
                <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                            <YAxis axisLine={false} tickLine={false} fontSize={12} />
                            <Tooltip cursor={{ fill: '#f3f4f6' }} />
                            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="dropoffs" name="Drop-offs" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="kilograms" name="Kilograms" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className={styles.emptyChart}>No drop-off data available.</div>
            )}
        </div>
    </div>
    );
};

export default EWasteMetrics;
