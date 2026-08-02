import { useState, useEffect } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from 'lucide-react'; 
import styles from '../styles/Login.module.css';
import logo from '../assets/recytech_logo.png';
import { useToast } from '../context/ToastContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const validate = () => {
        const newErrors = {};
        if (!email.trim()) newErrors.email = 'Email address is required';
        if (!password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/dashboard'); // QoL: Immediate auto-redirect
        } catch (err) {
            const msg = err.response?.data?.message || 'Invalid email or password';
            setErrors({ form: msg });
            showToast(msg, 'error');
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

            {/* LOGIN CARD */}
            <div className={styles.contentContainer}>
                <div className={styles.card}>
                    <h1 className={styles.header}>Welcome Back</h1>
                    <p className={styles.subHeader}>Sign in to access the RecyTech E-waste Management</p>
                    
                    <form onSubmit={handleLogin} className={styles.form} noValidate>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                            <div className={`${styles.inputWrapper} ${errors.email || errors.form ? styles.shake : ''}`}>
                                <Mail size={18} className={styles.inputIcon} />
                                <input 
                                    type="email" 
                                    placeholder="Enter your email address" 
                                    className={`${styles.input} ${styles.inputWithIcon} ${errors.email || errors.form ? styles.inputError : ''}`}
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email || errors.form) setErrors(prev => ({ ...prev, email: '', form: '' }));
                                    }}
                                />
                            </div>
                            {errors.email && <span className={styles.errorText}><AlertCircle size={13} style={{ flexShrink: 0 }} /> {errors.email}</span>}
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Password <span style={{ color: '#ef4444' }}>*</span></label>
                            <div className={`${styles.inputWrapper} ${errors.password || errors.form ? styles.shake : ''}`}>
                                <Lock size={18} className={styles.inputIcon} />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Enter your password" 
                                    className={`${styles.input} ${styles.inputWithIcon} ${errors.password || errors.form ? styles.inputError : ''}`}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password || errors.form) setErrors(prev => ({ ...prev, password: '', form: '' }));
                                    }}
                                    style={{ paddingRight: '45px' }}
                                />
                                <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <span className={styles.errorText}><AlertCircle size={13} style={{ flexShrink: 0 }} /> {errors.password}</span>}
                        </div>

                        <div className={styles.rememberMeContainer}>
                            <input 
                                type="checkbox" 
                                id="rememberMe"
                                className={styles.checkbox}
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <label htmlFor="rememberMe" className={styles.checkboxLabel}>Remember Me</label>
                        </div>

                        <div className={styles.buttonGroup}>
                            <button 
                                type="button" 
                                onClick={() => navigate('/forgot-password')}
                                className={styles.forgotBtn}
                            >
                                Forgot Password?
                            </button>
                            <button 
                                type="submit" 
                                className={styles.loginBtn} 
                                disabled={loading}
                            >
                                {loading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Loader2 size={18} className={styles.spinner} /> Processing...
                                    </div>
                                ) : 'Login'}
                            </button>
                        </div>
                    </form>
                    
                    {/* Added link to Register for easier navigation */}
                    <div className={styles.registerLinkContainer}>
                        <span className={styles.registerText}>Don't have an account? </span>
                        <span 
                            onClick={() => navigate('/register')} 
                            className={styles.registerLink}
                        >
                            Register
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
