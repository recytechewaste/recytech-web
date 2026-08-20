import { useState } from 'react';
import { Plus } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import PartnerOrgTable from '../features/partnerOrgs/PartnerOrgTable';
import PartnerOrgFormModal from '../features/partnerOrgs/PartnerOrgFormModal';
import usePartnerOrgs from '../features/partnerOrgs/usePartnerOrgs';
import ConfirmDeleteModal from '../features/residents/ConfirmDeleteModal';
import Pagination from '../components/Pagination';
import PartnerOrgFilterBar from '../features/partnerOrgs/PartnerOrgFilterBar';
import styles from '../styles/Collectors.module.css';

const PartnerOrgManager = () => {
  const { 
    isLoading, 
    paginatedPartnerOrgs,
    addPartnerOrg, updatePartnerOrg, deletePartnerOrg,
    searchTerm, setSearchTerm, 
    statusFilter, setStatusFilter,
    handleClearFilters,
    currentPage, totalPages, setPage
  } = usePartnerOrgs();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingOrgId, setDeletingOrgId] = useState(null);

  const handleOpenModal = (org = null) => {
    setEditingOrg(org);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingOrg(null);
    setIsModalOpen(false);
  };

  const handleSaveOrg = async (orgData) => {
    let success;
    if (editingOrg) {
      success = await updatePartnerOrg(editingOrg._id, orgData);
    } else {
      success = await addPartnerOrg(orgData);
    }
    if (success) {
      handleCloseModal();
    }
  };
  
  const openDeleteModal = (id) => {
    setDeletingOrgId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeletingOrgId(null);
    setIsDeleteModalOpen(false);
  };
  
  const confirmDelete = async () => {
    if (deletingOrgId) {
      const success = await deletePartnerOrg(deletingOrgId);
      if (success) {
        closeDeleteModal();
      }
    }
  };

  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userRole = userInfo.role;
  const canManage = userRole === 'Admin' || userRole === 'Super Admin';

  return (
    <div className={styles.container}>
      <Sidebar activePage="Partner Organization Management" />
      <main className={styles.main}>
        <header className={styles.header}>
            <div className={styles.titleGroup}>
                <h1 className={styles.pageTitle}>Partner Organization Management</h1>
                <p className={styles.subTitle}>Oversee and manage all verified partner organizations and institutions.</p>
            </div>
            {canManage && (
              <div className={styles.actionButtons}>
                <button onClick={() => handleOpenModal()} className={styles.addBtn}>
                    <Plus size={16} />
                    Add Partner Organization
                </button>
              </div>
            )}
        </header>

        <PartnerOrgFilterBar
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            handleClearFilters={handleClearFilters}
        />

        <PartnerOrgTable
          lgus={paginatedPartnerOrgs}
          loading={isLoading}
          onEdit={handleOpenModal}
          onDelete={openDeleteModal}
          page={currentPage}
          limit={10}
          canManage={canManage}
        />

        {totalPages > 1 && (
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        )}

        {isModalOpen && (
          <PartnerOrgFormModal
            lgu={editingOrg}
            onSave={handleSaveOrg}
            onClose={handleCloseModal}
          />
        )} 
        
        {isDeleteModalOpen && (
          <ConfirmDeleteModal
            onConfirm={confirmDelete}
            onCancel={closeDeleteModal}
            message="Are you sure you want to deactivate this partner organization? This action will unassign any linked bins."
          />
        )}
      </main>
    </div>
  );
};

export default PartnerOrgManager;
