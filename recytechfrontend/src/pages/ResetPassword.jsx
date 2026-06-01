import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import api from '../api/client';
import styles from '../styles/ForgotPassword.module.css';
import logo from '../assets/recytech_logo.png';
import { useToast } from '../context/ToastContext';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [resetToken, setResetToken] = useState('');
    const { showToast } = useToast();

    useEffect(() => {
        // Get email and token from location state or redirect
        if (location.state?.email && location.state?.resetToken) {
            setEmail(location.state.email);
            setResetToken(location.state.resetToken);
        } else {
            navigate('/forgot-password');
        }
    }, [location, navigate]);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (!newPassword || !confirmPassword) {
            return showToast('Please fill in all fields', 'error');
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return showToast('Password must be at least 8 chars, including upper, lower, number, and special char.', 'error');
        }

        if (newPassword !== confirmPassword) {
            return showToast('Passwords do not match', 'error');
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', { 
                email, 
                newPassword, 
                confirmPassword,
                resetToken 
            });
            
            showToast('Password reset successfully! Redirecting to login...', 'success');
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to reset password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
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
                    <h1 className={styles.header}>Create New Password</h1>
                    <p className={styles.subtext}>Enter a strong password for your account</p>

                    <form onSubmit={handleResetPassword}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>New Password</label>
                            <div className={styles.passwordWrapper}>
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Enter new password" 
                                    className={styles.input}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    className={styles.eyeBtn}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Confirm Password</label>
                            <div className={styles.passwordWrapper}>
                                <input 
                                    type={showConfirm ? "text" : "password"} 
                                    placeholder="Confirm new password" 
                                    className={styles.input}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    className={styles.eyeBtn}
                                    onClick={() => setShowConfirm(!showConfirm)}
                                >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px', marginBottom: '16px', fontSize: '12px', color: '#374151' }}>
                            <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>Password requirements:</p>
                            <ul style={{ margin: '0', paddingLeft: '20px' }}>
                                <li>At least 8 characters long</li>
                                <li>Mix of uppercase and lowercase letters</li>
                                <li>Include numbers and special characters</li>
                            </ul>
                        </div>

                        <button 
                            type="submit" 
                            className={styles.resetBtn} 
                            disabled={loading}
                        >
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                                    <Loader2 size={18} className={styles.spinner} /> Resetting...
                                </div>
                            ) : 'Reset Password'}
                        </button>
                    </form>
                    
                    <div className={styles.backLinkContainer}>
                        <span onClick={() => navigate('/login')} className={styles.backLink}>
                            <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Login
                        </span>
                    </div>
                </div>
                
                <div className={styles.footerLinks}>
                    <span>© 2025 RecyTech Admin Portal. All rights reserved.</span>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
