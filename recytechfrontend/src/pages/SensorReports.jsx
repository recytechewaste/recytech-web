import React, { useState } from 'react';
import { RefreshCw, Cpu, Clock, Wrench, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import SensorReportFilterBar from '../features/sensorReports/SensorReportFilterBar';
import SensorReportTable from '../features/sensorReports/SensorReportTable';
import SensorReportModal from '../features/sensorReports/SensorReportModal';
import Pagination from '../components/Pagination';
import styles from '../styles/Collectors.module.css';
import rpStyles from '../styles/RewardPointManager.module.css';
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
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                            className={styles.clearBtn}
                            onClick={handleRefresh}
                            title="Refresh sensor reports"
                            aria-label="Refresh sensor incident reports"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>
                </header>

                {/* ── KPI Stats Bar ── */}
                <div className={rpStyles.statsBar} style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: '#f3f4f6', color: '#374151' }}>
                            <Cpu size={22} />
                        </div>
                        <div>
                            <p className={rpStyles.statValue}>{stats.total}</p>
                            <p className={rpStyles.statLabel}>Total Incidents</p>
                        </div>
                    </div>

                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                            <Clock size={22} />
                        </div>
                        <div>
                            <p className={rpStyles.statValue} style={{ color: '#d97706' }}>{stats.pending}</p>
                            <p className={rpStyles.statLabel}>Pending Investigation</p>
                        </div>
                    </div>

                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <Wrench size={22} />
                        </div>
                        <div>
                            <p className={rpStyles.statValue} style={{ color: '#2563eb' }}>{stats.inProgress}</p>
                            <p className={rpStyles.statLabel}>In Progress (Dispatched)</p>
                        </div>
                    </div>

                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
                            <CheckCircle size={22} />
                        </div>
                        <div>
                            <p className={rpStyles.statValue} style={{ color: '#16a34a' }}>{stats.resolved}</p>
                            <p className={rpStyles.statLabel}>Resolved Incidents</p>
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

                {/* ── Modal ── */}
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
