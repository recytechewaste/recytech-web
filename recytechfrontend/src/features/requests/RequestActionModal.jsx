import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Truck, User, Calendar, MapPin, Building, Clock, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import styles from '../../styles/BinCollectionRequests.module.css';

const RequestActionModal = ({ request, onClose, onUpdateRequest }) => {
    const [status, setStatus] = useState('pending');
    const [assignedCollector, setAssignedCollector] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [notes, setNotes] = useState('');
    const [collectors, setCollectors] = useState([]);
    const [loadingCollectors, setLoadingCollectors] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (request) {
            setStatus(request.status?.toLowerCase() || 'pending');
            setAssignedCollector(request.assignedCollector?._id || request.assignedCollector || '');
            setNotes(request.notes || '');

            if (request.scheduledDate) {
                const d = new Date(request.scheduledDate);
                setScheduledDate(d.toISOString().split('T')[0]);
            } else {
                // Default to tomorrow for convenient scheduling
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setScheduledDate(tomorrow.toISOString().split('T')[0]);
            }
        }
    }, [request]);

    useEffect(() => {
        const fetchCollectors = async () => {
            try {
                setLoadingCollectors(true);
                const res = await api.get('/collectors');
                setCollectors(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Failed to load collectors list:', err);
                setError('Could not load collectors list.');
            } finally {
                setLoadingCollectors(false);
            }
        };

        fetchCollectors();
    }, []);

    if (!request) return null;

    const handleCollectorChange = (e) => {
        const val = e.target.value;
        setAssignedCollector(val);
        // Automatically suggest 'assigned' status when a collector is picked
        if (val && (status === 'pending' || status === 'approved')) {
            setStatus('assigned');
        }
    };

    const handleQuickApprove = async () => {
        setSubmitting(true);
        setError(null);
        try {
            await onUpdateRequest(request._id, {
                status: 'approved',
                assignedCollector: assignedCollector || undefined,
                scheduledDate: scheduledDate || undefined,
                notes
            });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to approve request.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Validation for scheduled status
        if (status === 'scheduled' && (!assignedCollector || !scheduledDate)) {
            setError('Please select both a collector and a scheduled date for scheduled requests.');
            setSubmitting(false);
            return;
        }

        try {
            await onUpdateRequest(request._id, {
                status,
                assignedCollector: assignedCollector || null,
                scheduledDate: scheduledDate || null,
                notes
            });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to update request.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div 
                className={styles.modalContent} 
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '620px' }}
            >
                {/* ── Modal Header ── */}
                <div className={styles.modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '10px', 
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                        }}>
                            <Truck size={22} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
                                Review & Assign Collection Request
                            </h2>
                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>
                                Request ID: <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{request._id}</span>
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
                        title="Close modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Summary Card ── */}
                <div style={{ 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '10px', 
                    padding: '16px', 
                    border: '1px solid #e2e8f0', 
                    marginBottom: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Truck size={16} color="#059669" />
                            <span style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                                {request.bin?.name || request.bin?.binId || 'Smart Bin'}
                            </span>
                        </div>
                        <span className={`${styles.statusBadge} ${styles[request.status?.toLowerCase()] || styles.pending}`}>
                            Current: {request.status?.toUpperCase()}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                        <MapPin size={14} color="#64748b" />
                        <span>{request.bin?.address || 'No address provided'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569' }}>
                        <Building size={14} color="#64748b" />
                        <span>Partner Org: <strong>{request.lgu?.name || request.bin?.assignedLgu?.name || 'LGU Partner'}</strong></span>
                        {request.lgu?.phone && <span style={{ color: '#94a3b8' }}>({request.lgu.phone})</span>}
                    </div>

                    {request.notes && (
                        <div style={{ 
                            fontSize: '12px', 
                            backgroundColor: '#fffbeb', 
                            color: '#92400e', 
                            padding: '8px 12px', 
                            borderRadius: '6px',
                            border: '1px solid #fef3c7',
                            marginTop: '4px'
                        }}>
                            <strong>Partner Note:</strong> "{request.notes}"
                        </div>
                    )}
                </div>

                {/* ── Error Banner ── */}
                {error && (
                    <div style={{ 
                        backgroundColor: '#fef2f2', 
                        color: '#dc2626', 
                        padding: '10px 14px', 
                        borderRadius: '6px', 
                        fontSize: '13px', 
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        border: '1px solid #fee2e2'
                    }}>
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* ── Action Form ── */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Status Selection */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                            Update Request Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className={styles.input}
                            style={{ cursor: 'pointer' }}
                        >
                            <option value="pending">Pending (Awaiting Staff Review)</option>
                            <option value="approved">Approved (Accepted by Admin/Staff)</option>
                            <option value="assigned">Assigned (Dispatched to Collector)</option>
                            <option value="scheduled">Scheduled (Specific Date & Collector)</option>
                            <option value="in_progress">In Progress (Collector En Route)</option>
                            <option value="cancelled">Cancelled (Declined / Duplicate)</option>
                        </select>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0 0' }}>
                            Setting status to <strong>Approved</strong> or <strong>Assigned</strong> reflects immediately on the Partner Org's mobile dashboard.
                        </p>
                    </div>

                    {/* Collector Assignment Dropdown */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                            Assign Collector (Mobile Job Dispatch)
                        </label>
                        <select
                            value={assignedCollector}
                            onChange={handleCollectorChange}
                            className={styles.input}
                            disabled={loadingCollectors}
                            style={{ cursor: loadingCollectors ? 'wait' : 'pointer' }}
                        >
                            <option value="">-- No Collector Assigned (Unassigned) --</option>
                            {collectors.map((col) => {
                                const vehicle = col.vehicleType || col.vehiclePlate ? `${col.vehicleType || 'Vehicle'}${col.vehiclePlate ? ` • ${col.vehiclePlate}` : ''}` : '';
                                const duty = col.status ? `[${col.status}]` : '';
                                return (
                                    <option key={col._id} value={col._id}>
                                        {col.firstName} {col.lastName} {vehicle ? `(${vehicle})` : ''} {duty}
                                    </option>
                                );
                            })}
                        </select>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0 0' }}>
                            The assigned collector will immediately see this pickup request in their Mobile App under <strong>Assigned Jobs</strong>.
                        </p>
                    </div>

                    {/* Scheduled Date */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                            Scheduled Collection Date
                        </label>
                        <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    {/* Staff Notes / Dispatch Instructions */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                            Staff Instructions / Dispatch Notes
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className={styles.input}
                            placeholder="Add dispatch instructions or special access instructions for the driver..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {/* ── Modal Footer ── */}
                    <div className={styles.modalFooter} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            {request.status?.toLowerCase() === 'pending' && (
                                <button
                                    type="button"
                                    onClick={handleQuickApprove}
                                    disabled={submitting}
                                    className={styles.quickApproveBtn}
                                    title="Quick approve without changing collector assignment"
                                >
                                    <CheckCircle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                    Quick Approve
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className={styles.cancelBtn}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className={styles.submitBtn}
                            >
                                {submitting ? 'Saving...' : 'Save & Dispatch'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestActionModal;
