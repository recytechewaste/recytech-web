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
                        <CalendarClock size={22} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h1 className={styles.pageTitle}>Smart Scheduling & Dispatch</h1>
                            <span className={styles.badge}>
                                <Sparkles size={11} /> Prescriptive AI
                            </span>
                            <InfoTooltip
                                title="Prescriptive Scheduling Engine"
                                content="Translates demand forecasts and bin sensor data into optimized collector assignments, balancing vehicle payloads and resolving time conflicts before dispatch."
                                size={16}
                                position="bottom"
                                width={280}
                            />
                        </div>
                        <p className={styles.subTitle}>
                            Forecast collection demand, balance vehicle payloads, and confirm automated route dispatches.
                        </p>
                    </div>
                </div>
            </header>

            {/* 4-Card KPI Overview Grid */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>Next 7-Day Forecast</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TrendingUp size={16} color="#0f766e" />
                            <InfoTooltip
                                title="7-Day Demand Forecast"
                                content="Projected volume of collection requests over the next 7 days, modeled from historical pickup patterns to anticipate collector requirements."
                                size={13}
                                position="bottom"
                                width={250}
                            />
                        </div>
                    </div>
                    <div className={styles.kpiValue} style={{ color: '#0f766e' }}>
                        {forecastTotal}
                    </div>
                    <p className={styles.kpiSub}>Estimated pickup requests</p>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>Pending Recommendations</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={16} color="#2563eb" />
                            <InfoTooltip
                                title="Actionable Recommendations"
                                content="Pending collection requests that the AI engine has paired with optimal collectors based on vehicle capacity, urgency, and route proximity."
                                size={13}
                                position="bottom"
                                width={260}
                            />
                        </div>
                    </div>
                    <div className={styles.kpiValue} style={{ color: '#2563eb' }}>
                        {recommendationCount}
                    </div>
                    <p className={styles.kpiSub}>AI-paired for review</p>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>Active Collectors</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Truck size={16} color="#059669" />
                            <InfoTooltip
                                title="Available Fleet"
                                content="Total registered collector drivers currently marked 'Active' and ready for dispatch."
                                size={13}
                                position="bottom"
                                width={230}
                            />
                        </div>
                    </div>
                    <div className={styles.kpiValue} style={{ color: '#059669' }}>
                        {activeCollectors}
                    </div>
                    <p className={styles.kpiSub}>Available for assignment</p>
                </div>

                <div className={styles.kpiCard}>
                    <div className={styles.kpiHeader}>
                        <span className={styles.kpiLabel}>Capacity Utilization</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Activity size={16} color={utilizationRate > 85 ? '#dc2626' : '#d97706'} />
                            <InfoTooltip
                                title="Capacity Utilization Rate"
                                content="Percentage of active fleet capacity committed. Values >85% indicate a need to schedule additional vehicle shifts."
                                size={13}
                                position="bottom"
                                width={260}
                            />
                        </div>
                    </div>
                    <div className={styles.kpiValue} style={{ color: utilizationRate > 85 ? '#dc2626' : '#0f172a' }}>
                        {utilizationRate}%
                    </div>
                    <p className={styles.kpiSub}>{utilizationRate > 85 ? 'High load alert' : 'Optimal capacity buffer'}</p>
                </div>
            </div>
        </div>
    );
};

export default SchedulingHeader;
