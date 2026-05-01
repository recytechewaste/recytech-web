import { useEffect, useState } from 'react';
import api from '../api/client';
import Sidebar from './Sidebar';
import styles from '../styles/Reports.module.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Calendar, Filter } from 'lucide-react';

const Reports = () => {
    const [reportData, setReportData] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [stats, setStats] = useState({ total: 0, successRate: 0, topItem: 'N/A' });

    const fetchReports = async () => {
        try {
            const { data } = await api.get('/requests');
            // Filter Completed/Rejected
            const archived = data.filter(r => r.status === 'Completed' || r.status === 'Rejected');
            setReportData(archived);

            // 1. Calculate Summary Stats
            const total = archived.length;
            const completed = archived.filter(r => r.status === 'Completed').length;
            const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            // Find Top Item
            const typeCounts = {};
            archived.forEach(item => { typeCounts[item.wasteType] = (typeCounts[item.wasteType] || 0) + 1; });
            const topItem = Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b, 'N/A');

            setStats({ total, successRate, topItem });

            // 2. Process Data for Bar Chart (Requests per Day)
            const dates = {};
            archived.forEach(item => {
                const date = new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                dates[date] = (dates[date] || 0) + 1;
            });
            const barData = Object.keys(dates).map(key => ({ name: key, collections: dates[key] }));
            setChartData(barData);

            // 3. Process Data for Pie Chart (Waste Types)
            const pieChartData = Object.keys(typeCounts).map(key => ({ name: key, value: typeCounts[key] }));
            setPieData(pieChartData);

        } catch (error) {
            console.error("Error fetching reports", error);
        }
    };

    useEffect(() => {
        Promise.resolve().then(fetchReports);
    }, []);

    const COLORS = ['#111827', '#374151', '#6B7280', '#9CA3AF', '#D1D5DB'];

    return (
        <div className={styles.container}>
            <Sidebar activePage="Reports and Analytics" />

            <div className={styles.main}>
                {/* HEADER */}
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.pageTitle}>Reports & Analytics</h1>
                        <p className={styles.subTitle}>Performance metrics and collection history.</p>
                    </div>
                    <button onClick={() => window.print()} className={styles.exportBtn} style={{backgroundColor: '#2563EB', color: 'white', border: 'none'}}>
                        <Download size={16} /> Export Report
                    </button>
                </div>

                {/* FILTERS */}
                <div className={styles.filterBar}>
                    <div className={styles.filterGroup}>
                        <Calendar size={16} className={styles.icon} />
                        <select className={styles.select}><option>Last 30 Days</option><option>Last 7 Days</option></select>
                    </div>
                    <div className={styles.filterGroup}>
                        <Filter size={16} className={styles.icon} />
                        <select className={styles.select}><option>All Waste Types</option></select>
                    </div>
                </div>
                
                {/* METRICS WIDGETS */}
                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Total Processed</span>
                        <h3 className={styles.metricValue}>{stats.total}</h3>
                        <span className={styles.metricTrend}>+12% from last month</span>
                    </div>
                    <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Collection Success Rate</span>
                        <h3 className={styles.metricValue}>{stats.successRate}%</h3>
                        <span className={styles.metricTrend}>Based on completed requests</span>
                    </div>
                    <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Most Common Waste</span>
                        <h3 className={styles.metricValue}>{stats.topItem}</h3>
                        <span className={styles.metricTrend}>High demand category</span>
                    </div>
                </div>

                {/* CHARTS SECTION */}
                <div className={styles.chartsGrid}>
                    {/* Bar Chart */}
                    <div className={styles.chartCard}>
                        <div className={styles.cardHeader}>
                            <h3>Weekly Collection Trends</h3>
                        </div>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{fill: '#f3f4f6'}} />
                                    <Bar dataKey="collections" fill="#111827" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie Chart */}
                    <div className={styles.chartCard}>
                        <div className={styles.cardHeader}>
                            <h3>Waste Type Distribution</h3>
                        </div>
                        <div style={{ height: '300px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* TABLE SECTION */}
                <div className={styles.tableCard}>
                    <div className={styles.cardHeader}>
                        <h3>Recent Transaction History</h3>
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Date Processed</th>
                                <th className={styles.th}>Resident</th>
                                <th className={styles.th}>Item Category</th>
                                <th className={styles.th}>Outcome</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.slice(0, 5).map((req) => (
                                <tr key={req._id} className={styles.tr}>
                                    <td className={styles.td}>
                                        {new Date(req.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className={styles.td}>{req.residentName}</td>
                                    <td className={styles.td}>{req.wasteType}</td>
                                    <td className={styles.td}>
                                        <span className={req.status === 'Completed' ? styles.statusCompleted : styles.statusRejected}>
                                            {req.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
