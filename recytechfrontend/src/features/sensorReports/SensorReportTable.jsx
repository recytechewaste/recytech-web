import React from 'react';
import { Eye, AlertCircle, CheckCircle, Clock, Wrench, ShieldAlert } from 'lucide-react';
import styles from '../../styles/Collectors.module.css';

const SensorReportTable = ({ reports, loading, onSelectReport }) => {
    const getSeverityBadge = (severity) => {
        const sevLower = (severity || 'medium').toLowerCase();
        let bg = '#eff6ff';
        let color = '#2563eb';
        let border = '#bfdbfe';

        if (sevLower === 'critical') {
            bg = '#fef2f2';
            color = '#dc2626';
            border = '#fecaca';
        } else if (sevLower === 'high') {
            bg = '#fff7ed';
            color = '#ea580c';
            border = '#fed7aa';
        } else if (sevLower === 'low') {
            bg = '#f0fdf4';
            color = '#16a34a';
            border = '#bbf7d0';
        }

        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                backgroundColor: bg,
                color: color,
                border: `1px solid ${border}`
            }}>
                {sevLower === 'critical' && <ShieldAlert size={12} />}
                {severity}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const sLower = (status || 'pending').toLowerCase();
        let bg = '#fffbeb';
        let color = '#d97706';
        let icon = <Clock size={12} />;

        if (sLower === 'in progress') {
            bg = '#eff6ff';
            color = '#2563eb';
            icon = <Wrench size={12} />;
        } else if (sLower === 'resolved') {
            bg = '#f0fdf4';
            color = '#16a34a';
            icon = <CheckCircle size={12} />;
        } else if (sLower === 'dismissed') {
            bg = '#f3f4f6';
            color = '#6b7280';
            icon = <AlertCircle size={12} />;
        }

        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 9px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: bg,
                color: color
            }}>
                {icon}
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className={styles.tableCard}>
                <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                    <div className={styles.spinner} style={{ margin: '0 auto 12px auto' }} />
                    <p>Loading sensor incident reports...</p>
                </div>
            </div>
        );
    }

    if (!reports || reports.length === 0) {
        return (
            <div className={styles.tableCard}>
                <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                    <CheckCircle size={36} color="#16a34a" style={{ margin: '0 auto 12px auto', display: 'block' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>No Sensor Incident Reports Found</h3>
                    <p style={{ fontSize: '13px', color: '#9ca3af' }}>All smart bins and ultrasonic sensors are currently running in optimal condition.</p>
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
                            <th>Sensor Component</th>
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
                                    <div style={{ fontWeight: '600', color: '#111827' }}>
                                        {report.binId?.name || 'Unknown Smart Bin'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                        {report.binId?.address || 'No address specified'}
                                    </div>
                                    {report.binId?.status === 'Maintenance' && (
                                        <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: '700' }}>
                                            [BIN IN MAINTENANCE]
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <div style={{ fontWeight: '500', color: '#1f2937' }}>
                                        {report.partnerOrgId?.name || report.reportedBy?.name || 'Partner Org'}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                        {report.partnerOrgId?.jurisdiction || report.reportedBy?.email || ''}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                                        {report.sensorType}
                                    </div>
                                    <div style={{ 
                                        fontSize: '12px', 
                                        color: '#6b7280', 
                                        maxWidth: '220px', 
                                        whiteSpace: 'nowrap', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis' 
                                    }}>
                                        {report.issueDescription}
                                    </div>
                                </td>
                                <td>{getSeverityBadge(report.severity)}</td>
                                <td>{getStatusBadge(report.status)}</td>
                                <td>
                                    <div style={{ fontSize: '13px', color: '#374151' }}>
                                        {new Date(report.createdAt).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                        {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        onClick={() => onSelectReport(report)}
                                        className={styles.viewBtn}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            border: '1px solid #d1d5db',
                                            backgroundColor: '#ffffff',
                                            color: '#374151',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                                            e.currentTarget.style.borderColor = '#9ca3af';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                            e.currentTarget.style.borderColor = '#d1d5db';
                                        }}
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
