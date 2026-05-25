import { useState, useEffect } from 'react';
import { Save, X, Upload } from 'lucide-react';
import styles from '../../styles/EducationManager.module.css';

const CATEGORIES = ["Sustainability", "E-Waste Disposal", "Environmental Impact", "Regulations"];

const EducationFormModal = ({ isOpen, isEditing, initialData, initialImage, onClose, onSubmit }) => {
    const [formData, setFormData] = useState(initialData);
    const [imagePreview, setImagePreview] = useState(initialImage);

    useEffect(() => {
        setFormData(initialData);
        setImagePreview(initialImage);
    }, [initialData, initialImage, isOpen]);

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) return alert("Title is required");
        
        if (formData.contentURL && !formData.contentURL.startsWith('http')) {
            return alert("Please enter a valid URL starting with http:// or https://");
        }

        onSubmit({ ...formData, thumbnail: imagePreview });
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{isEditing ? 'Edit Content' : 'New Educational Material'}</h2>
                    <button onClick={onClose} className={styles.closeBtn}><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Title</label>
                        <input required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Thumbnail</label>
                        <div className={styles.imageUploadArea}>
                            {imagePreview ? (
                                <div className={styles.previewContainer}>
                                    <img src={imagePreview} className={styles.imagePreview} alt="Preview" />
                                    <button type="button" onClick={() => setImagePreview(null)} className={styles.removeImgBtn}><X size={14} /></button>
                                </div>
                            ) : (
                                <label className={styles.uploadPlaceholder}>
                                    <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                                    <Upload size={24} /> <span>Click to upload image</span>
                                </label>
                            )}
                        </div>
                    </div>
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label>Category</label>
                            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className={styles.input}>
                                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Format</label>
                            <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className={styles.input}>
                                <option value="Article">Article</option>
                                <option value="Video">Video</option>
                                <option value="PDF">PDF</option>
                            </select>
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className={styles.textarea} />
                    </div>
                    <div className={styles.formGroup}>
                        <label>External URL</label>
                        <input value={formData.contentURL} onChange={(e) => setFormData({...formData, contentURL: e.target.value})} className={styles.input} placeholder="https://..." />
                    </div>
                    <div className={styles.modalFooter}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
                        <button type="submit" className={styles.submitBtn}><Save size={16} /> Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EducationFormModal;