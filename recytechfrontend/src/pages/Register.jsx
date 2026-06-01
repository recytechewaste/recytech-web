import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Eye, EyeOff, CheckCircle, AlertCircle, X, Loader2, Check, Circle } from 'lucide-react';
import styles from '../styles/Register.module.css';
import logo from '../assets/recytech_logo.png';
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
        
        setFormData({...formData, [name]: finalValue});
        
        if (name === 'password') {
            setPasswordStrength(calculateStrength(finalValue));
        }

        // Clear error when user types
        if (errors[name]) {
            setErrors({...errors, [name]: ''});
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last Name is required';
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                newErrors.password = 'Must be at least 8 chars, including upper, lower, number, and special char.';
            }
        }

        if (formData.confirmPassword !== formData.password) {
            newErrors.confirmPassword = 'Passwords do not match';
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
            showToast(error.response?.data?.message || "Registration failed. Email might be taken.", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            {/* TOP HEADER BAR */}
            <div className={styles.topBar}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
                        <img src={logo} alt="RecyTech Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                    </div>
                    <span className={styles.logoText}>
                        RecyTech<span style={{ fontWeight: '400', opacity: '0.9' }}>: E-waste Management System</span>
                    </span>
                </div>
            </div>

            <div className={styles.contentContainer}>
                <div className={styles.card}>
                    <h1 className={styles.header}>Create Account</h1>
                    <p className={styles.subHeader}>Join RecyTech to manage your operations efficiently</p>
                    
                    <form onSubmit={handleRegister} className={styles.form}>
                        <div className={styles.gridRow}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>First Name</label>
                                <input 
                                    name="firstName" 
                                    placeholder="Enter your first name" 
                                    className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`} 
                                    value={formData.firstName}
                                    onChange={handleChange} 
                                />
                                {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Last Name</label>
                                <input 
                                    name="lastName" 
                                    placeholder="Enter your last name" 
                                    className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`} 
                                    value={formData.lastName}
                                    onChange={handleChange} 
                                />
                                {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
                            </div>
                            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
                                <label className={styles.label}>Email</label>
                                <input 
                                    name="email" 
                                    type="email" 
                                    placeholder="Enter your email address" 
                                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`} 
                                    value={formData.email}
                                    onChange={handleChange} 
                                />
                                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Password</label>
                                <div className={styles.passwordWrapper}>
                                    <input 
                                        name="password" 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Create a password" 
                                        className={`${styles.input} ${errors.password ? styles.inputError : ''}`} 
                                        value={formData.password}
                                        onChange={handleChange} 
                                    />
                                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Confirm Password</label>
                                <div className={styles.passwordWrapper}>
                                    <input 
                                        name="confirmPassword" 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        placeholder="Re-enter your password" 
                                        className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`} 
                                        value={formData.confirmPassword}
                                        onChange={handleChange} 
                                    />
                                    <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
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
            </div>

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
