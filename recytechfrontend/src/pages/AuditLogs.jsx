import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/client';
import { 
    History, 
    Search, 
    RefreshCw, 
    X, 
    ChevronLeft, 
    ChevronRight,
    Calendar,
    Terminal,
    FileText,
    Database,
    Eye,
    Copy,
    Check
} from 'lucide-react';
import styles from '../styles/AuditLogs.module.css';
import InfoTooltip from '../components/InfoTooltip';
import Skeleton from '../components/Skeleton';

const CATEGORIES = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'ACCESS_CONTROL', label: 'Access Control & Roles' },
    { id: 'USER_MANAGEMENT', label: 'User Management' },
    { id: 'SYSTEM_CONFIG', label: 'System Configuration' },
    { id: 'COLLECTOR_MANAGEMENT', label: 'Collector Operations' },
    { id: 'SECURITY', label: 'Security & Auth' }
];

const getActionBadgeClass = (action = '') => {
    const act = (action || '').toUpperCase();
    if (act.includes('ROLE') || act.includes('PERM')) return styles.badgeRole;
    if (act.includes('DELETE') || act.includes('DEACTIVAT') || act.includes('REVOKE')) return styles.badgeDelete;
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('REGISTER')) return styles.badgeCreate;
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('MODIFY')) return styles.badgeUpdate;
    if (act.includes('LOGIN') || act.includes('PASSWORD') || act.includes('AUTH')) return styles.badgeSecurity;
    return styles.badgeDefault;
};

export const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const [limit, setLimit] = useState(10);

    // Detail Modal State
    const [inspectLog, setInspectLog] = useState(null);
    const [copiedDetails, setCopiedDetails] = useState(false);

    // Fetch Summary Metrics
    const fetchSummary = useCallback(async () => {
        try {
            const res = await api.get('/audit-logs/summary');
            if (res.data && res.data.summary) {
                setSummary(res.data.summary);
            }
        } catch (err) {
            console.error('Failed to load audit summary:', err);
        }
    }, []);

    // Fetch Audit Logs with Pagination
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: currentPage,
                limit
            };
            if (search.trim()) params.search = search.trim();
            if (selectedCategory && selectedCategory !== 'ALL') params.category = selectedCategory;
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const res = await api.get('/audit-logs', { params });
            if (res.data) {
                setLogs(res.data.logs || []);
                setTotalPages(res.data.totalPages || 1);
                setTotalLogs(res.data.totalLogs || 0);
            }
        } catch (err) {
            console.error('Failed to load audit logs:', err);
            setError(err.response?.data?.message || 'Failed to retrieve audit log records.');
        } finally {
            setLoading(false);
        }
    }, [currentPage, limit, search, selectedCategory, startDate, endDate]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleClearFilters = () => {
        setSearch('');
        setSelectedCategory('ALL');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
    };

    const formatTimeDate = (dateString) => {
        if (!dateString) return { date: '—', time: '' };
        const d = new Date(dateString);
        const date = d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const time = d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        return { date, time };
    };

    const handleCopyPayload = (details) => {
        if (!details) return;
        navigator.clipboard.writeText(JSON.stringify(details, null, 2));
        setCopiedDetails(true);
        setTimeout(() => setCopiedDetails(false), 2000);
    };

    // Calculate dynamic pagination numbers
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Sidebar activePage="Audit Logs" />

            <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
                <div className={styles.container}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.titleArea}>
                            <div className={styles.iconWrapper}>
                                <History size={24} />
                            </div>
                            <div>
                                <h1 className={styles.title}>System Audit Logs</h1>
                                <p className={styles.subtitle}>
                                    Immutable historical audit trail documenting system mutations, access control, and compliance events.
                                </p>
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            <button 
                                className={styles.refreshBtn}
                                onClick={() => { fetchSummary(); fetchLogs(); }}
                                title="Refresh Logs"
                            >
                                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* KPI Summary Cards */}
                    <div className={styles.kpiGrid}>
                        <div className={styles.kpiCard}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className={styles.kpiLabel}>Total Audit Records</div>
                                <InfoTooltip
                                    title="Audit Trail Ledger"
                                    content="Total immutable administrative and security events logged in the system since initialization."
                                    position="bottom"
                                    width={260}
                                />
                            </div>
                            <div className={styles.kpiValue}>{summary?.totalLogs ?? totalLogs}</div>
                            <div className={styles.kpiSub}>Tracked immutable transactions</div>
                        </div>

                        <div className={styles.kpiCard}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className={styles.kpiLabel}>Today's Activity</div>
                                <InfoTooltip
                                    title="Active Session Monitoring"
                                    content="Administrative operations, logins, and system updates executed during today's operating window."
                                    position="bottom"
                                    width={260}
                                />
                            </div>
                            <div className={styles.kpiValue} style={{ color: '#059669' }}>
                                {summary?.todayLogs ?? 0}
                            </div>
                            <div className={styles.kpiSub}>Events recorded since midnight</div>
                        </div>

                        <div className={styles.kpiCard}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className={styles.kpiLabel}>Access Control Events</div>
                                <InfoTooltip
                                    title="Security & Privileges"
                                    content="Role elevations, permission updates, account deactivations, and password modifications."
                                    position="bottom"
                                    width={260}
                                />
                            </div>
                            <div className={styles.kpiValue} style={{ color: '#7c3aed' }}>
                                {summary?.categories?.ACCESS_CONTROL ?? 0}
                            </div>
                            <div className={styles.kpiSub}>Role elevation & deactivations</div>
                        </div>

                        <div className={styles.kpiCard}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div className={styles.kpiLabel}>System Config & Rules</div>
                                <InfoTooltip
                                    title="System Configuration"
                                    content="Adjustments to core operating parameters, including reward point conversion rates and collector assignments."
                                    position="bottom"
                                    width={260}
                                />
                            </div>
                            <div className={styles.kpiValue} style={{ color: '#0284c7' }}>
                                {summary?.categories?.SYSTEM_CONFIG ?? 0}
                            </div>
                            <div className={styles.kpiSub}>Reward points & parameter changes</div>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className={styles.filterBar}>
                        <div className={styles.filterRow}>
                            <div className={styles.filterControlsLeft}>
                                <div className={styles.searchBox}>
                                    <Search size={16} className={styles.searchIcon} />
                                    <input
                                        type="text"
                                        placeholder="Search by action, user, target, or IP..."
                                        className={styles.searchInput}
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                    />
                                    {search && (
                                        <button 
                                            type="button" 
                                            className={styles.searchClearBtn}
                                            onClick={() => { setSearch(''); setCurrentPage(1); }}
                                            title="Clear search"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                <div className={styles.dateRangeGroup}>
                                    <Calendar size={15} className={styles.dateIcon} />
                                    <input
                                        type="date"
                                        className={styles.dateInput}
                                        value={startDate}
                                        onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                                        title="Start Date"
                                    />
                                    <span className={styles.dateSeparator}>to</span>
                                    <input
                                        type="date"
                                        className={styles.dateInput}
                                        value={endDate}
                                        max={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                                        title="End Date (Capped at Today)"
                                    />
                                </div>

                                <div className={styles.limitGroup}>
                                    <span className={styles.limitLabel}>Show:</span>
                                    <select
                                        className={styles.limitSelect}
                                        value={limit}
                                        onChange={(e) => { setLimit(Number(e.target.value)); setCurrentPage(1); }}
                                    >
                                        <option value={10}>10 / page</option>
                                        <option value={20}>20 / page</option>
                                        <option value={50}>50 / page</option>
                                    </select>
                                </div>
                            </div>

                            {(search || selectedCategory !== 'ALL' || startDate || endDate) && (
                                <button className={styles.clearBtn} onClick={handleClearFilters} title="Reset all filters">
                                    <X size={14} /> Clear Filters
                                </button>
                            )}
                        </div>

                        {/* Category Quick Pills */}
                        <div className={styles.categoryPills}>
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className={`${styles.pill} ${selectedCategory === cat.id ? styles.pillActive : ''}`}
                                    onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table View */}
                    <div className={styles.tableCard}>
                        {error && (
                            <div style={{ padding: '16px 20px', background: '#fef2f2', color: '#b91c1c', fontSize: '13px', borderBottom: '1px solid #fecaca' }}>
                                {error}
                            </div>
                        )}

                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '160px' }}>Timestamp</th>
                                        <th style={{ width: '180px' }}>Action</th>
                                        <th style={{ width: '140px' }}>Category</th>
                                        <th>Actor</th>
                                        <th>Target Entity</th>
                                        <th style={{ width: '130px' }}>IP Address</th>
                                        <th style={{ textAlign: 'center', width: '90px' }}>Inspect</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
                                            <tr key={`skeleton-${i}`}>
                                                <td><Skeleton width="110px" height="18px" /></td>
                                                <td><Skeleton width="130px" height="22px" borderRadius="6px" /></td>
                                                <td><Skeleton width="90px" height="20px" borderRadius="6px" /></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Skeleton width="26px" height="26px" borderRadius="50%" />
                                                        <Skeleton width="100px" height="16px" />
                                                    </div>
                                                </td>
                                                <td><Skeleton width="110px" height="16px" /></td>
                                                <td><Skeleton width="90px" height="18px" borderRadius="4px" /></td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <Skeleton width="60px" height="26px" borderRadius="6px" style={{ margin: '0 auto' }} />
                                                </td>
                                            </tr>
                                        ))
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className={styles.emptyState}>
                                                <Database size={36} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                                                <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#334155' }}>No audit records found</p>
                                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    Try adjusting your search query, dates, or category filters.
                                                </span>
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => {
                                            const { date, time } = formatTimeDate(log.createdAt);
                                            const actorInit = log.actor?.name ? log.actor.name.charAt(0).toUpperCase() : 'S';

                                            return (
                                                <tr key={log._id}>
                                                    <td>
                                                        <div className={styles.timeCell}>
                                                            <span className={styles.timeDate}>{date}</span>
                                                            <span className={styles.timeClock}>{time}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`${styles.badgeAction} ${getActionBadgeClass(log.action)}`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={styles.categoryChip}>
                                                            {log.actionCategory}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className={styles.actorCell}>
                                                            <div className={styles.actorAvatar}>
                                                                {actorInit}
                                                            </div>
                                                            <div className={styles.actorInfo}>
                                                                <span className={styles.actorName}>
                                                                    {log.actor?.name || 'System Engine'}
                                                                </span>
                                                                <span className={styles.actorEmail}>
                                                                    {log.actor?.email || log.actor?.role || 'automated'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {log.targetEntity?.name ? (
                                                            <div className={styles.targetCell}>
                                                                <span className={styles.targetName}>
                                                                    {log.targetEntity.name}
                                                                </span>
                                                                {log.targetEntity.entityType && (
                                                                    <span className={styles.targetType}>
                                                                        Type: {log.targetEntity.entityType}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={styles.ipBadge}>
                                                            {log.ipAddress || '127.0.0.1'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            type="button"
                                                            className={styles.inspectBtn}
                                                            onClick={() => setInspectLog(log)}
                                                            title="Inspect log details"
                                                        >
                                                            <Eye size={13} />
                                                            <span>Details</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Interactive Pagination Bar */}
                        <div className={styles.paginationBar}>
                            <div className={styles.pageInfo}>
                                Showing <span className={styles.pageBold}>{totalLogs === 0 ? 0 : (currentPage - 1) * limit + 1}</span> to <span className={styles.pageBold}>{Math.min(currentPage * limit, totalLogs)}</span> of <span className={styles.pageBold}>{totalLogs}</span> audit records
                            </div>

                            <div className={styles.paginationControls}>
                                <button
                                    type="button"
                                    className={styles.pageNavBtn}
                                    disabled={currentPage <= 1 || loading}
                                    onClick={() => setCurrentPage(1)}
                                    title="First Page"
                                >
                                    First
                                </button>
                                <button
                                    type="button"
                                    className={styles.pageNavBtn}
                                    disabled={currentPage <= 1 || loading}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    title="Previous Page"
                                >
                                    <ChevronLeft size={15} /> Prev
                                </button>

                                <div className={styles.pageNumbers}>
                                    {getPageNumbers().map((num, i) => (
                                        typeof num === 'number' ? (
                                            <button
                                                key={i}
                                                type="button"
                                                className={`${styles.pageNumBtn} ${currentPage === num ? styles.pageNumActive : ''}`}
                                                onClick={() => setCurrentPage(num)}
                                                disabled={loading}
                                            >
                                                {num}
                                            </button>
                                        ) : (
                                            <span key={i} className={styles.pageEllipsis}>...</span>
                                        )
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    className={styles.pageNavBtn}
                                    disabled={currentPage >= totalPages || loading}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    title="Next Page"
                                >
                                    Next <ChevronRight size={15} />
                                </button>
                                <button
                                    type="button"
                                    className={styles.pageNavBtn}
                                    disabled={currentPage >= totalPages || loading}
                                    onClick={() => setCurrentPage(totalPages)}
                                    title="Last Page"
                                >
                                    Last
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Inspect Detail Modal */}
            {inspectLog && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(3px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '14px',
                        width: '100%',
                        maxWidth: '680px',
                        maxHeight: '88vh',
                        overflowY: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            padding: '18px 24px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#f8fafc'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FileText size={20} style={{ color: '#10b981' }} />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                                        Audit Event Details
                                    </h3>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                                        Record ID: {inspectLog._id}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setInspectLog(null)}
                                style={{
                                    border: 'none',
                                    background: '#f1f5f9',
                                    color: '#64748b',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                                title="Close modal"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>ACTION & CATEGORY</span>
                                    <div style={{ marginTop: '6px' }}>
                                        <span className={`${styles.badgeAction} ${getActionBadgeClass(inspectLog.action)}`}>
                                            {inspectLog.action}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '6px' }}>
                                        Category: <strong>{inspectLog.actionCategory}</strong>
                                    </div>
                                </div>

                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>EVENT TIMESTAMP</span>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                                        {formatTimeDate(inspectLog.createdAt).date} at {formatTimeDate(inspectLog.createdAt).time}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                                        Status: <span style={{ color: '#059669', fontWeight: 600 }}>{inspectLog.status || 'SUCCESS'}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>ACTOR (INITIATOR)</span>
                                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                                        {inspectLog.actor?.name || 'System Engine'}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                        Email: {inspectLog.actor?.email || 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                                        Role: {inspectLog.actor?.role || 'System'}
                                    </div>
                                </div>

                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>TARGET ENTITY</span>
                                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                                        {inspectLog.targetEntity?.name || 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                        Type: {inspectLog.targetEntity?.entityType || 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
                                        ID: {inspectLog.targetEntity?.entityId || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>CLIENT & NETWORK METADATA</span>
                                <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px' }}>
                                    <strong>IP Address:</strong> <code style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{inspectLog.ipAddress || '127.0.0.1'}</code>
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', wordBreak: 'break-all' }}>
                                    <strong>User Agent:</strong> {inspectLog.userAgent || 'Web Browser'}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Terminal size={14} style={{ color: '#10b981' }} />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                                            Event Context & Details
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleCopyPayload(inspectLog.details)}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '4px 8px',
                                            background: '#f1f5f9',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '5px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: '#475569',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {copiedDetails ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                                        <span>{copiedDetails ? 'Copied' : 'Copy JSON'}</span>
                                    </button>
                                </div>
                                <pre style={{
                                    margin: 0,
                                    background: '#0f172a',
                                    color: '#38bdf8',
                                    padding: '14px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    overflowX: 'auto',
                                    fontFamily: 'Consolas, monospace',
                                    maxHeight: '180px'
                                }}>
                                    {JSON.stringify(inspectLog.details || {}, null, 2)}
                                </pre>
                            </div>
                        </div>

                        <div style={{
                            padding: '14px 24px',
                            borderTop: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            background: '#f8fafc'
                        }}>
                            <button
                                onClick={() => setInspectLog(null)}
                                style={{
                                    padding: '8px 20px',
                                    background: '#10b981',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogs;
