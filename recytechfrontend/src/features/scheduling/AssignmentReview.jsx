import React from 'react';
import { Check, Calendar, Send, MapPin, Truck, Sparkles, Clock } from 'lucide-react';
import styles from '../../styles/SmartScheduling.module.css';
import RequestPriorityTags from './RequestPriorityTags';
import InfoTooltip from '../../components/InfoTooltip';

const getQuickPresetTime = (hoursFromNow = 24, hourOfDay = 9) => {
    const target = new Date();
    target.setDate(target.getDate() + Math.ceil(hoursFromNow / 24));
    target.setHours(hourOfDay, 0, 0, 0);
    const tzOffset = target.getTimezoneOffset() * 60000;
    return new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
};

const AssignmentReview = ({
    recommendations = [],
    selectedAssignments = {},
    scheduledTimes = {},
    onSelectAssignment,
    onSelectAll,
    onTimeChange,
    onOpenConfirmModal
}) => {
    if (recommendations.length === 0) return null;

    const selectedCount = Object.keys(selectedAssignments).length;
    const totalRequests = recommendations.reduce((acc, c) => acc + (c.assignedRequests?.length || 0), 0);
    const isAllSelected = totalRequests > 0 && selectedCount === totalRequests;

    // Calculate unique collectors in current selection
    const selectedCollectorIds = new Set(Object.values(selectedAssignments).map(s => s.collectorId));

    return (
        <div className={styles.card} style={{ marginTop: '24px' }}>
            <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f766e' }}>
                        <Send size={15} />
                    </div>
                    <h3 className={styles.cardTitle}>Dispatch Queue & Assignment Console</h3>
                    <InfoTooltip
                        title="Prescriptive Dispatch Execution"
                        content="Interactive dispatch console where staff can review the assigned requests, adjust scheduled pickup times, and click Confirm to commit dispatches to active collectors."
                        size={15}
                        position="bottom"
                        width={270}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                        {selectedCount} of {totalRequests} stops selected
                    </span>
                    {onSelectAll && totalRequests > 0 && (
                        <button
                            type="button"
                            onClick={() => onSelectAll(!isAllSelected)}
                            style={{
                                padding: '4px 10px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: isAllSelected ? '#ecfdf5' : '#ffffff',
                                color: isAllSelected ? '#065f46' : '#334155',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <Check size={12} strokeWidth={2.5} />
                            <span>{isAllSelected ? 'Deselect All' : 'Select All Proposed'}</span>
                        </button>
                    )}
                </div>
            </div>

            <span className={styles.cardSub}>
                Review proposed pickup assignments, adjust scheduled times, and authorize collector dispatches
            </span>

            <div style={{ marginTop: '16px' }}>
                {recommendations.map((collector) => (
                    <div key={collector.collectorId} className={styles.collectorSection}>
                        <div className={styles.collectorSectionHeader}>
                            <div className={styles.collectorTitle}>
                                <Truck size={16} color="#0f766e" />
                                <span>{collector.collectorName}</span>
                                <span style={{
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    background: '#f1f5f9',
                                    color: '#475569',
                                    borderRadius: '6px',
                                    fontWeight: 600
                                }}>
                                    {collector.vehicleType}
                                </span>
                            </div>

                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                {collector.assignedRequests.length} suggested pickup{collector.assignedRequests.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div>
                            {collector.assignedRequests.map((request) => {
                                const key = `${request.requestId}-${collector.collectorId}`;
                                const isSelected = selectedAssignments[key];
                                const currentScheduledTime = scheduledTimes[request.requestId] || '';

                                return (
                                    <div
                                        key={request.requestId}
                                        className={`${styles.ticketCard} ${isSelected ? styles.ticketCardSelected : ''}`}
                                        onClick={() => onSelectAssignment(request.requestId, collector.collectorId)}
                                    >
                                        <div className={styles.ticketInfo}>
                                            <div className={styles.ticketHeader}>
                                                <span className={styles.binBadge}>
                                                    Bin {request.binId}
                                                </span>
                                                <RequestPriorityTags request={request} />
                                            </div>

                                            <div className={styles.ticketAddress}>
                                                <MapPin size={13} color="#94a3b8" />
                                                <span>{request.address || 'Designated Collection Point'}</span>
                                            </div>

                                            {(request.reasons || []).length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                                    {request.reasons.map((reason, idx) => (
                                                        <span
                                                            key={idx}
                                                            style={{
                                                                fontSize: '11px',
                                                                background: '#f8fafc',
                                                                color: '#475569',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #e2e8f0',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            <Sparkles size={10} color="#0f766e" />
                                                            {reason}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.scheduleControl} onClick={(e) => e.stopPropagation()}>
                                            {/* Quick preset buttons */}
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button
                                                    type="button"
                                                    title="Set to Tomorrow 9:00 AM"
                                                    onClick={() => onTimeChange(request.requestId, getQuickPresetTime(24, 9))}
                                                    style={{
                                                        padding: '4px 8px',
                                                        fontSize: '10.5px',
                                                        fontWeight: 600,
                                                        background: '#f1f5f9',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        color: '#475569',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    Tmrw 9 AM
                                                </button>
                                                <button
                                                    type="button"
                                                    title="Set to Tomorrow 2:00 PM"
                                                    onClick={() => onTimeChange(request.requestId, getQuickPresetTime(24, 14))}
                                                    style={{
                                                        padding: '4px 8px',
                                                        fontSize: '10.5px',
                                                        fontWeight: 600,
                                                        background: '#f1f5f9',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        color: '#475569',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    Tmrw 2 PM
                                                </button>
                                            </div>

                                            {/* Exact datetime input */}
                                            <div className={styles.timePickerBox}>
                                                <Calendar size={13} color="#64748b" />
                                                <input
                                                    type="datetime-local"
                                                    value={currentScheduledTime}
                                                    onChange={(event) => onTimeChange(request.requestId, event.target.value)}
                                                    className={styles.timeInput}
                                                />
                                            </div>

                                            {/* Selection Check Circle */}
                                            <div
                                                className={`${styles.checkCircle} ${isSelected ? styles.checkCircleActive : ''}`}
                                                onClick={() => onSelectAssignment(request.requestId, collector.collectorId)}
                                            >
                                                {isSelected && <Check size={14} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Sticky / Highlighted Bottom Authorization Bar */}
            {selectedCount > 0 && (
                <div className={styles.dispatchStickyBar}>
                    <div className={styles.dispatchSummaryText}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                        <span>
                            {selectedCount} pickup stop{selectedCount !== 1 ? 's' : ''} ready to dispatch across {selectedCollectorIds.size} collector{selectedCollectorIds.size !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <button
                        type="button"
                        className={styles.dispatchBtn}
                        onClick={onOpenConfirmModal}
                    >
                        <Send size={15} />
                        <span>Confirm & Dispatch ({selectedCount})</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default AssignmentReview;
