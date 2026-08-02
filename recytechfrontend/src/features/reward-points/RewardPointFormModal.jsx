import { useState, useEffect } from 'react';
import { Save, Recycle, Coins, Loader2 } from 'lucide-react';
import styles from '../../styles/Layout.module.css';
import Modal from '../../components/Modal';
import ToggleSwitch from '../../components/ToggleSwitch';

const RewardPointFormModal = ({ isOpen, isEditing, initialData, onClose, onSubmit }) => {
    const [formData, setFormData] = useState(initialData);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setFormData(initialData);
        setFormErrors({});
        setIsSubmitting(false);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};

        if (!formData.wasteType.trim()) errors.wasteType = true;
        if (formData.pointsPerItem < 0) errors.pointsPerItem = true;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsSubmitting(true);
        await onSubmit(formData);
        setIsSubmitting(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Reward Points' : 'New Reward Points'} maxWidth="450px">
                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    <div className={styles.formGroup}>
                        <label>Waste Type</label>
                        <div className={styles.inputWrapper}>
                            <Recycle size={16} className={styles.inputIcon} />
                            <input required value={formData.wasteType} onChange={(e) => setFormData({...formData, wasteType: e.target.value})} className={`${styles.input} ${styles.inputWithIcon} ${formErrors.wasteType ? styles.inputError + ' ' + styles.shake : ''}`} placeholder="e.g. Plastics, Electronics" />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Points per Item</label>
                        <div className={styles.inputWrapper}>
                            <Coins size={16} className={styles.inputIcon} />
                            <input type="number" step="1" min="0" required value={formData.pointsPerItem ?? 0} onChange={(e) => setFormData({...formData, pointsPerItem: parseInt(e.target.value, 10)})} className={`${styles.input} ${styles.inputWithIcon} ${formErrors.pointsPerItem ? styles.inputError + ' ' + styles.shake : ''}`} />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={styles.textarea} />
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: '8px' }}>
                        <ToggleSwitch 
                            checked={formData.isActive} 
                            onChange={(e) => setFormData({...formData, isActive: e.target.checked})} 
                            label="Active Rule" 
                        />
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                            {isSubmitting ? 'Saving...' : 'Save Rule'}
                        </button>
                    </div>
                </form>
        </Modal>
    );
};

export default RewardPointFormModal;