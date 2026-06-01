import { useState, useEffect } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react'; 
import styles from '../styles/Login.module.css';
import logo from '../assets/recytech_logo.png';
import { useToast } from '../context/ToastContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
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
            showToast(err.response?.data?.message || 'Invalid email or password', 'error');
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
                    
                    <form onSubmit={handleLogin} className={styles.form}>
                        <div className={styles.gridRow}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Email</label>
                                <input 
                                    type="email" 
                                    placeholder="Enter your email address" 
                                    className={styles.input}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        <div className={styles.inputGroup}>
                                <label className={styles.label}>Password</label>
                                <div className={styles.passwordWrapper}>
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="Enter your password" 
                                        className={styles.input}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
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
