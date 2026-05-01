import { useEffect, useState } from 'react';
import api from '../api/client';
import Sidebar from './Sidebar';
import styles from '../styles/UserManagement.module.css';
import { RefreshCw, User } from 'lucide-react';

const ResidentManagement = () => {
    const [residents, setResidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchResidents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/residents');
            // Extract the residents array from the paginated response
            setResidents(res.data.residents || res.data || []);
        } catch (error) {
            console.error("Error fetching residents:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { Promise.resolve().then(fetchResidents); }, []);

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
                        <p>Monitor wallet balances and recycling activity for registered residents.</p>
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
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{textAlign:'center', padding:'40px'}}><RefreshCw className={styles.spinner} /> Loading residents...</td></tr>
                            ) : filteredResidents.length === 0 ? (
                                <tr><td colSpan="6" style={{textAlign:'center', padding:'40px'}}>No residents found matching your search.</td></tr>
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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ResidentManagement;
