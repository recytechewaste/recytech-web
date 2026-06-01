import { useState } from 'react';
import { Info } from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

const countHighPriorityRequests = (requests = []) =>
    requests.filter((request) => ['Critical', 'High'].includes(request.priorityLevel)).length;

const CollectorRecommendationsTable = ({ recommendations, loading, error }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    const tooltipStyle = {
        position: 'absolute', top: '100%', right: 0, marginTop: '8px',
        backgroundColor: '#1F2937', color: '#F9FAFB', padding: '12px',
        borderRadius: '8px', fontSize: '12px', width: '250px', zIndex: 50,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', pointerEvents: 'none',
        lineHeight: '1.5', textAlign: 'left', fontWeight: 'normal', textTransform: 'none'
    };

    return (
    <div className={styles.chartCard} style={{ minHeight: '320px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>Collector Recommendations</h3>
            <div 
                style={{ position: 'relative', cursor: 'help', color: '#9CA3AF', display: 'flex' }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
            >
                <Info size={18} />
                {showTooltip && (
                    <div style={tooltipStyle}>Intelligent dispatch suggestions that match heavy/bulky requests to appropriate vehicles while optimizing route capacity.</div>
                )}
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
                            <th>Collector</th>
                            <th>Vehicle</th>
                            <th>Capacity</th>
                            <th>Priority Load</th>
                            <th>Assigned Requests</th>
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
