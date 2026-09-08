import React from 'react';
import { Search, Filter, AlertTriangle } from 'lucide-react';
import styles from '../../styles/Collectors.module.css';

const SensorReportFilterBar = ({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    severityFilter,
    setSeverityFilter,
    handleClearFilters
}) => {
    return (
        <div className={styles.filterBar} style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div className={styles.searchGroup} style={{ flex: '1 1 260px' }}>
                <Search size={18} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Search by bin name, partner org, reporter, or issue description..."
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search reports"
                />
            </div>

            <div className={styles.filterGroup}>
                <Filter size={18} className={styles.filterIcon} />
                <select
                    className={styles.selectInput}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    aria-label="Filter by report status"
                >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Dismissed">Dismissed</option>
                </select>
            </div>

            <div className={styles.filterGroup}>
                <AlertTriangle size={18} className={styles.filterIcon} />
                <select
                    className={styles.selectInput}
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    aria-label="Filter by severity level"
                >
                    <option value="All">All Severities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>
            </div>

            <button className={styles.clearBtn} onClick={handleClearFilters} aria-label="Clear all report filters">
                Clear All
            </button>
        </div>
    );
};

export default SensorReportFilterBar;
