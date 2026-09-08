import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Copy, Check, User, Mail, Phone, MapPin, Award, Lock, Activity, ShieldCheck } from 'lucide-react';
import styles from '../../styles/Collectors.module.css';
import sharedStyles from '../../styles/Layout.module.css';
import Modal from '../../components/Modal';

const ResidentFormModal = ({ isOpen, isEditing, initialData, onClose, onSubmit }) => {
    const [formData, setFormData] = useState(initialData || {});
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setFormData(initialData || {});
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
        setCopied(false);
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const generateStrongPassword = () => {
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
        
        return newPassword.split('').sort(() => 0.5 - Math.random()).join('');
    };

    const handleGeneratePassword = () => {
        const newPass = generateStrongPassword();
        setFormData(prev => ({ ...prev, password: newPass, confirmPassword: newPass }));
        setShowPassword(true);
        setShowConfirmPassword(true);
        setErrors(prev => ({ ...prev, password: '', confirmPassword: '' }));
    };

    const copyToClipboard = () => {
        if (!formData.password) return;
        navigator.clipboard.writeText(formData.password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const validate = () => {
        const nextErrors = {};
        if (!formData.firstName?.trim()) nextErrors.firstName = 'First name is required';
        if (!formData.lastName?.trim()) nextErrors.lastName = 'Last name is required';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email?.trim()) {
            nextErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            nextErrors.email = 'Invalid email format';
        }
        
        if (!isEditing && !formData.password) {
            nextErrors.password = 'Password is required for new residents';
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
            finalValue = value.replace(/\d/g, ''); // strip out numbers
        } else if (name === 'pointsBalance') {
            finalValue = value === '' ? '' : Math.max(0, parseInt(value) || 0);
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
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Resident Profile' : 'Add New Resident'}>
            <form onSubmit={handleSubmit} className={sharedStyles.form} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className={sharedStyles.formGroup}>
                        <label htmlFor="resFirstName">First Name <span style={{ color: '#ef4444' }}>*</span></label>
                        <div className={sharedStyles.inputWrapper}>
                            <User size={16} className={sharedStyles.inputIcon} />
                            <input
                                id="resFirstName"
                                name="firstName"
                                placeholder="e.g., Maria"
                                value={formData.firstName || ''}
                                onChange={handleInputChange}
                                className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.firstName ? sharedStyles.inputError : ''}`}
                            />
                        </div>
                        {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
                    </div>

                    <div className={sharedStyles.formGroup}>
                        <label htmlFor="resLastName">Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                        <div className={sharedStyles.inputWrapper}>
                            <User size={16} className={sharedStyles.inputIcon} />
                            <input
                                id="resLastName"
                                name="lastName"
                                placeholder="e.g., Santos"
                                value={formData.lastName || ''}
                                onChange={handleInputChange}
                                className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.lastName ? sharedStyles.inputError : ''}`}
                            />
                        </div>
                        {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
                    </div>
                </div>

                <div className={sharedStyles.formGroup}>
                    <label htmlFor="resEmail">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                    <div className={sharedStyles.inputWrapper}>
                        <Mail size={16} className={sharedStyles.inputIcon} />
                        <input
                            id="resEmail"
                            name="email"
                            type="email"
                            placeholder="e.g., resident@example.com"
                            value={formData.email || ''}
                            onChange={handleInputChange}
                            className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.email ? sharedStyles.inputError : ''}`}
                            disabled={isEditing}
                        />
                    </div>
                    {errors.email && <span className={styles.error}>{errors.email}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className={sharedStyles.formGroup}>
                        <label htmlFor="resPhone">Phone Number</label>
                        <div className={sharedStyles.inputWrapper}>
                            <Phone size={16} className={sharedStyles.inputIcon} />
                            <input
                                id="resPhone"
                                name="phone"
                                placeholder="e.g., 09123456789"
                                maxLength="11"
                                value={formData.phone || ''}
                                onChange={handleInputChange}
                                className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.phone ? sharedStyles.inputError : ''}`}
                            />
                        </div>
                        {errors.phone && <span className={styles.error}>{errors.phone}</span>}
                    </div>

                    <div className={sharedStyles.formGroup}>
                        <label htmlFor="resStatus">Account Status</label>
                        <div className={sharedStyles.inputWrapper}>
                            <Activity size={16} className={sharedStyles.inputIcon} />
                            <select
                                id="resStatus"
                                name="status"
                                value={formData.status || 'Active'}
                                onChange={handleInputChange}
                                className={`${sharedStyles.input} ${sharedStyles.inputWithIcon}`}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={sharedStyles.formGroup}>
                    <label htmlFor="resAddress">Complete Address</label>
                    <div className={sharedStyles.inputWrapper}>
                        <MapPin size={16} className={sharedStyles.inputIcon} />
                        <input
                            id="resAddress"
                            name="address"
                            placeholder="e.g., 123 Rizal St, Barangay San Isidro"
                            value={formData.address || ''}
                            onChange={handleInputChange}
                            className={`${sharedStyles.input} ${sharedStyles.inputWithIcon}`}
                        />
                    </div>
                </div>

                {isEditing ? (
                    <div className={sharedStyles.formGroup}>
                        <label htmlFor="resPoints">Points Balance</label>
                        <div className={sharedStyles.inputWrapper}>
                            <Award size={16} className={sharedStyles.inputIcon} />
                            <input
                                id="resPoints"
                                name="pointsBalance"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={formData.pointsBalance !== undefined ? formData.pointsBalance : (formData.totalPoints || 0)}
                                onChange={handleInputChange}
                                className={`${sharedStyles.input} ${sharedStyles.inputWithIcon}`}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className={sharedStyles.formGroup}>
                            <div className={styles.passwordHeader}>
                                <label htmlFor="resPassword">Password <span style={{ color: '#ef4444' }}>*</span></label>
                                <button type="button" onClick={handleGeneratePassword} className={styles.generateBtn}>
                                    Generate Password
                                </button>
                            </div>
                            <div className={sharedStyles.inputWrapper}>
                                <Lock size={16} className={sharedStyles.inputIcon} />
                                <input
                                    id="resPassword"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter secure password"
                                    value={formData.password || ''}
                                    onChange={handleInputChange}
                                    className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.password ? sharedStyles.inputError : ''}`}
                                    style={{ width: '100%', paddingRight: '65px' }}
                                />
                                <button
                                    type="button"
                                    onClick={copyToClipboard}
                                    className={styles.copyBtn}
                                    title="Copy Password"
                                    aria-label="Copy generated password"
                                >
                                    {copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className={styles.eyeBtn}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && <span className={styles.error}>{errors.password}</span>}
                        </div>

                        <div className={sharedStyles.formGroup}>
                            <label htmlFor="resConfirmPassword">Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
                            <div className={sharedStyles.inputWrapper}>
                                <Lock size={16} className={sharedStyles.inputIcon} />
                                <input
                                    id="resConfirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter password"
                                    value={formData.confirmPassword || ''}
                                    onChange={handleInputChange}
                                    className={`${sharedStyles.input} ${sharedStyles.inputWithIcon} ${errors.confirmPassword ? sharedStyles.inputError : ''}`}
                                    style={{ width: '100%', paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className={styles.eyeBtn}
                                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
                        </div>
                    </>
                )}

                <div className={sharedStyles.modalFooter}>
                    <button type="button" onClick={onClose} className={sharedStyles.cancelBtn}>
                        Cancel
                    </button>
                    <button type="submit" className={sharedStyles.submitBtn}>
                        <Save size={16} style={{ marginRight: '6px' }} />
                        {isEditing ? 'Update Resident' : 'Save Resident'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ResidentFormModal;