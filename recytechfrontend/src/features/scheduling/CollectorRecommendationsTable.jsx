import React, { useState } from 'react';
import InfoTooltip from '../../components/InfoTooltip';
import styles from '../../styles/SmartScheduling.module.css';
import { Truck, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

const countHighPriorityRequests = (requests = []) =>
    requests.filter((request) => ['Critical', 'High'].includes(request.priorityLevel)).length;

const getInitials = (name = '') => {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'C';
};

const CollectorRecommendationsTable = ({ recommendations = [], loading, error }) => {
    const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

    return (
        <div className={styles.card} style={{ minHeight: '340px', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f766e' }}>
                        <Truck size={15} />
                    </div>
                    <h3 className={styles.cardTitle}>Collector Fleet Workload</h3>
                    <InfoTooltip
                        title="Intelligent Collector Recommendations"
                        content="Evaluates driver vehicle capacity and assigns bulk/heavy pickup requests to balance workloads across the active fleet."
                        size={15}
                        position="bottom"
                        width={270}
                    />
                </div>
                {recommendations.length > 0 && (
                    <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
                        <button
                            type="button"
                            onClick={() => setViewMode('cards')}
                            style={{
                                padding: '4px 10px',
                                border: 'none',
                                background: viewMode === 'cards' ? '#ffffff' : 'transparent',
                                color: viewMode === 'cards' ? '#0f766e' : '#64748b',
                                fontWeight: 600,
                                fontSize: '11px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                boxShadow: viewMode === 'cards' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                            }}
                        >
                            Fleet Cards
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
                            Table View
                        </button>
                    </div>
                )}
            </div>

            <span className={styles.cardSub}>
                Real-time payload allocation and capacity saturation across active drivers
            </span>

            {loading ? (
                <p style={{ color: '#64748b', fontSize: '13px' }}>Loading recommendations...</p>
            ) : error ? (
                <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>
            ) : recommendations.length === 0 ? (
                <div style={{ padding: '28px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center', color: '#64748b', fontSize: '13px', border: '1px dashed #cbd5e1' }}>
                    No pending requests available for recommendation. All active pickups are scheduled.
                </div>
            ) : viewMode === 'cards' ? (
                <div className={styles.collectorGrid} style={{ flex: 1 }}>
                    {recommendations.map((item) => {
                        const capacityUsed = Math.min(100, Math.round((item.loadAssigned / (item.capacity || 1)) * 100));
                        const highCount = countHighPriorityRequests(item.assignedRequests);
                        const isOverloaded = capacityUsed > 85;
                        const isWarning = capacityUsed > 70 && !isOverloaded;

                        const barColor = isOverloaded
                            ? 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                            : isWarning
                            ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                            : 'linear-gradient(90deg, #10b981 0%, #059669 100%)';

                        return (
                            <div key={item.collectorId} className={styles.collectorCard}>
                                <div className={styles.collectorCardHeader}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className={styles.collectorAvatar}>
                                            {getInitials(item.collectorName)}
                                        </div>
                                        <div>
                                            <h4 className={styles.collectorName}>{item.collectorName}</h4>
                                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                {item.assignedRequests.length} stop{item.assignedRequests.length !== 1 ? 's' : ''} assigned
                                            </span>
                                        </div>
                                    </div>
                                    <span className={styles.vehicleTag}>
                                        {item.vehicleType}
                                    </span>
                                </div>

                                <div className={styles.capacityBarWrap}>
                                    <div className={styles.capacityLabels}>
                                        <span>Payload Used</span>
                                        <span style={{ color: isOverloaded ? '#dc2626' : '#0f766e', fontWeight: 700 }}>
                                            {item.loadAssigned} / {item.capacity} units ({capacityUsed}%)
                                        </span>
                                    </div>
                                    <div className={styles.capacityTrack}>
                                        <div
                                            className={styles.capacityProgress}
                                            style={{
                                                width: `${capacityUsed}%`,
                                                background: barColor
                                            }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {highCount > 0 ? (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '2px 8px',
                                                background: '#fee2e2',
                                                color: '#991b1b',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: 700
                                            }}>
                                                <AlertCircle size={12} />
                                                {highCount} High Priority
                                            </span>
                                        ) : (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                fontSize: '11px',
                                                color: '#059669',
                                                fontWeight: 600
                                            }}>
                                                <CheckCircle size={12} />
                                                Standard Load
                                            </span>
                                        )}
                                    </div>

                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: isOverloaded ? '#dc2626' : '#0f766e',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                    }}>
                                        <ShieldCheck size={12} />
                                        {isOverloaded ? 'Overload Risk' : 'Capacity Safe'}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.tableContainer} style={{ flex: 1 }}>
                    <table className={styles.table}>
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
                                <th style={{ textAlign: 'right' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                        Assigned
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
                            {recommendations.map((item) => {
                                const capacityUsed = Math.round((item.loadAssigned / (item.capacity || 1)) * 100);
                                const highCount = countHighPriorityRequests(item.assignedRequests);
                                return (
                                    <tr key={item.collectorId}>
                                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.collectorName}</td>
                                        <td>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: '#f1f5f9',
                                                color: '#334155',
                                                fontSize: '11.5px',
                                                fontWeight: 600
                                            }}>
                                                {item.vehicleType}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 700,
                                                color: capacityUsed > 85 ? '#dc2626' : '#0f766e'
                                            }}>
                                                {capacityUsed}%
                                            </span>
                                        </td>
                                        <td>
                                            {highCount > 0 ? (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    background: '#fee2e2',
                                                    color: '#991b1b',
                                                    fontSize: '11px',
                                                    fontWeight: 700
                                                }}>
                                                    {highCount} high
                                                </span>
                                            ) : (
                                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>0</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                                            {item.assignedRequests.length} stops
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

export default CollectorRecommendationsTable;
