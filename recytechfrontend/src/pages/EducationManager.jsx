import { useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import styles from '../styles/EducationManager.module.css';
import { 
    Plus, Search, Edit2, Trash2, 
    ExternalLink, AlertCircle, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useEducation } from '../features/education/useEducation';
import EducationFormModal from '../features/education/EducationFormModal';
import { useToast } from '../context/ToastContext';
import Skeleton from '../components/Skeleton';

const CATEGORIES = ["Sustainability", "E-Waste Disposal", "Environmental Impact", "Regulations"];

const EducationManager = () => {
    const { 
        filteredMaterials, paginatedMaterials, loading, fetchError, fetchMaterials,
        searchTerm, setSearchTerm, categoryFilter, setCategoryFilter,
        page, limit, pages, goToPage, hasNextPage, hasPrevPage
    } = useEducation();

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [initialImage, setInitialImage] = useState(null);
    const { showToast } = useToast();
    
    const [formData, setFormData] = useState({
        title: '',
        category: 'Sustainability',
        type: 'Article',
        description: '',
        contentURL: '',
        status: 'Published'
    });

    const handleSubmit = async (submissionData) => {
        try {
            if (editingId) {
                await api.put(`/education/${editingId}`, submissionData);
                showToast('Material updated successfully.', 'success');
            } else {
                await api.post('/education', submissionData);
                showToast('Material added successfully.', 'success');
            }
            setShowModal(false);
            fetchMaterials();
        } catch (error) { showToast(error.response?.data?.message || 'Error saving material', 'error'); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this content?")) {
            try {
                await api.delete(`/education/${id}`);
                showToast('Material deleted successfully.', 'success');
                fetchMaterials();
            } catch (error) { showToast(error.response?.data?.message || 'Error deleting material', 'error'); }
        }
    };

    const handleOpenAdd = () => {
        setEditingId(null);
        setInitialImage(null);
        setFormData({ title: '', category: 'Sustainability', type: 'Article', description: '', contentURL: '', status: 'Published' });
        setShowModal(true);
    };

    return (
        <div className={styles.container}>
            <Sidebar activePage="Educational Content" />
            <div className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.titleGroup}>
                        <h1 className={styles.pageTitle}>Educational Content</h1>
                        <p className={styles.subTitle}>Curation of sustainability guides and e-waste awareness.</p>
                    </div>
                    <button onClick={handleOpenAdd} className={styles.addBtn}>
                        <Plus size={18} /> Add Content
                    </button>
                </div>

                <div className={styles.filterBar}>
                    <div className={styles.searchGroup}>
                        <Search size={18} className={styles.searchIcon} />
                        <input type="text" placeholder="Search materials..." className={styles.searchInput} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <span className={styles.totalCount}>Total: {filteredMaterials.length} materials</span>
                    <select className={styles.selectInput} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">All Categories</option>
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                {fetchError ? (
                    <div className={styles.errorState}>
                        <AlertCircle size={48} color="#ef4444" />
                        <h3>Connection Error</h3>
                        <p>{fetchError}</p>
                        <button onClick={fetchMaterials} className={styles.retryBtn}>Retry Connection</button>
                    </div>
                ) : loading ? (
                    <div className={styles.grid}>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className={styles.contentCard}>
                                <Skeleton height="160px" width="100%" style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />
                                <div className={styles.cardBody}>
                                    <div className={styles.cardHeader}>
                                        <Skeleton width="80px" height="24px" borderRadius="12px" />
                                        <div className={styles.actions}>
                                            <Skeleton width="28px" height="28px" borderRadius="4px" />
                                            <Skeleton width="28px" height="28px" borderRadius="4px" />
                                        </div>
                                    </div>
                                    <Skeleton width="90%" height="24px" style={{ marginTop: '12px', marginBottom: '8px' }} />
                                    <Skeleton width="100%" height="14px" style={{ marginBottom: '4px' }} />
                                    <Skeleton width="60%" height="14px" style={{ marginBottom: '16px' }} />
                                    <div className={styles.cardFooter}>
                                        <Skeleton width="60px" height="24px" borderRadius="4px" />
                                        <Skeleton width="60px" height="16px" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : paginatedMaterials.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', width: '100%' }}>No educational content found.</div>
                ) : (
                    <>
                        <div className={styles.grid}>
                            {paginatedMaterials.map((item) => (
                                <div key={item._id} className={styles.contentCard}>
                                    {item.thumbnail && <img src={item.thumbnail} className={styles.cardThumb} alt="Thumbnail" />}
                                    <div className={styles.cardBody}>
                                        <div className={styles.cardHeader}>
                                            <span className={styles.categoryBadge}>{item.category}</span>
                                            <div className={styles.actions}>
                                                <button onClick={() => { setFormData(item); setEditingId(item._id); setInitialImage(item.thumbnail); setShowModal(true); }} className={styles.iconBtn}><Edit2 size={16}/></button>
                                                <button onClick={() => handleDelete(item._id)} className={styles.iconBtnDanger}><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                        <h3 className={styles.itemTitle}>{item.title}</h3>
                                        <p className={styles.itemDesc}>{item.description?.substring(0, 80) || "No description..."}...</p>
                                        <div className={styles.cardFooter}>
                                            <span className={styles.typeTag}>{item.type}</span>
                                            {item.contentURL && <a href={item.contentURL} target="_blank" rel="noreferrer" className={styles.link}><ExternalLink size={14} /> View</a>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className={styles.filterBar} style={{ marginTop: '20px', justifyContent: 'center' }}>
                            <button 
                                disabled={!hasPrevPage} 
                                onClick={() => goToPage(page - 1)}
                                className={styles.iconBtn}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ padding: '0 20px' }}>Page {page} of {pages}</span>
                            <button 
                                disabled={!hasNextPage} 
                                onClick={() => goToPage(page + 1)}
                                className={styles.iconBtn}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </>
                )}

                <EducationFormModal 
                    isOpen={showModal} 
                    isEditing={!!editingId} 
                    initialData={formData} 
                    initialImage={initialImage}
                    onClose={() => setShowModal(false)} 
                    onSubmit={handleSubmit} 
                />
            </div>
        </div>
    );
};

export default EducationManager;
