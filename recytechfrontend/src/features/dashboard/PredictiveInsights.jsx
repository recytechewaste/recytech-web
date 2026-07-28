import { useState } from 'react';
import { BarChart3, Info } from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

const PredictiveInsights = ({ predictiveInsights }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const insights = predictiveInsights.insights || {};

    return (
        <div className={styles.sectionContainer}>
            <h2 className={styles.sectionTitle}>Predictive Insights</h2>
            <p className={styles.sectionSubtext}>Forecasting for bin drop-off activity and demand trends.</p>

            <div className={styles.insightsGrid}>
                <div className={styles.insightCards}>
                    <div className={`${styles.kpiCard} ${insights.trendDirection === 'Increasing' ? '' : insights.trendDirection === 'Decreasing' ? styles.kpiDanger : ''}`}>
                        <span className={styles.kpiLabel}>Trend Direction</span>
                        <span className={styles.kpiValue}>{insights.trendDirection || 'N/A'}</span>
                    </div>
                    <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>Prediction Confidence</span>
                        <span className={styles.kpiValue}>{insights.predictionConfidence || 0}%</span>
                    </div>
                    <div className={`${styles.kpiCard} ${insights.seasonalityDetected ? styles.kpiWarning : ''}`}>
                        <span className={styles.kpiLabel}>
                            Seasonal Patterns
                            <Info style={{ position: 'absolute', right: 0 }} size={12} />
                        </span>
                        <span className={styles.kpiValue}>{insights.seasonalityDetected ? 'Detected' : 'None'}</span>
                    </div>
                    <div className={`${styles.kpiCard} ${insights.outlierCount > 0 ? styles.kpiDanger : ''}`}>
                        <span className={styles.kpiLabel}>Outlier Months</span>
                        <span className={styles.kpiValue}>{insights.outlierCount || 0}</span>
                    </div>
                </div>

                <div className={styles.forecastCard}>
                    <div className={styles.chartCardHeader}>
                        <h3 className={styles.chartTitle}>Forecast Snapshot</h3>
                        <div
                            style={{ position: 'relative', cursor: 'help', color: '#9CA3AF', display: 'flex' }}
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                        >
                            <Info size={18} />
                            {showTooltip && (
                                <div className={styles.tooltip}>
                                    Uses historical drop-off data to predict future volume trends. High confidence means the data follows a clear pattern.
                                </div>
                            )}
                        </div>
                    </div>
                    <BarChart3 size={40} color="#2563EB" style={{ margin: '12px 0 8px' }} />
                    <p style={{ margin: '4px 0 16px', fontSize: '14px', color: '#6B7280' }}>
                        Next 3 Months Prediction
                    </p>
                    {predictiveInsights.predictions && predictiveInsights.predictions.length > 0 ? (
                        <div className={styles.forecastGrid}>
                            {predictiveInsights.predictions.map((pred, idx) => (
                                <div key={idx} className={styles.forecastItem}>
                                    <div className={styles.forecastMonth}>{pred.month}</div>
                                    <div className={styles.forecastValue}>{pred.predictedDropoffs}</div>
                                    <div className={styles.forecastDetail}>drop-offs</div>
                                    <div className={styles.forecastDetail}>{pred.confidence}% confidence</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>
                            Not enough data to generate predictions yet.
                        </p>
                    )}
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '16px' }}>
                        {insights.predictionConfidence > 70
                            ? 'Strong historical pattern detected — predictions are reliable.'
                            : insights.predictionConfidence > 40
                            ? 'Moderate pattern — predictions should be used with caution.'
                            : 'Low confidence — more data needed for reliable predictions.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PredictiveInsights;
