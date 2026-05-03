import { useEffect, useState } from 'react';
import api from '../api/client';
import Sidebar from './Sidebar';
import styles from '../styles/Dashboard.module.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    // Calculate the position for the label (middle of the slice)
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const Dashboard = () => {
    const [stats, setStats] = useState({
        pending: 0,
        completed: 0,
        completionRate: 0,
        totalItems: 0,
        totalPayout: 0,
        totalResidents: 0
    });
    const [roleData, setRoleData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/analytics/dashboard');
                const requestStats = data.summary?.requests || {};
                const payoutStats = data.summary?.payouts || {};
                const residentStats = data.summary?.residents || {};

                setStats({
                    pending: requestStats.pendingRequests || 0,
                    completed: requestStats.completedRequests || 0,
                    completionRate: requestStats.completionRate || 0,
                    totalItems: requestStats.totalCompletedItems || 0,
                    totalPayout: payoutStats.totalPayout || 0,
                    totalResidents: residentStats.totalResidents || 0
                });
                setMonthlyData(data.monthlyTrends || []);
                setCategoryData(data.categoryDistribution || []);
                setRoleData(data.roleDistribution || []);
                setRecentActivity(data.recentRequests || []);
            } catch (error) { console.error("Error fetching stats", error); }
        };
        fetchStats();
    }, []);

    return (
        <div className={styles.container}>
            <Sidebar activePage="Dashboard" />

            <div className={styles.main}>
                <div className={styles.dashboardHeader}>
                    <h1 className={styles.pageTitle}>System Dashboard</h1>
                    <p className={styles.subTitle}>Welcome back, Super Admin. Here is your operational overview.</p>
                </div>

                {/* METRICS SECTION */}
                <div className={styles.sectionContainer}>
                    <h2 className={styles.sectionHeaderLeft}>E-Waste Metrics</h2>
                    <p className={styles.sectionSubHeaderLeft}>Processing and collection stats.</p>

                    <div className={styles.metricsLayout}>
                        {/* Left Column: Stats Cards */}
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

                        {/* Right Column: Monthly Trends */}
                        <div className={styles.chartCard}>
                            <h3 className={styles.cardTitle}>Monthly Collection Volume</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={monthlyData}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                    <Tooltip cursor={{fill: '#f3f4f6'}} />
                                    <Bar dataKey="items" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* 2. PIE CHARTS SECTION */}
                <div className={styles.chartsGrid}>
                    <div className={styles.chartCard}>
                        <h3 className={styles.cardTitle}>Waste Type Distribution</h3>
                        <span className={styles.chartSub}>Breakdown of collected e-waste categories</span>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={45}
                                    outerRadius={75}
                                    paddingAngle={5}
                                    dataKey="value"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {roleData.length > 0 && (
                        <div className={styles.chartCard}>
                            <h3 className={styles.cardTitle}>System User Distribution</h3>
                            <span className={styles.chartSub}>Breakdown of internal accounts by role</span>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={roleData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={45}
                                        outerRadius={75}
                                        paddingAngle={5}
                                        dataKey="value"
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                    >
                                        {roleData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                    {/* Recent Activity Table */}
                    <div className={styles.activityCard}>
                        <h3 className={styles.cardTitle}>Recent Collection Requests</h3>
                        <table className={styles.activityTable}>
                            <thead>
                                <tr>
                                    <th>Resident</th>
                                    <th>Waste Type</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentActivity.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className={styles.emptyActivityTd}>No recent activity.</td>
                                    </tr>
                                ) : (
                                    recentActivity.map((req) => (
                                        <tr key={req._id}>
                                            <td>{req.residentName}</td>
                                            <td>{req.wasteType}</td>
                                            <td>{req.location?.address?.substring(0, 20)}...</td> {/* Truncate long addresses */}
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles[req.status.toLowerCase().replace(/\s/g, '')]}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
