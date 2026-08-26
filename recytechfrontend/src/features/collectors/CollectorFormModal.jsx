import { useState, useEffect } from 'react';
import { Copy, Check, Eye, EyeOff, User, Mail, Lock, Phone, Truck, Activity, Hash } from 'lucide-react';
import styles from '../../styles/Collectors.module.css';
import sharedStyles from '../../styles/Layout.module.css';
import Modal from '../../components/Modal';

const CollectorFormModal = ({ isOpen, isEditing, initialData, onClose, onSubmit }) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setFormData({ ...initialData, confirmPassword: '' });
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
        if (!formData.firstName?.trim()) newErrors.firstName = 'First Name is required.';
        if (!formData.lastName?.trim()) newErrors.lastName = 'Last Name is required.';
        if (!formData.phone?.trim()) {
            newErrors.phone = 'Phone number is required.';
        } else if (!/^\d{11}$/.test(formData.phone)) {
            newErrors.phone = 'Phone number must be exactly 11 digits.';
        }
        if (!formData.vehiclePlate.trim()) newErrors.vehiclePlate = 'Vehicle plate is required.';
        if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required.';
        
        if (!isEditing) {
            if (!formData.email?.trim()) newErrors.email = 'Email is required for login.';
            if (!formData.password?.trim()) {
                newErrors.password = 'Password is required for login.';
            } else {
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
                if (!passwordRegex.test(formData.password)) {
                    newErrors.password = 'Must be at least 8 chars, including upper, lower, number, and special char.';
                }
            }
            if (formData.password && formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGeneratePassword = () => {
        const newPass = generateStrongPassword();
        setFormData(prev => ({ ...prev, password: newPass, confirmPassword: newPass }));
        setShowPassword(true);
        setShowConfirmPassword(true);
        if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
    };

    const copyToClipboard = () => {
        if (!formData.password) return;
        navigator.clipboard.writeText(formData.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleChange = (e) => {
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
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Collector' : 'Add New Bin Collector'} maxWidth="600px">
                <form onSubmit={handleSubmit} className={sharedStyles.form} noValidate>
                    <div className={sharedStyles.formGroup}>
                        <label>First Name <span style={{color:'#ef4444'}}>*</span></label>
                        <div className={sharedStyles.inputWrapper}>
                            <User size={16} className={sharedStyles.inputIcon} />
                            <input 
                                name="firstName" 
                                value={formData.firstName} 
                                onChange={handleChange} 
                                className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.firstName ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`}
                                placeholder="e.g. Juan"
                            />
                        </div>
                        {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
                    </div>
                    <div className={sharedStyles.formGroup}>
                        <label>Last Name <span style={{color:'#ef4444'}}>*</span></label>
                        <div className={sharedStyles.inputWrapper}>
                            <User size={16} className={sharedStyles.inputIcon} />
                            <input 
                                name="lastName" 
                                value={formData.lastName} 
                                onChange={handleChange} 
                                className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.lastName ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`}
                                placeholder="e.g. Dela Cruz"
                            />
                        </div>
                        {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
                    </div>
                    <div className={sharedStyles.formGroup}>
                        <label>Email Address {!isEditing && <span style={{color:'#ef4444'}}>*</span>}</label>
                        <div className={sharedStyles.inputWrapper}>
                            <Mail size={16} className={sharedStyles.inputIcon} />
                            <input 
                                name="email" 
                                type="email"
                                value={formData.email || ''} 
                                onChange={handleChange} 
                                className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.email ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`}
                                placeholder="e.g. driver@recytech.com"
                                disabled={isEditing}
                            />
                        </div>
                        {errors.email && <span className={styles.error}>{errors.email}</span>}
                    </div>
                    {!isEditing && (
                    <>
                    <div className={sharedStyles.formGroup}>
                        <div className={styles.passwordHeader}>
                            <label>Password <span style={{color:'#ef4444'}}>*</span></label>
                            <button type="button" className={styles.generateBtn} onClick={handleGeneratePassword}>
                                Generate Password
                            </button>
                        </div>
                        <div className={sharedStyles.inputWrapper}>
                            <Lock size={16} className={sharedStyles.inputIcon} />
                            <input 
                                name="password" 
                                type={showPassword ? "text" : "password"}
                                value={formData.password || ''} 
                                onChange={handleChange} 
                                className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.password ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`}
                                placeholder="Login password"
                                style={{paddingRight: '65px'}}
                            />
                            <button type="button" className={styles.copyBtn} onClick={copyToClipboard} title="Copy to clipboard" aria-label="Copy generated password">
                                {copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                            </button>
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <span className={styles.error}>{errors.password}</span>}
                    </div>
                    <div className={sharedStyles.formGroup}>
                        <label>Confirm Password <span style={{color:'#ef4444'}}>*</span></label>
                        <div className={sharedStyles.inputWrapper}>
                            <Lock size={16} className={sharedStyles.inputIcon} />
                            <input 
                                name="confirmPassword" 
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.confirmPassword || ''} 
                                onChange={handleChange} 
                                className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.confirmPassword ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`}
                                placeholder="Re-enter password"
                                style={{paddingRight: '40px'}}
                            />
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
                    </div>
                    </>
                    )}
                    <div className={sharedStyles.formGroup}>
                        <label>Phone Number <span style={{color:'#ef4444'}}>*</span></label>
                        <div className={sharedStyles.inputWrapper}>
                            <Phone size={16} className={sharedStyles.inputIcon} />
                            <input name="phone" maxLength="11" value={formData.phone} onChange={handleChange} className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.phone ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`} placeholder="e.g. 09123456789" />
                        </div>
                        {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                    </div>
                    <div className={sharedStyles.formGroup}>
                        <label>Vehicle Type <span style={{color:'#ef4444'}}>*</span></label>
                        <div className={sharedStyles.inputWrapper}>
                            <Truck size={16} className={sharedStyles.inputIcon} />
                            <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.vehicleType ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`} aria-label="Select vehicle type">
                                <option value="">Select Type</option><option value="Motorcycle">Motorcycle</option><option value="Van">Van</option><option value="Truck">Truck</option>
                            </select>
                        </div>
                        {errors.vehicleType && <span className={styles.error}>{errors.vehicleType}</span>}
                    </div>
                    <div className={sharedStyles.formGroup}>
                        <label>Status</label>
                        <div className={sharedStyles.inputWrapper}>
                            <Activity size={16} className={sharedStyles.inputIcon} />
                            <select name="status" value={formData.status} onChange={handleChange} className={`${sharedStyles.input} ${sharedStyles.inputWithIcon}`} aria-label="Select collector status">
                                <option value="Active">Active</option><option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div className={sharedStyles.formGroup}>
                        <label>Vehicle Plate Number <span style={{color:'#ef4444'}}>*</span></label>
                        <div className={sharedStyles.inputWrapper}>
                            <Hash size={16} className={sharedStyles.inputIcon} />
                            <input name="vehiclePlate" value={formData.vehiclePlate} onChange={handleChange} className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.vehiclePlate ? sharedStyles.inputError + ' ' + sharedStyles.shake : ''}`} placeholder="e.g. ABC 1234" />
                        </div>
                        {errors.vehiclePlate && <span className={styles.error}>{errors.vehiclePlate}</span>}
                    </div>
                    <div className={sharedStyles.modalFooter}>
                        <button type="button" onClick={onClose} className={sharedStyles.cancelBtn}>Cancel</button>
                        <button type="submit" className={sharedStyles.submitBtn}>{isEditing ? 'Save Changes' : 'Create Collector'}</button>
                    </div>
                </form>
        </Modal>
    );
};

export default CollectorFormModal;