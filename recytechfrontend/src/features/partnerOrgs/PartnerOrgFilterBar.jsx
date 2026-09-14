import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import styles from '../../styles/Collectors.module.css';

const PartnerOrgFilterBar = ({ 
    searchTerm, setSearchTerm, 
    statusFilter, setStatusFilter,
    nameSort, setNameSort,
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
                <label htmlFor="partnerOrgStatusFilter" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>Filter by status</label>
                <select 
                    id="partnerOrgStatusFilter"
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
            <div className={styles.filterGroup}>
                <ArrowUpDown size={18} className={styles.filterIcon} />
                <label htmlFor="partnerOrgNameSort" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>Sort by name</label>
                <select 
                    id="partnerOrgNameSort"
                    className={styles.selectInput}
                    value={nameSort}
                    onChange={(e) => setNameSort(e.target.value)}
                    aria-label="Sort partner organizations by name"
                >
                    <option value="">Sort by Name</option>
                    <option value="asc">Name: A to Z</option>
                    <option value="desc">Name: Z to A</option>
                </select>
            </div>
            <button className={styles.clearBtn} onClick={handleClearFilters} aria-label="Clear all partner organization filters">Clear All</button>
        </div>
    );
};

export default PartnerOrgFilterBar;
