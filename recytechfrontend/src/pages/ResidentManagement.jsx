import React, { useState } from 'react';
import { RefreshCw, Users, CheckCircle, Award, Layers, BookOpen } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import ResidentTable from '../features/residents/ResidentTable';
import ResidentFilterBar from '../features/residents/ResidentFilterBar';
import ResidentDetailModal from '../features/residents/ResidentDetailModal';
import ConfirmDeleteModal from '../features/residents/ConfirmDeleteModal';
import Pagination from '../components/Pagination';
import styles from '../styles/Collectors.module.css';
import rpStyles from '../styles/RewardPointManager.module.css';
import { useResidents } from '../features/residents/useResidents';
import InfoTooltip from '../components/InfoTooltip';

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
                <PageHeader
                    icon={<BookOpen size={24} />}
                    title="Registered Users"
                    tooltipTitle="Community Resident Registry"
                    tooltipContent="Central directory of registered community members eligible to deposit e-waste, accumulate reward points, and schedule collections."
                    subtitle="Manage and monitor registered community residents and account statuses."
                    actions={
                        <button 
                            className={styles.clearBtn} 
                            onClick={fetchResidents} 
                            title="Refresh users list"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                    }
                />

                {/* ── Stats Summary Bar ── */}
                <div className={rpStyles.statsBar} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                            <Users size={20} color="white" />
                        </div>
                        <div>
                            <p className={rpStyles.statValue}>{stats.total}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <p className={rpStyles.statLabel}>Total Residents</p>
                                <InfoTooltip
                                    title="Total Enrolled Citizens"
                                    content="Total citizen user accounts registered in the RecyTech ecosystem across web and mobile."
                                    position="top"
                                    width={240}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                            <CheckCircle size={20} color="white" />
                        </div>
                        <div>
                            <p className={rpStyles.statValue}>{stats.active}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <p className={rpStyles.statLabel}>Active Accounts</p>
                                <InfoTooltip
                                    title="Verified & Active"
                                    content="Residents in good standing who can deposit recyclables, receive live points, and request pickups."
                                    position="top"
                                    width={250}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={rpStyles.statCard}>
                        <div className={rpStyles.statIcon} style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }}>
                            <Users size={20} color="white" />
                        </div>
                        <div>
                            <p className={rpStyles.statValue}>{stats.inactive}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <p className={rpStyles.statLabel}>Inactive Accounts</p>
                                <InfoTooltip
                                    title="Restricted Accounts"
                                    content="Deactivated or suspended user profiles restricted from submitting collection tickets or point redemptions."
                                    position="top"
                                    width={250}
                                />
                            </div>
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

