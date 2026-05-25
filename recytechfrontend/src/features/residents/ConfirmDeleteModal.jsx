import { X } from 'lucide-react';
import styles from '../../styles/UserManagement.module.css';

const ConfirmDeleteModal = ({ resident, onClose, onConfirm }) => {
    if (!resident) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent} style={{maxWidth: '400px'}}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Confirm Deletion</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20}/></button>
                </div>
                <p style={{color:'#666', marginBottom:'24px'}}>
                    Delete {resident.firstName} {resident.lastName}? This also removes related payout transactions for this resident.
                </p>
                <div className={styles.modalFooter}>
                    <button onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                    <button onClick={onConfirm} className={styles.deleteBtn}>Delete</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;