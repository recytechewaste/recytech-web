import Sidebar from '../components/Sidebar';
import RequestTable from '../features/requests/RequestTable';
import { useRequests } from '../features/requests/useRequests';
import RequestFilterBar from '../features/requests/RequestFilterBar';
import Pagination from '../components/Pagination';
import ErrorState from '../components/ErrorState';
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
      <Sidebar activePage="Bin Collections" />
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
          <div style={{ marginBottom: '24px' }}>
            <ErrorState message={error} />
          </div>
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
