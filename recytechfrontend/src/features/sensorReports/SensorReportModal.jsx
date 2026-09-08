import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Wrench, Clock, ShieldAlert, Cpu, Building, MapPin, User } from 'lucide-react';
import styles from '../../styles/Collectors.module.css';

const SensorReportModal = ({ report, onClose, onUpdateStatus }) => {
    const [selectedStatus, setSelectedStatus] = useState('Pending');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [restoreBinStatus, setRestoreBinStatus] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (report) {
            setSelectedStatus(report.status || 'Pending');
            setResolutionNotes(report.resolutionNotes || '');
        }
    }, [report]);

    if (!report) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await onUpdateStatus(report._id, selectedStatus, resolutionNotes, restoreBinStatus);
            if (res?.success) {
                onClose();
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div 
                className={styles.modalContent} 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
            >
                {/* Header */}
                <div className={styles.modalHeader} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '8px', 
                            backgroundColor: '#fee2e2', 
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Cpu size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                                Sensor Incident Review
                            </h2>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>
                                Report ID: {report._id}
                            </p>
                        </div>
                    </div>
                    <button 
                        className={styles.closeBtn} 
                        onClick={onClose} 
                        aria-label="Close modal"
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#9ca3af' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Bin and Org info cards */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '12px',
                        background: '#f9fafb',
                        padding: '14px',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>
                                <MapPin size={13} color="#16a34a" /> Smart Bin Location
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '4px' }}>
                                {report.binId?.name || 'Smart Bin'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#4b5563' }}>
                                {report.binId?.address || 'No address provided'}
                            </div>
                            <div style={{ fontSize: '11px', marginTop: '4px', color: '#6b7280' }}>
                                Status: <strong style={{ color: report.binId?.status === 'Maintenance' ? '#dc2626' : '#16a34a' }}>{report.binId?.status || 'Operational'}</strong> | Fill: {report.binId?.currentFillKg || 0} / {report.binId?.capacityKg || 500} kg
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>
                                <Building size={13} color="#2563eb" /> Reporting Partner Org
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginTop: '4px' }}>
                                {report.partnerOrgId?.name || report.reportedBy?.name || 'Partner Org'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#4b5563' }}>
                                Contact: {report.partnerOrgId?.contactPerson || report.reportedBy?.name || 'N/A'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                {report.partnerOrgId?.email || report.reportedBy?.email || ''}
                            </div>
                        </div>
                    </div>

                    {/* Sensor Type & Severity */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#ffffff' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>Component Reported</span>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginTop: '2px' }}>
                                {report.sensorType}
                            </div>
                        </div>

                        <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#ffffff' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>Severity Level</span>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: report.severity === 'Critical' ? '#dc2626' : report.severity === 'High' ? '#ea580c' : '#2563eb', marginTop: '2px' }}>
                                {report.severity} Priority
                            </div>
                        </div>
                    </div>

                    {/* Issue Description from Partner */}
                    <div style={{ padding: '12px 14px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fef3c7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>
                            <AlertTriangle size={14} /> Malfunction Details / Description
                        </div>
                        <p style={{ fontSize: '13px', color: '#78350f', margin: 0, lineHeight: 1.5 }}>
                            {report.issueDescription}
                        </p>
                    </div>

                    {/* Staff Resolution Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                                Update Incident Status
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    backgroundColor: '#ffffff'
                                }}
                            >
                                <option value="Pending">⏳ Pending Investigation</option>
                                <option value="In Progress">🔧 In Progress (Technician Dispatched)</option>
                                <option value="Resolved">✅ Resolved (Repaired / Replaced)</option>
                                <option value="Dismissed">❌ Dismissed (False Alarm)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                                Staff Resolution Notes & Actions Taken
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Describe inspection findings, replaced hardware/ultrasonic sensor modules, calibration results, or technician actions..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '13px',
                                    resize: 'vertical',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {selectedStatus === 'Resolved' && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={restoreBinStatus}
                                    onChange={(e) => setRestoreBinStatus(e.target.checked)}
                                    style={{ width: '16px', height: '16px', accentColor: '#16a34a' }}
                                />
                                Automatically restore smart bin status to <strong>Operational</strong>
                            </label>
                        )}

                        {report.resolvedBy && (
                            <div style={{ fontSize: '11px', color: '#6b7280', background: '#f3f4f6', padding: '8px 12px', borderRadius: '6px' }}>
                                Last resolved by: <strong>{report.resolvedBy?.name || 'Staff'}</strong> on {new Date(report.resolvedAt || report.updatedAt).toLocaleString()}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: '9px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    background: '#ffffff',
                                    color: '#4b5563',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '9px 20px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: '#16a34a',
                                    color: '#ffffff',
                                    fontWeight: '700',
                                    fontSize: '13px',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)'
                                }}
                            >
                                {submitting ? 'Saving...' : 'Save & Update Status'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SensorReportModal;
