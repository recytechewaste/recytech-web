import { useState } from 'react';
import api from '../api/client';
import Sidebar from '../components/Sidebar';
import styles from '../styles/EducationManager.module.css';
import { 
    Plus, Search, Edit2, Trash2, 
    ExternalLink, AlertCircle, RefreshCw 
} from 'lucide-react';
import { useEducation } from '../features/education/useEducation';
import EducationFormModal from '../features/education/EducationFormModal';

const CATEGORIES = ["Sustainability", "E-Waste Disposal", "Environmental Impact", "Regulations"];

const EducationManager = () => {
    const { 
        filteredMaterials, loading, fetchError, fetchMaterials,
        searchTerm, setSearchTerm, categoryFilter, setCategoryFilter
    } = useEducation();

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [initialImage, setInitialImage] = useState(null);
    
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
            } else {
                await api.post('/education', submissionData);
            }
            setShowModal(false);
            fetchMaterials();
        } catch { alert('Error saving material'); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this content?")) {
            try {
                await api.delete(`/education/${id}`);
                fetchMaterials();
            } catch (error) { console.error(error); }
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
                    <div className={styles.loadingState}><RefreshCw className={styles.spinner} /> Loading...</div>
                ) : (
                    <div className={styles.grid}>
                        {filteredMaterials.map((item) => (
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
