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
        page, limit, pages, goToPage, hasNextPage, hasPrevPage
    } = useResidents();

    return (
        <div className={styles.container}>
            <Sidebar activePage="Mobile User Management" />
            <main className={styles.main}>
                <header className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1>Participant Audit</h1>
                        <p>Review verified participant activity, point balances, and contribution history.</p>
                    </div>
                    <div className={styles.actionButtons}>
                        <button className={styles.addBtn} onClick={() => fetchResidents()}>Refresh Audit</button>
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
                    onEdit={() => { /* TODO */ }}
                    onDelete={() => { /* TODO */ }}
                />

                <Pagination
                    page={page}
                    pages={pages}
                    total={filteredResidents.length}
                    limit={limit}
                    goToPage={goToPage}
                    hasNextPage={hasNextPage}
                    hasPrevPage={hasPrevPage}
                />
            </main>
        </div>
    );
};

export default ResidentManagement;
