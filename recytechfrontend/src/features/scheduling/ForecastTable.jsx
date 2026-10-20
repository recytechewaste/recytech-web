import InfoTooltip from '../../components/InfoTooltip';
import styles from '../../styles/SmartScheduling.module.css';

const ForecastTable = ({ forecast = [], loading, error }) => {
    return (
        <div className={styles.card} style={{ minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 className={styles.cardTitle}>Forecasted Request Volume</h3>
                    <InfoTooltip
                        title="7-Day Demand Forecast"
                        content="Daily time-series projection analyzing 90-day historical collection request trends to forecast incoming load over the next 7 calendar days."
                        size={15}
                        position="bottom"
                        width={260}
                    />
                </div>
            </div>
            <span className={styles.cardSub}>Time-series prediction for the next 7 days</span>
            {loading ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>Loading forecast...</p>
            ) : error ? (
                <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>
            ) : forecast.length === 0 ? (
                <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center', color: '#64748b', fontSize: '13px', border: '1px dashed #cbd5e1' }}>
                    No forecast data available.
                </div>
            ) : (
                <div className={styles.tableContainer} style={{ flex: 1 }}>
                    <table className={styles.table}>
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
                                <th style={{ textAlign: 'right' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
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
                                    <td style={{ fontWeight: 500, color: '#0f172a' }}>{item.date}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span style={{
                                            padding: '2px 10px',
                                            borderRadius: '12px',
                                            background: '#ecfdf5',
                                            color: '#065f46',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            border: '1px solid #a7f3d0'
                                        }}>
                                            {item.predictedRequests} reqs
                                        </span>
                                    </td>
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
