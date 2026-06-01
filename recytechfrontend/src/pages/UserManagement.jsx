import { useEffect, useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import styles from '../styles/UserManagement.module.css';
import { Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUsers } from '../features/users/useUsers';
import UserFormModal from '../features/users/UserFormModal';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';

const UserManagement = () => {
    const { 
        loading, 
        filteredUsers, paginatedUsers,
        fetchUsers, 
        searchTerm, setSearchTerm, 
        roleFilter, setRoleFilter, 
        statusFilter, setStatusFilter,
        page, limit, pages, goToPage, hasNextPage, hasPrevPage
    } = useUsers();
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Staff',
        status: 'Active'
    });
    const [deletingUserId, setDeletingUserId] = useState(null);
    const { showToast } = useToast();

    const openAddModal = () => {
        setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'Staff', status: 'Active' });
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email,
            password: '', 
            confirmPassword: '',
            role: user.role || 'Staff',
            status: user.status || 'Active'
        });
        setCurrentUserId(user._id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (submittedData) => {
        try {
            if (isEditing) {
                await api.put(`/users/${currentUserId}`, submittedData);
                showToast('User updated successfully.', 'success');
            } else {
                await api.post('/users', submittedData);
                showToast('User created successfully.', 'success');
            }
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            showToast(error.response?.data?.message || "Operation failed", 'error');
        }
    };

    const handleDelete = (id) => {
        setDeletingUserId(id);
    };

    const confirmDelete = async () => {
        try {
            const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
            
            if (!userInfo || !userInfo._id) {
                return showToast("You must be logged in.", 'error');
            }

            await api.delete(`/users/${deletingUserId}`);
            showToast('User deleted successfully.', 'success');
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            showToast("Failed to delete user.", 'error');
        }
        setDeletingUserId(null);
    };

    return (
        <div className={styles.container}>
            <Sidebar activePage="User Management" />
            <div className={styles.main}>
                
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1>User Management</h1>
                        <p>Manage and monitor registered system users</p>
                    </div>
                    <div className={styles.actionButtons}>
                        <button className={styles.addBtn} onClick={openAddModal}><Plus size={16}/> Add User</button>
                    </div>
                </div>

                {/* Filters */}
                <div className={styles.filterBar}>
                    <div className={styles.searchGroup}>
                        <input 
                            type="text" 
                            placeholder="Search users..." 
                            className={styles.searchInput} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select className={styles.selectInput} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="">All Roles</option>
                            <option value="Staff">Staff</option>
                            <option value="Admin">Admin</option>
                            <option value="Super Admin">Super Admin</option>
                        </select>
                        <select className={styles.selectInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <span className={styles.totalUsers}>Total Users: {filteredUsers.length}</span>
                </div>

                {/* Table */}
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
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`}>
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
                                ))
                            ) : paginatedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className={styles.td} style={{textAlign: 'center'}}>No users found.</td>
                                </tr>
                            ) : (
                                paginatedUsers.map((user, index) => (
                                    <tr key={user._id || index}>
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
                                                <button title="Edit user" className={styles.iconBtn} onClick={() => openEditModal(user)}><Edit2 size={16}/></button>
                                                <button title="Delete user" className={styles.iconBtnDanger} onClick={() => handleDelete(user._id)}><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className={styles.filterBar} style={{ marginTop: '20px', justifyContent: 'center' }}>
                    <button 
                        disabled={!hasPrevPage} 
                        onClick={() => goToPage(page - 1)}
                        className={styles.iconBtn}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span style={{ padding: '0 20px' }}>Page {page} of {pages}</span>
                    <button 
                        disabled={!hasNextPage} 
                        onClick={() => goToPage(page + 1)}
                        className={styles.iconBtn}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <UserFormModal 
                    isOpen={showModal} 
                    isEditing={isEditing} 
                    initialData={formData} 
                    onClose={() => setShowModal(false)} 
                    onSubmit={handleSubmit} 
                />

                {/* DELETE CONFIRMATION MODAL */}
                <Modal isOpen={!!deletingUserId} onClose={() => setDeletingUserId(null)} title="Confirm Deletion" maxWidth="400px">
                    <p style={{color:'#666', marginBottom:'24px'}}>Are you sure you want to delete this user? This action cannot be undone.</p>
                    <div className={styles.modalFooter}>
                        <button onClick={() => setDeletingUserId(null)} className={styles.cancelBtn}>Cancel</button>
                        <button onClick={confirmDelete} className={styles.deleteBtn}>Delete</button>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default UserManagement;
