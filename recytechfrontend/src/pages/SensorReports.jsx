import React, { useState } from 'react';
import { RefreshCw, Cpu, Clock, Wrench, CheckCircle, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import SensorReportFilterBar from '../features/sensorReports/SensorReportFilterBar';
import SensorReportTable from '../features/sensorReports/SensorReportTable';
import SensorReportModal from '../features/sensorReports/SensorReportModal';
import Pagination from '../components/Pagination';
import styles from '../styles/SensorReports.module.css';
import { useSensorReports } from '../features/sensorReports/useSensorReports';
import InfoTooltip from '../components/InfoTooltip';

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
                <PageHeader
                    icon={<AlertTriangle size={24} />}
                    title="Sensor Incident Reports"
                    tooltipTitle="Hardware Telemetry & Maintenance"
                    tooltipContent="Tracks Time-of-Flight (ToF) and ultrasonic distance sensor faults reported by partner facilities or detected via telemetry drift."
                    subtitle="Review and resolve Time-of-Flight (ToF) fullness sensor malfunctions and bin hardware damage reported by Partner Organizations."
                    actions={
                        <button
                            className={styles.refreshBtn}
                            onClick={handleRefresh}
                            title="Refresh sensor reports"
                            aria-label="Refresh sensor incident reports"
                        >
                            <RefreshCw size={14} /> Refresh Data
                        </button>
                    }
                />

                {/* ── KPI Stats Bar ── */}
                <div className={styles.statsBar}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#f1f5f9', color: '#334155' }}>
                            <Cpu size={22} />
                        </div>
                        <div>
                            <p className={styles.statValue}>{stats.total}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <p className={styles.statLabel}>Total Incidents</p>
                                <InfoTooltip
                                    title="Total Incident Reports"
                                    content="Cumulative sensor, telemetry, or physical damage incident tickets logged across all connected smart bins."
                                    position="top"
                                    width={250}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#d97706' }}>
                            <Clock size={22} />
                        </div>
                        <div>
                            <p className={styles.statValue} style={{ color: '#d97706' }}>{stats.pending}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <p className={styles.statLabel}>Pending Investigation</p>
                                <InfoTooltip
                                    title="Pending Triage"
                                    content="Newly submitted tickets awaiting inspection by technical operations or automated diagnostic verification."
                                    position="top"
                                    width={250}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <Wrench size={22} />
                        </div>
                        <div>
                            <p className={styles.statValue} style={{ color: '#2563eb' }}>{stats.inProgress}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <p className={styles.statLabel}>In Progress (Dispatched)</p>
                                <InfoTooltip
                                    title="Active Field Work"
                                    content="Tickets where field technicians or maintenance contractors have been dispatched for on-site repair or sensor replacement."
                                    position="top"
                                    width={260}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
                            <CheckCircle size={22} />
                        </div>
                        <div>
                            <p className={styles.statValue} style={{ color: '#059669' }}>{stats.resolved}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <p className={styles.statLabel}>Resolved Incidents</p>
                                <InfoTooltip
                                    title="Resolved & Verified"
                                    content="Hardware faults successfully repaired, recalibrated, and verified streaming accurate fullness levels."
                                    position="top"
                                    width={250}
                                />
                            </div>
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
