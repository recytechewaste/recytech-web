import { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from '../styles/Modal.module.css';

const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    maxWidth = '500px',
    hideCloseButton = false
}) => {
    // Prevent background scroll while open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'; 
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div
                className={styles.panel}
                style={{ maxWidth }}
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <div className={styles.header}>
                        <h2 className={styles.title}>{title}</h2>
                        {!hideCloseButton && (
                            <button onClick={onClose} className={styles.closeBtn} aria-label="Close modal">
                                <X size={18} />
                            </button>
                        )}
                    </div>
                )}
                <div className={styles.body}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;