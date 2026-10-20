import styles from '../../styles/SmartScheduling.module.css';
import InfoTooltip from '../../components/InfoTooltip';
import { CalendarClock, Sparkles, TrendingUp, CheckCircle2, Truck, Activity } from 'lucide-react';

const SchedulingHeader = ({ forecastTotal = 0, recommendationCount = 0, resourceSummary = {} }) => {
    const activeCollectors = resourceSummary.activeCollectors || 0;
    const utilizationRate = resourceSummary.utilizationRate || 0;

    return (
        <div style={{ marginBottom: '24px' }}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <div className={styles.headerIcon}>
                        <CalendarClock size={24} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <h1 className={styles.pageTitle}>Smart Scheduling & Dispatch</h1>
                            <span className={styles.badgeAI}>
                                <Sparkles size={11} /> Prescriptive AI
                            </span>
                            <InfoTooltip
                                title="Prescriptive Scheduling Engine"
                                content="Translates demand forecasts and bin sensor data into optimized collector assignments, balancing vehicle payloads and resolving time conflicts before dispatch."
                                size={15}
                                position="bottom"
                                width={280}
                            />
                        </div>
                        <p className={styles.subTitle}>
                            Automated collector assignment, workload balancing, and demand-driven route dispatching.
                        </p>
                    </div>
                </div>

                <div className={styles.liveIndicator}>
                    <span className={styles.pulseDot} />
                    <span>Live Optimization Active</span>
                </div>
            </header>

            {/* 4-Card Overview KPI Grid */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>Next 7-Day Forecast</span>
                        <div className={styles.kpiIconBubble} style={{ background: '#ecfdf5', color: '#0f766e' }}>
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <div className={styles.kpiValue} style={{ color: '#0f766e' }}>
                        {forecastTotal}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p className={styles.kpiSub}>Estimated inbound requests</p>
                        <InfoTooltip
                            title="7-Day Demand Forecast"
                            content="Projected volume of collection requests over the next 7 days, modeled from historical pickup patterns to anticipate collector requirements."
                            size={12}
                            position="bottom"
                            width={250}
                        />
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>Pending Recommendations</span>
                        <div className={styles.kpiIconBubble} style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <CheckCircle2 size={16} />
                        </div>
                    </div>
                    <div className={styles.kpiValue} style={{ color: '#2563eb' }}>
                        {recommendationCount}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p className={styles.kpiSub}>AI-paired for review</p>
                        <InfoTooltip
                            title="Actionable Recommendations"
                            content="Pending collection requests that the AI engine has paired with optimal collectors based on vehicle capacity, urgency, and route proximity."
                            size={12}
                            position="bottom"
                            width={260}
                        />
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>Active Collectors</span>
                        <div className={styles.kpiIconBubble} style={{ background: '#ecfdf5', color: '#059669' }}>
                            <Truck size={16} />
                        </div>
                    </div>
                    <div className={styles.kpiValue} style={{ color: '#059669' }}>
                        {activeCollectors}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p className={styles.kpiSub}>Available for assignment</p>
                        <InfoTooltip
                            title="Available Fleet"
                            content="Total registered collector drivers currently marked 'Active' and ready for dispatch."
                            size={12}
                            position="bottom"
                            width={230}
                        />
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>Capacity Utilization</span>
                        <div className={styles.kpiIconBubble} style={{
                            background: utilizationRate > 85 ? '#fef2f2' : '#fffbeb',
                            color: utilizationRate > 85 ? '#dc2626' : '#d97706'
                        }}>
                            <Activity size={16} />
                        </div>
                    </div>
                    <div className={styles.kpiValue} style={{ color: utilizationRate > 85 ? '#dc2626' : '#0f172a' }}>
                        {utilizationRate}%
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p className={styles.kpiSub}>
                            {utilizationRate > 85 ? 'High load alert — add shifts' : 'Optimal capacity buffer'}
                        </p>
                        <InfoTooltip
                            title="Capacity Utilization Rate"
                            content="Percentage of active fleet capacity committed. Values >85% indicate a need to schedule additional vehicle shifts."
                            size={12}
                            position="bottom"
                            width={260}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SchedulingHeader;
