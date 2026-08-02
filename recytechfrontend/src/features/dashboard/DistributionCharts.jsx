import { useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Info } from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const DistributionCharts = ({ categoryData }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className={styles.sectionContainer}>
            <h2 className={styles.sectionTitle}>Waste Type Distribution</h2>
            <p className={styles.sectionSubtext}>Breakdown of collected waste categories from bin drop-offs.</p>

            <div className={styles.chartCard}>
                <div className={styles.chartCardHeader}>
                    <h3 className={styles.chartTitle}>By Volume</h3>
                    <div
                        style={{ position: 'relative', cursor: 'help', color: '#9CA3AF', display: 'flex' }}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <Info size={18} />
                        {showTooltip && (
                            <div className={styles.tooltip}>
                                Shows the proportion of different waste categories dropped off at bins to help identify material trends.
                            </div>
                        )}
                    </div>
                </div>
                {categoryData && categoryData.length > 0 ? (
                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={55}
                                    outerRadius={90}
                                    paddingAngle={4}
                                    dataKey="value"
                                    labelLine={false}
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                        return (
                                            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
                                                {`${(percent * 100).toFixed(0)}%`}
                                            </text>
                                        );
                                    }}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className={styles.emptyChart}>No waste type data available.</div>
                )}
            </div>
        </div>
    );
};

export default DistributionCharts;
