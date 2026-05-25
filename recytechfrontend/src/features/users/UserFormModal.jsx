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
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const handleGeneratePassword = () => {
        const newPass = generateStrongPassword();
        setFormData({ ...formData, password: newPass, confirmPassword: newPass });
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
                        <input name="firstName" value={formData.firstName} onChange={handleInputChange} className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`} />
                        {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Last Name</label>
                        <input name="lastName" value={formData.lastName} onChange={handleInputChange} className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`} />
                        {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Email Address</label>
                        <input name="email" type="email" value={formData.email} onChange={handleInputChange} className={`${styles.input} ${errors.email ? styles.inputError : ''}`} />
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
                    <div className={styles.formGroup}>
                        <div className={styles.passwordHeader} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                            <label>Password {isEditing && <span style={{fontSize:'10px', color:'#666'}}>(Leave blank to keep current)</span>}</label>
                            {!isEditing && (
                                <button type="button" onClick={handleGeneratePassword} style={{fontSize: '11px', background: '#f3f4f6', border: '1px solid #d1d5db', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer'}}>Generate Password</button>
                            )}
                        </div>
                        <div style={{position: 'relative'}}>
                            <input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleInputChange} className={`${styles.input} ${errors.password ? styles.inputError : ''}`} />
                            <div style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '8px'}}>
                                {formData.password && !isEditing && <button type="button" onClick={copyToClipboard} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280'}}>{copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}</button>}
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280'}}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                            </div>
                        </div>
                        {errors.password && <span className={styles.error}>{errors.password}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Confirm Password</label>
                        <div style={{position: 'relative'}}>
                            <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleInputChange} className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`} />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280'}}>{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                        {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
                    </div>
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