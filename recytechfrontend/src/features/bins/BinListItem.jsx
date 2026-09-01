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
            <div className={styles.listItemHeader}>
                <h4 className={styles.binName} title={bin.name}>{bin.name}</h4>
                <span className={`${styles.badge} ${bin.status === 'Empty' ? styles.badgeEmpty : bin.status === 'Full' ? styles.badgeFull : styles.badgeMaintenance}`}>
                    {bin.status}
                </span>
            </div>

            <div className={styles.listItemFooter}>
                {lguName ? (
                    <span className={styles.lguBadge} title={`Assigned LGU: ${lguName}`}>
                        <Building2 size={12} className={styles.lguIcon} />
                        <span className={styles.lguText}>{lguName}</span>
                    </span>
                ) : (
                    <span className={styles.unassignedBadge}>Unassigned</span>
                )}

                {canManage && (
                    <div className={styles.listActions} onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={handleEdit}
                            title="Edit bin"
                            aria-label={`Edit bin ${bin.name}`}
                        >
                            <Pencil size={15} />
                        </button>
                        <button
                            type="button"
                            className={styles.actionBtnDanger}
                            onClick={handleDelete}
                            title="Delete bin"
                            aria-label={`Delete bin ${bin.name}`}
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BinListItem;
