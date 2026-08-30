import { Pencil, Trash2, Building2 } from 'lucide-react';
import styles from '../../styles/BinNetwork.module.css';

const BinListItem = ({ bin, isSelected, onSelect, onEdit, onDelete, canManage = true }) => {
    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit(bin);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(bin);
    };

    const lguName = bin.assignedLgu?.name || (typeof bin.assignedLgu === 'string' ? bin.assignedLgu : null);

    return (
        <div
            className={`${styles.listItem} ${isSelected ? styles.selectedItem : ''}`}
            onClick={() => onSelect(bin._id)}
        >
            <div className={styles.listItemInfo}>
                <strong className={styles.binName}>{bin.name}</strong>
                {lguName && (
                    <span style={{ fontSize: '11px', color: '#059669', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px', fontWeight: 500 }}>
                        <Building2 size={11} /> {lguName}
                    </span>
                )}
            </div>
            <div className={styles.listActions}>
                <span className={`${styles.badge} ${bin.status === 'Empty' ? styles.badgeEmpty : bin.status === 'Full' ? styles.badgeFull : styles.badgeMaintenance}`}>
                    {bin.status}
                </span>
                {canManage && (
                    <>
                        <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={handleEdit}
                            title="Edit bin"
                            aria-label={`Edit bin ${bin.name}`}
                        >
                            <Pencil size={16} />
                        </button>
                        <button
                            type="button"
                            className={styles.actionBtnDanger}
                            onClick={handleDelete}
                            title="Delete bin"
                            aria-label={`Delete bin ${bin.name}`}
                        >
                            <Trash2 size={16} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default BinListItem;
