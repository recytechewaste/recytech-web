import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import styles from '../../styles/Collectors.module.css';
import Skeleton from '../../components/Skeleton';

const LguTableRow = ({ lgu, index, page, limit, onEdit, onDelete }) => (
    <tr className={styles.tr}>
        <td className={styles.td}>{(page - 1) * limit + index + 1}</td>
        <td className={styles.td}>
            <div className={styles.driverCell}>
                <div className={styles.avatar} style={{backgroundColor: '#e0e7ff', color: '#4f46e5'}}>
                    {lgu.name ? lgu.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                    <div className={styles.driverName}>{lgu.name || "Unknown LGU"}</div>
                    <div className={styles.driverId}>ID: {lgu._id ? `LGU-${lgu._id.substring(lgu._id.length - 4)}` : 'N/A'}</div>
                </div>
            </div>
        </td>
        <td className={styles.td}>{lgu.contactPerson}</td>
        <td className={styles.td}>{lgu.email}</td>
        <td className={styles.td}>
            <span className={`${styles.statusBadge} ${lgu.status === 'Inactive' ? styles.inactive : styles.active}`}>
                {lgu.status || 'Active'}
            </span>
        </td>
        <td className={styles.td}>
            <div className={styles.actions}>
                <button title="Edit LGU" className={styles.iconBtn} onClick={() => onEdit(lgu)}><Edit2 size={16}/></button>
                <button title="Delete LGU" className={styles.iconBtnDanger} onClick={() => onDelete(lgu._id)}><Trash2 size={16}/></button>
            </div>
        </td>
    </tr>
);

const SkeletonRow = () => (
    <tr className={styles.tr}>
        <td className={styles.td}><Skeleton width="20px" /></td>
        <td className={styles.td}>
            <div className={styles.driverCell}>
                <Skeleton width="32px" height="32px" borderRadius="50%" />
                <div>
                    <Skeleton width="120px" height="16px" style={{marginBottom: '4px'}} />
                    <Skeleton width="80px" height="12px" />
                </div>
            </div>
        </td>
        <td className={styles.td}><Skeleton width="140px" height="16px" /></td>
        <td className={styles.td}><Skeleton width="160px" height="16px" /></td>
        <td className={styles.td}><Skeleton width="60px" height="24px" borderRadius="12px" /></td>
        <td className={styles.td}>
            <div className={styles.actions}>
                <Skeleton width="28px" height="28px" borderRadius="4px" />
                <Skeleton width="28px" height="28px" borderRadius="4px" />
            </div>
        </td>
    </tr>
);

const LguTable = ({ lgus, loading, page, limit, onEdit, onDelete }) => {
    return (
        <div className={styles.card}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th} style={{width:'50px'}}>#</th>
                        <th className={styles.th}>LGU Name</th>
                        <th className={styles.th}>Contact Person</th>
                        <th className={styles.th}>Email</th>
                        <th className={styles.th}>Status</th>
                        <th className={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={`skeleton-${i}`} />)
                    ) : lgus.length === 0 ? (
                        <tr>
                            <td colSpan="6" className={styles.emptyTd}>No LGU accounts found.</td>
                        </tr>
                    ) : (
                        lgus.map((lgu, index) => (
                            <LguTableRow 
                                key={lgu._id || index}
                                lgu={lgu}
                                index={index}
                                page={page}
                                limit={limit}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default LguTable;
