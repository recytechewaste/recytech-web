import { useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Info } from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444'];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const DonutChartCard = ({ title, subtitle, data, tooltipText }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipStyle = {
        position: 'absolute', top: '100%', right: 0, marginTop: '8px',
        backgroundColor: '#1F2937', color: '#F9FAFB', padding: '12px',
        borderRadius: '8px', fontSize: '12px', width: '220px', zIndex: 50,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', pointerEvents: 'none',
        lineHeight: '1.5', textAlign: 'left', fontWeight: 'normal', textTransform: 'none'
    };

    return (
    <div className={styles.chartCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>{title}</h3>
            <div 
                style={{ position: 'relative', cursor: 'help', color: '#9CA3AF', display: 'flex' }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
            >
                <Info size={18} />
                {showTooltip && (
                    <div style={tooltipStyle}>{tooltipText}</div>
                )}
            </div>
        </div>
        <span className={styles.chartSub}>{subtitle}</span>
        {data && data.length > 0 ? (
            <div style={{ width: '100%', height: '250px', minWidth: 0, marginTop: '16px' }}>
                <ResponsiveContainer width="99%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="45%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                            labelLine={false}
                            label={renderCustomizedLabel}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        ) : (
            <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '14px', marginTop: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #e5e7eb' }}>
                No data available for this chart.
            </div>
        )}
    </div>
    );
};

const DistributionCharts = ({ categoryData, roleData }) => (
    <div className={styles.chartsGrid}>
        <DonutChartCard
            title="Waste Type Distribution"
            subtitle="Breakdown of collected e-waste categories"
            tooltipText="Shows the proportion of different e-waste categories collected to help identify material trends."
            data={categoryData}
        />

        {roleData.length > 0 && (
            <DonutChartCard
                title="System User Distribution"
                subtitle="Breakdown of internal accounts by role"
                tooltipText="Displays the distribution of active staff, admins, and super admins managing the system."
                data={roleData}
            />
        )}
    </div>
);

export default DistributionCharts;
