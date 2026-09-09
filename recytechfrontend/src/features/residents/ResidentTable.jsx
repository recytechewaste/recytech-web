import React from 'react';
import { Eye, Edit2, Trash2, Award, Phone, Mail, MapPin } from 'lucide-react';
import styles from '../../styles/Collectors.module.css';
import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

const ResidentTableRow = ({ resident, index, page, limit, onView, onEdit, onDelete, canManage }) => {
    const fullName = `${resident.firstName || ''} ${resident.lastName || ''}`.trim() || 'Unknown Resident';
    const initials = resident.firstName ? resident.firstName.charAt(0).toUpperCase() : 'R';

    return (
        <tr>
            <td className={styles.td}>{(page - 1) * limit + index + 1}</td>
            <td className={styles.td}>
                <div className={styles.driverCell}>
                    <div className={styles.avatar}>
                        {initials}
                    </div>
                    <div>
                        <div className={styles.driverName}>{fullName}</div>
                        <div className={styles.driverId}>
                            ID: {resident._id ? `R-${resident._id.substring(resident._id.length - 6).toUpperCase()}` : 'N/A'}
                        </div>
                    </div>
                </div>
            </td>
            <td className={styles.td}>
                <span style={{ color: '#374151', fontSize: '13px' }}>{resident.email}</span>
            </td>
            <td className={styles.td}>
                <span style={{ color: '#4b5563', fontSize: '13px' }}>{resident.phone || '—'}</span>
            </td>
            <td className={styles.td}>
                <span className={`${styles.statusBadge} ${resident.status === 'Active' ? styles.active : styles.inactive}`}>
                    {resident.status || 'Active'}
                </span>
            </td>
            <td className={styles.td}>
                <div className={styles.actions}>
                    <button
                        title="View Profile Details"
                        aria-label={`View details for ${fullName}`}
                        className={styles.iconBtn}
                        onClick={() => onView(resident)}
                    >
                        <Eye size={16} />
                    </button>
                    {canManage && (
                        <button
                            title="Deactivate / Delete Resident"
                            aria-label={`Deactivate ${fullName}`}
                            className={styles.iconBtnDanger}
                            onClick={() => onDelete(resident)}
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

const SkeletonRow = () => (
    <tr>
        <td className={styles.td}><Skeleton width="20px" /></td>
        <td className={styles.td}>
            <div className={styles.driverCell}>
                <Skeleton width="36px" height="36px" borderRadius="50%" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <Skeleton width="120px" height="16px" />
                    <Skeleton width="70px" height="12px" />
                </div>
            </div>
        </td>
        <td className={styles.td}><Skeleton width="150px" height="16px" /></td>
        <td className={styles.td}><Skeleton width="100px" height="16px" /></td>
        <td className={styles.td}><Skeleton width="60px" height="24px" borderRadius="12px" /></td>
        <td className={styles.td}>
            <div className={styles.actions}>
                <Skeleton width="28px" height="28px" borderRadius="4px" />
                <Skeleton width="28px" height="28px" borderRadius="4px" />
            </div>
        </td>
    </tr>
);

const ResidentTable = ({ residents, loading, page = 1, limit = 10, onView, onEdit, onDelete, canManage = true }) => {
    return (
        <div className={styles.card}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th} style={{ width: '50px' }}>#</th>
                        <th className={styles.th}>Resident</th>
                        <th className={styles.th}>Email</th>
                        <th className={styles.th}>Phone</th>
                        <th className={styles.th}>Status</th>
                        <th className={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={`skeleton-${i}`} />)
                    ) : residents.length === 0 ? (
                        <tr>
                            <td colSpan="6" style={{ padding: 0 }}>
                                <EmptyState
                                    icon="users"
                                    title="No registered residents found"
                                    subtitle="Try adjusting your filters or search terms."
                                />
                            </td>
                        </tr>
                    ) : (
                        residents.map((resident, index) => (
                            <ResidentTableRow
                                key={resident._id || index}
                                resident={resident}
                                index={index}
                                page={page}
                                limit={limit}
                                onView={onView}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                canManage={canManage}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ResidentTable;