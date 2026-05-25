import { useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import ResidentTable from '../features/residents/ResidentTable';
import ResidentFormModal from '../features/residents/ResidentFormModal';
import ConfirmDeleteModal from '../features/residents/ConfirmDeleteModal';
import styles from '../styles/UserManagement.module.css';
import { Plus } from 'lucide-react';
import { useResidents } from '../features/residents/useResidents';

const emptyForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'Active'
};

const ResidentManagement = () => {
    const {
        loading,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        filteredResidents, fetchResidents
    } = useResidents();

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentResidentId, setCurrentResidentId] = useState(null);
    const [deletingResident, setDeletingResident] = useState(null);
    const [formData, setFormData] = useState(emptyForm);

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
            } else {
                await api.post('/residents', submittedData);
            }

            setShowModal(false);
            fetchResidents();
        } catch (error) {
            alert(error.response?.data?.message || 'Unable to save resident');
        }
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/residents/${deletingResident._id}`, { params: { hardDelete: true } });
            setDeletingResident(null);
            fetchResidents();
        } catch (error) {
            alert(error.response?.data?.message || 'Unable to delete resident');
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar activePage="Mobile Residents" />
            <div className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1>Mobile User Management</h1>
                        <p>Manage mobile users, wallet balances, and recycling activity.</p>
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
                    residents={filteredResidents} 
                    loading={loading} 
                    onEdit={openEditModal} 
                    onDelete={setDeletingResident} 
                />

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
