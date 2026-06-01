import { useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import styles from '../styles/EducationManager.module.css'; // Reusing layout styles
import { Plus, Edit2, RefreshCw, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useExchangeRates } from '../features/exchange-rates/useExchangeRates';
import ExchangeRateFormModal from '../features/exchange-rates/ExchangeRateFormModal';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';

const ExchangeRateManager = () => {
    const { rates, loading, fetchRates } = useExchangeRates();
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ wasteType: '', ratePerItem: 0, description: '', isActive: true });
    const { showToast } = useToast();

    const handleSubmit = async (submittedData) => {
        try {
            if (editingId) {
                await api.put(`/exchange-rates/${editingId}`, submittedData);
                showToast('Exchange rate updated successfully.', 'success');
            } else {
                await api.post('/exchange-rates', submittedData);
                showToast('Exchange rate added successfully.', 'success');
            }
            setShowModal(false);
            fetchRates();
        } catch (error) { showToast(error.response?.data?.message || 'Error saving rate', 'error'); }
    };

    const handleDelete = async (rate) => {
        if (!window.confirm(`Delete the exchange rate for "${rate.wasteType}"?`)) return;

        try {
            await api.delete(`/exchange-rates/${rate._id}`);
            showToast('Exchange rate deleted successfully.', 'success');
            fetchRates();
        } catch (error) {
            showToast(error.response?.data?.message || 'Error deleting rate', 'error');
        }
    };

    const toggleStatus = async (rate) => {
        try {
            await api.put(`/exchange-rates/${rate._id}`, { isActive: !rate.isActive });
            showToast(`Exchange rate ${rate.isActive ? 'deactivated' : 'activated'} successfully.`, 'success');
            fetchRates();
        } catch (error) { showToast(error.response?.data?.message || 'Error toggling rate status', 'error'); }
    };

    return (
        <div className={styles.container}>
            <Sidebar activePage="Exchange Rates" />
            <div className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1>Exchange Rates</h1>
                        <p>Configure PHP payout rates per category.</p>
                    </div>
                    <button onClick={() => { setEditingId(null); setFormData({ wasteType: '', ratePerItem: 0, description: '', isActive: true }); setShowModal(true); }} className={styles.addBtn}>
                        <Plus size={18} /> Add New Rate
                    </button>
                </div>

                {loading ? (
                    <div className={styles.grid}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className={styles.contentCard} style={{ borderLeft: '4px solid #e5e7eb' }}>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardHeader}>
                                        <Skeleton width="60px" height="24px" borderRadius="12px" />
                                        <div className={styles.actions}>
                                            <Skeleton width="28px" height="28px" borderRadius="4px" />
                                            <Skeleton width="28px" height="28px" borderRadius="4px" />
                                            <Skeleton width="28px" height="28px" borderRadius="4px" />
                                        </div>
                                    </div>
                                    <Skeleton width="150px" height="24px" style={{ marginTop: '12px', marginBottom: '8px' }} />
                                    <Skeleton width="180px" height="32px" style={{ marginBottom: '16px' }} />
                                    <Skeleton width="80%" height="16px" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {rates.map((rate) => (
                            <div key={rate._id} className={styles.contentCard} style={{ borderLeft: rate.isActive ? '4px solid #10b981' : '4px solid #ef4444' }}>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.categoryBadge}>{rate.isActive ? 'Active' : 'Inactive'}</span>
                                        <div className={styles.actions}>
                                            <button title="Edit rate" onClick={() => { setFormData(rate); setEditingId(rate._id); setShowModal(true); }} className={styles.iconBtn}><Edit2 size={16}/></button>
                                            <button title={rate.isActive ? 'Deactivate rate' : 'Activate rate'} onClick={() => toggleStatus(rate)} className={styles.iconBtn}>
                                                {rate.isActive ? <ToggleRight size={18}/> : <ToggleLeft size={18}/>}
                                            </button>
                                            <button title="Delete rate" onClick={() => handleDelete(rate)} className={styles.iconBtnDanger}><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    <h3 className={styles.itemTitle}>{rate.wasteType}</h3>
                                    <p className={styles.itemDesc} style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                                        PHP {(rate.ratePerItem ?? rate.ratePerKg ?? 0).toFixed(2)} / item
                                    </p>
                                    <p className={styles.itemDesc}>{rate.description || 'No description provided.'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <ExchangeRateFormModal 
                    isOpen={showModal} 
                    isEditing={!!editingId} 
                    initialData={formData} 
                    onClose={() => setShowModal(false)} 
                    onSubmit={handleSubmit} 
                />
            </div>
        </div>
    );
};

export default ExchangeRateManager;
