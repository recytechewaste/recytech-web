import styles from '../../styles/UserManagement.module.css';

const ResidentFilterBar = ({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    total,
}) => {
    return (
        <div className={styles.filterBar}>
            <div className={styles.searchGroup}>
                <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className={styles.selectInput}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>
            <span className={styles.totalUsers}>Total Residents: {total}</span>
        </div>
    );
};

export default ResidentFilterBar;
