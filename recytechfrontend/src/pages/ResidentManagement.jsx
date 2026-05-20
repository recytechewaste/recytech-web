import { useEffect, useState } from 'react';
import api from '../api/client';
import Sidebar from './Sidebar';
import styles from '../styles/UserManagement.module.css';
import { RefreshCw, User, ChevronLeft, ChevronRight, Edit3, X, Save } from 'lucide-react';

const ResidentManagement = () => {
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, pages: 1 });
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedResident, setSelectedResident] = useState(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [message, setMessage] = useState('');

    const fetchResidents = async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/residents?page=${page}&limit=10`);
            setResidents(res.data.residents || res.data || []);
            if (res.data.pagination) setPagination(res.data.pagination);
        } catch (error) {
            console.error("Error fetching residents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchResidents(pagination.page); }, [pagination.page]);

    const handleAdjustBalance = async (e) => {
        e.preventDefault();
        if (!adjustmentAmount || isNaN(adjustmentAmount)) {
            setMessage("Please enter a valid amount");
            return;
        }
        
        try {
            await api.put(`/residents/${selectedResident._id}`, {
                walletBalance: selectedResident.walletBalance + parseFloat(adjustmentAmount),
            });
            setMessage("Balance updated successfully");
            await fetchResidents(pagination.page); // Await to ensure update
            setTimeout(() => {
                setShowAdjustModal(false);
                setMessage('');
            }, 2000); // Close modal after 2 seconds
        } catch (error) {
            console.error("Error adjusting balance:", error);
            setMessage("Failed to adjust balance");
        }
    };

    const openAdjustModal = (resident) => {
        setSelectedResident(resident);
        setAdjustmentAmount('');
        setAdjustmentReason('');
        setMessage('');
        setShowAdjustModal(true);
    };

    const filteredResidents = residents.filter(r => 
        r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <Sidebar activePage="Resident Wallets" />
            <div className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1>Resident Wallets</h1>
                        <p>Monitor wallet balances and simulated mobile resident activity.</p>
                    </div>
                </div>

                <div className={styles.filterBar}>
                    <div className={styles.searchGroup}>
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            className={styles.searchInput} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <span className={styles.totalUsers}>Total Residents: {filteredResidents.length}</span>
                </div>

                <div className={styles.card}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Resident</th>
                                <th className={styles.th}>Email Address</th>
                                <th className={styles.th}>Wallet Balance</th>
                                <th className={styles.th}>Total Earned</th>
                                <th className={styles.th}>Total Requests</th>
                                <th className={styles.th}>Last Activity</th>
                                <th className={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{textAlign:'center', padding:'40px'}}><RefreshCw className={styles.spinner} /> Loading residents...</td></tr>
                            ) : filteredResidents.length === 0 ? (
                                <tr><td colSpan="7" style={{textAlign:'center', padding:'40px'}}>No residents found matching your search.</td></tr>
                            ) : (
                                filteredResidents.map((res) => (
                                    <tr key={res._id}>
                                        <td className={styles.td}>
                                            <div className={styles.userCell}>
                                                <div className={styles.avatar} style={{backgroundColor: '#eff6ff', color: '#2563EB'}}>{res.firstName?.[0] || <User size={14}/>}</div>
                                                <div className={styles.userInfo}>
                                                    <span className={styles.userName}>{res.firstName} {res.lastName}</span>
                                                    <span className={styles.userId}>ID: {res._id.substring(res._id.length - 4).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.td}>{res.email}</td>
                                        <td className={styles.td} style={{color: '#059669', fontWeight: '700'}}>PHP {res.walletBalance?.toFixed(2)}</td>
                                        <td className={styles.td}>PHP {res.totalEarned?.toFixed(2)}</td>
                                        <td className={styles.td}>{res.requestCount} collections</td>
                                        <td className={styles.td}>{new Date(res.updatedAt).toLocaleDateString()}</td>
                                        <td className={styles.td}>
                                            <button 
                                                className={styles.iconBtn} 
                                                title="Manual Adjustment"
                                                onClick={() => openAdjustModal(res)}
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className={styles.filterBar} style={{ marginTop: '20px', justifyContent: 'center' }}>
                    <button 
                        disabled={pagination.page <= 1} 
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        className={styles.iconBtn}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span style={{ padding: '0 20px' }}>Page {pagination.page} of {pagination.pages}</span>
                    <button 
                        disabled={pagination.page >= pagination.pages} 
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        className={styles.iconBtn}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Adjustment Modal */}
                {showAdjustModal && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>Adjust Balance: {selectedResident?.firstName}</h2>
                                <button onClick={() => setShowAdjustModal(false)} className={styles.closeBtn}><X size={20}/></button>
                            </div>
                            {message && (
                                <div style={{
                                    padding: '10px',
                                    margin: '10px 0',
                                    borderRadius: '4px',
                                    backgroundColor: message.includes('successfully') ? '#d4edda' : '#f8d7da',
                                    color: message.includes('successfully') ? '#155724' : '#721c24',
                                    border: `1px solid ${message.includes('successfully') ? '#c3e6cb' : '#f5c6cb'}`
                                }}>
                                    {message}
                                </div>
                            )}
                            <form onSubmit={handleAdjustBalance} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label>Adjustment Amount (Use negative for deduction)</label>
                                    <input 
                                        type="number" 
                                        step="0.01" 
                                        value={adjustmentAmount} 
                                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                                        className={styles.input} 
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Reason for Adjustment</label>
                                    <textarea 
                                        value={adjustmentReason} 
                                        onChange={(e) => setAdjustmentReason(e.target.value)}
                                        className={styles.textarea}
                                        placeholder="e.g., Manual correction for request error"
                                        required
                                    />
                                </div>
                                <div className={styles.modalFooter}>
                                    <button type="button" onClick={() => setShowAdjustModal(false)} className={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" className={styles.submitBtn}><Save size={16} style={{marginRight: '8px'}}/> Apply Adjustment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResidentManagement;
