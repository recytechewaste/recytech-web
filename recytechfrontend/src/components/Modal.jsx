import { useEffect, useRef } from 'react';
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
    const bodyRef = useRef(null);

    // Prevent background scroll while open and reset scroll to top
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'; 
            if (bodyRef.current) {
                bodyRef.current.scrollTop = 0;
            }
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
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
                <div ref={bodyRef} className={styles.body}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;