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

        if (!formData.wasteType || !formData.wasteType.trim()) {
            errors.wasteType = 'Material / Waste Type is required.';
        }
        
        const pts = Number(formData.pointsPerItem);
        if (formData.pointsPerItem === '' || formData.pointsPerItem === null || isNaN(pts) || pts < 0) {
            errors.pointsPerItem = 'Points per item must be a non-negative number (0 or higher).';
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsSubmitting(true);
        await onSubmit({
            ...formData,
            wasteType: formData.wasteType.trim(),
            pointsPerItem: pts
        });
        setIsSubmitting(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Reward Points' : 'New Reward Points'} maxWidth="450px">
                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    <div className={styles.formGroup}>
                        <label>Waste Type <span style={{ color: '#ef4444' }}>*</span></label>
                        <div className={styles.inputWrapper}>
                            <Recycle size={16} className={styles.inputIcon} />
                            <input 
                                required 
                                value={formData.wasteType} 
                                onChange={(e) => {
                                    setFormData({...formData, wasteType: e.target.value});
                                    if (formErrors.wasteType) setFormErrors({...formErrors, wasteType: ''});
                                }} 
                                className={`${styles.input} ${styles.inputWithIcon} ${formErrors.wasteType ? styles.inputError + ' ' + styles.shake : ''}`} 
                                placeholder="e.g. Plastics, Electronics" 
                            />
                        </div>
                        {formErrors.wasteType && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.wasteType}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Points per Item <span style={{ color: '#ef4444' }}>*</span></label>
                        <div className={styles.inputWrapper}>
                            <Coins size={16} className={styles.inputIcon} />
                            <input 
                                type="number" 
                                step="1" 
                                min="0" 
                                required 
                                value={formData.pointsPerItem ?? ''} 
                                onChange={(e) => {
                                    setFormData({...formData, pointsPerItem: e.target.value === '' ? '' : parseInt(e.target.value, 10)});
                                    if (formErrors.pointsPerItem) setFormErrors({...formErrors, pointsPerItem: ''});
                                }} 
                                className={`${styles.input} ${styles.inputWithIcon} ${formErrors.pointsPerItem ? styles.inputError + ' ' + styles.shake : ''}`} 
                            />
                        </div>
                        {formErrors.pointsPerItem && <span style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.pointsPerItem}</span>}
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