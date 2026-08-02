import BinListItem from './BinListItem';
import EmptyState from '../../components/EmptyState';
import styles from '../../styles/BinNetwork.module.css';

const BinList = ({ bins, selectedBinId, onSelectBin, onEditBin, onDeleteBin, allBinsCount, canManage = true }) => {
    return (
        <div className={styles.list}>
            {bins.length === 0 ? (
                <EmptyState
                    icon="bins"
                    title={allBinsCount > 0 ? "No bins match the filter" : "No bins found"}
                    subtitle={allBinsCount > 0 ? "Try adjusting your filters or search term." : "Add a bin to the network to get started."}
                />
            ) : (
                bins.map((bin) => (
                    <BinListItem
                        key={bin._id}
                        bin={bin}
                        isSelected={selectedBinId === bin._id}
                        onSelect={onSelectBin}
                        onEdit={onEditBin}
                        onDelete={onDeleteBin}
                        canManage={canManage}
                    />
                ))
            )}
        </div>
    );
};

export default BinList;
