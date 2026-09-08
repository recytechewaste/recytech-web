import React, { useState } from 'react';
import { RefreshCw, Cpu, Clock, Wrench, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import SensorReportFilterBar from '../features/sensorReports/SensorReportFilterBar';
import SensorReportTable from '../features/sensorReports/SensorReportTable';
import SensorReportModal from '../features/sensorReports/SensorReportModal';
import Pagination from '../components/Pagination';
import styles from '../styles/SensorReports.module.css';
import { useSensorReports } from '../features/sensorReports/useSensorReports';

const SensorReports = () => {
    const {
        filteredReports,
        paginatedReports,
        stats,
        loading,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        severityFilter,
        setSeverityFilter,
        handleClearFilters,
        fetchReports,
        fetchStats,
        updateStatus,
        currentPage,
        totalPages,
        setPage
    } = useSensorReports();

    const [selectedReport, setSelectedReport] = useState(null);

    const handleRefresh = () => {
        fetchReports();
        fetchStats();
    };

    return (
        <div className={styles.container}>
            <Sidebar activePage="Sensor Issue Reports" />

            <main className={styles.main}>
                {/* ── Page Header ── */}
                <header className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.pageTitle}>Sensor Incident Reports</h1>
                        <p className={styles.subTitle}>
                            Review and resolve Time-of-Flight (ToF) fullness sensor malfunctions and bin hardware damage reported by Partner Organizations.
                        </p>
                    </div>
                    <div>
                        <button
                            className={styles.refreshBtn}
                            onClick={handleRefresh}
                            title="Refresh sensor reports"
                            aria-label="Refresh sensor incident reports"
                        >
                            <RefreshCw size={14} /> Refresh Data
                        </button>
                    </div>
                </header>

                {/* ── KPI Stats Bar ── */}
                <div className={styles.statsBar}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#f1f5f9', color: '#334155' }}>
                            <Cpu size={22} />
                        </div>
                        <div>
                            <p className={styles.statValue}>{stats.total}</p>
                            <p className={styles.statLabel}>Total Incidents</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                            <Clock size={22} />
                        </div>
                        <div>
                            <p className={styles.statValue} style={{ color: '#d97706' }}>{stats.pending}</p>
                            <p className={styles.statLabel}>Pending Investigation</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <Wrench size={22} />
                        </div>
                        <div>
                            <p className={styles.statValue} style={{ color: '#2563eb' }}>{stats.inProgress}</p>
                            <p className={styles.statLabel}>In Progress (Dispatched)</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
                            <CheckCircle size={22} />
                        </div>
                        <div>
                            <p className={styles.statValue} style={{ color: '#059669' }}>{stats.resolved}</p>
                            <p className={styles.statLabel}>Resolved Incidents</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ── */}
                <SensorReportFilterBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    severityFilter={severityFilter}
                    setSeverityFilter={setSeverityFilter}
                    handleClearFilters={handleClearFilters}
                />

                {/* ── Table ── */}
                <SensorReportTable
                    reports={paginatedReports}
                    loading={loading}
                    onSelectReport={(report) => setSelectedReport(report)}
                />

                {/* ── Pagination ── */}
                {!loading && filteredReports.length > 0 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                )}

                {/* ── Incident Review Modal Dialog ── */}
                {selectedReport && (
                    <SensorReportModal
                        report={selectedReport}
                        onClose={() => setSelectedReport(null)}
                        onUpdateStatus={updateStatus}
                    />
                )}
            </main>
        </div>
    );
};

export default SensorReports;
