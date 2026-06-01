import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        console.warn("useToast must be used within a ToastProvider");
        return { showToast: () => {} };
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3000); // Automatically dismiss after 3 seconds
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    backgroundColor: toast.type === 'success' ? '#def7ec' : '#fef2f2',
                    color: toast.type === 'success' ? '#065f46' : '#991b1b',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    zIndex: 10000,
                    border: `1px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`,
                    animation: 'slideIn 0.3s ease-out forwards'
                }}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span style={{ fontWeight: 500, fontSize: '14px' }}>{toast.message}</span>
                    <button 
                        onClick={() => setToast(null)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center', marginLeft: '12px', padding: '4px' }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
            <style>
                {`
                @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                `}
            </style>
        </ToastContext.Provider>
    );
};