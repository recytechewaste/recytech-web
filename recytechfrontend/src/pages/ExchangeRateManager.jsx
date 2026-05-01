import { useEffect, useState } from 'react';
import api from '../api/client';
import Sidebar from './Sidebar';
import styles from '../styles/EducationManager.module.css'; // Reusing layout styles
import { Plus, Coins, Edit2, X, Save, RefreshCw, Trash2 } from 'lucide-react';

const ExchangeRateManager = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ wasteType: '', ratePerKg: 0, description: '', isActive: true });

    const fetchRates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/exchange-rates', { params: { includeInactive: true } });
            setRates(res.data.rates || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { Promise.resolve().then(fetchRates); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/exchange-rates/${editingId}`, formData);
            } else {
                await api.post('/exchange-rates', formData);
            }
            setShowModal(false);
            fetchRates();
        } catch (error) { alert(error.response?.data?.message || 'Error saving rate'); }
    };

    const toggleStatus = async (rate) => {
        try {
            await api.put(`/exchange-rates/${rate._id}`, { isActive: !rate.isActive });
            fetchRates();
        } catch (error) { console.error(error); }
    };

    return (
        <div className={styles.container}>
            <Sidebar activePage="Exchange Rates" />
            <div className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1>Exchange Rates</h1>
                        <p>Configure PHP payout rates per kilogram of waste.</p>
                    </div>
                    <button onClick={() => { setEditingId(null); setFormData({ wasteType: '', ratePerKg: 0, description: '', isActive: true }); setShowModal(true); }} className={styles.addBtn}>
                        <Plus size={18} /> Add New Rate
                    </button>
                </div>

                {loading ? (
                    <div className={styles.loadingState}><RefreshCw className={styles.spinner} /> Loading rates...</div>
                ) : (
                    <div className={styles.grid}>
                        {rates.map((rate) => (
                            <div key={rate._id} className={styles.contentCard} style={{ borderLeft: rate.isActive ? '4px solid #10b981' : '4px solid #ef4444' }}>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardHeader}>
                                        <span className={styles.categoryBadge}>{rate.isActive ? 'Active' : 'Inactive'}</span>
                                        <div className={styles.actions}>
                                            <button onClick={() => { setFormData(rate); setEditingId(rate._id); setShowModal(true); }} className={styles.iconBtn}><Edit2 size={16}/></button>
                                            <button onClick={() => toggleStatus(rate)} className={styles.iconBtnDanger}><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    <h3 className={styles.itemTitle}>{rate.wasteType}</h3>
                                    <p className={styles.itemDesc} style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                                        PHP {rate.ratePerKg.toFixed(2)} / kg
                                    </p>
                                    <p className={styles.itemDesc}>{rate.description || 'No description provided.'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {showModal && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalContent}>
                            <div className={styles.modalHeader}>
                                <h2>{editingId ? 'Edit Rate' : 'New Exchange Rate'}</h2>
                                <button onClick={() => setShowModal(false)} className={styles.closeBtn}><X size={20}/></button>
                            </div>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGroup}>
                                    <label>Waste Type</label>
                                    <input required disabled={!!editingId} value={formData.wasteType} onChange={(e) => setFormData({...formData, wasteType: e.target.value})} className={styles.input} placeholder="e.g. Plastics, Electronics" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Rate (PHP per kg)</label>
                                    <input type="number" step="0.01" required value={formData.ratePerKg} onChange={(e) => setFormData({...formData, ratePerKg: parseFloat(e.target.value)})} className={styles.input} />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Description</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={styles.textarea} />
                                </div>
                                <div className={styles.modalFooter}>
                                    <button type="button" onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" className={styles.submitBtn}><Save size={16} /> Save Rate</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExchangeRateManager;
