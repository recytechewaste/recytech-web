import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import styles from '../../styles/UserManagement.module.css'; // Using the same styles for consistency
import { Save } from 'lucide-react';

const LguFormModal = ({ lgu, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    jurisdiction: '',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});

  const isEditing = !!lgu;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: lgu.name || '',
        contactPerson: lgu.contactPerson || '',
        email: lgu.email || '',
        phone: lgu.phone || '',
        password: '',
        confirmPassword: '',
        jurisdiction: lgu.jurisdiction || '',
        status: lgu.status || 'Active',
      });
    } else {
        // Reset form for new entry
        setFormData({
            name: '',
            contactPerson: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            jurisdiction: '',
            status: 'Active',
        });
    }
    setErrors({});
  }, [lgu, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if(errors[name]) {
        setErrors(prev => ({...prev, [name]: null}));
    }
  };
  
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'LGU Name is required';
    if (!formData.contactPerson.trim()) newErrors.contactPerson = 'Contact Person is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format';
    }
    
    if (!isEditing && !formData.password) {
        newErrors.password = 'Password is required for new accounts';
    } else if (formData.password && formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
        const dataToSave = { ...formData };
        if (isEditing && !dataToSave.password) {
          delete dataToSave.password; // Don't send empty password string on update
        }
        delete dataToSave.confirmPassword; // Don't send this to backend
        onSave(dataToSave);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? 'Edit LGU Account' : 'Add New LGU Account'}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
            <label>LGU Name</label>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g., City of Makati" className={`${styles.input} ${errors.name ? styles.inputError : ''}`} required />
            {errors.name && <span className={styles.error}>{errors.name}</span>}
        </div>
        
        <div className={styles.formGrid}>
            <div className={styles.formGroup}>
                <label>Contact Person</label>
                <input name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="e.g., Juan Dela Cruz" className={`${styles.input} ${errors.contactPerson ? styles.inputError : ''}`} required />
                {errors.contactPerson && <span className={styles.error}>{errors.contactPerson}</span>}
            </div>

            <div className={styles.formGroup}>
                <label>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="e.g., lgu@makati.gov.ph" className={`${styles.input} ${errors.email ? styles.inputError : ''}`} required disabled={isEditing} />
                {errors.email && <span className={styles.error}>{errors.email}</span>}
            </div>
        </div>

        <div className={styles.formGrid}>
            <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Optional contact number" className={styles.input} />
            </div>

            <div className={styles.formGroup}>
                <label>Jurisdiction</label>
                <input name="jurisdiction" value={formData.jurisdiction} onChange={handleChange} placeholder="e.g., District 1" className={styles.input} />
            </div>
        </div>
        
        <div className={styles.formGroup}>
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className={styles.selectInput}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
            </select>
        </div>
        
        <div className={styles.formGrid}>
            <div className={styles.formGroup}>
                <label>Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEditing ? "Leave blank to keep current" : "Min. 8 characters"} className={`${styles.input} ${errors.password ? styles.inputError : ''}`} required={!isEditing} />
                {errors.password && <span className={styles.error}>{errors.password}</span>}
            </div>
            
            <div className={styles.formGroup}>
                <label>Confirm Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`} required={!isEditing && !!formData.password} />
                {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
            </div>
        </div>

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
          <button type="submit" className={styles.submitBtn}>
            <Save size={16} style={{marginRight:'6px'}}/>
            {isEditing ? 'Save Changes' : 'Create LGU Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LguFormModal;
