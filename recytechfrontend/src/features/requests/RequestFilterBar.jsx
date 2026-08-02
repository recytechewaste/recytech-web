import React from 'react';
import { Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import styles from '../../styles/BinCollectionRequests.module.css';

const RequestFilterBar = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  handleClearFilters,
}) => {
  return (
    <div className={styles.filterBar}>
      <div className={styles.searchGroup}>
        <Search className={styles.searchIcon} size={18} />
        <input
          type="text"
          placeholder="Search by Bin ID, Address, or Notes..."
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.filterGroup}>
        <SlidersHorizontal className={styles.filterIcon} size={16} />
        <select
          className={styles.selectInput}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <select
          className={styles.selectInput}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="automated">Automated</option>
          <option value="manual">Manual</option>
        </select>
      </div>

      <button onClick={handleClearFilters} className={styles.clearBtn}>
        <Trash2 size={14} />
        Clear
      </button>
    </div>
  );
};

export default RequestFilterBar;
