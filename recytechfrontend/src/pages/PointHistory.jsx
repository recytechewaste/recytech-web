import Sidebar from '../components/Sidebar';
import styles from '../styles/UserManagement.module.css';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { usePointHistory } from '../features/point-history/usePointHistory';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

const PointHistory = () => {
    const { loading, error, searchTerm, setSearchTerm, page, pages, goToPage, hasNextPage, filteredTransactions } = usePointHistory();

    // Safe fallbacks to prevent crashes if the API request fails
    const safeTransactions = filteredTransactions || [];

    return (
        <div className={styles.container}>
            <Sidebar activePage="Point History" />
            <div className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.pageTitle}>Point History</h1>
                        <p className={styles.subTitle}>Complete audit trail of incentive points, adjustments, and bin contribution activity.</p>
                    </div>
                </div>

                <div className={styles.filterBar}>
                    <div className={styles.searchGroup}>
                        <input 
                            type="text" 
                            placeholder="Search by email, ID, or description..." 
                            className={styles.searchInput} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <span className={styles.totalUsers}>Total: {safeTransactions.length} records</span>
                </div>

                {error && (
                    <div style={{ marginBottom: '24px' }}>
                        <ErrorState message={error} />
                    </div>
                )}

                <div className={styles.card}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Date & Time</th>
                                <th className={styles.th}>Resident</th>
                                <th className={styles.th}>Type</th>
                                <th className={styles.th}>Points</th>
                                <th className={styles.th}>Description</th>
                                <th className={styles.th}>Reference ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`}>
                                        <td className={styles.td}>
                                            <div style={{display:'flex', flexDirection:'column', gap: '4px'}}>
                                                <Skeleton width="80px" height="16px" />
                                                <Skeleton width="60px" height="12px" />
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            <div style={{display:'flex', flexDirection:'column', gap: '4px'}}>
                                                <Skeleton width="120px" height="16px" />
                                                <Skeleton width="160px" height="12px" />
                                            </div>
                                        </td>
                                        <td className={styles.td}><Skeleton width="80px" height="16px" /></td>
                                        <td className={styles.td}><Skeleton width="100px" height="16px" /></td>
                                        <td className={styles.td}><Skeleton width="200px" height="16px" /></td>
                                        <td className={styles.td}><Skeleton width="120px" height="20px" borderRadius="4px" /></td>
                                    </tr>
                                ))
                            ) : safeTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: 0 }}>
                                        <EmptyState
                                            icon="history"
                                            title="No transaction history yet"
                                            subtitle={searchTerm ? 'No records match your search.' : 'Incentive point transactions will appear here once residents start recycling.'}
                                        />
                                    </td>
                                </tr>
                            ) : (
                                safeTransactions.map((tx) => (
                                    <tr key={tx._id}>
                                        <td className={styles.td}>
                                            <div style={{display:'flex', flexDirection:'column'}}>
                                                <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                                                <span style={{fontSize:'11px', color:'#6b7280'}}>{new Date(tx.createdAt).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className={styles.td}>
                                            <div style={{fontWeight:'500'}}>{tx.resident?.firstName} {tx.resident?.lastName}</div>
                                            <div style={{fontSize:'12px', color:'#6b7280'}}>{tx.resident?.email}</div>
                                        </td>
                                        <td className={styles.td}>
                                            <span style={{color: tx.type === 'Payment' ? '#059669' : '#d97706', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                                {tx.type === 'Payment' ? <ArrowUpRight size={14}/> : <ArrowDownLeft size={14}/>} {tx.type}
                                            </span>
                                        </td>
                                        <td className={styles.td} style={{fontWeight: '700'}}>{tx.points?.toLocaleString()} pts</td>
                                        <td className={styles.td} style={{maxWidth: '250px', fontSize: '13px'}}>{tx.description}</td>
                                        <td className={styles.td}><code style={{fontSize: '11px', background: '#f3f4f6', padding: '2px 4px', borderRadius: '4px'}}>{tx.requestId?._id || tx.requestId || tx._id}</code></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination currentPage={page} totalPages={pages} onPageChange={goToPage} />
            </div>
        </div>
    );
};

export default PointHistory;
