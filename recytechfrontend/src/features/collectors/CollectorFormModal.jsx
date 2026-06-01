import { useState, useEffect } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import styles from '../../styles/Collectors.module.css';
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
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required.';
        } else {
            if (formData.phone.length !== 11) {
                newErrors.phone = 'Phone number must be exactly 11 digits.';
            }
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
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Collector' : 'Add New Collector'} maxWidth="600px">
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>First Name</label>
                        <input 
                            name="firstName" 
                            value={formData.firstName} 
                            onChange={handleChange} 
                            className={errors.firstName ? styles.inputError : styles.input}
                            placeholder="e.g. Juan"
                        />
                        {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Last Name</label>
                        <input 
                            name="lastName" 
                            value={formData.lastName} 
                            onChange={handleChange} 
                            className={errors.lastName ? styles.inputError : styles.input}
                            placeholder="e.g. Dela Cruz"
                        />
                        {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Email Address {!isEditing && <span style={{color:'red'}}>*</span>}</label>
                        <input 
                            name="email" 
                            type="email"
                            value={formData.email || ''} 
                            onChange={handleChange} 
                            className={errors.email ? styles.inputError : styles.input}
                            placeholder="e.g. driver@recytech.com"
                            disabled={isEditing}
                        />
                        {errors.email && <span className={styles.error}>{errors.email}</span>}
                    </div>
                    {!isEditing && (
                    <>
                    <div className={styles.formGroup}>
                        <div className={styles.passwordHeader}>
                            <label>Password <span style={{color:'red'}}>*</span></label>
                            <button type="button" className={styles.generateBtn} onClick={handleGeneratePassword}>
                                Generate Password
                            </button>
                        </div>
                        <div className={styles.passwordWrapper}>
                            <input 
                                name="password" 
                                type={showPassword ? "text" : "password"}
                                value={formData.password || ''} 
                                onChange={handleChange} 
                                className={errors.password ? styles.inputError : styles.input}
                                placeholder="Login password"
                                style={{paddingRight: '65px'}}
                            />
                            <button type="button" className={styles.copyBtn} onClick={copyToClipboard} title="Copy to clipboard">
                                {copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                            </button>
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <span className={styles.error}>{errors.password}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Confirm Password <span style={{color:'red'}}>*</span></label>
                        <div className={styles.passwordWrapper}>
                            <input 
                                name="confirmPassword" 
                                type={showConfirmPassword ? "text" : "password"}
                                value={formData.confirmPassword || ''} 
                                onChange={handleChange} 
                                className={errors.confirmPassword ? styles.inputError : styles.input}
                                placeholder="Re-enter password"
                                style={{paddingRight: '40px'}}
                            />
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
                    </div>
                    </>
                    )}
                    <div className={styles.formGroup}>
                        <label>Phone Number</label>
                        <input name="phone" maxLength="11" value={formData.phone} onChange={handleChange} className={errors.phone ? styles.inputError : styles.input} placeholder="e.g. 09123456789" />
                        {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Vehicle Type</label>
                        <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className={errors.vehicleType ? styles.inputError : styles.input}>
                            <option value="">Select Type</option><option value="Motorcycle">Motorcycle</option><option value="Van">Van</option><option value="Truck">Truck</option>
                        </select>
                        {errors.vehicleType && <span className={styles.error}>{errors.vehicleType}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className={styles.input}>
                            <option value="Active">Active</option><option value="Inactive">Inactive</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Vehicle Plate Number</label>
                        <input name="vehiclePlate" value={formData.vehiclePlate} onChange={handleChange} className={errors.vehiclePlate ? styles.inputError : styles.input} placeholder="e.g. ABC 1234" />
                        {errors.vehiclePlate && <span className={styles.error}>{errors.vehiclePlate}</span>}
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn} style={{backgroundColor: '#2563EB'}}>{isEditing ? 'Save Changes' : 'Create Collector'}</button>
                    </div>
                </form>
        </Modal>
    );
};

export default CollectorFormModal;