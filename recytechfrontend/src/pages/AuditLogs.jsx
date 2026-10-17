import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../api/client';
import { 
    History, 
    Search, 
    Filter, 
    RefreshCw, 
    ShieldAlert, 
    ShieldCheck, 
    UserCheck, 
    Settings, 
    Sliders, 
    X, 
    ChevronLeft, 
    ChevronRight,
    Calendar,
    Terminal,
    FileText,
    Database
} from 'lucide-react';
import styles from '../styles/AuditLogs.module.css';

const CATEGORIES = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'ACCESS_CONTROL', label: 'Access Control & Roles' },
    { id: 'USER_MANAGEMENT', label: 'User Management' },
    { id: 'SYSTEM_CONFIG', label: 'System Configuration' },
    { id: 'COLLECTOR_MANAGEMENT', label: 'Collector Operations' },
    { id: 'SECURITY', label: 'Security & Auth' }
];

const getActionBadgeClass = (action = '') => {
    if (action.includes('ROLE') || action.includes('PERM')) return styles.badgeRole;
    if (action.includes('DELETE') || action.includes('DEACTIVAT')) return styles.badgeDelete;
    if (action.includes('CREATE') || action.includes('ADD')) return styles.badgeCreate;
    if (action.includes('UPDATE') || action.includes('EDIT')) return styles.badgeUpdate;
    if (action.includes('LOGIN') || action.includes('PASSWORD') || action.includes('AUTH')) return styles.badgeSecurity;
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
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    // Detail Modal State
    const [inspectLog, setInspectLog] = useState(null);

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

    // Fetch Audit Logs
    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: currentPage,
                limit: 15
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
    }, [currentPage, search, selectedCategory, startDate, endDate]);

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

    const formatDate = (dateString) => {
        if (!dateString) return '—';
        const d = new Date(dateString);
        return d.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
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
                            <div className={styles.kpiLabel}>Total Audit Records</div>
                            <div className={styles.kpiValue}>{summary?.totalLogs ?? totalLogs}</div>
                            <div className={styles.kpiSub}>Tracked immutable transactions</div>
                        </div>

                        <div className={styles.kpiCard}>
                            <div className={styles.kpiLabel}>Today's Activity</div>
                            <div className={styles.kpiValue} style={{ color: '#059669' }}>
                                {summary?.todayLogs ?? 0}
                            </div>
                            <div className={styles.kpiSub}>Events recorded since midnight</div>
                        </div>

                        <div className={styles.kpiCard}>
                            <div className={styles.kpiLabel}>Access Control Events</div>
                            <div className={styles.kpiValue} style={{ color: '#7c3aed' }}>
                                {summary?.categories?.ACCESS_CONTROL ?? 0}
                            </div>
                            <div className={styles.kpiSub}>Role elevation & deactivations</div>
                        </div>

                        <div className={styles.kpiCard}>
                            <div className={styles.kpiLabel}>System Config & Rules</div>
                            <div className={styles.kpiValue} style={{ color: '#0284c7' }}>
                                {summary?.categories?.SYSTEM_CONFIG ?? 0}
                            </div>
                            <div className={styles.kpiSub}>Reward points & parameter changes</div>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className={styles.filterBar}>
                        <div className={styles.filterRow}>
                            <div className={styles.searchBox}>
                                <Search size={16} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Search by action, actor name, email, target, or IP..."
                                    className={styles.searchInput}
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={15} style={{ color: '#64748b' }} />
                                <input
                                    type="date"
                                    className={styles.dateInput}
                                    value={startDate}
                                    onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                                    title="Start Date"
                                />
                                <span style={{ color: '#94a3b8', fontSize: '12px' }}>to</span>
                                <input
                                    type="date"
                                    className={styles.dateInput}
                                    value={endDate}
                                    max={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                                    title="End Date (Capped at Today)"
                                />
                            </div>

                            {(search || selectedCategory !== 'ALL' || startDate || endDate) && (
                                <button className={styles.clearBtn} onClick={handleClearFilters}>
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        {/* Category Quick Pills */}
                        <div className={styles.categoryPills}>
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
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
                            <div style={{ padding: '20px', background: '#fef2f2', color: '#b91c1c', fontSize: '13px' }}>
                                {error}
                            </div>
                        )}

                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Action</th>
                                        <th>Category</th>
                                        <th>Actor</th>
                                        <th>Target Entity</th>
                                        <th>IP Address</th>
                                        <th style={{ textAlign: 'center' }}>Inspect</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className={styles.emptyState}>
                                                Loading audit log entries...
                                            </td>
                                        </tr>
                                    ) : logs.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className={styles.emptyState}>
                                                <Database size={32} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                                                <p style={{ margin: 0, fontWeight: 600 }}>No audit logs found</p>
                                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    Try clearing your search query or filters.
                                                </span>
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log._id}>
                                                <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: '#64748b' }}>
                                                    {formatDate(log.createdAt)}
                                                </td>
                                                <td>
                                                    <span className={`${styles.badgeAction} ${getActionBadgeClass(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: '#475569',
                                                        background: '#f1f5f9',
                                                        padding: '3px 8px',
                                                        borderRadius: '4px'
                                                    }}>
                                                        {log.actionCategory}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                                            {log.actor?.name || 'System'}
                                                        </span>
                                                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                            {log.actor?.email || log.actor?.role}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {log.targetEntity?.name ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                                                {log.targetEntity.name}
                                                            </span>
                                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                                Type: {log.targetEntity.entityType}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                                                    )}
                                                </td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#64748b' }}>
                                                    {log.ipAddress || '127.0.0.1'}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button
                                                        className={styles.viewDetailsBtn}
                                                        onClick={() => setInspectLog(log)}
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <div className={styles.pageInfo}>
                                    Showing page {currentPage} of {totalPages} ({totalLogs} total events)
                                </div>
                                <div className={styles.pageControls}>
                                    <button
                                        className={styles.pageBtn}
                                        disabled={currentPage <= 1 || loading}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <span style={{ fontSize: '12px', fontWeight: 600, padding: '0 8px', color: '#334155' }}>
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        className={styles.pageBtn}
                                        disabled={currentPage >= totalPages || loading}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
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
                        maxHeight: '85vh',
                        overflowY: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
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
                                <FileText size={20} style={{ color: '#0f766e' }} />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                                        Audit Event Details
                                    </h3>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>
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
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ACTION & CATEGORY</span>
                                    <div style={{ marginTop: '4px' }}>
                                        <span className={`${styles.badgeAction} ${getActionBadgeClass(inspectLog.action)}`}>
                                            {inspectLog.action}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px' }}>
                                        Category: {inspectLog.actionCategory}
                                    </div>
                                </div>

                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>EVENT TIMESTAMP</span>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginTop: '4px' }}>
                                        {formatDate(inspectLog.createdAt)}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                                        Status: {inspectLog.status}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>ACTOR (INITIATOR)</span>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                                        {inspectLog.actor?.name || 'System'}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                        Email: {inspectLog.actor?.email || 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#0f766e', fontWeight: 600 }}>
                                        Role: {inspectLog.actor?.role}
                                    </div>
                                </div>

                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TARGET ENTITY</span>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                                        {inspectLog.targetEntity?.name || 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                                        Type: {inspectLog.targetEntity?.entityType || 'N/A'}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                        ID: {inspectLog.targetEntity?.entityId || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>CLIENT & NETWORK METADATA</span>
                                <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px' }}>
                                    <strong>IP Address:</strong> {inspectLog.ipAddress || '127.0.0.1'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', wordBreak: 'break-all' }}>
                                    <strong>User Agent:</strong> {inspectLog.userAgent || 'Web Browser'}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                                    <Terminal size={14} style={{ color: '#0f766e' }} />
                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                                        Event Context & Modification Details
                                    </span>
                                </div>
                                <pre style={{
                                    margin: 0,
                                    background: '#0f172a',
                                    color: '#38bdf8',
                                    padding: '14px',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    overflowX: 'auto',
                                    fontFamily: 'Consolas, monospace'
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
                                    padding: '8px 18px',
                                    background: '#0f766e',
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
