import styles from '../../styles/SmartScheduling.module.css';
import { HelpCircle } from 'lucide-react';

const SchedulingGuidance = () => (
    <div className={styles.guidanceBox}>
        <h4 className={styles.guidanceTitle}>
            <HelpCircle size={17} color="#0f766e" />
            <span>Prescriptive Scheduling Guidance & Best Practices</span>
        </h4>
        <ul className={styles.guidanceList}>
            <li><strong>Demand Monitoring:</strong> Review the 7-day ARIMA forecast curve to anticipate peak pickup days and pre-stage driver availability.</li>
            <li><strong>Automated Load Balancing:</strong> Collector recommendations automatically prioritize Critical (≥80% bin fill) requests without exceeding vehicle cargo payload.</li>
            <li><strong>Time-Window Selection:</strong> Set realistic pickup timestamps for each stop to prevent route congestion and driver delay.</li>
            <li><strong>Conflict Checking:</strong> The system automatically validates vehicle availability and prevents double-booking active drivers.</li>
        </ul>
    </div>
);

export default SchedulingGuidance;
