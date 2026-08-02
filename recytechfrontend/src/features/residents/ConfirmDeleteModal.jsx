import { X } from 'lucide-react';
import Modal from '../../components/Modal';
import sharedStyles from '../../styles/Layout.module.css';

const ConfirmDeleteModal = ({ resident, message, onClose, onCancel, onConfirm }) => {
    const handleClose = onClose || onCancel;
    return (
        <Modal isOpen={true} onClose={handleClose} title="Confirm Deletion" maxWidth="400px">
            <p style={{color:'#666', marginBottom:'24px', fontSize: '14px'}}>
                {message || (resident ? `Delete ${resident.firstName} ${resident.lastName}? This also removes related payout transactions for this resident.` : "Are you sure you want to delete this?")}
            </p>
            <div className={sharedStyles.modalFooter}>
                <button onClick={handleClose} className={sharedStyles.cancelBtn}>Cancel</button>
                <button onClick={onConfirm} className={sharedStyles.deleteBtn}>Delete</button>
            </div>
        </Modal>
    );
};

export default ConfirmDeleteModal;