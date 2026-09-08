import React from 'react';
import { Search, Filter, Shield } from 'lucide-react';
import styles from '../../styles/Collectors.module.css';

const ResidentFilterBar = ({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sourceFilter,
    setSourceFilter,
    handleClearFilters,
    total
}) => {
    return (
        <div className={styles.filterBar}>
            <div className={styles.searchGroup}>
                <Search size={18} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search by resident name, email, phone, or address..."
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search residents by name, email, phone, or address"
                />
            </div>

            <div className={styles.filterGroup}>
                <Filter size={18} className={styles.filterIcon} />
                <select
                    className={styles.selectInput}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter residents by status"
                >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>

            <div className={styles.filterGroup}>
                <Shield size={18} className={styles.filterIcon} />
                <select
                    className={styles.selectInput}
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    aria-label="Filter residents by source"
                >
                    <option value="">All Sources</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Web">Web</option>
                    <option value="Mobile Simulation">Mobile Simulation</option>
                    <option value="Imported">Imported</option>
                </select>
            </div>

            <button className={styles.clearBtn} onClick={handleClearFilters} aria-label="Clear all resident filters">
                Clear All
            </button>
        </div>
    );
};

export default ResidentFilterBar;

