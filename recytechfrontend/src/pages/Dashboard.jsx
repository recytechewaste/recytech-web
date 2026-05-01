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
    const [stats, setStats] = useState({ pending: 0, active: 0, completed: 0, newUsers: 0, total: 0, totalWeight: 0, engagement: 0 });
    const [roleData, setRoleData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const reqData = await api.get('/requests');
                
                const pending = reqData.data.filter(r => r.status === 'Pending').length;
                const active = reqData.data.filter(r => r.status === 'Approved').length;
                const completed = reqData.data.filter(r => r.status === 'Completed').length;
                const total = reqData.data.length;

                // Calculate total weight of completed requests
                const totalWeight = reqData.data.filter(r => r.status === 'Completed').reduce((sum, r) => sum + (parseFloat(r.weight) || 0), 0);
                
                // Get recent activity (last 5 requests, sorted by creation date)
                const sortedRequests = [...reqData.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setRecentActivity(sortedRequests.slice(0, 5));

                // Process Monthly Weights
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const weightMap = reqData.data.reduce((acc, req) => {
                    if (req.status === 'Completed') {
                        const m = months[new Date(req.createdAt).getMonth()];
                        acc[m] = (acc[m] || 0) + (parseFloat(req.weight) || 0);
                    }
                    return acc;
                }, {});
                setMonthlyData(months.map(m => ({ name: m, weight: weightMap[m] || 0 })));

                // Process Category Distribution for Pie Chart
                const categoryCounts = {};
                reqData.data.forEach(r => { categoryCounts[r.wasteType] = (categoryCounts[r.wasteType] || 0) + 1; });
                setCategoryData(Object.keys(categoryCounts).map(key => ({ name: key, value: categoryCounts[key] })));

                const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
                let usersThisMonth = 0;
                let activeUsers = 0;

                if (userInfo && userInfo.token && userInfo.role === 'Super Admin') {
                    const userRes = await api.get('/users', { params: { includeCollectors: true } }); // Fetch all users for dashboard analytics
                    const users = userRes.data;
                    
                    const roleCounts = users.reduce((acc, user) => {
                        const role = user.role || 'Staff';
                        acc[role] = (acc[role] || 0) + 1;
                        return acc;
                    }, {});

                    setRoleData(Object.keys(roleCounts).map(name => ({ name, value: roleCounts[name] })));

                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    usersThisMonth = users.filter(u => new Date(u.createdAt) >= thirtyDaysAgo).length;

                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    activeUsers = users.filter(u => u.lastLogin && new Date(u.lastLogin) >= sevenDaysAgo).length;
                }

                setStats({ pending, active, completed, total, newUsers: usersThisMonth, totalWeight, engagement: usersThisMonth > 0 ? Math.round((activeUsers / usersThisMonth) * 100) : 0 });
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
                    <p className={styles.sectionSubHeaderLeft}>Real-time processing and collection stats.</p>

                    <div className={styles.metricsLayout}>
                        {/* Left Column: Stats Cards */}
                        <div className={styles.statsColumn}>
                            <div className={`${styles.metricCard} ${stats.pending >= 10 ? styles.dangerCard : stats.pending >= 5 ? styles.warningCard : ''}`}>
                                <span>Pending Review</span>
                                <h3>{stats.pending}</h3>
                            </div>
                            <div className={styles.metricCard}>
                                <span>Total E-Waste Recycled</span>
                                <h3>{stats.totalWeight.toLocaleString()} kg</h3>
                            </div>
                            <div className={styles.metricCard}>
                                <span>User Engagement</span>
                                <h3>{stats.engagement}%</h3>
                            </div>
                            <div className={`${styles.metricCard} ${stats.newUsers >= 10 ? styles.successCard : ''}`}>
                                <span>New Users This Month</span>
                                <h3>{stats.newUsers}</h3>
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
                                    <Bar dataKey="weight" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={30} />
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
