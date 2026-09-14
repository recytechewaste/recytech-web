import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Trash2, Truck, User, Calendar, MapPin, Building, AlertCircle, Ban } from 'lucide-react';
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
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);

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
            const updatePayload = {
                assignedCollector,
                scheduledDate: scheduledDate || undefined,
                notes
            };
            if (isPending) {
                updatePayload.status = 'assigned';
            }
            await onUpdateRequest(request._id, updatePayload);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || (isPending ? 'Failed to assign and approve request.' : 'Failed to update request.'));
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

    // Cancel/Decline request after in-app modal confirmation
    const handleConfirmCancel = async () => {
        setSubmitting(true);
        setError(null);
        try {
            await onUpdateRequest(request._id, {
                status: 'cancelled',
                notes: notes ? `${notes} (Cancelled by Admin)` : 'Cancelled by Admin'
            });
            setShowConfirmCancel(false);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to cancel request.');
            setShowConfirmCancel(false);
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
                                {isPending ? 'Approve & Assign Collector' : 'Edit Collection Dispatch'}
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
                            <Trash2 size={16} color="#059669" />
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
                {isPending ? (
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
                ) : (
                    <div style={{
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        marginBottom: '18px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        fontSize: '12.5px',
                        color: '#1e40af',
                        lineHeight: 1.45
                    }}>
                        <Truck size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <strong>Dispatch Management:</strong> You can edit the assigned collector, scheduled date, or dispatch instructions. Any changes will immediately sync with the collector's mobile application.
                        </div>
                    </div>
                )}

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
                                    onClick={() => setShowConfirmCancel(true)}
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
                                {submitting
                                    ? (isPending ? 'Dispatching...' : 'Saving Changes...')
                                    : (isPending ? 'Assign & Approve' : 'Save Changes')}
                            </button>
                        </div>
                    </div>
                </form>

                {/* ── In-App Confirmation Dialog for Declining/Cancelling Request ── */}
                {showConfirmCancel && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.65)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        padding: '16px'
                    }} onClick={() => setShowConfirmCancel(false)}>
                        <div style={{
                            background: '#ffffff',
                            borderRadius: '14px',
                            width: '100%',
                            maxWidth: '440px',
                            padding: '24px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
                            border: '1px solid #e2e8f0'
                        }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '10px',
                                    backgroundColor: '#fef2f2',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#dc2626',
                                    flexShrink: 0
                                }}>
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#111827' }}>
                                        Decline Collection Request?
                                    </h3>
                                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                                        This action will mark the request as cancelled.
                                    </p>
                                </div>
                            </div>

                            <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                                Are you sure you want to decline / cancel this collection request for <strong>{request.bin?.name || request.bin?.binId || 'this smart bin'}</strong>? The partner organization will be notified.
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmCancel(false)}
                                    disabled={submitting}
                                    style={{
                                        padding: '9px 16px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        background: '#ffffff',
                                        color: '#374151',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Keep Request
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmCancel}
                                    disabled={submitting}
                                    style={{
                                        padding: '9px 18px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                        color: '#ffffff',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)'
                                    }}
                                >
                                    {submitting ? 'Cancelling...' : 'Yes, Decline Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestActionModal;
