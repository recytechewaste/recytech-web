import React from 'react';
import Modal from '../../components/Modal';
import { User, Mail, Phone, MapPin, Award, Calendar, Layers, ShieldCheck, X } from 'lucide-react';
import styles from '../../styles/Collectors.module.css';

const ResidentDetailModal = ({ resident, isOpen, onClose }) => {
    if (!isOpen || !resident) return null;

    const fullName = `${resident.firstName || ''} ${resident.lastName || ''}`.trim() || 'Anonymous Resident';
    const initials = resident.firstName ? resident.firstName.charAt(0).toUpperCase() : 'R';
    const formattedDate = resident.createdAt 
        ? new Date(resident.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'N/A';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Resident Profile Overview" maxWidth="540px">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}>
                    {initials}
                </div>
                <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                        {fullName}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            ID: {resident._id ? `R-${resident._id.substring(resident._id.length - 6).toUpperCase()}` : 'N/A'}
                        </span>
                        <span className={`${styles.statusBadge} ${resident.status === 'Active' ? styles.active : styles.inactive}`}>
                            {resident.status || 'Active'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        <Award size={16} /> Points Balance
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803d' }}>
                        {(resident.pointsBalance ?? resident.totalPoints ?? 0).toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 500 }}>pts</span>
                    </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        <Layers size={16} /> Total Requests
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>
                        {resident.requestCount || 0}
                    </div>
                </div>
            </div>

            {/* Contact & Account Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#374151' }}>
                    <Mail size={16} color="#6b7280" />
                    <span style={{ fontWeight: 600, width: '90px' }}>Email:</span>
                    <span>{resident.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#374151' }}>
                    <Phone size={16} color="#6b7280" />
                    <span style={{ fontWeight: 600, width: '90px' }}>Phone:</span>
                    <span>{resident.phone || 'Not provided'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#374151' }}>
                    <MapPin size={16} color="#6b7280" />
                    <span style={{ fontWeight: 600, width: '90px' }}>Address:</span>
                    <span>{resident.address || 'Not provided'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#374151' }}>
                    <ShieldCheck size={16} color="#6b7280" />
                    <span style={{ fontWeight: 600, width: '90px' }}>Source:</span>
                    <span style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600
                    }}>
                        {resident.source || 'Mobile App'}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#374151' }}>
                    <Calendar size={16} color="#6b7280" />
                    <span style={{ fontWeight: 600, width: '90px' }}>Joined Date:</span>
                    <span>{formattedDate}</span>
                </div>
            </div>

            <div className={styles.modalFooter}>
                <button type="button" onClick={onClose} className={styles.submitBtn}>
                    Close Profile
                </button>
            </div>
        </Modal>
    );
};

export default ResidentDetailModal;
