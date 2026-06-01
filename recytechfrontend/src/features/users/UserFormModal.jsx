import { useState, useEffect } from 'react';
import { Save, X, Eye, EyeOff, Copy, Check } from 'lucide-react';
import styles from '../../styles/UserManagement.module.css';

const UserFormModal = ({ isOpen, isEditing, initialData, onClose, onSubmit }) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setFormData(initialData);
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        setCopied(false);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const generateStrongPassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let password = "";
        password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
        password += "0123456789"[Math.floor(Math.random() * 10)];
        password += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)];
        
        for (let i = 0; i < 9; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }
        return password.split('').sort(() => 0.5 - Math.random()).join('');
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName?.trim()) newErrors.firstName = 'First Name is required';
        if (!formData.lastName?.trim()) newErrors.lastName = 'Last Name is required';
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!isEditing && !formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                newErrors.password = 'Must be at least 8 chars, including upper, lower, number, and special char.';
            }
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;
        
        if (name === 'firstName' || name === 'lastName') {
            finalValue = value.replace(/\d/g, ''); // Instantly strip out digits
        }
        
        setFormData({ ...formData, [name]: finalValue });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleGeneratePassword = () => {
        const newPass = generateStrongPassword();
        setFormData({ ...formData, password: newPass, confirmPassword: newPass });
        setShowPassword(true);
        setShowConfirmPassword(true);
        setErrors({ ...errors, password: '', confirmPassword: '' });
    };

    const copyToClipboard = () => {
        if (!formData.password) return;
        navigator.clipboard.writeText(formData.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{isEditing ? 'Edit User' : 'Add New User'}</h2>
                    <button type="button" onClick={onClose} className={styles.closeBtn}><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>First Name</label>
                        <input name="firstName" placeholder="e.g., Juan" value={formData.firstName} onChange={handleInputChange} className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`} />
                        {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Last Name</label>
                        <input name="lastName" placeholder="e.g., Dela Cruz" value={formData.lastName} onChange={handleInputChange} className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`} />
                        {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Email Address</label>
                        <input name="email" type="email" placeholder="e.g., user@recytech.com" value={formData.email} onChange={handleInputChange} className={`${styles.input} ${errors.email ? styles.inputError : ''}`} disabled={isEditing} />
                        {errors.email && <span className={styles.error}>{errors.email}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Role</label>
                        <select name="role" value={formData.role} onChange={handleInputChange} className={styles.selectInput} style={{width: '100%', border: '1px solid #d1d5db'}}>
                            <option value="Staff">Staff</option>
                            <option value="Admin">Admin</option>
                            <option value="Super Admin">Super Admin</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Status</label>
                        <select name="status" value={formData.status} onChange={handleInputChange} className={styles.selectInput} style={{width: '100%', border: '1px solid #d1d5db'}}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    {!isEditing && (
                    <>
                    <div className={styles.formGroup}>
                        <div className={styles.passwordHeader}>
                            <label>Password <span style={{color: '#ef4444'}}>*</span></label>
                            <button type="button" onClick={handleGeneratePassword} className={styles.generateBtn}>Generate Password</button>
                        </div>
                        <div className={styles.passwordWrapper}>
                            <input name="password" type={showPassword ? "text" : "password"} placeholder="Login password" value={formData.password || ''} onChange={handleInputChange} className={`${styles.input} ${errors.password ? styles.inputError : ''}`} style={{ width: '100%', paddingRight: '65px' }} />
                            <button type="button" onClick={copyToClipboard} className={styles.copyBtn} title="Copy to clipboard">
                                {copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                            </button>
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.eyeBtn}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <span className={styles.error}>{errors.password}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Confirm Password <span style={{color: '#ef4444'}}>*</span></label>
                        <div className={styles.passwordWrapper}>
                            <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter password" value={formData.confirmPassword || ''} onChange={handleInputChange} className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`} style={{ width: '100%', paddingRight: '40px' }} />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={styles.eyeBtn}>
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
                    </div>
                    </>
                    )}
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn}><Save size={16} style={{marginRight:'6px'}}/> Save User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;