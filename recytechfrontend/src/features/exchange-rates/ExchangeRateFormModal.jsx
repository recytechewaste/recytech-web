import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import styles from '../../styles/EducationManager.module.css'; // Reusing layout styles
import Modal from '../../components/Modal';

const ExchangeRateFormModal = ({ isOpen, isEditing, initialData, onClose, onSubmit }) => {
    const [formData, setFormData] = useState(initialData);

    useEffect(() => {
        setFormData(initialData);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Frontend Validation
        const rateValue = formData.ratePerItem ?? formData.ratePerKg ?? 0;
        if (rateValue < 0) {
            return alert("Exchange rate cannot be negative.");
        }
        if (!formData.wasteType.trim()) {
            return alert("Waste type is required.");
        }

        onSubmit(formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Rate' : 'New Exchange Rate'} maxWidth="450px">
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Waste Type</label>
                        <input required value={formData.wasteType} onChange={(e) => setFormData({...formData, wasteType: e.target.value})} className={styles.input} placeholder="e.g. Plastics, Electronics" />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Rate (PHP per item)</label>
                        <input type="number" step="0.01" min="0" required value={formData.ratePerItem ?? formData.ratePerKg ?? 0} onChange={(e) => setFormData({...formData, ratePerItem: parseFloat(e.target.value)})} className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={styles.textarea} />
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn}><Save size={16} /> Save Rate</button>
                    </div>
                </form>
        </Modal>
    );
};

export default ExchangeRateFormModal;