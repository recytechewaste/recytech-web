import { useState, useEffect } from 'react';
import { Save, X, Eye, EyeOff, Copy } from 'lucide-react';
import styles from '../../styles/UserManagement.module.css';

const ResidentFormModal = ({ isOpen, isEditing, initialData, onClose, onSubmit }) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        setFormData({ ...initialData, confirmPassword: '' });
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const generatePassword = () => {
        const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const lowercase = "abcdefghijklmnopqrstuvwxyz";
        const numbers = "0123456789";
        const specials = "!@#$%^&*";
        
        let newPassword = 
            uppercase[Math.floor(Math.random() * uppercase.length)] +
            lowercase[Math.floor(Math.random() * lowercase.length)] +
            numbers[Math.floor(Math.random() * numbers.length)] +
            specials[Math.floor(Math.random() * specials.length)];
            
        const allChars = uppercase + lowercase + numbers + specials;
        for (let i = 0; i < 8; i++) {
            newPassword += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // Shuffle the characters so it doesn't follow a predictable pattern
        newPassword = newPassword.split('').sort(() => 0.5 - Math.random()).join('');
        
        setFormData(prev => ({ ...prev, password: newPassword, confirmPassword: newPassword }));
        setShowPassword(true);
        setShowConfirmPassword(true);
        
        if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
    };

    const copyToClipboard = () => {
        if (formData.password) {
            navigator.clipboard.writeText(formData.password);
        }
    };

    const validate = () => {
        const nextErrors = {};
        if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) {
            nextErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            nextErrors.email = 'Invalid email format';
        }
        
        if (!isEditing && !formData.password) {
            nextErrors.password = 'Password is required for new users';
        } else if (formData.password) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                nextErrors.password = 'Must be at least 8 chars, including upper, lower, number, and special char.';
            }
        }

        if (formData.password && formData.password !== formData.confirmPassword) {
            nextErrors.confirmPassword = 'Passwords do not match';
        }
        
        if (formData.phone && formData.phone.length > 0 && formData.phone.length < 11) {
            nextErrors.phone = 'Phone number must be exactly 11 digits';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;
        
        if (name === 'phone') {
            finalValue = value.replace(/\D/g, '').slice(0, 11);
        } else if (name === 'firstName' || name === 'lastName') {
            finalValue = value.replace(/\d/g, ''); // Instantly strip out digits
        }
        
        setFormData(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
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
                    <h2 className={styles.modalTitle}>{isEditing ? 'Edit Resident' : 'Add Resident'}</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20}/></button>
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
                        <input name="email" type="email" placeholder="e.g., juan@example.com" value={formData.email} onChange={handleInputChange} className={`${styles.input} ${errors.email ? styles.inputError : ''}`} disabled={isEditing} />
                        {errors.email && <span className={styles.error}>{errors.email}</span>}
                    </div>
                    {!isEditing && (
                    <>
                    <div className={styles.formGroup}>
                        <div className={styles.passwordHeader}>
                            <label>Password <span style={{color: '#ef4444'}}>*</span></label>
                            <button type="button" onClick={generatePassword} className={styles.generateBtn}>
                                Generate Password
                            </button>
                        </div>
                        <div className={styles.passwordWrapper}>
                            <input 
                                name="password" 
                                type={showPassword ? "text" : "password"} 
                                value={formData.password || ''} 
                                onChange={handleInputChange} 
                                placeholder="Enter password"
                                className={`${styles.input} ${errors.password ? styles.inputError : ''}`} 
                                style={{ width: '100%', paddingRight: '65px' }}
                            />
                            <button 
                                type="button" 
                                onClick={copyToClipboard}
                                className={styles.copyBtn}
                                title="Copy Password"
                            >
                                <Copy size={16} />
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className={styles.eyeBtn}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <span className={styles.error}>{errors.password}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Confirm Password <span style={{color: '#ef4444'}}>*</span></label>
                        <div className={styles.passwordWrapper}>
                            <input 
                                name="confirmPassword" 
                                type={showConfirmPassword ? "text" : "password"} 
                                value={formData.confirmPassword || ''} 
                                onChange={handleInputChange} 
                                placeholder="Re-enter password"
                                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`} 
                                style={{ width: '100%', paddingRight: '40px' }}
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className={styles.eyeBtn}
                            >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
                    </div>
                    </>
                    )}
                    <div className={styles.formGroup}>
                        <label>Phone Number</label>
                        <input name="phone" placeholder="e.g., 09123456789" maxLength="11" value={formData.phone} onChange={handleInputChange} className={`${styles.input} ${errors.phone ? styles.inputError : ''}`} />
                        {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Status</label>
                        <select name="status" value={formData.status} onChange={handleInputChange} className={styles.selectInput} style={{width: '100%', border: '1px solid #d1d5db'}}>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn}><Save size={16} style={{marginRight:'6px'}}/> Save Resident</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResidentFormModal;