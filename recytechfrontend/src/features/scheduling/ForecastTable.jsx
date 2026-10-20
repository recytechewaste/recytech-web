import React, { useState } from 'react';
import InfoTooltip from '../../components/InfoTooltip';
import styles from '../../styles/SmartScheduling.module.css';
import { BarChart3, Calendar, Flame } from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ForecastTable = ({ forecast = [], loading, error }) => {
    const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

    const maxRequests = Math.max(...forecast.map(f => f.predictedRequests || 0), 1);
    const peakItem = forecast.reduce((max, cur) => (cur.predictedRequests > (max?.predictedRequests || 0) ? cur : max), null);
    const totalForecast = forecast.reduce((sum, f) => sum + (f.predictedRequests || 0), 0);

    return (
        <div className={styles.card} style={{ minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f766e' }}>
                        <BarChart3 size={15} />
                    </div>
                    <h3 className={styles.cardTitle}>7-Day Demand Forecast</h3>
                    <InfoTooltip
                        title="Time-Series Demand Forecast"
                        content="Uses 90-day historical collection patterns to predict incoming drop-off and pickup demand over the next 7 days, highlighting peak collection volume days."
                        size={15}
                        position="bottom"
                        width={270}
                    />
                </div>
                {forecast.length > 0 && (
                    <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setViewMode('chart')}
                            style={{
                                padding: '4px 10px',
                                border: 'none',
                                background: viewMode === 'chart' ? '#ffffff' : 'transparent',
                                color: viewMode === 'chart' ? '#0f766e' : '#64748b',
                                fontWeight: 600,
                                fontSize: '11px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'chart' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                            }}
                        >
                            Visual Chart
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            style={{
                                padding: '4px 10px',
                                border: 'none',
                                background: viewMode === 'table' ? '#ffffff' : 'transparent',
                                color: viewMode === 'table' ? '#0f766e' : '#64748b',
                                fontWeight: 600,
                                fontSize: '11px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                            }}
                        >
                            Data Table
                        </button>
                    </div>
                )}
            </div>

            <span className={styles.cardSub}>
                Algorithmic projection of upcoming collection demand ({totalForecast} total requests projected)
            </span>

            {loading ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>Loading forecast...</p>
            ) : error ? (
                <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>
            ) : forecast.length === 0 ? (
                <div style={{ padding: '28px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center', color: '#64748b', fontSize: '13px', border: '1px dashed #cbd5e1' }}>
                    No forecast data available. Complete more collection runs to populate time-series trends.
                </div>
            ) : viewMode === 'chart' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    {/* Visual Bar Chart */}
                    <div className={styles.forecastChartWrap}>
                        <div className={styles.forecastBars}>
                            {forecast.map((item, idx) => {
                                const count = item.predictedRequests || 0;
                                const heightPercent = Math.max(12, Math.round((count / maxRequests) * 100));
                                const dateObj = new Date(item.date);
                                const dayName = !isNaN(dateObj.getTime()) ? WEEKDAYS[dateObj.getDay()] : `D${idx + 1}`;
                                const dateNum = !isNaN(dateObj.getTime()) ? dateObj.getDate() : idx + 1;
                                const isPeak = peakItem && item.date === peakItem.date && count > 0;

                                return (
                                    <div key={item.date} className={styles.forecastBarCol}>
                                        <span className={styles.barValBadge}>
                                            {count}
                                        </span>
                                        <div className={styles.barTrack}>
                                            <div
                                                className={`${styles.barFill} ${isPeak ? styles.barFillPeak : ''}`}
                                                style={{ height: `${heightPercent}%` }}
                                            />
                                        </div>
                                        <span className={styles.barDayLabel}>
                                            {dayName} {dateNum}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Peak Day Insight Banner */}
                    {peakItem && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginTop: '12px',
                            padding: '8px 12px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#92400e'
                        }}>
                            <Flame size={15} color="#d97706" />
                            <span>
                                <strong>Expected Peak Day:</strong> {peakItem.date} (~{peakItem.predictedRequests} requests). Ensure extra driver availability.
                            </span>
                        </div>
                    )}
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
                            {forecast.map((item) => {
                                const isPeak = peakItem && item.date === peakItem.date;
                                return (
                                    <tr key={item.date} style={{ background: isPeak ? '#fffbeb' : 'transparent' }}>
                                        <td style={{ fontWeight: 600, color: '#0f172a' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar size={13} color="#64748b" />
                                                {item.date}
                                                {isPeak && (
                                                    <span style={{ fontSize: '10px', background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                                        Peak
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span style={{
                                                padding: '2px 10px',
                                                borderRadius: '12px',
                                                background: isPeak ? '#fef3c7' : '#ecfdf5',
                                                color: isPeak ? '#92400e' : '#065f46',
                                                fontWeight: 700,
                                                fontSize: '12px',
                                                border: `1px solid ${isPeak ? '#fde68a' : '#a7f3d0'}`
                                            }}>
                                                {item.predictedRequests} requests
                                            </span>
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

export default ForecastTable;
