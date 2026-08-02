
import React from 'react';
import styles from '../../styles/Reports.module.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
            {percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
        </text>
    );
};

const ReportCharts = ({ weeklyTrend, summaryByWasteType }) => {
    return (
        <div className={styles.twoCol}>
            {/* Weekly Trends Chart */}
            <div className={styles.chartCard}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Weekly Collection Trends</h3>
                    <p className={styles.sectionSubtext}>Total drop-offs recorded per day.</p>
                </div>
                <div style={{ height: '300px' }}>
                    {weeklyTrend && weeklyTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={weeklyTrend.map(d => ({ name: d._id, collections: d.count }))} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: '#f3f4f6' }}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        borderColor: '#e5e7eb',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                    }}
                                />
                                <Bar dataKey="collections" name="Total Drop-offs" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className={styles.emptyChart}>
                            No weekly collection trend data available for the selected period.
                        </div>
                    )}
                </div>
            </div>

            {/* Material Distribution Chart */}
            <div className={styles.chartCard}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Material Distribution</h3>
                    <p className={styles.sectionSubtext}>Breakdown by waste category.</p>
                </div>
                <div style={{ height: '300px' }}>
                    {summaryByWasteType && summaryByWasteType.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={summaryByWasteType.map(d => ({ name: d._id, value: d.count }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                >
                                    {summaryByWasteType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        borderColor: '#e5e7eb',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                    }}
                                />
                                <Legend
                                    iconType="circle"
                                    iconSize={10}
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className={styles.emptyChart}>
                            No material distribution data available for the selected period.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportCharts;
