import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import styles from '../../styles/UserManagement.module.css';
import sharedStyles from '../../styles/Layout.module.css';
import { Save, Building2, User, Mail, Phone, MapPin, Activity, Lock } from 'lucide-react';

const PartnerOrgFormModal = ({ lgu, onSave, onClose }) => {
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
    if (!formData.name.trim()) newErrors.name = 'Partner Organization Name is required';
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
          delete dataToSave.password;
        }
        delete dataToSave.confirmPassword;
        onSave(dataToSave);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? 'Edit Partner Organization' : 'Add New Partner Organization'} maxWidth="700px">
      <form onSubmit={handleSubmit} className={sharedStyles.form} noValidate>
        <div className={sharedStyles.formGroup}>
            <label>Partner Organization Name <span style={{color: '#ef4444'}}>*</span></label>
            <div className={sharedStyles.inputWrapper}>
                <Building2 size={16} className={sharedStyles.inputIcon} />
                <input name="name" value={formData.name} onChange={handleChange} placeholder="e.g., City of Makati or Green Earth Org" className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.name ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`} />
            </div>
            {errors.name && <span className={styles.error}>{errors.name}</span>}
        </div>
        
        <div className={sharedStyles.formRow}>
            <div className={sharedStyles.formGroup}>
                <label>Contact Person <span style={{color: '#ef4444'}}>*</span></label>
                <div className={sharedStyles.inputWrapper}>
                    <User size={16} className={sharedStyles.inputIcon} />
                    <input name="contactPerson" value={formData.contactPerson} onChange={handleChange} placeholder="e.g., Juan Dela Cruz" className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.contactPerson ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`} />
                </div>
                {errors.contactPerson && <span className={styles.error}>{errors.contactPerson}</span>}
            </div>

            <div className={sharedStyles.formGroup}>
                <label>Email Address <span style={{color: '#ef4444'}}>*</span></label>
                <div className={sharedStyles.inputWrapper}>
                    <Mail size={16} className={sharedStyles.inputIcon} />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="e.g., partner@organization.org" className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.email ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`} disabled={isEditing} />
                </div>
                {errors.email && <span className={styles.error}>{errors.email}</span>}
            </div>
        </div>

        <div className={sharedStyles.formRow}>
            <div className={sharedStyles.formGroup}>
                <label>Phone Number</label>
                <div className={sharedStyles.inputWrapper}>
                    <Phone size={16} className={sharedStyles.inputIcon} />
                    <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Optional contact number" className={`${sharedStyles.input} ${sharedStyles.inputWithIcon}`} />
                </div>
            </div>

            <div className={sharedStyles.formGroup}>
                <label>Jurisdiction / Region</label>
                <div className={sharedStyles.inputWrapper}>
                    <MapPin size={16} className={sharedStyles.inputIcon} />
                    <input name="jurisdiction" value={formData.jurisdiction} onChange={handleChange} placeholder="e.g., District 1 or Metro Area" className={`${sharedStyles.input} ${sharedStyles.inputWithIcon}`} />
                </div>
            </div>
        </div>
        
        <div className={sharedStyles.formGroup}>
            <label>Status</label>
            <div className={sharedStyles.inputWrapper}>
                <Activity size={16} className={sharedStyles.inputIcon} />
                <select name="status" value={formData.status} onChange={handleChange} className={`${sharedStyles.input} ${sharedStyles.inputWithIcon}`}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>
        </div>
        
        <div className={sharedStyles.formRow}>
            <div className={sharedStyles.formGroup}>
                <label>Password {!isEditing && <span style={{color: '#ef4444'}}>*</span>}</label>
                <div className={sharedStyles.inputWrapper}>
                    <Lock size={16} className={sharedStyles.inputIcon} />
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEditing ? "Leave blank to keep current" : "Min. 8 characters"} className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.password ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`} />
                </div>
                {errors.password && <span className={styles.error}>{errors.password}</span>}
            </div>
            
            <div className={sharedStyles.formGroup}>
                <label>Confirm Password {!isEditing && <span style={{color: '#ef4444'}}>*</span>}</label>
                <div className={sharedStyles.inputWrapper}>
                    <Lock size={16} className={sharedStyles.inputIcon} />
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.confirmPassword ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`} />
                </div>
                {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
            </div>
        </div>

        <div className={sharedStyles.modalFooter}>
          <button type="button" onClick={onClose} className={sharedStyles.cancelBtn}>Cancel</button>
          <button type="submit" className={sharedStyles.submitBtn}>
            <Save size={16} style={{marginRight:'6px'}}/>
            {isEditing ? 'Save Changes' : 'Create Partner Organization'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PartnerOrgFormModal;
