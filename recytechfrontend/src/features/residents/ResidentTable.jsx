import { Edit2, RefreshCw, Trash2 } from 'lucide-react';
import styles from '../../styles/UserManagement.module.css';
import Skeleton from '../../components/Skeleton';

const ResidentTable = ({ residents, loading, onEdit, onDelete }) => {
    return (
        <div className={styles.card}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th} style={{width:'50px'}}>#</th>
                        <th className={styles.th}>Resident</th>
                        <th className={styles.th}>Email</th>
                        <th className={styles.th}>Contact Number</th>
                        <th className={styles.th}>Status</th>
                        <th className={styles.th}>Total Earned</th>
                        <th className={styles.th}>Requests</th>
                        <th className={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={`skeleton-${i}`}>
                                <td className={styles.td}><Skeleton width="20px" /></td>
                                <td className={styles.td}>
                                    <div className={styles.userCell}>
                                        <Skeleton width="32px" height="32px" borderRadius="50%" />
                                        <div className={styles.userInfo}>
                                            <Skeleton width="120px" height="16px" style={{marginBottom: '4px'}} />
                                            <Skeleton width="60px" height="12px" />
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.td}><Skeleton width="160px" height="16px" /></td>
                                <td className={styles.td}><Skeleton width="100px" height="16px" /></td>
                                <td className={styles.td}><Skeleton width="60px" height="24px" borderRadius="12px" /></td>
                                <td className={styles.td}><Skeleton width="80px" height="16px" /></td>
                                <td className={styles.td}><Skeleton width="30px" height="16px" /></td>
                                <td className={styles.td}>
                                    <div className={styles.actionIcons}>
                                        <Skeleton width="28px" height="28px" borderRadius="4px" />
                                        <Skeleton width="28px" height="28px" borderRadius="4px" />
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : residents.length === 0 ? (
                        <tr><td colSpan="8" className={styles.td} style={{textAlign:'center', padding:'40px'}}>No mobile residents found.</td></tr>
                    ) : (
                        residents.map((resident, index) => (
                            <tr key={resident._id || index}>
                                <td className={styles.td}>{index + 1}</td>
                                <td className={styles.td}>
                                    <div className={styles.userCell}>
                                        <div className={styles.avatar}>
                                            {resident.firstName ? resident.firstName.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div className={styles.userInfo}>
                                            <span className={styles.userName}>{`${resident.firstName || ''} ${resident.lastName || ''}`.trim() || 'Unknown'}</span>
                                            <span className={styles.userId}>ID: {resident._id ? `R-${resident._id.substring(resident._id.length - 4).toUpperCase()}` : 'N/A'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className={styles.td}>{resident.email}</td>
                                <td className={styles.td}>{resident.phone || '—'}</td>
                                <td className={styles.td}>
                                    <span className={resident.status === 'Active' ? styles.statusActive : styles.statusInactive}>
                                        {resident.status || 'Active'}
                                    </span>
                                </td>
                                <td className={styles.td} style={{color: '#059669', fontWeight: 700}}>PHP {resident.totalEarned?.toFixed(2) || '0.00'}</td>
                                <td className={styles.td}>{resident.requestCount || 0}</td>
                                <td className={styles.td}>
                                    <div className={styles.actionIcons}>
                                        <button title="Edit resident" className={styles.iconBtn} onClick={() => onEdit(resident)}><Edit2 size={16}/></button>
                                        <button title="Delete resident" className={styles.iconBtnDanger} onClick={() => onDelete(resident)}><Trash2 size={16}/></button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ResidentTable;