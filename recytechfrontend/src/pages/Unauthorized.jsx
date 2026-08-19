import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import styles from '../styles/Unauthorized.module.css';

const Unauthorized = () => {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    // Determine safe landing page based on user's actual role
    let userRole = null;
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        userRole = userInfo.role;
    } catch {
        userRole = null;
    }

    const targetPath = userRole === 'Staff' ? '/bin-network' : (userRole ? '/dashboard' : '/login');
    const destinationName = userRole === 'Staff' ? 'Bin Location Network' : (userRole ? 'Dashboard' : 'Login');

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate(targetPath, { replace: true });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate, targetPath]);

    const handleRedirect = () => {
        navigate(targetPath, { replace: true });
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <ShieldAlert size={80} className={styles.icon} />
                <h1 className={styles.title}>Access Denied</h1>
                <p className={styles.message}>
                    You do not have the required permissions to access this page. 
                    This incident may be logged for security purposes.
                </p>
                <div className={styles.timer}>
                    Redirecting you to {destinationName} in <span>{countdown}</span> seconds...
                </div>
                <button onClick={handleRedirect} className={styles.backBtn}>
                    <ArrowLeft size={18} /> Return to {destinationName}
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;