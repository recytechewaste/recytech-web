import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Eye, EyeOff, CheckCircle, AlertCircle, X, Loader2, Check, Circle, User, Mail, Lock } from 'lucide-react';
import styles from '../styles/Register.module.css';
import logo from '../assets/recytech_logo.webp';
import { useToast } from '../context/ToastContext';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '', 
        lastName: '', 
        email: '', 
        password: '', 
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [errors, setErrors] = useState({});
    const { showToast } = useToast();

    const getPasswordRequirements = (password) => [
        { label: 'At least 8 characters', met: password.length >= 8 },
        { label: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'At least one lowercase letter', met: /[a-z]/.test(password) },
        { label: 'At least one number', met: /[0-9]/.test(password) },
        { label: 'At least one special character', met: /[^A-Za-z0-9]/.test(password) },
    ];

    const calculateStrength = (password) => {
        if (!password) return 0;
        const requirements = getPasswordRequirements(password);
        const score = requirements.filter(req => req.met).length;
        return score;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;
        
        if (name === 'firstName' || name === 'lastName') {
            finalValue = value.replace(/\d/g, ''); // Instantly strip out digits
        }
        
        setFormData(prev => ({ ...prev, [name]: finalValue }));
        
        if (name === 'password') {
            setPasswordStrength(calculateStrength(finalValue));
        }

        // Clear error when user types
        if (errors[name] || errors.form) {
            setErrors(prev => ({ ...prev, [name]: '', form: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Email address is required.';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address.';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required.';
        } else {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                newErrors.password = 'Password must meet all security requirements below.';
            }
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password.';
        } else if (formData.confirmPassword !== formData.password) {
            newErrors.confirmPassword = 'Passwords do not match.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', formData);
            setSuccessMessage(data.message || 'Registration successful! Your account is pending administrator approval before you can log in.');
            setShowSuccessModal(true);
        } catch (error) {
            const msg = error.response?.data?.message || "Registration failed. Email might already be taken.";
            if (msg.toLowerCase().includes('email')) {
                setErrors({ email: msg, form: msg });
            } else {
                setErrors({ form: msg });
            }
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            {/* TOP HEADER BAR */}
            <header className={styles.topBar}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
                        <img src={logo} alt="RecyTech Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                    </div>
                    <span className={styles.logoText}>
                        RecyTech<span style={{ fontWeight: '400', opacity: '0.9' }}>: E-waste Management System</span>
                    </span>
                </div>
            </header>

            <main className={styles.contentContainer}>
                <div className={styles.card}>
                    <h1 className={styles.header}>Create Account</h1>
                    <p className={styles.subHeader}>Join RecyTech to manage your operations efficiently</p>
                    
                    <form onSubmit={handleRegister} className={styles.form} noValidate>
                        <div className={styles.gridRow}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label} htmlFor="regFirstName">First Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className={`${styles.inputWrapper} ${errors.firstName || errors.form ? styles.shake : ''}`}>
                                    <User size={18} className={styles.inputIcon} />
                                    <input 
                                        id="regFirstName"
                                        name="firstName" 
                                        placeholder="e.g. Juan" 
                                        className={`${styles.input} ${styles.inputWithIcon} ${errors.firstName || errors.form ? styles.inputError : ''}`} 
                                        value={formData.firstName}
                                        onChange={handleChange} 
                                    />
                                </div>
                                {errors.firstName && <span className={styles.errorText}><AlertCircle size={13} style={{ flexShrink: 0 }} /> {errors.firstName}</span>}
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label} htmlFor="regLastName">Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className={`${styles.inputWrapper} ${errors.lastName || errors.form ? styles.shake : ''}`}>
                                    <User size={18} className={styles.inputIcon} />
                                    <input 
                                        id="regLastName"
                                        name="lastName" 
                                        placeholder="e.g. Dela Cruz" 
                                        className={`${styles.input} ${styles.inputWithIcon} ${errors.lastName || errors.form ? styles.inputError : ''}`} 
                                        value={formData.lastName}
                                        onChange={handleChange} 
                                    />
                                </div>
                                {errors.lastName && <span className={styles.errorText}><AlertCircle size={13} style={{ flexShrink: 0 }} /> {errors.lastName}</span>}
                            </div>
                            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                                <label className={styles.label} htmlFor="regEmail">Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className={`${styles.inputWrapper} ${errors.email || errors.form ? styles.shake : ''}`}>
                                    <Mail size={18} className={styles.inputIcon} />
                                    <input 
                                        id="regEmail"
                                        name="email" 
                                        type="email" 
                                        placeholder="e.g. user@recytech.com" 
                                        className={`${styles.input} ${styles.inputWithIcon} ${errors.email || errors.form ? styles.inputError : ''}`} 
                                        value={formData.email}
                                        onChange={handleChange} 
                                    />
                                </div>
                                {errors.email && <span className={styles.errorText}><AlertCircle size={13} style={{ flexShrink: 0 }} /> {errors.email}</span>}
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label} htmlFor="regPassword">Password <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className={`${styles.inputWrapper} ${errors.password || errors.form ? styles.shake : ''}`}>
                                    <Lock size={18} className={styles.inputIcon} />
                                    <input 
                                        id="regPassword"
                                        name="password" 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Create a password" 
                                        className={`${styles.input} ${styles.inputWithIcon} ${errors.password || errors.form ? styles.inputError : ''}`} 
                                        value={formData.password}
                                        onChange={handleChange} 
                                        style={{ paddingRight: '45px' }}
                                    />
                                    <button 
                                        type="button" 
                                        className={styles.eyeBtn} 
                                        onClick={() => setShowPassword(!showPassword)} 
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.password && <span className={styles.errorText}><AlertCircle size={13} style={{ flexShrink: 0 }} /> {errors.password}</span>}
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label} htmlFor="regConfirmPassword">Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
                                <div className={`${styles.inputWrapper} ${errors.confirmPassword || errors.form ? styles.shake : ''}`}>
                                    <Lock size={18} className={styles.inputIcon} />
                                    <input 
                                        id="regConfirmPassword"
                                        name="confirmPassword" 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        placeholder="Re-enter your password" 
                                        className={`${styles.input} ${styles.inputWithIcon} ${errors.confirmPassword || errors.form ? styles.inputError : ''}`} 
                                        value={formData.confirmPassword}
                                        onChange={handleChange} 
                                        style={{ paddingRight: '45px' }}
                                    />
                                    <button 
                                        type="button" 
                                        className={styles.eyeBtn} 
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <span className={styles.errorText}><AlertCircle size={13} style={{ flexShrink: 0 }} /> {errors.confirmPassword}</span>}
                            </div>
                            {formData.password && (
                                <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '-8px' }}>
                                    <div className={styles.strengthMeter}>
                                        <div className={`${styles.strengthBar} ${styles[`strength-${passwordStrength}`]}`} />
                                        <span className={styles.strengthText}>
                                            {['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][passwordStrength]}
                                        </span>
                                    </div>
                                    <div className={styles.requirementList}>
                                        {getPasswordRequirements(formData.password).map((req, index) => (
                                            <div key={index} className={`${styles.requirementItem} ${req.met ? styles.met : ''}`}>
                                                {req.met ? <Check size={12} strokeWidth={3} /> : <Circle size={12} />}
                                                <span>{req.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {errors.form && (
                            <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                                <AlertCircle size={16} />
                                <span>{errors.form}</span>
                            </div>
                        )}

                        {/* Button */}
                        <div className={styles.buttonContainer}>
                            <button 
                                type="submit" 
                                className={styles.registerBtn} 
                                disabled={loading}
                            >
                                {loading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Loader2 size={18} className={styles.spinner} /> Processing...
                                    </div>
                                ) : 'Register'}
                            </button>
                        </div>
                    </form>
                    
                    <div className={styles.loginLinkContainer}>
                        <span className={styles.loginText}>Already have an account? </span>
                        <span 
                            onClick={() => navigate('/login')} 
                            className={styles.loginLink}
                        >
                            Log In
                        </span>
                    </div>
                </div>
            </main>

            {/* SUCCESS MODAL */}
            {showSuccessModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalBody}>
                            <CheckCircle size={60} color="#059669" className={styles.modalIcon} />
                            <h2 className={styles.modalTitle}>Success!</h2>
                            <p className={styles.modalText}>{successMessage}</p>
                            <button 
                                className={styles.modalBtn} 
                                onClick={() => navigate('/login')}
                                style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}
                            >
                                Go to Login
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Register;
