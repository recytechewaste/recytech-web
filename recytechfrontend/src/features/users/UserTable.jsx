import Skeleton from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { Edit2, Trash2, Shield, ShieldCheck, User as UserIcon } from 'lucide-react';
import styles from '../../styles/UserManagement.module.css';
import InfoTooltip from '../../components/InfoTooltip';

const renderRoleBadge = (role) => {
    const r = (role || 'Staff').toString().trim();
    if (['Super Admin', 'super_admin', 'superadmin'].includes(r)) {
        return (
            <span className={styles.roleBadgeSuperAdmin} title="System Super Administrator">
                <Shield size={12} /> Super Admin
            </span>
        );
    }
    if (['Admin', 'admin'].includes(r)) {
        return (
            <span className={styles.roleBadgeAdmin} title="Operations Administrator">
                <ShieldCheck size={12} /> Admin
            </span>
        );
    }
    if (['Staff', 'staff'].includes(r)) {
        return (
            <span className={styles.roleBadgeStaff} title="Frontline Staff">
                <UserIcon size={12} /> Staff
            </span>
        );
    }
    return (
        <span className={styles.roleBadgeOther}>
            {r}
        </span>
    );
};

const UserTableRow = ({ user, index, page, limit, onEdit, onDelete, currentUserRole, currentUserId }) => {
    const isSuperAdminUser = ['Super Admin', 'super_admin', 'superadmin'].includes(user.role);
    const isAdminUser = ['Admin', 'admin'].includes(user.role);
    const isSelf = currentUserId && user._id && currentUserId.toString() === user._id.toString();

    // Permission enforcement:
    // Standard Admins cannot edit/delete Super Admins or other Admins
    const isRequesterSuperAdmin = ['Super Admin', 'super_admin', 'superadmin'].includes(currentUserRole);
    const canEdit = isRequesterSuperAdmin || (!isSuperAdminUser && (!isAdminUser || isSelf));
    const canDelete = !isSelf && (isRequesterSuperAdmin ? true : (!isSuperAdminUser && !isAdminUser));

    return (
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
            <td className={styles.td}>{renderRoleBadge(user.role)}</td>
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
                    {canEdit ? (
                        <button
                            title="Edit user"
                            aria-label={`Edit user ${user.firstName} ${user.lastName}`}
                            className={styles.iconBtn}
                            onClick={() => onEdit(user)}
                        >
                            <Edit2 size={16}/>
                        </button>
                    ) : (
                        <button
                            disabled
                            title="Protected account: requires Super Administrator access"
                            aria-label="Cannot edit this account"
                            className={styles.disabledIconBtn}
                        >
                            <Edit2 size={16}/>
                        </button>
                    )}

                    {canDelete ? (
                        <button
                            title="Deactivate user"
                            aria-label={`Deactivate user ${user.firstName} ${user.lastName}`}
                            className={styles.iconBtnDanger}
                            onClick={() => onDelete(user._id)}
                        >
                            <Trash2 size={16}/>
                        </button>
                    ) : (
                        <button
                            disabled
                            title={isSelf ? "You cannot deactivate your own account" : "Protected account: requires Super Administrator access"}
                            aria-label="Cannot deactivate this account"
                            className={styles.disabledIconBtn}
                        >
                            <Trash2 size={16}/>
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
        <td className={styles.td}><Skeleton width="70px" height="32px" /></td>
    </tr>
);

const UserTable = ({ users, loading, page, limit, onEdit, onDelete }) => {
    let currentUserRole = '';
    let currentUserId = '';
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        currentUserRole = userInfo.role || '';
        currentUserId = userInfo._id || userInfo.id || '';
    } catch {
        // Fallback
    }

    return (
        <div className={styles.card}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th} style={{width:'50px'}}>#</th>
                        <th className={styles.th}>User</th>
                        <th className={styles.th}>Email</th>
                        <th className={styles.th}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span>Role</span>
                                <InfoTooltip
                                    title="Role-Based Access Control (RBAC)"
                                    content="Super Admin (full security & configuration), Admin (operations management), or Staff (frontline collection support)."
                                    position="top"
                                    width={260}
                                />
                            </div>
                        </th>
                        <th className={styles.th}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span>Status</span>
                                <InfoTooltip
                                    title="Account Authorization"
                                    content="Active users are authorized to log in. Inactive accounts are immediately revoked from active API sessions."
                                    position="top"
                                    width={240}
                                />
                            </div>
                        </th>
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
                                currentUserRole={currentUserRole}
                                currentUserId={currentUserId}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;
