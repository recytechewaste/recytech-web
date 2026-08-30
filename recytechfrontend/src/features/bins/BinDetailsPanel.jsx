import { Pencil, Trash2 } from 'lucide-react';
import styles from '../../styles/BinNetwork.module.css';

const BinDetailsPanel = ({ bin, onEdit, onDelete }) => {
    if (!bin) return null;

    const fillPercentage = bin.capacityKg > 0 ? ((bin.currentFillKg || 0) / bin.capacityKg) * 100 : 0;

    const getStatusInfo = (status) => {
        switch (status) {
            case 'Full':
                return { className: styles.badgeFull, label: 'Full' };
            case 'Maintenance':
                return { className: styles.badgeMaintenance, label: 'Needs Maintenance' };
            case 'Empty':
            default:
                return { className: styles.badgeEmpty, label: 'Operational' };
        }
    };

    const statusInfo = getStatusInfo(bin.status);

    return (
        <div className={styles.rightPanel}>
            <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>{bin.name}</h3>
            </div>
            <div className={styles.panelBody}>
                <div className={styles.detailGroup}>
                    <p className={styles.detailLabel}>Address</p>
                    <p className={styles.detailValue}>{bin.address}</p>
                </div>
                <div className={styles.detailGroup}>
                    <p className={styles.detailLabel}>Status</p>
                    <p className={styles.detailValue}>
                        <span className={`${styles.badge} ${statusInfo.className}`}>{statusInfo.label}</span>
                    </p>
                </div>
                <div className={styles.detailGroup}>
                    <p className={styles.detailLabel}>Fill Level</p>
                    <div className={styles.progressWrapper}>
                        <div className={styles.progressBar} style={{ width: `${fillPercentage}%` }} />
                    </div>
                    <p className={styles.detailValue}>{fillPercentage.toFixed(1)}% full ({bin.currentFillKg || 0} / {bin.capacityKg} kg)</p>
                </div>
                <div className={styles.detailGrid}>
                    <div className={styles.detailGroup}>
                        <p className={styles.detailLabel}>QR Code</p>
                        <p className={styles.detailValue}>{bin.qrCode || 'N/A'}</p>
                    </div>
                    <div className={styles.detailGroup}>
                        <p className={styles.detailLabel}>Last Emptied</p>
                        <p className={styles.detailValue}>{bin.lastEmptied ? new Date(bin.lastEmptied).toLocaleDateString() : 'N/A'}</p>
                    </div>
                </div>
            </div>
            <div className={styles.panelFooter}>
                <button type="button" aria-label={`Edit details for ${bin.name}`} className={styles.panelActionBtn} onClick={() => onEdit(bin)}>
                    <Pencil size={16} /> Edit Details
                </button>
                <button type="button" aria-label={`Delete bin ${bin.name}`} className={`${styles.panelActionBtn} ${styles.panelActionDanger}`} onClick={() => onDelete(bin)}>
                    <Trash2 size={16} /> Delete Bin
                </button>
            </div>
        </div>
    );
};

export default BinDetailsPanel;
