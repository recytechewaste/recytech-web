import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Wrench, Clock, ShieldAlert, Cpu, Building, MapPin, Check } from 'lucide-react';
import styles from '../../styles/SensorReports.module.css';

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

    const isCritical = report.severity === 'Critical';
    const isHigh = report.severity === 'High';

    return (
        <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div 
                className={styles.modalContent} 
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Modal Header ── */}
                <div className={styles.modalHeader}>
                    <div className={styles.modalHeaderInfo}>
                        <div 
                            className={styles.modalIconWrapper}
                            style={{
                                backgroundColor: isCritical ? '#fee2e2' : isHigh ? '#ffedd5' : '#eff6ff',
                                color: isCritical ? '#dc2626' : isHigh ? '#ea580c' : '#2563eb'
                            }}
                        >
                            <Cpu size={22} />
                        </div>
                        <div>
                            <h2 id="modal-title" className={styles.modalTitle}>
                                Sensor Incident Review
                            </h2>
                            <p className={styles.modalSubtitle}>
                                Incident Ref: #{report._id?.substring(0, 10)}...
                            </p>
                        </div>
                    </div>
                    <button 
                        className={styles.closeBtn} 
                        onClick={onClose} 
                        aria-label="Close modal"
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Modal Body ── */}
                <div className={styles.modalBody}>
                    {/* Location & Reporting Partner Details */}
                    <div className={styles.infoGrid}>
                        <div className={styles.infoCard}>
                            <div className={styles.infoCardLabel}>
                                <MapPin size={13} color="#059669" /> Smart Bin Location
                            </div>
                            <div className={styles.infoCardTitle}>
                                {report.binId?.name || 'Smart Bin'}
                            </div>
                            <div className={styles.infoCardDesc}>
                                {report.binId?.address || 'No address specified'}
                            </div>
                            <div className={styles.infoCardMeta}>
                                Status: <strong style={{ color: report.binId?.status === 'Maintenance' ? '#dc2626' : '#059669' }}>
                                    {report.binId?.status || 'Operational'}
                                </strong> | Fill: {report.binId?.currentFillKg || 0} / {report.binId?.capacityKg || 500} kg
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <div className={styles.infoCardLabel}>
                                <Building size={13} color="#2563eb" /> Reporting Partner Org
                            </div>
                            <div className={styles.infoCardTitle}>
                                {report.partnerOrgId?.name || report.reportedBy?.name || 'Partner Org'}
                            </div>
                            <div className={styles.infoCardDesc}>
                                Contact: {report.partnerOrgId?.contactPerson || report.reportedBy?.name || 'N/A'}
                            </div>
                            <div className={styles.infoCardMeta}>
                                {report.partnerOrgId?.email || report.reportedBy?.email || 'No email recorded'}
                            </div>
                        </div>
                    </div>

                    {/* Sensor Type & Priority Badges */}
                    <div className={styles.badgeGrid}>
                        <div className={styles.badgeCard}>
                            <div className={styles.badgeCardLabel}>Component Reported</div>
                            <div className={styles.badgeCardValue} style={{ color: '#0f766e' }}>
                                {report.sensorType || 'Time-of-Flight (ToF) Fullness Sensor'}
                            </div>
                        </div>

                        <div className={styles.badgeCard}>
                            <div className={styles.badgeCardLabel}>Severity Level</div>
                            <div 
                                className={styles.badgeCardValue}
                                style={{
                                    color: isCritical ? '#dc2626' : isHigh ? '#ea580c' : '#2563eb'
                                }}
                            >
                                {report.severity || 'Medium'} Priority
                            </div>
                        </div>
                    </div>

                    {/* Issue Description Warning Box */}
                    <div className={styles.alertBox}>
                        <div className={styles.alertBoxHeader}>
                            <AlertTriangle size={14} /> Malfunction Details / Description
                        </div>
                        <p className={styles.alertBoxText}>
                            {report.issueDescription || 'No description provided by the partner.'}
                        </p>
                    </div>

                    {/* Resolution & Status Form */}
                    <form onSubmit={handleSubmit} className={styles.formSection}>
                        <div className={styles.formGroup}>
                            <label htmlFor="update-incident-status" className={styles.formLabel}>
                                Update Incident Status
                            </label>
                            <select
                                id="update-incident-status"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className={styles.formSelect}
                            >
                                <option value="Pending">⏳ Pending Investigation</option>
                                <option value="In Progress">🔧 In Progress (Technician Dispatched)</option>
                                <option value="Resolved">✅ Resolved (Repaired / Replaced)</option>
                                <option value="Dismissed">❌ Dismissed (False Alarm)</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="resolution-notes" className={styles.formLabel}>
                                Staff Resolution Notes & Actions Taken
                            </label>
                            <textarea
                                id="resolution-notes"
                                rows={3}
                                placeholder="Describe inspection findings, replaced hardware/ultrasonic sensor modules, calibration results, or technician actions..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                className={styles.formTextarea}
                            />
                        </div>

                        {selectedStatus === 'Resolved' && (
                            <label htmlFor="restore-bin-status" className={styles.checkboxLabel}>
                                <input
                                    id="restore-bin-status"
                                    type="checkbox"
                                    checked={restoreBinStatus}
                                    onChange={(e) => setRestoreBinStatus(e.target.checked)}
                                    className={styles.checkboxInput}
                                />
                                <span>
                                    Automatically restore smart bin status to <strong>Operational</strong>
                                </span>
                            </label>
                        )}

                        {report.resolvedBy && (
                            <div className={styles.auditBox}>
                                Last updated by <strong>{report.resolvedBy?.name || 'Staff'}</strong> on {new Date(report.resolvedAt || report.updatedAt).toLocaleString()}
                            </div>
                        )}

                        <div className={styles.modalFooter}>
                            <button
                                type="button"
                                onClick={onClose}
                                className={styles.modalCancelBtn}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className={styles.modalSubmitBtn}
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
