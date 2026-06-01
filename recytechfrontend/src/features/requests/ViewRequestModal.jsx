import MapWidget from '../../components/MapWidget';
import styles from '../../styles/RequestManagement.module.css';

const getCollectorName = (collector) => collector?.firstName ? `${collector.firstName} ${collector.lastName}` : 'Unassigned';

const ViewRequestModal = ({ request, onClose, onApprove }) => {
    if (!request) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Request Details</h2>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>

                <div className={styles.modalBody}>
                    {/* Left Column: Visuals */}
                    <div className={styles.visualsSection}>
                        <div className={styles.visualBlock}>
                            <p className={styles.sectionLabel}>Evidence Image</p>
                            <img src={request.imageUrl || 'https://placehold.co/600x400'} className={styles.evidenceImage} alt="Evidence" />
                        </div>
                        <div className={styles.visualBlock}>
                            <p className={styles.sectionLabel}>Pickup Location</p>
                            <div className={styles.mapSection}>
                                {request.location?.address ? (
                                    <MapWidget address={request.location.address} />
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#6b7280' }}>No location provided</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Information */}
                    <div className={styles.infoSection}>
                        <h3 className={styles.infoTitle}>Request Information</h3>
                        <div className={styles.detailsGrid}>
                            <div className={styles.detailCard}>
                                <strong>Resident Name</strong>
                                <span>{request.residentName}</span>
                            </div>
                            <div className={styles.detailCard}>
                                <strong>Contact Email</strong>
                                <span>{request.resident?.email || request.residentEmail || 'N/A'}</span>
                            </div>
                            <div className={styles.detailCard}>
                                <strong>Waste Category</strong>
                                <span>{request.wasteType}</span>
                            </div>
                            <div className={styles.detailCard}>
                                <strong>Quantity</strong>
                                <span>{request.quantity || 1} item(s)</span>
                            </div>
                            <div className={styles.detailCard} style={{ gridColumn: '1 / -1' }}>
                                <strong>Full Address</strong>
                                <span>{request.location?.address}</span>
                            </div>
                        </div>

                        <h3 className={styles.infoTitle}>Assignment Details</h3>
                        <div className={styles.detailsGrid}>
                            <div className={styles.detailCard}>
                                <strong>Status</strong>
                                <span style={{ color: request.status === 'Completed' ? '#059669' : request.status === 'Rejected' ? '#dc2626' : '#0f766e', fontWeight: 'bold' }}>
                                    {request.status}
                                </span>
                            </div>
                            <div className={styles.detailCard}>
                                <strong>Assigned Collector</strong>
                                <span>{getCollectorName(request.assignedCollector)}</span>
                            </div>
                            <div className={styles.detailCard} style={{ gridColumn: '1 / -1' }}>
                                <strong>Pickup Schedule</strong>
                                <span>{request.scheduledAt ? new Date(request.scheduledAt).toLocaleString() : 'Not scheduled'}</span>
                            </div>
                            {request.assignedCollector?.firstName && (
                                <>
                                    <div className={styles.detailCard}>
                                        <strong>Collector Phone</strong>
                                        <span>{request.assignedCollector.phone}</span>
                                    </div>
                                    <div className={styles.detailCard}>
                                        <strong>Vehicle Details</strong>
                                        <span>{request.assignedCollector.vehicleType} - {request.assignedCollector.vehiclePlate}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    {request.status === 'Pending' && (
                        <button onClick={() => onApprove(request)} className={styles.approveBtn}>Proceed to Approve</button>
                    )}
                    <button onClick={onClose} className={styles.viewBtn}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ViewRequestModal;
