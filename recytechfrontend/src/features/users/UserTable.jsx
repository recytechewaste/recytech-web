import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { Edit2, Trash2 } from 'lucide-react';
import styles from '../../styles/UserManagement.module.css';

const UserTableRow = ({ user, index, page, limit, onEdit, onDelete }) => (
    <tr>
        <td className={styles.td}>{(page - 1) * limit + index + 1}</td>
        <td className={styles.td}>
            <div className={styles.userCell}>
                <div className={styles.avatar}>
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : '?'}
                </div>
                <div className={styles.userInfo}>
                    <span className={styles.userName}>{`${user.firstName} ${user.lastName}`.trim() || "Unknown"}</span>
                    <span className={styles.userId}>ID: {user._id ? `USR-${user._id.substring(user._id.length - 4)}` : 'N/A'}</span>
                </div>
            </div>
        </td>
        <td className={styles.td}>{user.email}</td>
        <td className={styles.td}>{user.role || 'Staff'}</td>
        <td className={styles.td}>
            <span className={user.status === 'Active' ? styles.statusActive : styles.statusInactive}>
                {user.status || 'Active'}
            </span>
        </td>
        <td className={styles.td}>
            {user.lastLogin ? (
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <span>{new Date(user.lastLogin).toLocaleDateString()}</span>
                    <span style={{fontSize: '11px', color: '#6b7280'}}>{new Date(user.lastLogin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            ) : (
                <span style={{color: '#9ca3af', fontStyle: 'italic'}}>Never</span>
            )}
        </td>
        <td className={styles.td}>
            <div className={styles.actionIcons}>
                <button
                    title="Edit user"
                    aria-label={`Edit user ${user.firstName} ${user.lastName}`}
                    className={styles.iconBtn}
                    onClick={() => onEdit(user)}
                >
                    <Edit2 size={16}/>
                </button>
                <button
                    title="Delete user"
                    aria-label={`Delete user ${user.firstName} ${user.lastName}`}
                    className={styles.iconBtnDanger}
                    onClick={() => onDelete(user._id)}
                >
                    <Trash2 size={16}/>
                </button>
            </div>
        </td>
    </tr>
);

const SkeletonRow = () => (
    <tr>
        <td className={styles.td}><Skeleton width="20px" /></td>
        <td className={styles.td}>
            <div className={styles.userCell}>
                <Skeleton width="32px" height="32px" borderRadius="50%" />
                <div className={styles.userInfo}>
                    <Skeleton width="120px" height="16px" style={{marginBottom: '4px'}} />
                    <Skeleton width="80px" height="12px" />
                </div>
            </div>
        </td>
        <td className={styles.td}><Skeleton width="160px" height="16px" /></td>
        <td className={styles.td}><Skeleton width="60px" height="16px" /></td>
        <td className={styles.td}><Skeleton width="60px" height="24px" borderRadius="12px" /></td>
        <td className={styles.td}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                <Skeleton width="80px" height="16px" />
                <Skeleton width="50px" height="12px" />
            </div>
        </td>
        <td className={styles.td}>
            <div className={styles.actionIcons}>
                <Skeleton width="28px" height="28px" borderRadius="4px" />
                <Skeleton width="28px" height="28px" borderRadius="4px" />
            </div>
        </td>
    </tr>
);


const UserTable = ({ users, loading, page, limit, onEdit, onDelete }) => {
    return (
        <div className={styles.card}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th} style={{width:'50px'}}>#</th>
                        <th className={styles.th}>User</th>
                        <th className={styles.th}>Email</th>
                        <th className={styles.th}>Role</th>
                        <th className={styles.th}>Status</th>
                        <th className={styles.th}>Last Login</th>
                        <th className={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={`skeleton-${i}`} />)
                    ) : users.length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ padding: 0 }}>
                                <EmptyState
                                    icon="users"
                                    title="No users found"
                                    subtitle="Try adjusting your filters or add a new user."
                                />
                            </td>
                        </tr>
                    ) : (
                        users.map((user, index) => (
                            <UserTableRow 
                                key={user._id || index}
                                user={user}
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

export default UserTable;
