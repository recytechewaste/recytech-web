import { useEffect, useState } from 'react';
import api from '../api/client';
import Sidebar from './Sidebar';
import styles from '../styles/RequestManagement.module.css';
import { Check, Eye, X } from 'lucide-react';

const RequestManagement = () => {
    const [requests, setRequests] = useState([]);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [collectors, setCollectors] = useState([]);
    const [wasteCategories, setWasteCategories] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, completed: 0 });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [successTitle, setSuccessTitle] = useState('');
    
    // Modal States
    const [viewRequest, setViewRequest] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null); // For Approval
    const [selectedCollector, setSelectedCollector] = useState('');
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [rejectingRequestId, setRejectingRequestId] = useState(null);

    // Filter States
    const [filters, setFilters] = useState({
        status: '',
        wasteType: '',
        dateFrom: '',
        dateTo: ''
    });

    const fetchData = async () => {
        try {
            const reqData = await api.get('/requests');
            const colData = await api.get('/collectors');
            const rateData = await api.get('/exchange-rates');
            
            setRequests(reqData.data);
            setFilteredRequests(reqData.data);
            setCollectors(colData.data);
            setWasteCategories((rateData.data.rates || []).map(rate => rate.wasteType));

            // Calculate Stats for the Cards
            const total = reqData.data.length;
            const pending = reqData.data.filter(r => r.status === 'Pending').length;
            const approved = reqData.data.filter(r => r.status === 'Approved').length;
            const completed = reqData.data.filter(r => r.status === 'Completed').length;
            
            setStats({ total, pending, approved, completed });

        } catch (error) { console.error("Error", error); }
    };

    useEffect(() => {
        Promise.resolve().then(fetchData);
    }, []);

    const handleApplyFilters = () => {
        let result = [...requests];

        if (filters.status) {
            result = result.filter(r => r.status === filters.status);
        }

        if (filters.wasteType) {
            result = result.filter(r => r.wasteType === filters.wasteType);
        }

        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            result = result.filter(r => new Date(r.createdAt) >= fromDate);
        }

        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            result = result.filter(r => new Date(r.createdAt) <= toDate);
        }

        setFilteredRequests(result);
    };

    const handleClearFilters = () => {
        setFilters({
            status: '',
            wasteType: '',
            dateFrom: '',
            dateTo: ''
        });
        setFilteredRequests(requests);
    };

    // --- Action Handlers ---
    const handleApproveClick = (req) => {
        setSelectedRequest(req);
        if (viewRequest) setViewRequest(null);
    };

    const confirmAssignment = () => {
        if (!selectedCollector) return alert("Please select a collector");
        setShowAssignmentModal(true);
    };

    const executeAssignment = async () => {
        try {
            await api.put(`/requests/${selectedRequest._id}`, {
                status: 'Approved',
                assignedCollector: selectedCollector
            });
            setSuccessTitle("Request Approved");
            setSuccessMessage("The pickup request has been successfully approved and assigned to the selected collector.");
            setShowSuccessModal(true);
            setShowAssignmentModal(false);
            setSelectedRequest(null);
            setSelectedCollector('');
            fetchData();
        } catch (error) { console.error(error); }
    };

    const confirmReject = async () => {
        try {
            await api.put(`/requests/${rejectingRequestId}`, { status: 'Rejected' });
            setSuccessTitle("Request Rejected");
            setSuccessMessage("The pickup request has been successfully marked as Rejected.");
            setShowSuccessModal(true);
            setRejectingRequestId(null);
            fetchData();
        } catch (error) { console.error(error); }
    };

    const handleRejectClick = (id) => {
        setRejectingRequestId(id);
    };

    return (
        <div className={styles.container}>
            <Sidebar activePage="Request Management" />
            <div className={styles.main}>
                
                {/* HEADER SECTION */}
                <div className={styles.headerContainer}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.pageTitle}>Request Management</h1>
                        <p className={styles.subTitle}>Monitor and verify e-waste pickup requests within your jurisdiction.</p>
                    </div>
                    <button className={styles.helpBtn}>?</button>
                </div>

                {/* FILTERS SECTION */}
                <div className={styles.filterBar}>
                    <div className={styles.filterGroup}>
                        <label className={styles.label}>Status</label>
                        <select 
                            className={styles.select} 
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Completed">Completed</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.label}>Waste Category</label>
                        <select 
                            className={styles.select}
                            value={filters.wasteType}
                            onChange={(e) => setFilters({...filters, wasteType: e.target.value})}
                        >
                            <option value="">All Categories</option>
                            {wasteCategories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.label}>Date From</label>
                        <input 
                            type="date" 
                            className={styles.input} 
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label className={styles.label}>Date To</label>
                        <input 
                            type="date" 
                            className={styles.input} 
                            value={filters.dateTo}
                            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                        />
                    </div>
                    <button className={styles.applyBtn} onClick={handleApplyFilters}>Apply Filters</button>
                    <button className={styles.clearBtn} onClick={handleClearFilters}>Clear All</button>
                </div>

                {/* --- METRICS CARDS (New) --- */}
                <div className={styles.metricsGrid}>
                    <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Total Requests</span>
                        <h3 className={styles.metricValue}>{stats.total}</h3>
                    </div>
                    <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Pending Review</span>
                        <h3 className={styles.metricValue}>{stats.pending}</h3>
                    </div>
                    <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Approved</span>
                        <h3 className={styles.metricValue}>{stats.approved}</h3>
                    </div>
                    <div className={styles.metricCard}>
                        <span className={styles.metricLabel}>Completed</span>
                        <h3 className={styles.metricValue}>{stats.completed}</h3>
                    </div>
                </div>

                {/* TABLE SECTION */}
                <div className={styles.card}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Request ID</th>
                                <th className={styles.th}>E-Waste Type</th>
                                <th className={styles.th}>Quantity</th>
                                <th className={styles.th}>Area</th>
                                <th className={styles.th}>Assigned Collector</th>
                                <th className={styles.th}>Submission Date</th>
                                <th className={styles.th}>Status</th>
                                <th className={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map((req) => (
                                <tr key={req._id} className={styles.tr}>
                                    <td className={styles.td}>REQ-{req._id.substring(0,6).toUpperCase()}</td>
                                    <td className={styles.td}>{req.wasteType}</td>
                                    <td className={styles.td}>{req.quantity || 1} item(s)</td>
                                    <td className={styles.td}>{req.location?.address || "Area 1"}</td>
                                    <td className={styles.td}>
                                        {req.assignedCollector ? `${req.assignedCollector.firstName} ${req.assignedCollector.lastName}` : <span style={{color: '#9ca3af', fontStyle: 'italic'}}>Unassigned</span>}
                                    </td>
                                    <td className={styles.td}>{new Date(req.createdAt).toLocaleDateString()}</td>
                                    <td className={styles.td}>{req.status}</td>
                                    <td className={`${styles.td} ${styles.actionCell}`}>
                                        <div className={styles.tableActions}>
                                            <button
                                                type="button"
                                                title="View details"
                                                onClick={() => setViewRequest(req)}
                                                className={`${styles.actionBtn} ${styles.actionView}`}
                                            >
                                                <Eye size={14} />
                                                <span>View</span>
                                            </button>
                                        {req.status === 'Pending' && (
                                            <>
                                                    <button
                                                        type="button"
                                                        title="Approve request"
                                                        onClick={() => handleApproveClick(req)}
                                                        className={`${styles.actionBtn} ${styles.actionApprove}`}
                                                    >
                                                        <Check size={14} />
                                                        <span>Approve</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        title="Reject request"
                                                        onClick={() => handleRejectClick(req._id)}
                                                        className={`${styles.actionBtn} ${styles.actionReject}`}
                                                    >
                                                        <X size={14} />
                                                        <span>Reject</span>
                                                    </button>
                                            </>
                                        )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- MODALS (Keep existing logic) --- */}
                {/* 1. VIEW DETAILS MODAL */}
                {viewRequest && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>Request Details</h2>
                                <button onClick={() => setViewRequest(null)} className={styles.closeBtn}>&times;</button>
                            </div>
                            
                            <div className={styles.modalBody}>
                                <div className={styles.detailsSection}>
                                    <img src={viewRequest.imageUrl || "https://placehold.co/600x400"} className={styles.evidenceImage} alt="Evidence" />
                                    <div className={styles.detailRow}><strong>Resident:</strong> {viewRequest.residentName}</div>
                                    <div className={styles.detailRow}><strong>Resident Email:</strong> {viewRequest.resident?.email || viewRequest.residentEmail || 'N/A'}</div>
                                    <div className={styles.detailRow}><strong>Quantity:</strong> {viewRequest.quantity || 1} item(s)</div>
                                    <div className={styles.detailRow}><strong>Location:</strong> {viewRequest.location?.address}</div>
                                    <div className={styles.detailRow}>
                                        <strong>Assigned To:</strong> {(() => {
                                            const collector = viewRequest.assignedCollector;
                                            return collector?.firstName ? `${collector.firstName} ${collector.lastName}` : "Unassigned";
                                        })()}
                                    </div>
                                    {viewRequest.assignedCollector?.firstName && (
                                        <>
                                            <div className={styles.detailRow}>
                                                <strong>Collector Phone:</strong> {viewRequest.assignedCollector.phone}
                                            </div>
                                            <div className={styles.detailRow}>
                                                <strong>Vehicle Type:</strong> {viewRequest.assignedCollector.vehicleType}
                                            </div>
                                            <div className={styles.detailRow}>
                                                <strong>Plate Number:</strong> {viewRequest.assignedCollector.vehiclePlate}
                                            </div>
                                        </>
                                    )}
                                    <div className={styles.detailRow}><strong>Status:</strong> {viewRequest.status}</div>
                                </div>
                                <div className={styles.mapSection}>
                                    <iframe 
                                        width="100%" 
                                        height="100%" 
                                        frameBorder="0" 
                                        style={{border:0}}
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(viewRequest.location?.address || "Philippines")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </div>
                            
                            <div style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                                {viewRequest.status === 'Pending' && (
                                    <button onClick={() => handleApproveClick(viewRequest)} className={styles.approveBtn}>Proceed to Approve</button>
                                )}
                                <button onClick={() => setViewRequest(null)} className={styles.viewBtn}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. ASSIGN DRIVER MODAL */}
                {selectedRequest && !showAssignmentModal && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>Assign Collector</h2>
                                <button onClick={() => setSelectedRequest(null)} className={styles.closeBtn}>&times;</button>
                            </div>
                            <p style={{marginBottom: '10px'}}>Select a driver for <strong>{selectedRequest.wasteType}</strong>:</p>
                            <select 
                                className={styles.select} 
                                style={{marginBottom:'20px'}}
                                onChange={(e) => setSelectedCollector(e.target.value)}
                                value={selectedCollector}
                            >
                                <option value="">-- Select Driver --</option>
                                {collectors.filter(c => c.status === 'Active').map(c => (
                                    <option key={c._id} value={c._id}>{`${c.firstName} ${c.lastName}`} ({c.vehiclePlate})</option>
                                ))}
                            </select>
                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                                <button onClick={() => setSelectedRequest(null)} className={styles.viewBtn}>Cancel</button>
                                <button onClick={confirmAssignment} className={styles.approveBtn}>Assign</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. CONFIRM ASSIGNMENT MODAL */}
                {showAssignmentModal && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>Confirm Assignment</h2>
                            </div>
                            <p>Are you sure you want to assign <strong>{(() => {
                                const col = collectors.find(c => c._id === selectedCollector);
                                return col ? `${col.firstName} ${col.lastName}` : 'this collector';
                            })()}</strong> to this request?</p>
                            <div style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                                <button onClick={() => setShowAssignmentModal(false)} className={styles.viewBtn}>Cancel</button>
                                <button onClick={executeAssignment} className={styles.approveBtn}>Confirm</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- SUCCESS DIALOGUE --- */}
                {showSuccessModal && (
                    <div className={styles.modalOverlay}>
                        <div className={`${styles.modalContent} ${styles.successModal}`}>
                            <div className={styles.successIconWrapper}>
                                <Check size={40} color="#059669" />
                            </div>
                            <h2 className={styles.successTitle}>{successTitle || "Action Successful"}</h2>
                            <p className={styles.successText}>{successMessage}</p>
                            <div className={styles.modalFooter} style={{borderTop: 'none', justifyContent: 'center', marginTop: '16px'}}>
                                <button onClick={() => setShowSuccessModal(false)} className={styles.approveBtn} style={{width: '100%', padding: '12px'}}>
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- REJECT CONFIRMATION MODAL --- */}
                {rejectingRequestId && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent} style={{maxWidth: '400px'}}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>Confirm Rejection</h2>
                                <button onClick={() => setRejectingRequestId(null)} className={styles.closeBtn}><X size={20}/></button>
                            </div>
                            <p style={{color:'#666', marginBottom:'24px', fontSize: '14px', lineHeight: '1.5'}}>Are you sure you want to reject this pickup request? This action will mark the request as Rejected and cannot be undone.</p>
                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                                <button onClick={() => setRejectingRequestId(null)} className={styles.viewBtn}>Cancel</button>
                                <button onClick={confirmReject} className={styles.rejectBtn} style={{marginRight: 0}}>Reject Request</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default RequestManagement;
