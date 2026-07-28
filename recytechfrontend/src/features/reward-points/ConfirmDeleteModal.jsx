import { X, AlertTriangle } from 'lucide-react';
import styles from '../../styles/UserManagement.module.css'; // Reusing styles

const ConfirmDeleteModal = ({ point, onClose, onConfirm, isDeleting }) => {
    if (!point) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{ maxWidth: '420px' }}>
                <div className={styles.modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <AlertTriangle size={24} color="#f59e0b" />
                        <h2 className={styles.modalTitle}>Confirm Deletion</h2>
                    </div>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20}/></button>
                </div>
                <p className={styles.modalSubText} style={{ margin: '8px 0 24px' }}>
                    Are you sure you want to permanently delete the reward point rule for <strong>"{point.wasteType}"</strong>? This action cannot be undone.
                </p>
                <div className={styles.modalFooter}>
                    <button onClick={onClose} className={styles.cancelBtn} disabled={isDeleting}>
                        Cancel
                    </button>
                    <button onClick={onConfirm} className={styles.deleteBtn} disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
