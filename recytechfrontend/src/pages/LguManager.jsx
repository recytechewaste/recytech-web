import { useState } from 'react';
import { Plus } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import LguTable from '../features/lgus/LguTable';
import LguFormModal from '../features/lgus/LguFormModal';
import useLgus from '../features/lgus/useLgus';
import ConfirmDeleteModal from '../features/residents/ConfirmDeleteModal';
import Pagination from '../components/Pagination';
import LguFilterBar from '../features/lgus/LguFilterBar';
import styles from '../styles/Collectors.module.css'; // Changed to Collectors styles

const LguManager = () => {
  const { 
    isLoading, 
    paginatedLgus,
    addLgu, updateLgu, deleteLgu,
    searchTerm, setSearchTerm, 
    statusFilter, setStatusFilter,
    handleClearFilters,
    currentPage, totalPages, setPage
  } = useLgus();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLgu, setEditingLgu] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingLguId, setDeletingLguId] = useState(null);

  const handleOpenModal = (lgu = null) => {
    setEditingLgu(lgu);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingLgu(null);
    setIsModalOpen(false);
  };

  const handleSaveLgu = async (lguData) => {
    let success;
    if (editingLgu) {
      success = await updateLgu(editingLgu._id, lguData);
    } else {
      success = await addLgu(lguData);
    }
    if (success) {
      handleCloseModal();
    }
  };
  
  const openDeleteModal = (id) => {
    setDeletingLguId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeletingLguId(null);
    setIsDeleteModalOpen(false);
  };
  
  const confirmDelete = async () => {
    if (deletingLguId) {
      const success = await deleteLgu(deletingLguId);
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
      <Sidebar activePage="LGU Management" />
      <main className={styles.main}>
        <header className={styles.header}>
            <div className={styles.titleGroup}>
                <h1 className={styles.pageTitle}>LGU Account Management</h1>
                <p className={styles.subTitle}>Oversee and manage all Local Government Unit accounts.</p>
            </div>
            {canManage && (
              <div className={styles.actionButtons}>
                <button onClick={() => handleOpenModal()} className={styles.addBtn}>
                    <Plus size={16} />
                    Add New LGU
                </button>
              </div>
            )}
        </header>

        <LguFilterBar
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            handleClearFilters={handleClearFilters}
        />

        <LguTable
          lgus={paginatedLgus}
          loading={isLoading}
          onEdit={handleOpenModal}
          onDelete={openDeleteModal}
          page={currentPage}
          limit={10} // This should match the value in usePagination
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
          <LguFormModal
            lgu={editingLgu}
            onSave={handleSaveLgu}
            onClose={handleCloseModal}
          />
        )} 
        
        {isDeleteModalOpen && (
          <ConfirmDeleteModal
            onConfirm={confirmDelete}
            onCancel={closeDeleteModal}
            message="Are you sure you want to delete this LGU account? This action cannot be undone."
          />
        )}
      </main>
    </div>
  );
};

export default LguManager;
