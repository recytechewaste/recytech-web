import BinListItem from './BinListItem';
import styles from '../../styles/BinNetwork.module.css';

const BinList = ({ bins, selectedBinId, onSelectBin, onEditBin, onDeleteBin, allBinsCount }) => {
    return (
        <div className={styles.list}>
            {bins.length === 0 ? (
                <div className={styles.emptyState} style={{ border: 'none', background: 'transparent' }}>
                    {allBinsCount > 0 ? 'No bins match the current filter.' : 'No bins found.'}
                </div>
            ) : (
                bins.map((bin) => (
                    <BinListItem
                        key={bin._id}
                        bin={bin}
                        isSelected={selectedBinId === bin._id}
                        onSelect={onSelectBin}
                        onEdit={onEditBin}
                        onDelete={onDeleteBin}
                    />
                ))
            )}
        </div>
    );
};

export default BinList;
