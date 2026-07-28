import { useEffect, useState, useMemo } from 'react';
import { useBins } from '../features/bins/useBins';
import Sidebar from '../components/Sidebar';
import MapWidget from '../components/MapWidget';
import Modal from '../components/Modal';
import BinForm from '../features/bins/BinForm';
import BinList from '../features/bins/BinList';
import styles from '../styles/BinNetwork.module.css';
import { PanelLeftOpen, PanelLeftClose, ListFilter, ArrowDownUp } from 'lucide-react';

const DEFAULT_COORDINATES = [14.5995, 120.9842];

const createEmptyBin = () => ({
    name: '',
    address: '',
    qrCode: '',
    capacityKg: '500',
    currentFillKg: 0,
    status: 'Empty',
    description: '',
    location: {
        type: 'Point',
        coordinates: [...DEFAULT_COORDINATES],
    },
});

const BinNetwork = () => {
    const { bins, loading, addBin, updateBin, deleteBin } = useBins();
    const [selectedBinId, setSelectedBinId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBin, setEditingBin] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [isListCollapsed, setListCollapsed] = useState(false);
    const [deletingBin, setDeletingBin] = useState(null); // State for delete confirmation
    const [userGeolocation, setUserGeolocation] = useState(null); // Stores user's current location
    
    // Filter and Sort states
    const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Empty', 'Full', 'Maintenance'
    const [sortOrder, setSortOrder] = useState('none'); // 'none', 'asc', 'desc'

    useEffect(() => {
        if (!loading && bins.length > 0 && !selectedBinId) {
            setSelectedBinId(bins[0]._id);
        }

        // Request user's geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserGeolocation([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.warn('Geolocation failed:', error);
                    // Fallback to default if user denies or error occurs
                    setUserGeolocation(null); 
                }
            );
        }
    }, [bins, loading, selectedBinId]);

    const filteredBins = useMemo(() => {
        let currentBins = bins;

        if (statusFilter !== 'All') {
            currentBins = currentBins.filter(bin => bin.status === statusFilter);
        }

        if (sortOrder !== 'none') {
            currentBins = [...currentBins].sort((a, b) => {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                if (sortOrder === 'asc') {
                    return nameA.localeCompare(nameB);
                } else { // desc
                    return nameB.localeCompare(nameA);
                }
            });
        }

        return currentBins;
    }, [bins, statusFilter, sortOrder]);

    const openCreateModal = () => {
        setEditingBin(null);
        setIsModalOpen(true);
    };

    const openEditModal = (bin) => {
        const preparedBin = {
            ...bin,
            capacityKg: bin.capacityKg?.toString() || '500',
            location: {
                type: 'Point',
                coordinates: Array.isArray(bin.location?.coordinates) && bin.location.coordinates.length === 2
                    ? bin.location.coordinates
                    : [...DEFAULT_COORDINATES]
            }
        };
        setEditingBin(preparedBin);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBin(null);
    };

    const handleFormSubmit = async (binData) => {
        setSubmitting(true);
        let success;
        if (editingBin) {
            success = await updateBin(editingBin._id, binData);
        } else {
            success = await addBin(binData);
        }
        if (success) {
            closeModal();
        }
        setSubmitting(false);
    };

    // Opens the delete confirmation modal
    const handleDelete = (bin) => {
        setDeletingBin(bin);
    };

    // Performs the actual deletion
    const confirmDelete = async () => {
        if (!deletingBin) return;
        
        if (selectedBinId === deletingBin._id) {
            setSelectedBinId(null);
        }
        await deleteBin(deletingBin._id);
        setDeletingBin(null); // Close the modal
    };

    const handleResetFilters = () => {
        setStatusFilter('All');
        setSortOrder('none');
    };

    const missionControlClasses = [
        styles.missionControl,
        isListCollapsed ? styles.listCollapsed : ''
    ].join(' ');

    return (
        <div className={styles.container}>
            <Sidebar activePage="Smart Bin Network" />

            <main className={styles.main}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.pageTitle}>Smart Bin Network</h1>
                        <p className={styles.subtitle}>Manage collection points across the city.</p>
                    </div>
                    <button className={styles.addBtn} type="button" onClick={openCreateModal}>
                        + Add Bin
                    </button>
                </header>

                <div className={missionControlClasses}>
                    <div className={styles.leftPanel}>
                        <div className={styles.listHeader}>
                            <h2 className={styles.listTitle}>All Bins ({!loading ? filteredBins.length : '...'})</h2>
                            {(statusFilter !== 'All' || sortOrder !== 'none') && (
                                <button onClick={handleResetFilters} className={styles.resetFilterBtn}>Reset</button>
                            )}
                        </div>
                        <div className={styles.filterBar}>
                            <div className={styles.filterContainer}>
                                <div className={styles.filterGroup}>
                                    <ListFilter size={14} className={styles.filterIcon} />
                                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.filterSelect} aria-label="Filter by status">
                                        <option value="All">All Status</option>
                                        <option value="Empty">Empty</option>
                                        <option value="Full">Full</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </div>
                                <div className={styles.filterGroup}>
                                    <ArrowDownUp size={14} className={styles.filterIcon} />
                                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={styles.filterSelect} aria-label="Sort by name">
                                        <option value="none">Sort by Name</option>
                                        <option value="asc">A-Z (Asc.)</option>
                                        <option value="desc">Z-A (Desc.)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        {loading ? (
                            <p className={styles.loading} style={{ marginTop: '20px' }}>Loading bins...</p>
                        ) : (
                            <BinList
                                bins={filteredBins}
                                selectedBinId={selectedBinId}
                                    // Pass the original bins.length for the empty state message
                                    // This ensures the message differentiates between "no bins at all"
                                    // and "no bins matching filter"
                                allBinsCount={bins.length}
                                onSelectBin={setSelectedBinId}
                                onEditBin={openEditModal}
                                onDeleteBin={handleDelete}
                            />
                        )}
                    </div>

                    <div className={styles.centerPanel}>
                        <div className={styles.mapArea}>
                            <MapWidget bins={bins} selectedBinId={selectedBinId} onSelectBin={setSelectedBinId} userGeolocation={userGeolocation} />
                        </div>
                        <button
                            className={styles.listToggleBtn}
                            onClick={() => setListCollapsed(!isListCollapsed)}
                            title={isListCollapsed ? 'Show List' : 'Hide List'}
                        >
                            {isListCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                        </button>
                    </div>
                </div>

                <Modal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    title={editingBin ? 'Edit Bin' : 'Add New Bin'}
                    maxWidth="700px"
                >
                    <BinForm
                        initialBin={editingBin || { ...createEmptyBin(), location: { type: 'Point', coordinates: userGeolocation || DEFAULT_COORDINATES } }}
                        onSubmit={handleFormSubmit}
                        onCancel={closeModal}
                        submitting={submitting}
                    />
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal isOpen={!!deletingBin} onClose={() => setDeletingBin(null)} title="Confirm Deletion" maxWidth="450px">
                    <p style={{color:'#4b5563', marginBottom:'1rem'}}>
                        Are you sure you want to delete the bin named <strong style={{color: '#1f2937'}}>{deletingBin?.name}</strong>?
                    </p>
                    <p style={{color:'#6b7280', fontSize: '0.875rem', marginBottom:'2rem'}}>
                        This action is permanent and cannot be undone. All associated data for this bin will be removed.
                    </p>
                    <div className={styles.panelFooter} style={{justifyContent: 'flex-end'}}>
                        <button onClick={() => setDeletingBin(null)} className={styles.panelActionBtn} style={{flex: '0 0 auto'}}>
                            Cancel
                        </button>
                        <button onClick={confirmDelete} className={`${styles.panelActionBtn} ${styles.panelActionDanger}`} style={{flex: '0 0 auto'}}>
                            Delete Bin
                        </button>
                    </div>
                </Modal>
            </main>
        </div>
    );
};

export default BinNetwork;
