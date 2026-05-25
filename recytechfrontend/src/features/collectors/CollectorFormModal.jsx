import { useState, useEffect } from 'react';
import { Save, X, Copy, Check, Eye, EyeOff } from 'lucide-react';
import styles from '../../styles/Collectors.module.css';

const CollectorFormModal = ({ isOpen, isEditing, initialData, onClose, onSubmit }) => {
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setFormData(initialData);
        setErrors({});
        setShowPassword(false);
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
            const phoneDigits = formData.phone.replace(/\D/g, '');
            if (phoneDigits.length < 10 || phoneDigits.length > 15) {
                newErrors.phone = 'Enter valid phone (10-15 digits).';
            }
        }
        if (!formData.vehiclePlate.trim()) newErrors.vehiclePlate = 'Vehicle plate is required.';
        if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required.';
        
        if (!isEditing) {
            if (!formData.email?.trim()) newErrors.email = 'Email is required for login.';
            if (!formData.password?.trim()) {
                newErrors.password = 'Password is required for login.';
            } else if (formData.password.length < 8) {
                newErrors.password = 'Password must be at least 8 characters.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGeneratePassword = () => {
        const newPass = generateStrongPassword();
        setFormData(prev => ({ ...prev, password: newPass }));
        setErrors(prev => ({ ...prev, password: '' }));
    };

    const copyToClipboard = () => {
        if (!formData.password) return;
        navigator.clipboard.writeText(formData.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
                    <h2>{isEditing ? 'Edit Collector' : 'Add New Collector'}</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20}/></button>
                </div>
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
                            value={formData.email} 
                            onChange={handleChange} 
                            className={errors.email ? styles.inputError : styles.input}
                            placeholder="e.g. driver@recytech.com"
                            disabled={!!isEditing}
                        />
                        {errors.email && <span className={styles.error}>{errors.email}</span>}
                    </div>
                    {!isEditing && (
                    <div className={styles.formGroup}>
                        <div className={styles.passwordHeader}>
                            <label>Password <span style={{color:'red'}}>*</span></label>
                            <button type="button" className={styles.generateBtn} onClick={handleGeneratePassword}>
                                Generate Strong Password
                            </button>
                        </div>
                        <div className={styles.passwordWrapper}>
                            <input 
                                name="password" 
                                type={showPassword ? "text" : "password"}
                                value={formData.password} 
                                onChange={handleChange} 
                                className={errors.password ? styles.inputError : styles.input}
                                placeholder="Login password"
                                style={{paddingRight: '65px'}}
                            />
                            {formData.password && (
                                <button type="button" className={styles.copyBtn} onClick={copyToClipboard} title="Copy to clipboard">
                                    {copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                                </button>
                            )}
                            <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <span className={styles.error}>{errors.password}</span>}
                    </div>
                    )}
                    <div className={styles.formGroup}>
                        <label>Phone Number</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} className={errors.phone ? styles.inputError : styles.input} placeholder="e.g. 09123456789" />
                        {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                    </div>
                    <div className={styles.formGroup}>
                        <label>Vehicle Type</label>
                        <select name="vehicleType" value={formData.vehicleType} onChange={handleChange} className={errors.vehicleType ? styles.inputError : styles.input}>
                            <option value="">Select Type</option><option value="E-Trike">E-Trike</option><option value="Truck">Truck</option><option value="Bike">Bike</option>
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
            </div>
        </div>
    );
};

export default CollectorFormModal;