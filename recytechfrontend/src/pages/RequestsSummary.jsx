import { useEffect, useState } from 'react';
import api from '../api/client';
import Sidebar from './Sidebar';
import styles from '../styles/RequestsSummary.module.css';
import { FileText, Clock, CheckCircle, Truck, TrendingUp, AlertCircle } from 'lucide-react';

const RequestsSummary = () => {
    const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, completed: 0 });
    const [recentRequests, setRecentRequests] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await api.get('/requests');
                
                // 1. Calculate Stats
                const total = data.length;
                const pending = data.filter(r => r.status === 'Pending').length;
                const active = data.filter(r => r.status === 'Approved').length;
                const completed = data.filter(r => r.status === 'Completed').length;
                
                setStats({ total, pending, active, completed });

                // 2. Get Recent 3 Requests (sorted by newest)
                const sorted = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setRecentRequests(sorted.slice(0, 3));

            } catch (error) {
                console.error("Error loading summary", error);
            }
        };
        fetchData();
    }, []);

    return (
        <div className={styles.container}>
            <Sidebar activePage="Requests Summary" />

            <div className={styles.main}>
                <div className={styles.headerContainer}>
                    <h1 className={styles.pageTitle}>Summary of Requests</h1>
                </div>

                {/* 1. METRICS CARDS */}
                <div className={styles.metricsGrid}>
                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Total Requests</div>
                        <div className={styles.cardValue}>{stats.total}</div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Requests Awaiting Approval</div>
                        <div className={styles.cardValue}>{stats.pending}</div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Requests in Progress</div>
                        <div className={styles.cardValue}>{stats.active}</div>
                    </div>
                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Completed Collections</div>
                        <div className={styles.cardValue}>{stats.completed}</div>
                    </div>
                </div>

                {/* 2. RECENT REQUESTS SECTION */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Recent E-Waste Requests</h2>
                    <div className={styles.recentGrid}>
                        {recentRequests.map((req, index) => (
                            <div key={req._id || index} className={styles.recentCard}>
                                <div className={styles.iconWrapper}>
                                    <FileText size={24} color="#666" />
                                </div>
                                <div>
                                    <div className={styles.reqTitle}>
                                        Request ID #{req._id ? req._id.substring(req._id.length - 4) : '---'}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500', marginTop: '2px' }}>
                                        {req.residentName || 'Unnamed Requester'}
                                    </div>
                                    <div className={styles.reqStatus}>
                                        {req.status}
                                    </div>
                                </div>
                                <div className={styles.reqDate}>
                                    Requested on:<br/>
                                    <strong>{new Date(req.createdAt).toLocaleDateString()}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestsSummary;
