import React from 'react';
import { Trash2, Building2, User } from 'lucide-react';
import styles from '../../styles/Reports.module.css';

const getStatusBadgeStyle = (status) => {
    const s = (status || '').toLowerCase().replace(/[\s_-]/g, '');
    switch (s) {
        case 'completed':
            return { backgroundColor: '#def7ec', color: '#067647', border: '1px solid #bcf0da' };
        case 'intransit':
            return { backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe' };
        case 'assigned':
            return { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' };
        case 'scheduled':
            return { backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff' };
        case 'pending':
            return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' };
        case 'cancelled':
        case 'canceled':
            return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' };
        default:
            return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' };
    }
};

const ReportTable = ({ data }) => {
    return (
        <div className={styles.tableCard}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Bin</th>
                        <th>Partner Organization</th>
                        <th>Assigned Collector</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {(!data || data.length === 0) ? (
                        <tr>
                            <td colSpan="5" className={styles.emptyState}>No recent collection activity to display.</td>
                        </tr>
                    ) : (
                        data.slice(0, 10).map((item) => (
                            <tr key={item._id}>
                                <td style={{ whiteSpace: 'nowrap', fontWeight: 500 }}>
                                    {new Date(item.date || item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Trash2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                                            {item.binName || 'Bin'}
                                        </span>
                                        {item.binAddress && (
                                            <span style={{ fontSize: '12px', color: '#6b7280', paddingLeft: '20px' }}>
                                                {item.binAddress}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#374151' }}>
                                        <Building2 size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                                        <span>{item.partnerOrg || 'N/A'}</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#374151', fontWeight: 500 }}>
                                            <User size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                                            <span>{item.collectorName || 'Unassigned'}</span>
                                        </span>
                                        {item.vehiclePlate && (
                                            <span style={{ fontSize: '11px', color: '#6b7280', paddingLeft: '20px' }}>
                                                Plate: {item.vehiclePlate}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span 
                                        className={styles.status} 
                                        style={getStatusBadgeStyle(item.status)}
                                    >
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ReportTable;
