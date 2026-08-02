import { useState } from 'react';
import { BarChart3, Info, TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, Database, CalendarClock } from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

/**
 * Generates human-readable action prompts from raw predictive analytics data.
 */
const generateActionInsights = (predictiveInsights) => {
    const insights = predictiveInsights?.insights || {};
    const predictions = predictiveInsights?.predictions || [];
    const stats = predictiveInsights?.statisticalSummary || {};
    const actions = [];

    const confidence = insights.predictionConfidence || 0;
    const trend = insights.trendDirection || 'Stable';
    const seasonal = insights.seasonalityDetected || false;
    const outliers = insights.outlierCount || 0;

    // Trend-based action
    if (trend === 'Increasing' && confidence >= 50) {
        const nextPred = predictions[0];
        actions.push({
            icon: <TrendingUp size={18} />,
            color: '#10b981',
            bg: '#ecfdf5',
            border: '#a7f3d0',
            title: 'Rising Drop-Off Volume',
            message: nextPred
                ? `Drop-offs are trending upward — next month forecast is ~${nextPred.predictedDropoffs} drop-offs. Consider pre-dispatching additional collectors.`
                : 'Drop-off activity is increasing. Monitor bin fill rates more closely for timely pickups.'
        });
    } else if (trend === 'Decreasing' && confidence >= 50) {
        actions.push({
            icon: <TrendingDown size={18} />,
            color: '#ef4444',
            bg: '#fef2f2',
            border: '#fecaca',
            title: 'Declining Drop-Off Activity',
            message: 'Drop-offs are trending downward. This could indicate reduced community engagement — consider running a recycling awareness campaign.'
        });
    } else {
        actions.push({
            icon: <Minus size={18} />,
            color: '#6b7280',
            bg: '#f9fafb',
            border: '#e5e7eb',
            title: 'Stable Activity',
            message: 'Drop-off volume is stable with no significant growth or decline detected.'
        });
    }

    // Seasonality-based action
    if (seasonal) {
        actions.push({
            icon: <CalendarClock size={18} />,
            color: '#f59e0b',
            bg: '#fffbeb',
            border: '#fde68a',
            title: 'Seasonal Pattern Detected',
            message: 'Recurring seasonal peaks found in your data. Use this to pre-schedule collector shifts during historically busy periods.'
        });
    }

    // Outlier-based action
    if (outliers > 0) {
        actions.push({
            icon: <AlertTriangle size={18} />,
            color: '#ef4444',
            bg: '#fef2f2',
            border: '#fecaca',
            title: `${outliers} Outlier ${outliers === 1 ? 'Month' : 'Months'} Detected`,
            message: outliers === 1
                ? 'One month had an unusual spike or drop in activity. Investigate if it was caused by an event, outage, or data issue.'
                : `${outliers} months showed abnormal activity levels. Review these periods for potential causes like events, outages, or data issues.`
        });
    }

    // Confidence-based guidance
    if (confidence >= 70) {
        actions.push({
            icon: <Lightbulb size={18} />,
            color: '#2563eb',
            bg: '#eff6ff',
            border: '#bfdbfe',
            title: 'High-Confidence Forecasts Available',
            message: `Prediction confidence is ${confidence}% — forecasts are reliable and can be used for proactive collector scheduling.`
        });
    }

    return actions;
};

/**
 * Determines if the system has enough data for meaningful analytics.
 */
const getDataSufficiency = (predictiveInsights) => {
    const predictions = predictiveInsights?.predictions || [];
    const confidence = predictiveInsights?.insights?.predictionConfidence || 0;
    const stats = predictiveInsights?.statisticalSummary || {};

    if (!predictions.length && confidence === 0 && !stats.mean) {
        return { level: 'none', weeksNeeded: 8 };
    }
    if (confidence < 30) {
        return { level: 'low', weeksNeeded: 4 };
    }
    return { level: 'sufficient', weeksNeeded: 0 };
};

const PredictiveInsights = ({ predictiveInsights = {} }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const insights = predictiveInsights.insights || {};
    const actionInsights = generateActionInsights(predictiveInsights);
    const dataSufficiency = getDataSufficiency(predictiveInsights);

    return (
        <div className={styles.sectionContainer}>
            <h2 className={styles.sectionTitle}>Predictive Insights</h2>
            <p className={styles.sectionSubtext}>Recommendations for bin operations and collector dispatch.</p>

            {/* Cold-Start Guidance Banner */}
            {dataSufficiency.level !== 'sufficient' && (
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px 20px',
                    background: dataSufficiency.level === 'none' ? '#f8fafc' : '#fffbeb',
                    border: `1px solid ${dataSufficiency.level === 'none' ? '#e2e8f0' : '#fde68a'}`,
                    borderRadius: '10px',
                    marginBottom: '16px'
                }}>
                    <Database size={20} style={{ color: dataSufficiency.level === 'none' ? '#64748b' : '#d97706', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                            {dataSufficiency.level === 'none' ? 'Collecting Initial Data' : 'Building Prediction Accuracy'}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                            {dataSufficiency.level === 'none'
                                ? `The system needs approximately ${dataSufficiency.weeksNeeded} more weeks of drop-off activity to generate accurate predictions. Analytics will improve automatically as data flows in.`
                                : `Prediction confidence is still building. About ${dataSufficiency.weeksNeeded} more weeks of data will significantly improve forecast accuracy.`
                            }
                        </p>
                    </div>
                </div>
            )}

            <div className={styles.insightsGrid}>
                {/* Action-Oriented Insight Cards */}
                <div className={styles.insightCards}>
                    {actionInsights.map((action, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '14px 16px',
                            background: action.bg,
                            border: `1px solid ${action.border}`,
                            borderRadius: '10px',
                            transition: 'box-shadow 0.15s ease'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                color: action.color,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                {action.icon}
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{action.title}</p>
                                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>{action.message}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Forecast Snapshot */}
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
                                    <div className={styles.forecastDetail}>est. drop-offs</div>
                                    {pred.lowerBound !== undefined && pred.upperBound !== undefined ? (
                                        <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600, marginTop: '4px', background: '#ffffff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                            Range: {pred.lowerBound} – {pred.upperBound}
                                        </div>
                                    ) : (
                                        <div className={styles.forecastDetail}>{pred.confidence}% confidence</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '20px 16px',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px dashed #cbd5e1'
                        }}>
                            <Database size={28} style={{ color: '#94a3b8' }} />
                            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 }}>
                                Not enough data to generate predictions yet.
                            </p>
                            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                                Continue collecting drop-off data to unlock forecasting.
                            </p>
                        </div>
                    )}
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '16px' }}>
                        {insights.predictionConfidence > 70
                            ? '✅ Strong historical pattern detected — predictions are reliable.'
                            : insights.predictionConfidence > 40
                            ? '⚠️ Moderate pattern — predictions should be used with caution.'
                            : '📊 Low confidence — more data needed for reliable predictions.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PredictiveInsights;

