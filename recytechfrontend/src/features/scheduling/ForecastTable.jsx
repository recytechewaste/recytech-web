import InfoTooltip from '../../components/InfoTooltip';
import styles from '../../styles/Dashboard.module.css';

const ForecastTable = ({ forecast, loading, error }) => {
    return (
    <div className={styles.chartCard} style={{ minHeight: '320px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 className={styles.cardTitle} style={{ margin: 0 }}>Forecasted Request Volume</h3>
                <InfoTooltip
                    title="7-Day Demand Forecast"
                    content="Daily time-series projection analyzing 90-day historical collection request trends to forecast incoming load over the next 7 calendar days."
                    size={16}
                    position="bottom"
                    width={260}
                />
            </div>
        </div>
        <span className={styles.chartSub}>Time-series prediction for the next 7 days</span>
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
                            <th>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    Date
                                    <InfoTooltip
                                        title="Forecast Date"
                                        content="Specific upcoming calendar date for which pickup request volume is estimated."
                                        size={11}
                                        position="bottom"
                                        width={200}
                                    />
                                </span>
                            </th>
                            <th>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    Predicted Requests
                                    <InfoTooltip
                                        title="Projected Volume"
                                        content="Estimated number of inbound bin collection pickups anticipated on this day."
                                        size={11}
                                        position="bottom"
                                        width={220}
                                    />
                                </span>
                            </th>
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
    );
};

export default ForecastTable;
