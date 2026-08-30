import React from 'react';
import { Search, Filter, Shield } from 'lucide-react';
import styles from '../../styles/Collectors.module.css'; // Using collector styles for consistency

const UserFilterBar = ({ 
    searchTerm, setSearchTerm, 
    roleFilter, setRoleFilter,
    statusFilter, setStatusFilter, 
    handleClearFilters 
}) => {
    return (
        <div className={styles.filterBar}>
            <div className={styles.searchGroup}>
                <Search size={18} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search users by name or email"
                />
            </div>
            <div className={styles.filterGroup}>
                <Shield size={18} className={styles.filterIcon} />
                <label htmlFor="userRoleFilter" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>Filter by role</label>
                <select
                    id="userRoleFilter"
                    className={styles.selectInput}
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                >
                    <option value="">All Roles</option>
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                </select>
            </div>
            <div className={styles.filterGroup}>
                <Filter size={18} className={styles.filterIcon} />
                <label htmlFor="userStatusFilter" style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>Filter by status</label>
                <select
                    id="userStatusFilter"
                    className={styles.selectInput}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>
            <button className={styles.clearBtn} onClick={handleClearFilters} aria-label="Clear all user filters">Clear All</button>
        </div>
    );
};

export default UserFilterBar;
