import styles from '../../styles/Dashboard.module.css';
import InfoTooltip from '../../components/InfoTooltip';

const SchedulingHeader = ({ forecastTotal, recommendationCount }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px' }}>
            <h2 className={styles.sectionHeaderLeft}>Smart Scheduling</h2>
            <p className={styles.sectionSubHeaderLeft}>Forecast demand and review collector recommendations before confirming assignments.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className={`${styles.metricCard} ${styles.successCard}`} style={{ minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Next 7-day forecast</span>
                    <InfoTooltip
                        title="7-Day Demand Forecast"
                        content="Projected volume of collection requests over the next 7 days, modeled from historical pickup patterns to anticipate collector requirements."
                        size={14}
                        position="bottom"
                        width={250}
                    />
                </div>
                <h3>{forecastTotal} requests</h3>
            </div>
            <div className={styles.metricCard} style={{ minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Pending recommendations</span>
                    <InfoTooltip
                        title="Actionable Recommendations"
                        content="Pending collection requests that the AI engine has paired with optimal collectors based on vehicle capacity, urgency, and route proximity."
                        size={14}
                        position="bottom"
                        width={260}
                    />
                </div>
                <h3>{recommendationCount}</h3>
            </div>
        </div>
    </div>
);

export default SchedulingHeader;
