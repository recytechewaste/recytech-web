import React from 'react';
import { Search, Filter } from 'lucide-react';
import styles from '../../styles/Collectors.module.css';

const PartnerOrgFilterBar = ({ 
    searchTerm, setSearchTerm, 
    statusFilter, setStatusFilter, 
    handleClearFilters 
}) => {
    return (
        <div className={styles.filterBar}>
            <div className={styles.searchGroup}>
                <Search size={18} className={styles.searchIcon} />
                <input 
                    type="text" 
                    placeholder="Search by organization name or email..." 
                    className={styles.searchInput} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search partner organizations by name or email"
                />
            </div>
            <div className={styles.filterGroup}>
                <Filter size={18} className={styles.filterIcon} />
                <select 
                    className={styles.selectInput}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter partner organizations by status"
                >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>
            <button className={styles.clearBtn} onClick={handleClearFilters}>Clear All</button>
        </div>
    );
};

export default PartnerOrgFilterBar;
