import styles from '../../styles/Dashboard.module.css';

const getStatusClass = (status = '') => status.toLowerCase().replace(/\s/g, '');

const RecentRequestsTable = ({ dropoffs = [] }) => (
    <div className={styles.activityCard}>
        <h3 className={styles.cardTitle}>Recent Drop-off Activity</h3>
        <table className={styles.activityTable}>
            <thead>
                <tr>
                    <th>Participant</th>
                    <th>Waste Type</th>
                    <th>Kilograms</th>
                    <th>Points</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                {dropoffs.length === 0 ? (
                    <tr>
                        <td colSpan="5" className={styles.emptyActivityTd}>No recent drop-off activity.</td>
                    </tr>
                ) : (
                    dropoffs.map((dropoff) => (
                        <tr key={dropoff._id}>
                            <td>{dropoff.participantName || dropoff.participantEmail || 'Anonymous'}</td>
                            <td>{dropoff.wasteType}</td>
                            <td>{dropoff.kilograms} kg</td>
                            <td>{dropoff.pointsAwarded}</td>
                            <td>{new Date(dropoff.createdAt).toLocaleDateString()}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

export default RecentRequestsTable;
