import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Truck, User, Calendar, MapPin, Building, AlertCircle, Ban } from 'lucide-react';
import api from '../../api/client';
import styles from '../../styles/BinCollectionRequests.module.css';

const RequestActionModal = ({ request, onClose, onUpdateRequest }) => {
    const [assignedCollector, setAssignedCollector] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [notes, setNotes] = useState('');
    const [collectors, setCollectors] = useState([]);
    const [loadingCollectors, setLoadingCollectors] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (request) {
            setAssignedCollector(request.assignedCollector?._id || request.assignedCollector || '');
            setNotes(request.notes || '');

            if (request.scheduledDate) {
                const d = new Date(request.scheduledDate);
                setScheduledDate(d.toISOString().split('T')[0]);
            } else {
                // Default to today or tomorrow
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

    const isPending = request.status?.toLowerCase() === 'pending';

    // Submit: Automatically approves and assigns the collector
    const handleAssignAndApprove = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (!assignedCollector) {
            setError('Please select a collector to dispatch for this collection request.');
            setSubmitting(false);
            return;
        }

        try {
            // AUTOMATIC STATUS: Once a collector is assigned, status becomes 'assigned' (or 'approved')
            // This immediately dispatches the job to the collector's mobile app and notifies the partner org.
            await onUpdateRequest(request._id, {
                status: 'assigned',
                assignedCollector,
                scheduledDate: scheduledDate || undefined,
                notes
            });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to assign and approve request.');
        } finally {
            setSubmitting(false);
        }
    };

    // Quick Approve without assigning a specific collector immediately
    const handleApproveOnly = async () => {
        setSubmitting(true);
        setError(null);
        try {
            await onUpdateRequest(request._id, {
                status: 'approved',
                assignedCollector: null,
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

    // Cancel/Decline request
    const handleCancelRequest = async () => {
        if (!window.confirm('Are you sure you want to decline / cancel this collection request?')) return;
        setSubmitting(true);
        setError(null);
        try {
            await onUpdateRequest(request._id, {
                status: 'cancelled',
                notes: notes ? `${notes} (Cancelled by Admin)` : 'Cancelled by Admin'
            });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to cancel request.');
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
                                {isPending ? 'Approve & Assign Collector' : 'Manage Collection Dispatch'}
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
                            Current Status: {request.status?.toUpperCase()}
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

                {/* ── Workflow Automation Banner ── */}
                <div style={{
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '12.5px',
                    color: '#065f46',
                    lineHeight: 1.45
                }}>
                    <CheckCircle size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <strong>Automatic Workflow:</strong> Once you assign a collector and confirm, this request will automatically be <strong>Approved & Assigned</strong>. The collector will see the job in their Mobile App, and subsequent status transitions (In-Transit, Completed) are handled directly by the collector on-site.
                    </div>
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
                <form onSubmit={handleAssignAndApprove} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Collector Assignment Dropdown */}
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                            Select Collector to Dispatch *
                        </label>
                        <select
                            value={assignedCollector}
                            onChange={(e) => setAssignedCollector(e.target.value)}
                            className={styles.input}
                            disabled={loadingCollectors}
                            style={{ cursor: loadingCollectors ? 'wait' : 'pointer' }}
                            required
                        >
                            <option value="">-- Choose an Available Collector --</option>
                            {collectors.map((col) => {
                                const vehicle = col.vehicleType || col.vehiclePlate ? `${col.vehicleType || 'Vehicle'}${col.vehiclePlate ? ` • Plate: ${col.vehiclePlate}` : ''}` : '';
                                const duty = col.status ? `[${col.status}]` : '';
                                return (
                                    <option key={col._id} value={col._id}>
                                        {col.firstName} {col.lastName} {vehicle ? `(${vehicle})` : ''} {duty}
                                    </option>
                                );
                            })}
                        </select>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0 0' }}>
                            Dispatches the task directly to the collector's mobile app under <strong>Assigned Jobs</strong>.
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
                            Staff Instructions / Dispatch Notes (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className={styles.input}
                            placeholder="Add access instructions or notes for the driver (e.g. Inquire at barangay desk, proceed to back parking)..."
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {/* ── Modal Footer ── */}
                    <div className={styles.modalFooter} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            {request.status?.toLowerCase() !== 'cancelled' && (
                                <button
                                    type="button"
                                    onClick={handleCancelRequest}
                                    disabled={submitting}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#dc2626',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '6px 8px'
                                    }}
                                    title="Decline or cancel this collection request"
                                >
                                    <Ban size={14} /> Decline Request
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
                                {submitting ? 'Dispatching...' : 'Assign & Approve'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RequestActionModal;
