import { useState } from 'react';
import { Info } from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

const ForecastTable = ({ forecast, loading, error }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    const tooltipStyle = {
        position: 'absolute', top: '100%', right: 0, marginTop: '8px',
        backgroundColor: '#1F2937', color: '#F9FAFB', padding: '12px',
        borderRadius: '8px', fontSize: '12px', width: '240px', zIndex: 50,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', pointerEvents: 'none',
        lineHeight: '1.5', textAlign: 'left', fontWeight: 'normal', textTransform: 'none'
    };

    return (
    <div className={styles.chartCard} style={{ minHeight: '320px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>Forecasted Request Volume</h3>
            <div 
                style={{ position: 'relative', cursor: 'help', color: '#9CA3AF', display: 'flex' }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
            >
                <Info size={18} />
                {showTooltip && (
                    <div style={tooltipStyle}>Uses an ARIMA machine-learning model to analyze your 90-day historical trends and predict demand for the upcoming week.</div>
                )}
            </div>
        </div>
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
    );
};

export default ForecastTable;
