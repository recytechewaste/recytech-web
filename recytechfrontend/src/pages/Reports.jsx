import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Sidebar from '../components/Sidebar';
import styles from '../styles/Reports.module.css';
import headerStyles from '../styles/BinCollectionRequests.module.css';
import { Download, Calendar, Filter, Loader2, Landmark } from 'lucide-react';
import { useReports } from '../features/reports/useReports';
import ReportMetrics from '../features/reports/ReportMetrics';
import ReportCharts from '../features/reports/ReportCharts';
import ReportTable from '../features/reports/ReportTable';
import { MetricSkeleton } from '../components/Skeleton';
import ErrorBoundary from '../components/ErrorBoundary';


const Reports = () => {
    const { loading, filters, setFilters, handleClearFilters, reportData, wasteTypes, lguAccounts } = useReports();
    const reportRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        
        setIsExporting(true);
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                backgroundColor: '#f7f9fc',
                useCORS: true,
                scrollX: -window.scrollX,
                scrollY: -window.scrollY,
                windowWidth: document.documentElement.offsetWidth,
                windowHeight: document.documentElement.offsetHeight,
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4', true);
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');
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

            <main className={styles.main}>
                <div className={headerStyles.header}>
                    <div>
                        <h1 className={headerStyles.pageTitle}>Reports & Analytics</h1>
                        <p className={headerStyles.subTitle}>Performance metrics and drop-off activity.</p>
                    </div>
                    <button onClick={handleExportPDF} disabled={isExporting} className={styles.exportBtn}>
                        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        {isExporting ? 'Generating...' : 'Export PDF'}
                    </button>
                </div>

                {/* Filter Controls */}
                <div className={styles.filterCard}>
                    <div className={styles.filterGroup}>
                        <Calendar size={16} className={styles.icon} />
                        <select className={styles.select} value={filters.timeframe} onChange={(e) => setFilters({ ...filters, timeframe: e.target.value })}>
                            <option value="week">Last 7 Days</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <Filter size={16} className={styles.icon} />
                        <select className={styles.select} value={filters.wasteType} onChange={(e) => setFilters({ ...filters, wasteType: e.target.value })}>
                            <option value="All">All Waste Types</option>
                            {wasteTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <Landmark size={16} className={styles.icon} />
                        <select className={styles.select} value={filters.lguId} onChange={(e) => setFilters({ ...filters, lguId: e.target.value })}>
                            <option value="All">All Partner Organizations</option>
                            {lguAccounts.map((lgu) => (
                                <option key={lgu._id} value={lgu._id}>{lgu.name}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleClearFilters} className={styles.clearBtn}>Clear Filters</button>
                </div>
                
                <div ref={reportRef}>
                    {loading || !reportData ? (
                        <>
                            <div className={styles.sectionContainer}>
                                <div className={styles.kpiGrid}><MetricSkeleton count={4} /></div>
                            </div>
                            <div className={styles.sectionContainer}>
                                <div className={styles.twoCol}>
                                    <div className={styles.chartCard} style={{ height: '360px' }}><MetricSkeleton count={1} /></div>
                                    <div className={styles.chartCard} style={{ height: '360px' }}><MetricSkeleton count={1} /></div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <ErrorBoundary>
                            {/* Key Metrics Section */}
                            <div className={styles.sectionContainer}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>Key Metrics</h2>
                                    <p className={styles.sectionSubtext}>An overview of performance in the selected period.</p>
                                </div>
                                <ReportMetrics summary={reportData.summary} loading={loading} />
                            </div>

                            {/* Charts Section */}
                            <div className={styles.sectionContainer}>
                                <ReportCharts 
                                    weeklyTrend={reportData.weeklyTrend} 
                                    summaryByWasteType={reportData.summaryByWasteType} 
                                />
                            </div>

                            {/* Recent Activity Table Section */}
                            <div className={styles.sectionContainer}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>Recent Activity</h2>
                                    <p className={styles.sectionSubtext}>A log of the most recent drop-off events.</p>
                                </div>
                                <ReportTable data={reportData.recentActivity} />
                            </div>
                        </ErrorBoundary>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Reports;
