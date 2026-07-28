import { useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import styles from '../styles/EducationManager.module.css'; // Reusing layout styles
import { Plus, Edit2, RefreshCw, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useRewardPoints } from '../features/reward-points/useRewardPoints';
import RewardPointFormModal from '../features/reward-points/RewardPointFormModal';
import ConfirmDeleteModal from '../features/reward-points/ConfirmDeleteModal';
import { useToast } from "../context/ToastContext.jsx";
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';

const RewardPointManager = () => {
    const { points, loading, fetchPoints, currentPage, totalPages, setPage } = useRewardPoints();
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ wasteType: '', pointsPerItem: 0, description: '', isActive: true }); // Initial formData uses pointsPerItem
    
    // State for delete confirmation
    const [pointToDelete, setPointToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { showToast } = useToast();

    const handleSubmit = async (submittedData) => {
        try {
            if (editingId) {
                await api.put(`/reward-points/${editingId}`, submittedData);
                showToast('Reward point rule updated successfully.', 'success');
            } else {
                await api.post('/reward-points', submittedData);
                showToast('Reward point rule added successfully.', 'success');
            }
            setShowModal(false);
            fetchPoints();
        } catch (error) { showToast(error.response?.data?.message || 'Error saving rule', 'error'); }
    };

    const handleConfirmDelete = async () => {
        if (!pointToDelete) return;

        setIsDeleting(true);
        try {
            await api.delete(`/reward-points/${pointToDelete._id}`);
            showToast('Reward point rule deleted successfully.', 'success');
            fetchPoints();
            setPointToDelete(null); // Close modal on success
        } catch (error) {
            showToast(error.response?.data?.message || 'Error deleting rule', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const toggleStatus = async (point) => {
        try {
            await api.put(`/reward-points/${point._id}`, { isActive: !point.isActive });
            showToast(`Reward point rule ${point.isActive ? 'deactivated' : 'activated'} successfully.`, 'success');
            fetchPoints();
        } catch (error) { showToast(error.response?.data?.message || 'Error toggling rule status', 'error'); }
    };

    const openDeleteModal = (point) => {
        setPointToDelete(point);
    };

    const closeDeleteModal = () => {
        setPointToDelete(null);
    };

    return (
        <div className={styles.container}>
            <Sidebar activePage="Reward Points" />
            <div className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1>Reward Points</h1>
                        <p>Configure incentive points per item for each material category.</p> {/* Updated description */}
                    </div>
                    <button onClick={() => { setEditingId(null); setFormData({ wasteType: '', pointsPerItem: 0, description: '', isActive: true }); setShowModal(true); }} className={styles.addBtn}>
                        <Plus size={18} /> Add New Rule
                    </button>
                </div>

                {loading ? (
                    <div className={styles.grid}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className={styles.contentCard} style={{ borderLeft: '4px solid #e5e7eb' }}>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardHeader}>
                                        <Skeleton width="60px" height="24px" borderRadius="12px" />
                                        <div className={styles.actions}>
                                            <Skeleton width="28px" height="28px" borderRadius="4px" />
                                            <Skeleton width="28px" height="28px" borderRadius="4px" />
                                            <Skeleton width="28px" height="28px" borderRadius="4px" />
                                        </div>
                                    </div>
                                    <Skeleton width="150px" height="24px" style={{ marginTop: '12px', marginBottom: '8px' }} />
                                    <Skeleton width="180px" height="32px" style={{ marginBottom: '16px' }} />
                                    <Skeleton width="80%" height="16px" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {points.map((point) => (
                            <div key={point._id} className={styles.contentCard} style={{ borderLeft: point.isActive ? '4px solid #10b981' : '4px solid #ef4444' }}>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.categoryBadge}>{point.isActive ? 'Active' : 'Inactive'}</span>
                                        <div className={styles.actions}>
                                            <button title="Edit rule" onClick={() => { setFormData(point); setEditingId(point._id); setShowModal(true); }} className={styles.iconBtn}><Edit2 size={16}/></button>
                                            <button title={point.isActive ? 'Deactivate rule' : 'Activate rule'} onClick={() => toggleStatus(point)} className={styles.iconBtn}>
                                                {point.isActive ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                                            </button>
                                            <button title="Delete rule" onClick={() => openDeleteModal(point)} className={styles.iconBtnDanger}><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    <h3 className={styles.itemTitle}>{point.wasteType}</h3>
                                    <p className={styles.itemDesc} style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                                        {(point.pointsPerItem ?? 0).toLocaleString()} points / item {/* Display points per item, with nullish coalescing */}
                                    </p>
                                    <p className={styles.itemDesc}>{point.description || 'No description provided.'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
                )}

                <RewardPointFormModal 
                    isOpen={showModal} 
                    isEditing={!!editingId} 
                    initialData={formData} 
                    onClose={() => setShowModal(false)} 
                    onSubmit={handleSubmit} 
                />
                <ConfirmDeleteModal
                    point={pointToDelete}
                    onClose={closeDeleteModal}
                    onConfirm={handleConfirmDelete}
                    isDeleting={isDeleting}
                />
            </div>
        </div>
    );
};

export default RewardPointManager;
