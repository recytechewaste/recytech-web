import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';
import { useUsers } from '../features/users/useUsers';
import UserFormModal from '../features/users/UserFormModal';
import UserTable from '../features/users/UserTable';
import UserFilterBar from '../features/users/UserFilterBar';
import ErrorState from '../components/ErrorState';
import PageHeader from '../components/PageHeader';
import { Users } from 'lucide-react';
import styles from '../styles/UserManagement.module.css'; // Changed to Collectors styles

const BLANK_USER_FORM = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Staff',
    status: 'Active'
};

const UserManagement = () => {
    const { 
        loading, error,
        paginatedUsers,
        addUser, updateUser, deleteUser,
        searchTerm, setSearchTerm, 
        roleFilter, setRoleFilter, 
        statusFilter, setStatusFilter,
        nameSort, setNameSort,
        handleClearFilters,
        currentPage, totalPages, setPage
    } = useUsers();
    
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [deletingUserId, setDeletingUserId] = useState(null);

    const openAddModal = () => {
        setEditingUser(null);
        setFormModalOpen(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormModalOpen(true);
    };

    const handleFormSubmit = async (submittedData) => {
        let success;
        if (editingUser) {
            success = await updateUser(editingUser._id, submittedData);
        } else {
            success = await addUser(submittedData);
        }
        if (success) {
            setFormModalOpen(false);
        }
    };

    const confirmDelete = async () => {
        const success = await deleteUser(deletingUserId);
        if (success) {
            setDeletingUserId(null);
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar activePage="User Management" />
            <main className={styles.main}>
                <PageHeader
                    icon={<Users size={24} />}
                    title="User Management"
                    tooltipTitle="Administrative Access Directory"
                    tooltipContent="Directory of authorized staff and administrator accounts. Manage roles, access levels, and security credentials."
                    subtitle="Manage and monitor registered administrative system users."
                    actions={
                        <button className={styles.addBtn} onClick={openAddModal}><Plus size={18}/> Add User</button>
                    }
                />

                <UserFilterBar
                    searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                    roleFilter={roleFilter} setRoleFilter={setRoleFilter}
                    statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                    nameSort={nameSort} setNameSort={setNameSort}
                    handleClearFilters={handleClearFilters}
                />

                {error && (
                    <div style={{ marginBottom: '24px' }}>
                        <ErrorState message={error} />
                    </div>
                )}

                <UserTable
                    users={paginatedUsers}
                    loading={loading}
                    onEdit={openEditModal}
                    onDelete={setDeletingUserId}
                    page={currentPage}
                    limit={10}
                />

                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                )}

                {isFormModalOpen && (
                    <UserFormModal 
                        isOpen={isFormModalOpen} 
                        isEditing={!!editingUser} 
                        initialData={editingUser ? { ...editingUser, password: '', confirmPassword: '' } : BLANK_USER_FORM} 
                        onClose={() => setFormModalOpen(false)} 
                        onSubmit={handleFormSubmit} 
                    />
                )}

                <Modal isOpen={!!deletingUserId} onClose={() => setDeletingUserId(null)} title="Confirm Deletion" maxWidth="400px">
                    <p style={{color:'#666', marginBottom:'24px'}}>Are you sure you want to delete this user? This action cannot be undone.</p>
                    <div className={styles.modalFooter}>
                        <button onClick={() => setDeletingUserId(null)} className={styles.cancelBtn}>Cancel</button>
                        <button onClick={confirmDelete} className={styles.deleteBtn}>Delete</button>
                    </div>
                </Modal>
            </main>
        </div>
    );
};

export default UserManagement;
