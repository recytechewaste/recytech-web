import InfoTooltip from '../../components/InfoTooltip';
import styles from '../../styles/Dashboard.module.css';

const ResourceAllocationSummary = ({ summary }) => {
    return (
    <div className={styles.chartCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Resource Allocation Summary</h3>
                <InfoTooltip
                    title="Fleet Resource Allocation"
                    content="Compares the aggregate payload capacity of active collection vehicles against current pending request volume."
                    size={16}
                    position="bottom"
                    width={260}
                />
            </div>
        </div>
        <span className={styles.chartSub}>Collector capacity and pending operational load</span>
        <table className={styles.activityTable}>
            <tbody>
                <tr>
                    <td>
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
                    <td>{summary.activeCollectors || 0}</td>
                </tr>
                <tr>
                    <td>
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
                    <td>{summary.suggestedCollectorsNeeded || 0}</td>
                </tr>
                <tr>
                    <td>
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
                    <td>{summary.totalLoad || 0} of {summary.totalCapacity || 0}</td>
                </tr>
                <tr>
                    <td>
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
                    <td>{summary.utilizationRate || 0}%</td>
                </tr>
                <tr>
                    <td>
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
                    <td>{summary.highPriorityRequests || 0}</td>
                </tr>
                <tr>
                    <td>
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
                    <td>PHP {(summary.totalEstimatedValue || 0).toLocaleString()}</td>
                </tr>
            </tbody>
        </table>
    </div>
    );
};

export default ResourceAllocationSummary;
