import React from 'react';
import Sidebar from '../components/Sidebar';
import SchedulingPanel from '../features/scheduling/SchedulingPanel';
import styles from '../styles/SmartScheduling.module.css';

const SmartScheduling = () => {
    return (
        <div className={styles.container}>
            <Sidebar activePage="Smart Scheduling" />
            <main className={styles.main}>
                <SchedulingPanel />
            </main>
        </div>
    );
};

export default SmartScheduling;
