import { useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import ResidentTable from '../features/residents/ResidentTable';
import ResidentFormModal from '../features/residents/ResidentFormModal';
import ConfirmDeleteModal from '../features/residents/ConfirmDeleteModal';
import styles from '../styles/UserManagement.module.css';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useResidents } from '../features/residents/useResidents';
import { useToast } from '../context/ToastContext';

const emptyForm = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    status: 'Active'
};

const ResidentManagement = () => {
    const {
        loading,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        filteredResidents, paginatedResidents, fetchResidents,
        page, limit, pages, goToPage, hasNextPage, hasPrevPage
    } = useResidents();

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentResidentId, setCurrentResidentId] = useState(null);
    const [deletingResident, setDeletingResident] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const { showToast } = useToast();

    const openAddModal = () => {
        setFormData(emptyForm);
        setCurrentResidentId(null);
        setIsEditing(false);
        setShowModal(true);
    };

    const openEditModal = (resident) => {
        setFormData({
            firstName: resident.firstName || '',
            lastName: resident.lastName || '',
            email: resident.email || '',
            password: '', // Keep blank during edit so it only changes if the admin types a new one
            phone: resident.phone || '',
            status: resident.status || 'Active'
        });
        setCurrentResidentId(resident._id);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleSubmit = async (submittedData) => {
        try {
            if (isEditing) {
                await api.put(`/residents/${currentResidentId}`, submittedData);
                showToast('Resident updated successfully.', 'success');
            } else {
                await api.post('/residents', submittedData);
                showToast('Resident added successfully.', 'success');
            }

            setShowModal(false);
            fetchResidents();
        } catch (error) {
            showToast(error.response?.data?.message || 'Unable to save resident', 'error');
        }
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/residents/${deletingResident._id}`, { params: { hardDelete: true } });
            showToast('Resident deleted successfully.', 'success');
            setDeletingResident(null);
            fetchResidents();
        } catch (error) {
            showToast(error.response?.data?.message || 'Unable to delete resident', 'error');
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar activePage="Mobile Residents" />
            <div className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1>Mobile User Management</h1>
                        <p>Manage mobile users, total earnings, and recycling activity.</p>
                    </div>
                    <div className={styles.actionButtons}>
                        <button className={styles.addBtn} onClick={openAddModal}><Plus size={16}/> Add Resident</button>
                    </div>
                </div>

                <div className={styles.filterBar}>
                    <div className={styles.searchGroup}>
                        <input
                            type="text"
                            placeholder="Search by name, email, or phone..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select className={styles.selectInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <span className={styles.totalUsers}>Total Residents: {filteredResidents.length}</span>
                </div>

                <ResidentTable 
                    residents={paginatedResidents} 
                    loading={loading} 
                    onEdit={openEditModal} 
                    onDelete={setDeletingResident} 
                />

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

                <ResidentFormModal 
                    isOpen={showModal} 
                    isEditing={isEditing} 
                    initialData={formData} 
                    onClose={() => setShowModal(false)} 
                    onSubmit={handleSubmit} 
                />

                <ConfirmDeleteModal 
                    resident={deletingResident} 
                    onClose={() => setDeletingResident(null)} 
                    onConfirm={confirmDelete} 
                />
            </div>
        </div>
    );
};

export default ResidentManagement;
