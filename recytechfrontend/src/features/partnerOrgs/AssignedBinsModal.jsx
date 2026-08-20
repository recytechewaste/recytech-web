import React from 'react';
import Modal from '../../components/Modal';
import { MapPin, QrCode, Weight, Box } from 'lucide-react';
import sharedStyles from '../../styles/Layout.module.css';

const AssignedBinsModal = ({ isOpen, onClose, lguName, bins = [] }) => {
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Empty':
                return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
            case 'Full':
                return { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' };
            default:
                return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Assigned Smart Bins — ${lguName || 'Partner Organization'}`}
            maxWidth="600px"
        >
            <div style={{ padding: '4px 0 12px 0' }}>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                    Showing all smart bins currently assigned to <strong>{lguName}</strong>.
                </p>

                {bins.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                        <Box size={36} style={{ color: '#94a3b8', margin: '0 auto 8px auto' }} />
                        <h4 style={{ color: '#334155', fontWeight: 600, fontSize: '15px', margin: 0 }}>No Bins Assigned</h4>
                        <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
                            Go to the <strong>Bin Location Network</strong> page to assign a bin to this partner organization.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
                        {bins.map((bin) => {
                            const statusStyle = getStatusStyle(bin.status);
                            return (
                                <div key={bin._id} style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ margin: 0, color: '#0f172a', fontSize: '15px', fontWeight: 600 }}>{bin.name}</h4>
                                        <span style={{
                                            padding: '3px 10px',
                                            borderRadius: '999px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            backgroundColor: statusStyle.bg,
                                            color: statusStyle.color,
                                            border: `1px solid ${statusStyle.border}`
                                        }}>
                                            {bin.status}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#475569' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MapPin size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                                            <span>{bin.address || 'Address unavailable'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '16px', marginTop: '2px', color: '#64748b' }}>
                                            {bin.qrCode && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <QrCode size={13} /> {bin.qrCode}
                                                </span>
                                            )}
                                            {bin.capacityKg && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Weight size={13} /> Capacity: {bin.capacityKg} kg
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className={sharedStyles.modalFooter} style={{ marginTop: '20px' }}>
                    <button onClick={onClose} className={sharedStyles.cancelBtn}>
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignedBinsModal;
