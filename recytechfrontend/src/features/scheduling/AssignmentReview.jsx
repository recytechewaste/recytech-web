import { CheckCircle, Calendar, Send } from 'lucide-react';
import styles from '../../styles/SmartScheduling.module.css';
import RequestPriorityTags from './RequestPriorityTags';
import InfoTooltip from '../../components/InfoTooltip';

const AssignmentReview = ({
    recommendations = [],
    selectedAssignments = {},
    scheduledTimes = {},
    onSelectAssignment,
    onTimeChange,
    onOpenConfirmModal
}) => {
    if (recommendations.length === 0) return null;

    const selectedCount = Object.keys(selectedAssignments).length;

    return (
        <div className={styles.card} style={{ marginTop: '24px' }}>
            <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 className={styles.cardTitle}>Review & Confirm Assignments</h3>
                    <InfoTooltip
                        title="Prescriptive Dispatch Execution"
                        content="Interactive dispatch console where staff can review the AI-assigned requests, adjust scheduled pickup times, and click Confirm to commit dispatches to active collectors."
                        size={15}
                        position="bottom"
                        width={270}
                    />
                </div>
            </div>
            <span className={styles.cardSub}>Select proposed assignments and schedule dates before confirming dispatch</span>

            <div style={{ marginTop: '16px' }}>
                {recommendations.map((collector) => (
                    <div key={collector.collectorId} className={styles.collectorGroup}>
                        <div className={styles.collectorGroupTitle}>
                            <span>{collector.collectorName}</span>
                            <span style={{
                                fontSize: '11.5px',
                                padding: '2px 8px',
                                background: '#f1f5f9',
                                color: '#475569',
                                borderRadius: '6px',
                                fontWeight: 500
                            }}>
                                {collector.vehicleType}
                            </span>
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            {collector.assignedRequests.map((request) => {
                                const key = `${request.requestId}-${collector.collectorId}`;
                                const isSelected = selectedAssignments[key];

                                return (
                                    <div
                                        key={request.requestId}
                                        className={`${styles.requestCard} ${isSelected ? styles.requestCardSelected : ''}`}
                                        onClick={() => onSelectAssignment(request.requestId, collector.collectorId)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13.5px' }}>
                                                    Bin {request.binId}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                    {request.address}
                                                </div>
                                                <RequestPriorityTags request={request} />
                                                {(request.reasons || []).length > 0 && (
                                                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px', color: '#64748b', fontSize: '12px', lineHeight: 1.5 }}>
                                                        {request.reasons.map((reason) => (
                                                            <li key={reason}>{reason}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                    <Calendar size={13} color="#64748b" />
                                                    <input
                                                        type="datetime-local"
                                                        value={scheduledTimes[request.requestId] || ''}
                                                        onChange={(event) => {
                                                            event.stopPropagation();
                                                            onTimeChange(request.requestId, event.target.value);
                                                        }}
                                                        style={{
                                                            fontSize: '12px',
                                                            border: 'none',
                                                            background: 'transparent',
                                                            outline: 'none',
                                                            color: '#1e293b',
                                                            fontWeight: 500
                                                        }}
                                                    />
                                                </div>
                                                {isSelected ? (
                                                    <CheckCircle size={22} color="#059669" />
                                                ) : (
                                                    <div style={{ width: '22px', height: '22px', border: '2px solid #cbd5e1', borderRadius: '50%' }} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                className={styles.confirmBtn}
                onClick={onOpenConfirmModal}
                disabled={selectedCount === 0}
            >
                <Send size={15} />
                <span>Confirm {selectedCount} Assignment(s)</span>
            </button>
        </div>
    );
};

export default AssignmentReview;
