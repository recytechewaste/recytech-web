import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import api from '../api/client';
import styles from '../styles/ForgotPassword.module.css';
import logo from '../assets/recytech_logo.webp';
import { useToast } from '../context/ToastContext';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const handleResetRequest = async (e) => {
        e.preventDefault();
        if (!email) return showToast('Please enter your email address', 'error');
        
        setLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            showToast('PIN has been sent to your email! Redirecting...', 'success');
            
            setTimeout(() => {
                navigate('/verify-pin', { state: { email } });
            }, 1500);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to send reset instructions.', 'error');
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
                        RecyTech<span style={{ fontWeight: '400', opacity: '0.9' }}>: E-waste Management System</span>
                    </span>
                </div>
            </header>

            <main className={styles.contentContainer}>
                <div className={styles.card}>
                    <h1 className={styles.header}>Reset Password</h1>
                    <p className={styles.subtext}>Enter your registered email address to receive password reset instructions.</p>
                    
                    <form onSubmit={handleResetRequest}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="forgotEmail" className={styles.label}>Email Address</label>
                            <input 
                                id="forgotEmail"
                                type="email" 
                                placeholder="admin@example.com" 
                                className={styles.input} 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className={styles.resetBtn} 
                            disabled={loading}
                        >
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                                    <Loader2 size={18} className={styles.spinner} /> Processing...
                                </div>
                            ) : 'Send Reset Instructions'}
                        </button>
                    </form>
                    
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

export default ForgotPassword;
