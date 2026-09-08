import React from 'react';
import { Eye, AlertCircle, CheckCircle, Clock, Wrench, ShieldAlert, Cpu } from 'lucide-react';
import styles from '../../styles/SensorReports.module.css';

const SensorReportTable = ({ reports, loading, onSelectReport }) => {
    const getSeverityBadge = (severity) => {
        const sevLower = (severity || 'medium').toLowerCase();
        let className = `${styles.severityBadge} ${styles.severityMedium}`;

        if (sevLower === 'critical') {
            className = `${styles.severityBadge} ${styles.severityCritical}`;
        } else if (sevLower === 'high') {
            className = `${styles.severityBadge} ${styles.severityHigh}`;
        } else if (sevLower === 'low') {
            className = `${styles.severityBadge} ${styles.severityLow}`;
        }

        return (
            <span className={className}>
                {sevLower === 'critical' && <ShieldAlert size={12} />}
                {severity}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const sLower = (status || 'pending').toLowerCase();
        let className = `${styles.statusBadge} ${styles.statusPending}`;
        let icon = <Clock size={12} />;

        if (sLower === 'in progress') {
            className = `${styles.statusBadge} ${styles.statusInProgress}`;
            icon = <Wrench size={12} />;
        } else if (sLower === 'resolved') {
            className = `${styles.statusBadge} ${styles.statusResolved}`;
            icon = <CheckCircle size={12} />;
        } else if (sLower === 'dismissed') {
            className = `${styles.statusBadge} ${styles.statusDismissed}`;
            icon = <AlertCircle size={12} />;
        }

        return (
            <span className={className}>
                {icon}
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className={styles.tableCard}>
                <div className={styles.emptyCard}>
                    <div className={styles.spinner} />
                    <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, margin: 0 }}>
                        Loading sensor incident reports...
                    </p>
                </div>
            </div>
        );
    }

    if (!reports || reports.length === 0) {
        return (
            <div className={styles.tableCard}>
                <div className={styles.emptyCard}>
                    <CheckCircle size={38} color="#10b981" style={{ margin: '0 auto 12px auto', display: 'block' }} />
                    <p style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                        No Sensor Incident Reports Found
                    </p>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                        All smart bins and Time-of-Flight (ToF) fullness sensors are currently running in optimal condition.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.tableCard}>
            <div className={styles.tableResponsive}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Smart Bin / Location</th>
                            <th>Partner Organization</th>
                            <th>Issue Description</th>
                            <th>Severity</th>
                            <th>Status</th>
                            <th>Reported Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((report) => (
                            <tr key={report._id}>
                                <td>
                                    <div className={styles.binName}>
                                        {report.binId?.name || 'Unknown Smart Bin'}
                                    </div>
                                    <div className={styles.binAddress}>
                                        {report.binId?.address || 'No address specified'}
                                    </div>
                                    {report.binId?.status === 'Maintenance' && (
                                        <span className={styles.maintenanceTag}>
                                            BIN IN MAINTENANCE
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <div className={styles.orgName}>
                                        {report.partnerOrgId?.name || report.reportedBy?.name || 'Partner Org'}
                                    </div>
                                    <div className={styles.orgSub}>
                                        {report.partnerOrgId?.jurisdiction || report.reportedBy?.email || ''}
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.sensorTag}>
                                        <Cpu size={12} /> ToF Fullness Sensor
                                    </div>
                                    <div className={styles.issueText} title={report.issueDescription}>
                                        {report.issueDescription}
                                    </div>
                                </td>
                                <td>{getSeverityBadge(report.severity)}</td>
                                <td>{getStatusBadge(report.status)}</td>
                                <td>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                        {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        onClick={() => onSelectReport(report)}
                                        className={styles.reviewBtn}
                                        title="View report details and take staff action"
                                    >
                                        <Eye size={14} /> Review & Action
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SensorReportTable;
