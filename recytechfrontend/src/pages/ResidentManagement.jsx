import React, { useState } from 'react';
import { RefreshCw, Users, CheckCircle, Award, Layers } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ResidentTable from '../features/residents/ResidentTable';
import ResidentFilterBar from '../features/residents/ResidentFilterBar';
import ResidentDetailModal from '../features/residents/ResidentDetailModal';
import ConfirmDeleteModal from '../features/residents/ConfirmDeleteModal';
import Pagination from '../components/Pagination';
import styles from '../styles/Collectors.module.css';
import rpStyles from '../styles/RewardPointManager.module.css';
import { useResidents } from '../features/residents/useResidents';

const ResidentManagement = () => {
    const {
        loading,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        handleClearFilters,
        filteredResidents, paginatedResidents, fetchResidents,
        deleteResident,
        stats,
        currentPage, totalPages, setPage
    } = useResidents();

    // Modal state management
    const [viewingResident, setViewingResident] = useState(null);
    const [deletingResident, setDeletingResident] = useState(null);

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userRole = userInfo.role;
    const canManage = userRole === 'Admin' || userRole === 'Super Admin';

    const handleOpenViewModal = (resident) => {
        setViewingResident(resident);
    };

    const handleOpenDeleteModal = (resident) => {
        setDeletingResident(resident);
    };

    const handleConfirmDelete = async () => {
        if (deletingResident) {
            const success = await deleteResident(deletingResident._id, false);
            if (success) {
                setDeletingResident(null);
            }
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar activePage="Registered Users" />
            
            <main className={styles.main}>
                {/* ── Header ── */}
                <header className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.pageTitle}>Registered Users</h1>
                        <p className={styles.subTitle}>Manage and monitor registered community residents, point balances, and recycling activity.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button 
                            className={styles.clearBtn} 
                            onClick={fetchResidents} 
                            title="Refresh users list"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>
                </header>

                {/* ── Stats Summary Bar ── */}
                <div className={rpStyles.statsBar}>
                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <Users size={20} color="white" />
                        </div>
                        <div>
                            <p className={rpStyles.statValue}>{stats.total}</p>
                            <p className={rpStyles.statLabel}>Total Residents</p>
                        </div>
                    </div>

                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                            <CheckCircle size={20} color="white" />
                        </div>
                        <div>
                            <p className={rpStyles.statValue}>{stats.active}</p>
                            <p className={rpStyles.statLabel}>Active Participants</p>
                        </div>
                    </div>

                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <Award size={20} color="white" />
                        </div>
                        <div>
                            <p className={rpStyles.statValue}>{stats.points.toLocaleString()}</p>
                            <p className={rpStyles.statLabel}>Total Points Balance</p>
                        </div>
                    </div>

                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>
                            <Layers size={20} color="white" />
                        </div>
                        <div>
                            <p className={rpStyles.statValue}>{stats.requests}</p>
                            <p className={rpStyles.statLabel}>Lifetime Requests</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter & Search Bar ── */}
                <ResidentFilterBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    handleClearFilters={handleClearFilters}
                    total={filteredResidents.length}
                />

                {/* ── Residents Table ── */}
                <ResidentTable
                    residents={paginatedResidents}
                    loading={loading}
                    page={currentPage}
                    limit={10}
                    onView={handleOpenViewModal}
                    onDelete={handleOpenDeleteModal}
                    canManage={canManage}
                />

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalCount={filteredResidents.length}
                    />
                )}

                {/* ── View Detail Modal ── */}
                {viewingResident && (
                    <ResidentDetailModal
                        resident={viewingResident}
                        isOpen={!!viewingResident}
                        onClose={() => setViewingResident(null)}
                    />
                )}

                {/* ── Deactivate / Delete Confirmation Modal ── */}
                {deletingResident && (
                    <ConfirmDeleteModal
                        resident={deletingResident}
                        onConfirm={handleConfirmDelete}
                        onCancel={() => setDeletingResident(null)}
                        message={`Are you sure you want to deactivate ${deletingResident.firstName || ''} ${deletingResident.lastName || ''}? They will be marked as inactive and will not be able to log in or earn points.`}
                    />
                )}
            </main>
        </div>
    );
};

export default ResidentManagement;

