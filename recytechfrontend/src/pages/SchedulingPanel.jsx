import { useEffect, useState } from 'react';
import api from '../api/client';
import styles from '../styles/Dashboard.module.css';
import { Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const SchedulingPanel = () => {
    const [forecast, setForecast] = useState([]);
    const [history, setHistory] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState('');
    const [selectedAssignments, setSelectedAssignments] = useState({});
    const [scheduledTimes, setScheduledTimes] = useState({});

    useEffect(() => {
        const fetchScheduling = async () => {
            try {
                const [forecastRes, recommendationRes] = await Promise.all([
                    api.get('/scheduling/forecast?days=7'),
                    api.get('/scheduling/recommendations')
                ]);

                setForecast(forecastRes.data.forecast || []);
                setHistory(forecastRes.data.history || []);
                setRecommendations(recommendationRes.data.recommendations || []);

                // Initialize scheduled times to tomorrow 9 AM
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                const timeString = tomorrow.toISOString().slice(0, 16);
                
                recommendationRes.data.recommendations?.forEach((rec) => {
                    rec.assignedRequests?.forEach((req) => {
                        setScheduledTimes(prev => ({
                            ...prev,
                            [req.requestId]: timeString
                        }));
                    });
                });
            } catch (err) {
                console.error('Scheduling API error', err);
                setError('Unable to load scheduling suggestions.');
            } finally {
                setLoading(false);
            }
        };

        fetchScheduling();
    }, []);

    const toggleAssignmentSelection = (requestId, collectorId) => {
        setSelectedAssignments(prev => {
            const key = `${requestId}-${collectorId}`;
            const newSelected = { ...prev };
            if (newSelected[key]) {
                delete newSelected[key];
            } else {
                newSelected[key] = { requestId, collectorId };
            }
            return newSelected;
        });
    };

    const handleTimeChange = (requestId, value) => {
        setScheduledTimes(prev => ({
            ...prev,
            [requestId]: value
        }));
    };

    const handleConfirmAssignments = async () => {
        const assignments = Object.values(selectedAssignments).map(({ requestId, collectorId }) => ({
            requestId,
            collectorId,
            scheduledAt: scheduledTimes[requestId]
        }));

        if (assignments.length === 0) {
            setConfirmMessage('Please select at least one assignment to confirm.');
            return;
        }

        setConfirming(true);
        try {
            const response = await api.post('/scheduling/confirm-assignments', { assignments });
            
            if (response.data.successful > 0) {
                setConfirmMessage(`✓ ${response.data.successful} assignment(s) confirmed successfully!`);
                setSelectedAssignments({});
                // Refresh recommendations
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }

            if (response.data.failed > 0) {
                setConfirmMessage(`⚠ ${response.data.failed} assignment(s) failed. Check details below.`);
            }
        } catch (err) {
            setConfirmMessage(`Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setConfirming(false);
        }
    };

    const allRequestsInRecommendations = recommendations.reduce((count, rec) => count + rec.assignedRequests.length, 0);

    return (
        <div className={styles.sectionContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 320px' }}>
                    <h2 className={styles.sectionHeaderLeft}>Smart Scheduling</h2>
                    <p className={styles.sectionSubHeaderLeft}>Forecast demand and review collector recommendations before confirming assignments.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div className={`${styles.metricCard} ${styles.successCard}`} style={{ minWidth: '220px' }}>
                        <span>Next 7-day forecast</span>
                        <h3>{forecast.reduce((sum, item) => sum + (item.predictedRequests || 0), 0)} requests</h3>
                    </div>
                    <div className={`${styles.metricCard}`} style={{ minWidth: '220px' }}>
                        <span>Pending recommendations</span>
                        <h3>{allRequestsInRecommendations}</h3>
                    </div>
                </div>
            </div>

            <div className={styles.chartsGrid} style={{ marginTop: '24px' }}>
                {/* Forecast Chart */}
                <div className={styles.chartCard} style={{ minHeight: '320px' }}>
                    <h3 className={styles.cardTitle}>Forecasted Request Volume</h3>
                    <span className={styles.chartSub}>ARIMA-based prediction for the next 7 days</span>
                    {loading ? (
                        <p>Loading forecast...</p>
                    ) : error ? (
                        <p style={{ color: '#dc2626' }}>{error}</p>
                    ) : forecast.length === 0 ? (
                        <p>No forecast data available.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className={styles.activityTable} style={{ width: '100%', marginTop: '16px' }}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Predicted Requests</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {forecast.map((item) => (
                                        <tr key={item.date}>
                                            <td>{item.date}</td>
                                            <td>{item.predictedRequests}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Collector Recommendations Summary */}
                <div className={styles.chartCard} style={{ minHeight: '320px' }}>
                    <h3 className={styles.cardTitle}>Collector Recommendations</h3>
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
                                        <th>Assigned Requests</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recommendations.map((item) => (
                                        <tr key={item.collectorId}>
                                            <td>{item.collectorName}</td>
                                            <td>{item.vehicleType}</td>
                                            <td>{Math.round((item.loadAssigned / item.capacity) * 100)}% used</td>
                                            <td>{item.assignedRequests.length}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed Assignment Review */}
            {recommendations.length > 0 && (
                <div className={styles.chartCard} style={{ marginTop: '24px' }}>
                    <h3 className={styles.cardTitle}>Review & Confirm Assignments</h3>
                    <span className={styles.chartSub}>Select assignments and set scheduled times before confirming</span>
                    
                    <div style={{ marginTop: '16px' }}>
                        {recommendations.map((collector) => (
                            <div key={collector.collectorId} style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                                <h4 style={{ margin: '0 0 12px 0', color: '#111827', fontWeight: '600' }}>
                                    {collector.collectorName} ({collector.vehicleType})
                                </h4>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    {collector.assignedRequests.map((request) => {
                                        const key = `${request.requestId}-${collector.collectorId}`;
                                        const isSelected = selectedAssignments[key];
                                        return (
                                            <div
                                                key={request.requestId}
                                                style={{
                                                    padding: '12px',
                                                    border: isSelected ? '2px solid #2563EB' : '1px solid #e5e7eb',
                                                    borderRadius: '6px',
                                                    backgroundColor: isSelected ? '#f0f9ff' : '#f9fafb',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onClick={() => toggleAssignmentSelection(request.requestId, collector.collectorId)}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '500', color: '#111827' }}>
                                                            {request.residentName} - {request.wasteType}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                                                            {request.location}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <input
                                                            type="datetime-local"
                                                            value={scheduledTimes[request.requestId] || ''}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                handleTimeChange(request.requestId, e.target.value);
                                                            }}
                                                            style={{
                                                                padding: '6px 8px',
                                                                fontSize: '12px',
                                                                border: '1px solid #d1d5db',
                                                                borderRadius: '4px'
                                                            }}
                                                        />
                                                        {isSelected ? (
                                                            <CheckCircle size={20} color="#10b981" />
                                                        ) : (
                                                            <div style={{ width: '20px', height: '20px', border: '2px solid #d1d5db', borderRadius: '50%' }} />
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
                        onClick={() => setShowConfirmModal(true)}
                        disabled={Object.keys(selectedAssignments).length === 0}
                        style={{
                            marginTop: '16px',
                            padding: '10px 20px',
                            backgroundColor: Object.keys(selectedAssignments).length === 0 ? '#d1d5db' : '#2563EB',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: Object.keys(selectedAssignments).length === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}
                    >
                        Confirm {Object.keys(selectedAssignments).length} Assignment(s)
                    </button>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '24px',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 12px 0', color: '#111827' }}>Confirm Assignments</h3>
                        <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
                            You are about to confirm {Object.keys(selectedAssignments).length} collector assignment(s). This action cannot be easily undone.
                        </p>

                        {confirmMessage && (
                            <div style={{
                                padding: '12px',
                                marginBottom: '16px',
                                borderRadius: '6px',
                                backgroundColor: confirmMessage.includes('Error') ? '#fee2e2' : '#d4edda',
                                color: confirmMessage.includes('Error') ? '#991b1b' : '#155724',
                                fontSize: '14px'
                            }}>
                                {confirmMessage}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setConfirmMessage('');
                                }}
                                disabled={confirming}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#e5e7eb',
                                    color: '#111827',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: confirming ? 'not-allowed' : 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAssignments}
                                disabled={confirming}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: confirming ? '#d1d5db' : '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: confirming ? 'not-allowed' : 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                {confirming ? 'Confirming...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Guidance */}
            <div className={styles.chartCard} style={{ marginTop: '24px' }}>
                <h3 className={styles.cardTitle}>Scheduling Guidance</h3>
                <p className={styles.chartSub}>How to use the smart scheduling assistant</p>
                <ul style={{ marginTop: '12px', paddingLeft: '20px', color: '#374151', lineHeight: '1.6' }}>
                    <li>Review the 7-day demand forecast to understand expected volume.</li>
                    <li>Check recommended collector assignments based on vehicle capacity.</li>
                    <li>Select assignments and set the scheduled date/time for each request.</li>
                    <li>Confirm the selected assignments to apply them to the system.</li>
                    <li>The system checks for scheduling conflicts before confirming.</li>
                </ul>
            </div>
        </div>
    );
};

export default SchedulingPanel;
