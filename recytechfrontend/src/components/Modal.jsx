import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    maxWidth = '500px',
    hideCloseButton = false
}) => {
    // QoL: Close modal when pressing the Escape key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            // Prevent background scrolling when modal is open
            document.body.style.overflow = 'hidden'; 
        }
        
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1rem',
                backdropFilter: 'blur(4px)'
            }} 
            onClick={onClose} // QoL: Click overlay to close
        >
            <div 
                style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '0.75rem',
                    width: '100%',
                    maxWidth: maxWidth,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh',
                    overflow: 'hidden'
                }} 
                onClick={(e) => e.stopPropagation()} // Prevent overlay click from triggering inside the modal
            >
                {/* Standard Header */}
                {title && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid #e5e7eb'
                    }}>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
                            {title}
                        </h2>
                        {!hideCloseButton && (
                            <button 
                                onClick={onClose}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}
                
                {/* Modal Content */}
                <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;