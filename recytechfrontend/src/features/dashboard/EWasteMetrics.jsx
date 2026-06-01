import { useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Info } from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

const EWasteMetrics = ({ stats, monthlyData }) => {
    const [showVolumeTooltip, setShowVolumeTooltip] = useState(false);
    
    const tooltipStyle = {
        position: 'absolute', top: '100%', right: 0, marginTop: '8px',
        backgroundColor: '#1F2937', color: '#F9FAFB', padding: '12px',
        borderRadius: '8px', fontSize: '12px', width: '260px', zIndex: 50,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', pointerEvents: 'none',
        lineHeight: '1.5', textAlign: 'left', fontWeight: 'normal', textTransform: 'none'
    };

    return (
    <div className={styles.sectionContainer}>
        <h2 className={styles.sectionHeaderLeft}>E-Waste Metrics</h2>
        <p className={styles.sectionSubHeaderLeft}>Processing and collection stats.</p>

        <div className={styles.metricsLayout}>
            <div className={styles.statsColumn}>
                <div className={`${styles.metricCard} ${stats.pending >= 10 ? styles.dangerCard : stats.pending >= 5 ? styles.warningCard : ''}`}>
                    <span>Pending Review</span>
                    <h3>{stats.pending}</h3>
                </div>
                <div className={styles.metricCard}>
                    <span>Total E-Waste Items</span>
                    <h3>{stats.totalItems.toLocaleString()}</h3>
                </div>
                <div className={styles.metricCard}>
                    <span>Total Payout Released</span>
                    <h3>PHP {stats.totalPayout.toLocaleString()}</h3>
                </div>
                <div className={`${styles.metricCard} ${stats.completionRate >= 70 ? styles.successCard : ''}`}>
                    <span>Completion Rate</span>
                    <h3>{stats.completionRate}%</h3>
                </div>
            </div>

            <div className={styles.chartCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 className={styles.cardTitle} style={{ margin: 0 }}>Monthly Collection Volume</h3>
                    <div 
                        style={{ position: 'relative', cursor: 'help', color: '#9CA3AF', display: 'flex' }}
                        onMouseEnter={() => setShowVolumeTooltip(true)}
                        onMouseLeave={() => setShowVolumeTooltip(false)}
                        onClick={() => setShowVolumeTooltip(!showVolumeTooltip)}
                    >
                        <Info size={18} />
                        {showVolumeTooltip && (
                            <div style={tooltipStyle}>
                                Compares the total number of incoming requests against the total number of items successfully collected each month.
                            </div>
                        )}
                    </div>
                </div>
                {monthlyData && monthlyData.some(d => d.items > 0 || d.requests > 0) ? (
                    <div style={{ width: '100%', height: '300px', minWidth: 0, marginTop: '16px' }}>
                        <ResponsiveContainer width="99%" height="100%">
                            <BarChart data={monthlyData}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="requests" name="Total Requests" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="items" name="Completed Items" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '14px', marginTop: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #e5e7eb' }}>
                        No collection volume data available.
                    </div>
                )}
            </div>
        </div>
    </div>
    );
};

export default EWasteMetrics;
