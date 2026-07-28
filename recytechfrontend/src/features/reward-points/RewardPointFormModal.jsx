import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import styles from '../../styles/EducationManager.module.css'; // Reusing layout styles
import Modal from '../../components/Modal';

const RewardPointFormModal = ({ isOpen, isEditing, initialData, onClose, onSubmit }) => {
    const [formData, setFormData] = useState(initialData);

    useEffect(() => {
        setFormData(initialData);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Frontend Validation
        if (formData.pointsPerItem < 0) { // Changed pointsPerKg to pointsPerItem
            return alert("Points per Item cannot be negative."); // Updated alert message
        }
        if (!formData.wasteType.trim()) {
            return alert("Waste type is required.");
        }

        onSubmit(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Reward Points' : 'New Reward Points'} maxWidth="450px">
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Waste Type</label>
                        <input required value={formData.wasteType} onChange={(e) => setFormData({...formData, wasteType: e.target.value})} className={styles.input} placeholder="e.g. Plastics, Electronics" />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Points per Item</label> {/* Changed label */}
                        <input type="number" step="1" min="0" required value={formData.pointsPerItem ?? 0} onChange={(e) => setFormData({...formData, pointsPerItem: parseInt(e.target.value, 10)})} className={styles.input} /> {/* Changed pointsPerKg to pointsPerItem */}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={styles.textarea} />
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn}><Save size={16} /> Save Rule</button>
                    </div>
                </form>
        </Modal>
    );
};

export default RewardPointFormModal;