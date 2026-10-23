import InfoTooltip from '../../components/InfoTooltip';
import styles from '../../styles/SmartScheduling.module.css';

const ResourceAllocationSummary = ({ summary = {} }) => {
    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 className={styles.cardTitle}>Resource Allocation Summary</h3>
                    <InfoTooltip
                        title="Fleet Resource Allocation"
                        content="Compares the aggregate payload capacity of active collection vehicles against current pending request volume."
                        size={15}
                        position="bottom"
                        width={260}
                    />
                </div>
            </div>
            <span className={styles.cardSub}>Collector capacity and pending operational load</span>
            <table className={styles.summaryTable}>
                <tbody>
                    <tr>
                        <td className={styles.summaryLabel}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                Active collectors
                                <InfoTooltip
                                    title="Available Fleet"
                                    content="Total registered collector drivers currently marked 'Active' and ready for dispatch."
                                    size={12}
                                    position="bottom"
                                    width={230}
                                />
                            </span>
                        </td>
                        <td className={styles.summaryVal}>{summary.activeCollectors || 0}</td>
                    </tr>
                    <tr>
                        <td className={styles.summaryLabel}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                Suggested collectors needed
                                <InfoTooltip
                                    title="Optimal Fleet Requirement"
                                    content="The algorithmic minimum number of collection vehicles required to satisfy pending pickups without vehicle capacity overload."
                                    size={12}
                                    position="bottom"
                                    width={260}
                                />
                            </span>
                        </td>
                        <td className={styles.summaryVal}>{summary.suggestedCollectorsNeeded || 0}</td>
                    </tr>
                    <tr>
                        <td className={styles.summaryLabel}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                Pending request load
                                <InfoTooltip
                                    title="Aggregate Payload"
                                    content="Sum of estimated weight/volume across all unfulfilled pickup requests versus the total maximum carrying capacity."
                                    size={12}
                                    position="bottom"
                                    width={250}
                                />
                            </span>
                        </td>
                        <td className={styles.summaryVal}>
                            <span style={{
                                padding: '2px 8px',
                                background: '#f1f5f9',
                                borderRadius: '6px',
                                fontSize: '12px'
                            }}>
                                {summary.totalLoad || 0} of {summary.totalCapacity || 0} units
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td className={styles.summaryLabel}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                Capacity utilization
                                <InfoTooltip
                                    title="Capacity Utilization Rate"
                                    content="Percentage of active fleet capacity committed. Values >85% indicate a need to schedule additional vehicle shifts."
                                    size={12}
                                    position="bottom"
                                    width={260}
                                />
                            </span>
                        </td>
                        <td className={styles.summaryVal}>
                            <span style={{
                                color: (summary.utilizationRate || 0) > 85 ? '#dc2626' : '#0f766e',
                                fontWeight: 700
                            }}>
                                {summary.utilizationRate || 0}%
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td className={styles.summaryLabel}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                High-priority requests
                                <InfoTooltip
                                    title="Urgent Pickups"
                                    content="Requests elevated to Critical or High priority due to bin fill levels ≥80% or requests waiting ≥3 days."
                                    size={12}
                                    position="bottom"
                                    width={250}
                                />
                            </span>
                        </td>
                        <td className={styles.summaryVal}>
                            <span style={{
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: (summary.highPriorityRequests || 0) > 0 ? '#fee2e2' : '#f1f5f9',
                                color: (summary.highPriorityRequests || 0) > 0 ? '#991b1b' : '#334155',
                                fontSize: '11px',
                                fontWeight: 700
                            }}>
                                {summary.highPriorityRequests || 0} urgent
                            </span>
                        </td>
                    </tr>
                    {/*<tr>
                        <td className={styles.summaryLabel}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                Estimated recyclable value
                                <InfoTooltip
                                    title="Projected Recovery Value"
                                    content="Estimated financial value of raw recyclables contained in pending collection requests."
                                    size={12}
                                    position="bottom"
                                    width={240}
                                />
                            </span>
                        </td>
                        <td className={styles.summaryVal} style={{ color: '#047857' }}>
                            PHP {(summary.totalEstimatedValue || 0).toLocaleString()}
                        </td>
                    </tr>*/}
                </tbody>
            </table>
        </div>
    );
};

export default ResourceAllocationSummary;
