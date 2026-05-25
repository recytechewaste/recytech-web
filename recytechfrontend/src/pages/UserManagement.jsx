import { useEffect, useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import styles from '../styles/UserManagement.module.css';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { useUsers } from '../features/users/useUsers';
import UserFormModal from '../features/users/UserFormModal';

const UserManagement = () => {
    const { 
        loading, 
        filteredUsers, 
        fetchUsers, 
        searchTerm, setSearchTerm, 
        roleFilter, setRoleFilter, 
        statusFilter, setStatusFilter 
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
            } else {
                await api.post('/users', submittedData);
            }
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = (id) => {
        setDeletingUserId(id);
    };

    const confirmDelete = async () => {
        try {
            const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
            
            if (!userInfo || !userInfo.token) {
                return alert("You must be logged in.");
            }

            await api.delete(`/users/${deletingUserId}`);
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Failed to delete user.");
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
                                <tr>
                                    <td colSpan="7" className={styles.td} style={{textAlign: 'center'}}>Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className={styles.td} style={{textAlign: 'center'}}>No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, index) => (
                                    <tr key={user._id || index}>
                                        <td className={styles.td}>{index + 1}</td>
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

                <UserFormModal 
                    isOpen={showModal} 
                    isEditing={isEditing} 
                    initialData={formData} 
                    onClose={() => setShowModal(false)} 
                    onSubmit={handleSubmit} 
                />

                {/* DELETE CONFIRMATION MODAL */}
                {deletingUserId && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent} style={{maxWidth: '400px'}}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>Confirm Deletion</h2>
                                <button onClick={() => setDeletingUserId(null)} className={styles.closeBtn}><X size={20}/></button>
                            </div>
                            <p style={{color:'#666', marginBottom:'24px'}}>Are you sure you want to delete this user? This action cannot be undone.</p>
                            <div className={styles.modalFooter}>
                                <button onClick={() => setDeletingUserId(null)} className={styles.cancelBtn}>Cancel</button>
                                <button onClick={confirmDelete} className={styles.deleteBtn}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
