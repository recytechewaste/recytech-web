import { useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import styles from '../styles/Layout.module.css';
import rpStyles from '../styles/RewardPointManager.module.css';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Search, Star, Zap, TrendingUp, Filter, X } from 'lucide-react';
import { useRewardPoints } from '../features/reward-points/useRewardPoints';
import RewardPointFormModal from '../features/reward-points/RewardPointFormModal';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';

const WASTE_TYPE_COLORS = {
    'Plastics':     { bg: '#eff6ff', accent: '#3b82f6', text: '#1d4ed8' },
    'Electronics':  { bg: '#fdf4ff', accent: '#a855f7', text: '#7e22ce' },
    'Paper':        { bg: '#fffbeb', accent: '#f59e0b', text: '#92400e' },
    'Metal':        { bg: '#f0fdf4', accent: '#22c55e', text: '#15803d' },
    'Glass':        { bg: '#ecfeff', accent: '#06b6d4', text: '#0e7490' },
    'Batteries':    { bg: '#fff7ed', accent: '#f97316', text: '#c2410c' },
    'Textiles':     { bg: '#fdf2f8', accent: '#ec4899', text: '#be185d' },
};

const getTypeStyle = (wasteType) => {
    const key = Object.keys(WASTE_TYPE_COLORS).find(k => 
        wasteType?.toLowerCase().includes(k.toLowerCase())
    );
    return WASTE_TYPE_COLORS[key] || { bg: '#f0fdf4', accent: '#10b981', text: '#065f46' };
};

const RewardPointManager = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userRole = userInfo.role;
    const canDelete = userRole === 'Admin' || userRole === 'Super Admin';

    const { 
        points, allPoints, filteredTotal, loading, fetchPoints, 
        currentPage, totalPages, setPage,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
    } = useRewardPoints();

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ wasteType: '', pointsPerItem: 0, description: '', isActive: true });
    const [pointToDelete, setPointToDelete] = useState(null);
    const { showToast } = useToast();

    const handleSubmit = async (submittedData) => {
        try {
            if (editingId) {
                await api.put(`/reward-points/${editingId}`, submittedData);
                showToast('Reward point rule updated successfully.', 'success');
            } else {
                await api.post('/reward-points', submittedData);
                showToast('Reward point rule added successfully.', 'success');
            }
            setShowModal(false);
            fetchPoints();
        } catch (error) { showToast(error.response?.data?.message || 'Error saving rule', 'error'); }
    };

    const handleConfirmDelete = async () => {
        if (!pointToDelete) return;
        try {
            await api.delete(`/reward-points/${pointToDelete._id}`);
            showToast('Reward point rule deleted.', 'success');
            fetchPoints();
            setPointToDelete(null);
        } catch (error) {
            showToast(error.response?.data?.message || 'Error deleting rule', 'error');
        }
    };

    const toggleStatus = async (point) => {
        try {
            await api.put(`/reward-points/${point._id}`, { isActive: !point.isActive });
            showToast(`Rule ${point.isActive ? 'deactivated' : 'activated'} successfully.`, 'success');
            fetchPoints();
        } catch (error) { showToast(error.response?.data?.message || 'Error toggling status', 'error'); }
    };

    const openEditModal = (point) => {
        setFormData(point);
        setEditingId(point._id);
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({ wasteType: '', pointsPerItem: 0, description: '', isActive: true });
        setShowModal(true);
    };

    const totalActive = allPoints.filter(p => p.isActive).length;
    const totalInactive = allPoints.filter(p => !p.isActive).length;
    const totalPoints = allPoints.reduce((sum, p) => sum + (p.pointsPerItem || 0), 0);
    const hasActiveFilters = searchTerm || statusFilter !== 'all';

    return (
        <div className={styles.container}>
            <Sidebar activePage="Reward Points" />
            <div className={styles.main}>

                {/* ── Page Header ── */}
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.pageTitle}>Reward Point Rules</h1>
                        <p className={styles.subTitle}>Configure incentive points per item for each material category.</p>
                    </div>
                    <button onClick={openCreateModal} className={styles.addBtn} id="add-reward-rule-btn">
                        <Plus size={18} /> Add New Rule
                    </button>
                </div>

                {/* ── Stats Bar ── */}
                <div className={rpStyles.statsBar}>
                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <Star size={18} color="white" />
                        </div>
                        <div>
                            <p className={rpStyles.statValue}>{allPoints.length}</p>
                            <p className={rpStyles.statLabel}>Total Rules</p>
                        </div>
                    </div>
                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                            <Zap size={18} color="white" />
                        </div>
                        <div>
                            <p className={rpStyles.statValue}>{totalActive}</p>
                            <p className={rpStyles.statLabel}>Active Rules</p>
                        </div>
                    </div>
                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <TrendingUp size={18} color="white" />
                        </div>
                        <div>
                            <p className={rpStyles.statValue}>{totalPoints.toLocaleString()}</p>
                            <p className={rpStyles.statLabel}>Total Pts / Rule</p>
                        </div>
                    </div>
                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}>
                            <Filter size={18} color="white" />
                        </div>
                        <div>
                            <p className={rpStyles.statValue}>{totalInactive}</p>
                            <p className={rpStyles.statLabel}>Inactive Rules</p>
                        </div>
                    </div>
                </div>

                {/* ── Search & Filter Bar ── */}
                <div className={styles.filterBar}>
                    <div className={styles.searchGroup}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            id="reward-search"
                            type="text"
                            placeholder="Search by waste type or description..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <Filter size={14} className={styles.filterIcon} />
                        <select
                            id="reward-status-filter"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className={styles.selectInput}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>
                    {hasActiveFilters && (
                        <button
                            className={styles.clearBtn}
                            onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                        >
                            <X size={14} style={{ display: 'inline', marginRight: 4 }} />
                            Clear
                        </button>
                    )}
                    {!loading && (
                        <span className={rpStyles.resultCount}>
                            {filteredTotal} result{filteredTotal !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* ── Card Grid ── */}
                {loading ? (
                    <div className={styles.grid}>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={`sk-${i}`} className={rpStyles.card}>
                                <div className={rpStyles.cardColorBar} style={{ background: '#e5e7eb' }} />
                                <div className={rpStyles.cardBody}>
                                    <div className={rpStyles.cardTop}>
                                        <Skeleton width="64px" height="22px" borderRadius="999px" />
                                        <Skeleton width="72px" height="28px" borderRadius="4px" />
                                    </div>
                                    <Skeleton width="140px" height="22px" style={{ marginTop: 16, marginBottom: 8 }} />
                                    <Skeleton width="90px" height="38px" style={{ marginBottom: 10 }} />
                                    <Skeleton width="85%" height="14px" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : points.length > 0 ? (
                    <div className={styles.grid}>
                        {points.map((point) => {
                            const typeStyle = getTypeStyle(point.wasteType);
                            return (
                                <div
                                    key={point._id}
                                    className={`${rpStyles.card} ${point.isActive ? rpStyles.cardActive : rpStyles.cardInactive}`}
                                    id={`reward-card-${point._id}`}
                                >
                                    {/* Colored accent bar at top */}
                                    <div
                                        className={rpStyles.cardColorBar}
                                        style={{ background: point.isActive ? typeStyle.accent : '#d1d5db' }}
                                    />
                                    <div className={rpStyles.cardBody}>
                                        {/* Row: Status badge + Actions */}
                                        <div className={rpStyles.cardTop}>
                                            <span
                                                className={rpStyles.statusBadge}
                                                style={point.isActive
                                                    ? { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }
                                                    : { background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb' }
                                                }
                                            >
                                                {point.isActive ? '● Active' : '○ Inactive'}
                                            </span>
                                            <div className={styles.actions}>
                                                <button
                                                    title="Edit rule"
                                                    onClick={() => openEditModal(point)}
                                                    className={styles.iconBtn}
                                                    id={`edit-rule-${point._id}`}
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    title={point.isActive ? 'Deactivate' : 'Activate'}
                                                    onClick={() => toggleStatus(point)}
                                                    className={styles.iconBtn}
                                                    id={`toggle-rule-${point._id}`}
                                                >
                                                    {point.isActive ? <ToggleRight size={18} color="#10b981" /> : <ToggleLeft size={18} />}
                                                </button>
                                                {canDelete && (
                                                    <button
                                                        title="Delete rule"
                                                        onClick={() => setPointToDelete(point)}
                                                        className={styles.iconBtnDanger}
                                                        id={`delete-rule-${point._id}`}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Waste type chip */}
                                        <div className={rpStyles.typeChip} style={{ background: typeStyle.bg, color: typeStyle.text }}>
                                            {point.wasteType}
                                        </div>

                                        {/* Points value */}
                                        <div className={rpStyles.pointsValue} style={{ color: point.isActive ? typeStyle.accent : '#9ca3af' }}>
                                            <span className={rpStyles.pointsNumber}>
                                                {(point.pointsPerItem ?? 0).toLocaleString()}
                                            </span>
                                            <span className={rpStyles.pointsUnit}>pts / item</span>
                                        </div>

                                        {/* Description */}
                                        <p className={rpStyles.description}>
                                            {point.description || <em style={{ opacity: 0.5 }}>No description provided.</em>}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <EmptyState
                        icon="rewards"
                        title={hasActiveFilters ? 'No matching rules found' : 'No reward rules configured'}
                        subtitle={hasActiveFilters ? 'Try clearing your filters.' : 'Add your first rule to start rewarding residents for recycling.'}
                        action={!hasActiveFilters ? { label: '+ Add New Rule', onClick: openCreateModal } : undefined}
                    />
                )}

                {/* ── Pagination ── */}
                {!loading && totalPages > 1 && (
                    <div className={rpStyles.paginationWrapper}>
                        <p className={rpStyles.paginationInfo}>
                            Showing {((currentPage - 1) * 6) + 1}–{Math.min(currentPage * 6, filteredTotal)} of {filteredTotal} rules
                        </p>
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                )}

                {/* ── Modals ── */}
                <RewardPointFormModal
                    isOpen={showModal}
                    isEditing={!!editingId}
                    initialData={formData}
                    onClose={() => setShowModal(false)}
                    onSubmit={handleSubmit}
                />
                <Modal isOpen={!!pointToDelete} onClose={() => setPointToDelete(null)} title="Delete Rule" maxWidth="400px">
                    <p style={{ color: '#6b7280', marginBottom: '24px', lineHeight: '1.6' }}>
                        Are you sure you want to permanently delete the reward rule for{' '}
                        <strong style={{ color: '#111827' }}>"{pointToDelete?.wasteType}"</strong>?{' '}
                        This action cannot be undone.
                    </p>
                    <div className={styles.modalFooter}>
                        <button onClick={() => setPointToDelete(null)} className={styles.cancelBtn}>Cancel</button>
                        <button onClick={handleConfirmDelete} className={styles.deleteBtn}>Delete Rule</button>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default RewardPointManager;
