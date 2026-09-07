import Sidebar from '../components/Sidebar';
import ResidentTable from '../features/residents/ResidentTable';
import ResidentFilterBar from '../features/residents/ResidentFilterBar';
import Pagination from '../components/Pagination';
import styles from '../styles/UserManagement.module.css';
import { useResidents } from '../features/residents/useResidents';

const ResidentManagement = () => {
    const {
        loading,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        filteredResidents, paginatedResidents, fetchResidents,
        currentPage, totalPages, setPage
    } = useResidents();

    return (
        <div className={styles.container}>
            <Sidebar activePage="Registered Users" />
            <main className={styles.main}>
                <header className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1>Registered Users</h1>
                        <p>Review registered mobile participants, point balances, and activity.</p>
                    </div>
                    <div className={styles.actionButtons}>
                        <button className={styles.addBtn} onClick={() => fetchResidents()}>Refresh Users</button>
                    </div>
                </header>

                <ResidentFilterBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    total={filteredResidents.length}
                />

                <ResidentTable
                    residents={paginatedResidents}
                    loading={loading}
                    onEdit={() => {}}
                    onDelete={() => {}}
                />

                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalCount={filteredResidents.length}
                    />
                )}
            </main>
        </div>
    );
};

export default ResidentManagement;
