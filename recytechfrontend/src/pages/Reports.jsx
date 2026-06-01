import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Sidebar from '../components/Sidebar';
import styles from '../styles/Reports.module.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Calendar, Filter, Loader2 } from 'lucide-react';
import { useReports } from '../features/reports/useReports';

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

const Reports = () => {
    const { filteredData, chartData, pieData, wasteTypes, filters, setFilters, stats, handleClearFilters } = useReports();
    const reportRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        
        setIsExporting(true);
        try {
            // Capture the exact React elements as a high-quality canvas
            const canvas = await html2canvas(reportRef.current, {
                scale: 2, // 2x scale for crisp text resolution
                backgroundColor: '#f3f4f6', // Matches your dashboard background
                useCORS: true // Allows Recharts to render properly
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait, millimeters, A4 page size
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`RecyTech_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setIsExporting(false);
        }
    };

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
                    <button onClick={handleExportPDF} disabled={isExporting} className={styles.exportBtn} style={{backgroundColor: '#2563EB', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', opacity: isExporting ? 0.7 : 1, cursor: isExporting ? 'wait' : 'pointer'}}>
                        {isExporting ? <Loader2 size={16} /> : <Download size={16} />} 
                        {isExporting ? 'Generating PDF...' : 'Export Report'}
                    </button>
                </div>

                {/* PDF EXPORT CONTENT WRAPPER */}
                <div ref={reportRef} style={{ padding: '10px 0', backgroundColor: '#f3f4f6' }}>
                    {/* FILTERS */}
                    <div className={styles.filterBar}>
                    <div className={styles.filterGroup}>
                        <Calendar size={16} className={styles.icon} />
                        <select className={styles.select} value={filters.dateRange} onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}>
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                            <option>Last 90 Days</option>
                            <option>All Time</option>
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <Filter size={16} className={styles.icon} />
                        <select className={styles.select} value={filters.wasteType} onChange={(e) => setFilters({ ...filters, wasteType: e.target.value })}>
                            <option>All Waste Types</option>
                            {wasteTypes.map((type) => (
                                <option key={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <Filter size={16} className={styles.icon} />
                        <select className={styles.select} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                            <option>All</option>
                            <option>Completed</option>
                            <option>Rejected</option>
                        </select>
                    </div>
                    <button className={styles.clearBtn} onClick={handleClearFilters}>Clear Filters</button>
                </div>
                
                {/* METRICS WIDGETS */}
                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Total Processed</span>
                        <h3 className={styles.metricValue}>{stats.total}</h3>
                        <span className={styles.metricTrend}>Archived completed/rejected requests</span>
                    </div>
                    <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Collection Success Rate</span>
                        <h3 className={styles.metricValue}>{stats.successRate}%</h3>
                        <span className={styles.metricTrend}>Completed vs archived requests</span>
                    </div>
                    <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Total Payout</span>
                        <h3 className={styles.metricValue}>PHP {stats.totalPayout.toLocaleString()}</h3>
                        <span className={styles.metricTrend}>Amount based on request values</span>
                    </div>
                    <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Residents Served</span>
                        <h3 className={styles.metricValue}>{stats.uniqueResidents}</h3>
                        <span className={styles.metricTrend}>Unique resident profiles in filtered data</span>
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
                            <ResponsiveContainer width="99%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{fill: '#f3f4f6'}} />
                                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="collections" name="Total Collections" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} />
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
                            <ResponsiveContainer width="99%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                    cy="45%"
                                        innerRadius={60}
                                    outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
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
                            {filteredData.slice(0, 5).map((req) => (
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
        </div>
    );
};

export default Reports;
