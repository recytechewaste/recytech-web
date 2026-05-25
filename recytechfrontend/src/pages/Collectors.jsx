import { useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import styles from '../styles/Collectors.module.css';
import { Plus, Search, Truck, Phone, Edit2, Trash2, X, Filter, Check } from 'lucide-react';
import { useCollectors } from '../features/collectors/useCollectors';
import CollectorFormModal from '../features/collectors/CollectorFormModal';

const Collectors = () => {
    const { 
        filteredCollectors, fetchCollectors,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        vehicleTypeFilter, setVehicleTypeFilter,
        handleClearFilters
    } = useCollectors();

    const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', vehiclePlate: '', vehicleType: '', email: '', password: '', status: 'Active' });
    
    // UI States
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleOpenAdd = () => {
        setFormData({ firstName: '', lastName: '', phone: '', vehiclePlate: '', vehicleType: '', email: '', password: '', status: 'Active' });
        setEditingId(null);
        setShowModal(true);
    };

    const handleEdit = (collector) => {
        setFormData({ firstName: collector.firstName, lastName: collector.lastName, phone: collector.phone, vehiclePlate: collector.vehiclePlate, vehicleType: collector.vehicleType || '', email: '', password: '', status: collector.status || 'Active' });
        setEditingId(collector._id);
        setShowModal(true);
    };

    const handleSubmit = async (submittedData) => {
        try {
            if (editingId) {
                await api.put(`/collectors/${editingId}`, submittedData);
                setSuccessMessage('The collector profile has been updated successfully.');
            } else {
                await api.post('/collectors', submittedData);
                setSuccessMessage('New collector has been successfully registered and added to the system.');
            }
            setShowModal(false);
            setShowSuccessModal(true);
            fetchCollectors();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving collector');
        }
    };

    const handleDeleteClick = (id) => {
        setDeletingId(id);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/collectors/${deletingId}`);
            fetchCollectors();
        } catch (error) {
            console.error(error);
        }
        setDeletingId(null);
    };

    return (
        <div className={styles.container}>
            <Sidebar activePage="Collector Management" />

            <div className={styles.main}>
                
                {/* HEADER */}
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.pageTitle}>Collector Management</h1>
                        <p className={styles.subTitle}>Manage driver profiles and vehicle assignments.</p>
                    </div>
                    <button onClick={handleOpenAdd} className={styles.addBtn} style={{backgroundColor: '#2563EB'}}>
                        <Plus size={18} /> Add Collector
                    </button>
                </div>

                {/* FILTERS */}
                <div className={styles.filterBar}>
                    <div className={styles.searchGroup}>
                        <Search size={18} className={styles.searchIcon} />
                        <input 
                            type="text" 
                            placeholder="Search by name or plate number..." 
                            className={styles.searchInput} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <Filter size={18} className={styles.filterIcon} />
                        <select 
                            className={styles.selectInput}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <Truck size={18} className={styles.filterIcon} />
                        <select 
                            className={styles.selectInput}
                            value={vehicleTypeFilter}
                            onChange={(e) => setVehicleTypeFilter(e.target.value)}
                        >
                            <option value="">All Vehicles</option>
                            <option value="E-Trike">E-Trike</option>
                            <option value="Truck">Truck</option>
                            <option value="Bike">Bike</option>
                        </select>
                    </div>
                    <button className={styles.clearBtn} onClick={handleClearFilters}>Clear All</button>
                </div>

                {/* TABLE */}
                <div className={styles.card}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th} style={{width:'50px'}}>#</th>
                                <th className={styles.th}>Driver Name</th>
                                <th className={styles.th}>Contact Info</th>
                                <th className={styles.th}>Vehicle Plate</th>
                                <th className={styles.th}>Status</th>
                                <th className={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCollectors.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className={styles.emptyTd}>No collectors found.</td>
                                </tr>
                            ) : (
                                filteredCollectors.map((c, index) => (
                                    <tr key={c._id} className={styles.tr}>
                                        <td className={styles.td}>{index + 1}</td>
                                        <td className={styles.td}>
                                            <div className={styles.driverCell}>
                                                <div className={styles.avatar}>{c.firstName ? c.firstName.charAt(0).toUpperCase() : '?'}</div>
                                                <div>
                                                    <div className={styles.driverName}>{`${c.firstName} ${c.lastName}`}</div>
                                                    <div className={styles.driverId}>ID: {c._id.substring(c._id.length - 4)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            <div className={styles.iconText}><Phone size={14}/> {c.phone}</div>
                                        </td>
                                        <td className={styles.td}>
                                            <div className={styles.plateBadge}><Truck size={12}/> {c.vehiclePlate}</div>
                                        </td>
                                        <td className={styles.td}>
                                            <span className={`${styles.statusBadge} ${c.status === 'Inactive' ? styles.inactive : styles.active}`}>
                                                {c.status || 'Active'}
                                            </span>
                                        </td>
                                        <td className={styles.td}>
                                            <div className={styles.actions}>
                                                <button onClick={() => handleEdit(c)} className={styles.iconBtn}><Edit2 size={16}/></button>
                                                <button onClick={() => handleDeleteClick(c._id)} className={styles.iconBtnDanger}><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <CollectorFormModal 
                    isOpen={showModal} 
                    isEditing={!!editingId} 
                    initialData={formData} 
                    onClose={() => setShowModal(false)} 
                    onSubmit={handleSubmit} 
                />

                {/* --- SUCCESS DIALOGUE --- */}
                {showSuccessModal && (
                    <div className={styles.modalOverlay}>
                        <div className={`${styles.modalContent} ${styles.successModal}`}>
                            <div className={styles.successIconWrapper}>
                                <Check size={40} color="#059669" />
                            </div>
                            <h2 className={styles.successTitle}>Action Successful</h2>
                            <p className={styles.successText}>{successMessage}</p>
                            <div className={styles.modalFooter} style={{borderTop: 'none', justifyContent: 'center', marginTop: '16px'}}>
                                <button onClick={() => setShowSuccessModal(false)} className={styles.submitBtn} style={{width: '100%', backgroundColor: '#059669'}}>
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- DELETE CONFIRMATION MODAL --- */}
                {deletingId && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent} style={{maxWidth: '400px'}}>
                            <div className={styles.modalHeader}>
                                <h2>Confirm Deletion</h2>
                                <button onClick={() => setDeletingId(null)} className={styles.closeBtn}><X size={20}/></button>
                            </div>
                            <p style={{color:'#666', marginBottom:'24px'}}>Are you sure you want to remove this collector? This action cannot be undone.</p>
                            <div className={styles.modalFooter}>
                                <button onClick={() => setDeletingId(null)} className={styles.cancelBtn}>Cancel</button>
                                <button onClick={confirmDelete} className={styles.deleteBtn} style={{backgroundColor: '#ef4444'}}>Delete</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default Collectors;
