import InfoTooltip from '../../components/InfoTooltip';
import styles from '../../styles/Dashboard.module.css';

const countHighPriorityRequests = (requests = []) =>
    requests.filter((request) => ['Critical', 'High'].includes(request.priorityLevel)).length;

const CollectorRecommendationsTable = ({ recommendations, loading, error }) => {
    return (
    <div className={styles.chartCard} style={{ minHeight: '320px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Collector Recommendations</h3>
                <InfoTooltip
                    title="Collector Recommendations"
                    content="Intelligent dispatch suggestions that match heavy/bulky requests to appropriate vehicles while balancing route capacity across drivers."
                    size={16}
                    position="bottom"
                    width={270}
                />
            </div>
        </div>
        <span className={styles.chartSub}>Suggested assignments for pending approved requests</span>
        {loading ? (
            <p>Loading recommendations...</p>
        ) : error ? (
            <p style={{ color: '#dc2626' }}>{error}</p>
        ) : recommendations.length === 0 ? (
            <p>No pending requests available for recommendation.</p>
        ) : (
            <div style={{ overflowX: 'auto' }}>
                <table className={styles.activityTable} style={{ width: '100%', marginTop: '16px' }}>
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
                            <th>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    Assigned Requests
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
                        {recommendations.map((item) => (
                            <tr key={item.collectorId}>
                                <td>{item.collectorName}</td>
                                <td>{item.vehicleType}</td>
                                <td>{Math.round((item.loadAssigned / item.capacity) * 100)}% used</td>
                                <td>{countHighPriorityRequests(item.assignedRequests)} high</td>
                                <td>{item.assignedRequests.length}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
    );
};

export default CollectorRecommendationsTable;
