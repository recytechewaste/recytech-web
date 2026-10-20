import React from 'react';
import Sidebar from '../components/Sidebar';
import SchedulingPanel from '../features/scheduling/SchedulingPanel';
import InfoTooltip from '../components/InfoTooltip';
import styles from '../styles/Dashboard.module.css';
import { CalendarClock, Sparkles } from 'lucide-react';

const SmartScheduling = () => {
    return (
        <div className={styles.container}>
            <Sidebar activePage="Smart Scheduling" />
            <main className={styles.main}>
                <header className={styles.dashboardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0f766e'
                        }}>
                            <CalendarClock size={22} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h1 className={styles.pageTitle} style={{ margin: 0 }}>Smart Scheduling & Dispatch</h1>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: '#ecfdf5',
                                    color: '#047857',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    border: '1px solid #a7f3d0',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
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
                            <p className={styles.subTitle} style={{ margin: '4px 0 0 0' }}>
                                Automated collector assignment, workload balancing, and demand-driven route dispatching.
                            </p>
                        </div>
                    </div>
                </header>
                <SchedulingPanel />
            </main>
        </div>
    );
};

export default SmartScheduling;
