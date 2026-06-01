import { useState } from 'react';
import { Info } from 'lucide-react';
import styles from '../../styles/Dashboard.module.css';

const ResourceAllocationSummary = ({ summary }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    const tooltipStyle = {
        position: 'absolute', top: '100%', right: 0, marginTop: '8px',
        backgroundColor: '#1F2937', color: '#F9FAFB', padding: '12px',
        borderRadius: '8px', fontSize: '12px', width: '240px', zIndex: 50,
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', pointerEvents: 'none',
        lineHeight: '1.5', textAlign: 'left', fontWeight: 'normal', textTransform: 'none'
    };

    return (
    <div className={styles.chartCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}>Resource Allocation Summary</h3>
            <div 
                style={{ position: 'relative', cursor: 'help', color: '#9CA3AF', display: 'flex' }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
            >
                <Info size={18} />
                {showTooltip && (
                    <div style={tooltipStyle}>Overview comparing your total pending request load against the total carrying capacity of your active collectors.</div>
                )}
            </div>
        </div>
        <span className={styles.chartSub}>Collector capacity and pending operational load</span>
        <table className={styles.activityTable}>
            <tbody>
                <tr>
                    <td>Active collectors</td>
                    <td>{summary.activeCollectors || 0}</td>
                </tr>
                <tr>
                    <td>Suggested collectors needed</td>
                    <td>{summary.suggestedCollectorsNeeded || 0}</td>
                </tr>
                <tr>
                    <td>Pending request load</td>
                    <td>{summary.totalLoad || 0} of {summary.totalCapacity || 0}</td>
                </tr>
                <tr>
                    <td>Capacity utilization</td>
                    <td>{summary.utilizationRate || 0}%</td>
                </tr>
                <tr>
                    <td>High-priority requests</td>
                    <td>{summary.highPriorityRequests || 0}</td>
                </tr>
                <tr>
                    <td>Estimated recyclable value</td>
                    <td>PHP {(summary.totalEstimatedValue || 0).toLocaleString()}</td>
                </tr>
            </tbody>
        </table>
    </div>
    );
};

export default ResourceAllocationSummary;
