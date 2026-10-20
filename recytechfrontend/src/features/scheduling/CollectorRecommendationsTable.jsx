import InfoTooltip from '../../components/InfoTooltip';
import styles from '../../styles/SmartScheduling.module.css';

const countHighPriorityRequests = (requests = []) =>
    requests.filter((request) => ['Critical', 'High'].includes(request.priorityLevel)).length;

const CollectorRecommendationsTable = ({ recommendations = [], loading, error }) => {
    return (
        <div className={styles.card} style={{ minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 className={styles.cardTitle}>Collector Recommendations</h3>
                    <InfoTooltip
                        title="Collector Recommendations"
                        content="Intelligent dispatch suggestions that match heavy/bulky requests to appropriate vehicles while balancing route capacity across drivers."
                        size={15}
                        position="bottom"
                        width={270}
                    />
                </div>
            </div>
            <span className={styles.cardSub}>Suggested assignments for pending approved requests</span>
            {loading ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>Loading recommendations...</p>
            ) : error ? (
                <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>
            ) : recommendations.length === 0 ? (
                <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontSize: '13px', border: '1px dashed #cbd5e1' }}>
                    No pending requests available for recommendation.
                </div>
            ) : (
                <div className={styles.tableContainer} style={{ flex: 1 }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        Collector
                                        <InfoTooltip
                                            title="Assigned Collector"
                                            content="The designated driver responsible for executing the collection run."
                                            size={11}
                                            position="bottom"
                                            width={220}
                                        />
                                    </span>
                                </th>
                                <th>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        Vehicle
                                        <InfoTooltip
                                            title="Vehicle Profile"
                                            content="Mode of transport and cargo capacity used to determine maximum pickup volume."
                                            size={11}
                                            position="bottom"
                                            width={230}
                                        />
                                    </span>
                                </th>
                                <th>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        Capacity
                                        <InfoTooltip
                                            title="Workload Saturation"
                                            content="Percentage of vehicle cargo space committed for this shift. Over 85% alerts for load-shedding."
                                            size={11}
                                            position="bottom"
                                            width={250}
                                        />
                                    </span>
                                </th>
                                <th>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        Priority Load
                                        <InfoTooltip
                                            title="Critical Urgency Stops"
                                            content="Number of Critical or High priority pickup requests assigned to this collector."
                                            size={11}
                                            position="bottom"
                                            width={240}
                                        />
                                    </span>
                                </th>
                                <th style={{ textAlign: 'right' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                        Assigned
                                        <InfoTooltip
                                            title="Total Stops"
                                            content="Total quantity of pickup locations assigned to this collector."
                                            size={11}
                                            position="bottom"
                                            width={220}
                                        />
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {recommendations.map((item) => {
                                const capacityUsed = Math.round((item.loadAssigned / (item.capacity || 1)) * 100);
                                const highCount = countHighPriorityRequests(item.assignedRequests);
                                return (
                                    <tr key={item.collectorId}>
                                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.collectorName}</td>
                                        <td>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: '#f1f5f9',
                                                color: '#334155',
                                                fontSize: '11.5px',
                                                fontWeight: 600
                                            }}>
                                                {item.vehicleType}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 700,
                                                color: capacityUsed > 85 ? '#dc2626' : '#0f766e'
                                            }}>
                                                {capacityUsed}%
                                            </span>
                                        </td>
                                        <td>
                                            {highCount > 0 ? (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    background: '#fee2e2',
                                                    color: '#991b1b',
                                                    fontSize: '11px',
                                                    fontWeight: 700
                                                }}>
                                                    {highCount} high
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>0</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                                            {item.assignedRequests.length} stops
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CollectorRecommendationsTable;
