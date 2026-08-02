import { useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Info, Weight, AlertTriangle, Truck, Box } from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

const EWasteMetrics = ({ stats = {}, monthlyData }) => {
    const [showVolumeTooltip, setShowVolumeTooltip] = useState(false);

    const totalKg = (stats.totalKilograms || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const nearCapacity = stats.binsNearCapacity || 0;
    const pendingReqs = stats.pendingRequests || 0;
    const operational = stats.operationalBins || 0;
    const totalBins = stats.totalBins || 0;

    return (
    <div className={styles.sectionContainer}>
        <h2 className={styles.sectionTitle}>Bin Network Overview</h2>
        <p className={styles.sectionSubtext}>Drop-off volume, urgent bin alerts, and operational status.</p>

        <div className={styles.kpiGrid}>
            <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Total E-Waste Recycled</span>
                    <Weight size={20} style={{ color: '#10b981' }} />
                </div>
                <span className={styles.kpiValue}>{totalKg} <span style={{ fontSize: '15px', fontWeight: 500, color: '#64748b' }}>kg</span></span>
                <p className={styles.kpiSub}>All-time weight collected</p>
            </div>

            <div className={`${styles.kpiCard} ${nearCapacity > 0 ? styles.kpiWarning : ''}`}>
                <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Bins Needing Pickup</span>
                    <AlertTriangle size={20} style={{ color: nearCapacity > 0 ? '#f59e0b' : '#9ca3af' }} />
                </div>
                <span className={styles.kpiValue}>{nearCapacity} <span style={{ fontSize: '15px', fontWeight: 500, color: '#64748b' }}>{nearCapacity === 1 ? 'Bin' : 'Bins'}</span></span>
                <p className={styles.kpiSub}>{nearCapacity > 0 ? '⚠️ At or near 80% capacity' : 'All bins below threshold'}</p>
            </div>

            <div className={`${styles.kpiCard} ${pendingReqs > 0 ? styles.kpiInfo : ''}`}>
                <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Pending Requests</span>
                    <Truck size={20} style={{ color: pendingReqs > 0 ? '#3b82f6' : '#9ca3af' }} />
                </div>
                <span className={styles.kpiValue}>{pendingReqs} <span style={{ fontSize: '15px', fontWeight: 500, color: '#64748b' }}>{pendingReqs === 1 ? 'Request' : 'Requests'}</span></span>
                <p className={styles.kpiSub}>{pendingReqs > 0 ? '📦 Awaiting collector dispatch' : 'No pending pickup requests'}</p>
            </div>

            <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>Operational Bins</span>
                    <Box size={20} style={{ color: '#8b5cf6' }} />
                </div>
                <span className={styles.kpiValue}>{operational} <span className={styles.kpiSub}>/ {totalBins} Online</span></span>
                <p className={styles.kpiSub}>Bins active in network</p>
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
