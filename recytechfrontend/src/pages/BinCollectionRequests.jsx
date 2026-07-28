import React from 'react';
import Sidebar from '../components/Sidebar';
import RequestTable from '../features/requests/RequestTable';
import { useRequests } from '../features/requests/useRequests';
import RequestFilterBar from '../features/requests/RequestFilterBar';
import Pagination from '../components/Pagination';
import styles from '../styles/BinCollectionRequests.module.css';

const ITEMS_PER_PAGE = 10;

const BinCollectionRequests = () => {
  const {
    requests,
    isLoading,
    error,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    handleClearFilters,
    currentPage,
    totalPages,
    setPage,
  } = useRequests(ITEMS_PER_PAGE);

  return (
    <div className={styles.container}>
      <Sidebar activePage="Bin Collection Requests" />
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <h1 className={styles.pageTitle}>Bin Collection Requests</h1>
            <p className={styles.subTitle}>Monitor all automated and manual collection requests for bins.</p>
          </div>
        </header>

        <RequestFilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          handleClearFilters={handleClearFilters}
        />

        {error && (
          <div className="p-8 text-center text-red-600 bg-red-50 mb-4 rounded-lg">{error}</div>
        )}

        <RequestTable
          requests={requests}
          loading={isLoading}
          limit={ITEMS_PER_PAGE}
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </main>
    </div>
  );
};

export default BinCollectionRequests;
