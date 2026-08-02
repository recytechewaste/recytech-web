
import React from 'react';
import styles from '../../styles/Reports.module.css';

const ReportTable = ({ data }) => {
    return (
        <div className={styles.tableCard}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Waste Type</th>
                        <th>Kilograms</th>
                        <th>Points Awarded</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {(!data || data.length === 0) ? (
                        <tr>
                            <td colSpan="5" className={styles.emptyState}>No recent activity to display.</td>
                        </tr>
                    ) : (
                        data.slice(0, 10).map((item) => (
                            <tr key={item._id}>
                                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                <td>{item.wasteType}</td>
                                <td>{item.kilograms.toFixed(2)} kg</td>
                                <td>{item.pointsAwarded}</td>
                                <td>
                                    <span className={`${styles.status} ${styles[item.status]}`}>
                                        {item.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ReportTable;
