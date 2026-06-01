import { useState } from 'react';
import { BarChart3, Info } from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

const getCorrelationColor = (value) => {
    const absoluteValue = Math.abs(value || 0);

    if (absoluteValue > 0.7) return '#10B981';
    if (absoluteValue > 0.3) return '#F59E0B';
    return '#EF4444';
};

const getCorrelationDescription = (value) => {
    const absoluteValue = Math.abs(value || 0);

    if (absoluteValue > 0.7) return 'Strong relationship between requests and completions';
    if (absoluteValue > 0.3) return 'Moderate relationship detected';
    return 'Weak or no relationship found';
};

const PredictiveInsights = ({ predictiveInsights }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [showSeasonalTooltip, setShowSeasonalTooltip] = useState(false);
    const [showOutlierTooltip, setShowOutlierTooltip] = useState(false);
    const insights = predictiveInsights.insights || {};
    const correlationValue = predictiveInsights.correlation?.requestCompletionCorrelation || 0;

    const tooltipStyle = {
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: '8px',
        backgroundColor: '#1F2937',
        color: '#F9FAFB',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        width: '220px',
        zIndex: 50,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        pointerEvents: 'none',
        lineHeight: '1.5',
        textAlign: 'left',
        fontWeight: 'normal',
        textTransform: 'none'
    };

    return (
        <div className={styles.sectionContainer}>
            <h2 className={styles.sectionHeaderLeft}>Predictive Insights</h2>
            <p className={styles.sectionSubHeaderLeft}>Predictive analytics and forecasting.</p>

            <div className={styles.metricsLayout}>
                <div className={styles.statsColumn}>
                    <div className={`${styles.metricCard} ${insights.trendDirection === 'Increasing' ? styles.successCard : insights.trendDirection === 'Decreasing' ? styles.dangerCard : ''}`}>
                        <span>Trend Direction</span>
                        <h3>{insights.trendDirection || 'N/A'}</h3>
                    </div>
                    <div className={styles.metricCard}>
                        <span>Prediction Confidence</span>
                        <h3>{insights.predictionConfidence || 0}%</h3>
                    </div>
                    <div className={`${styles.metricCard} ${insights.seasonalityDetected ? styles.warningCard : ''}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span>Seasonal Patterns</span>
                            <div 
                                style={{ position: 'relative', cursor: 'help', color: '#9CA3AF', display: 'flex' }}
                                onMouseEnter={() => setShowSeasonalTooltip(true)}
                                onMouseLeave={() => setShowSeasonalTooltip(false)}
                                onClick={() => setShowSeasonalTooltip(!showSeasonalTooltip)}
                            >
                                <Info size={14} />
                                {showSeasonalTooltip && (
                                    <div style={tooltipStyle}>
                                        Detects recurring cycles in your request volume (e.g., regular spikes during holidays or specific months).
                                    </div>
                                )}
                            </div>
                        </div>
                        <h3>{insights.seasonalityDetected ? 'Detected' : 'None'}</h3>
                    </div>
                    <div className={`${styles.metricCard} ${insights.outlierCount > 0 ? styles.dangerCard : styles.successCard}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <span>Outlier Months</span>
                            <div 
                                style={{ position: 'relative', cursor: 'help', color: '#9CA3AF', display: 'flex' }}
                                onMouseEnter={() => setShowOutlierTooltip(true)}
                                onMouseLeave={() => setShowOutlierTooltip(false)}
                                onClick={() => setShowOutlierTooltip(!showOutlierTooltip)}
                            >
                                <Info size={14} />
                                {showOutlierTooltip && (
                                    <div style={tooltipStyle}>
                                        Months with abnormally high or low request volume that break normal baseline patterns.
                                    </div>
                                )}
                            </div>
                        </div>
                        <h3>{insights.outlierCount || 0}</h3>
                    </div>
                </div>

                <div className={styles.chartCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h3 className={styles.cardTitle} style={{ margin: 0 }}>Correlation Analysis</h3>
                        <div 
                            style={{ position: 'relative', cursor: 'help', color: '#9CA3AF', display: 'flex' }}
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                            onClick={() => setShowTooltip(!showTooltip)}
                        >
                            <Info size={18} />
                            {showTooltip && (
                                <div style={{ ...tooltipStyle, width: '260px' }}>
                                    Measures the relationship between incoming requests and completed pickups. A score near +1.0 means your fleet successfully handles high volume. A low or negative score indicates operational bottlenecks.
                                </div>
                            )}
                        </div>
                    </div>
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <BarChart3 size={44} color="#2563EB" style={{ marginBottom: '10px' }} />
                        <p style={{ margin: '10px 0', fontSize: '14px', color: '#6B7280' }}>
                            Request-Completion Correlation
                        </p>
                        <h3
                            style={{
                                fontSize: '24px',
                                margin: '10px 0',
                                color: getCorrelationColor(correlationValue)
                            }}
                        >
                            {predictiveInsights.correlation?.strength || 'N/A'} ({correlationValue.toFixed(2)})
                        </h3>
                        <p style={{ fontSize: '13px', color: '#4B5563', margin: '8px 0', fontStyle: 'italic' }}>
                            Shows how well completions scale with incoming demand.
                        </p>
                        <p style={{ fontSize: '12px', color: '#9CA3AF' }}>
                            {getCorrelationDescription(correlationValue)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PredictiveInsights;
