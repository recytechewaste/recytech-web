import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../api/client';
import styles from '../styles/ForgotPassword.module.css'; // Reuse styles
import logo from '../assets/recytech_logo.webp';
import { useToast } from '../context/ToastContext';

const VerifyPin = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { email } = location.state || {};
    const [pin, setPin] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resetToken, setResetToken] = useState('');
    const { showToast } = useToast();

    const handleVerifyPin = async (e) => {
        e.preventDefault();
        if (!pin) return showToast('Please enter the PIN', 'error');

        setLoading(true);

        try {
            const { data } = await api.post('/auth/verify-pin', { email, pin });
            setResetToken(data.resetToken);
            showToast('PIN verified! Now set your new password.', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Invalid PIN', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) return showToast('Please fill all fields', 'error');
        if (newPassword !== confirmPassword) return showToast('Passwords do not match', 'error');
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return showToast('Password must be at least 8 chars, including upper, lower, number, and special char.', 'error');
        }

        setLoading(true);

        try {
            await api.post('/auth/reset-password', { email, newPassword, confirmPassword, resetToken });
            showToast('Password reset successful! Redirecting to login...', 'success');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to reset password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <header className={styles.topBar}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
                        <img src={logo} alt="RecyTech Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                    </div>
                    <span className={styles.logoText}>
                        RecyTech <span style={{ fontWeight: '400', opacity: '0.9' }}>Admin Portal</span>
                    </span>
                </div>
            </header>

            <main className={styles.contentContainer}>
                <div className={styles.card}>
                    <h1 className={styles.header}>Verify PIN & Reset Password</h1>
                    <p className={styles.subtext}>Enter the PIN sent to your email and set a new password.</p>

                    {!resetToken ? (
                        <form onSubmit={handleVerifyPin}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>PIN</label>
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit PIN"
                                    className={styles.input}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    maxLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                className={styles.resetBtn}
                                disabled={loading}
                            >
                                {loading ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                                        <Loader2 size={18} className={styles.spinner} /> Verifying...
                                    </div>
                                ) : 'Verify PIN'}
                            </button>
                        </form>
                    ) : (
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
                                <label className={styles.label}>Confirm New Password</label>
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
                    )}

                    <div className={styles.backLinkContainer}>
                        <span onClick={() => navigate('/login')} className={styles.backLink}>
                            <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to Login
                        </span>
                    </div>
                </div>

                <p className={styles.footerText}>For security purposes, password reset is only available for registered staff, admins and super admins.</p>
                <div className={styles.footerLinks}>
                    <span>© 2025 RecyTech Admin Portal. All rights reserved.</span>
                    <div className={styles.footerLinksGroup}>
                        <span>Privacy Policy</span>
                        <span>Terms of Service</span>
                        <span>Support</span>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default VerifyPin;