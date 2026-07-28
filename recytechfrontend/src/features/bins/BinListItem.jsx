import { Pencil, Trash2 } from 'lucide-react';
import styles from '../../styles/BinNetwork.module.css';

const BinListItem = ({ bin, isSelected, onSelect, onEdit, onDelete }) => {
    const handleEdit = (e) => {
        e.stopPropagation();
        onEdit(bin);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDelete(bin);
    };

    return (
        <div
            className={`${styles.listItem} ${isSelected ? styles.selectedItem : ''}`}
            onClick={() => onSelect(bin._id)}
        >
            <div className={styles.listItemInfo}>
                <strong className={styles.binName}>{bin.name}</strong>
            </div>
            <div className={styles.listActions}>
                <span className={`${styles.badge} ${bin.status === 'Empty' ? styles.badgeEmpty : bin.status === 'Full' ? styles.badgeFull : styles.badgeMaintenance}`}>
                    {bin.status}
                </span>
                <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={handleEdit}
                    title="Edit bin"
                >
                    <Pencil size={16} />
                </button>
                <button
                    type="button"
                    className={styles.actionBtnDanger}
                    onClick={handleDelete}
                    title="Delete bin"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default BinListItem;
