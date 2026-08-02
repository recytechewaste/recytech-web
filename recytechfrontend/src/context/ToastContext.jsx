import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        console.warn("useToast must be used within a ToastProvider");
        return { showToast: () => {}, addToast: () => {} };
    }
    return context;
};

// A single toast item that handles its own enter/exit animation
const ToastItem = ({ toast, onDismiss }) => {
    const [exiting, setExiting] = useState(false);
    const timerRef = useRef(null);

    const dismiss = useCallback(() => {
        setExiting(true);
        // Wait for the slide-out animation to finish before removing from DOM
        setTimeout(() => onDismiss(), 320);
    }, [onDismiss]);

    useEffect(() => {
        timerRef.current = setTimeout(dismiss, 3000);
        return () => clearTimeout(timerRef.current);
    }, [dismiss]);

    const isSuccess = toast.type === 'success';

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: isSuccess ? '#def7ec' : '#fef2f2',
            color: isSuccess ? '#065f46' : '#991b1b',
            padding: '14px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 10000,
            border: `1px solid ${isSuccess ? '#a7f3d0' : '#fecaca'}`,
            minWidth: '280px',
            maxWidth: '400px',
            fontFamily: "'Inter', sans-serif",
            animation: exiting
                ? 'toastSlideOut 0.32s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                : 'toastSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}>
            <span style={{ flexShrink: 0 }}>
                {isSuccess ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            </span>
            <span style={{ fontWeight: 500, fontSize: '14px', lineHeight: 1.4, flex: 1 }}>
                {toast.message}
            </span>
            <button
                onClick={dismiss}
                style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    opacity: 0.6,
                    flexShrink: 0,
                    borderRadius: '4px',
                    transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
            >
                <X size={15} />
            </button>

            <style>{`
                @keyframes toastSlideIn {
                    from { transform: translateX(calc(100% + 24px)); opacity: 0; }
                    to   { transform: translateX(0); opacity: 1; }
                }
                @keyframes toastSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to   { transform: translateX(calc(100% + 24px)); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState(null);
    // Give each toast a unique key so React re-mounts on rapid fire calls
    const [toastKey, setToastKey] = useState(0);

    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setToastKey(k => k + 1);
    }, []);

    const handleDismiss = useCallback(() => {
        setToast(null);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, addToast: showToast }}>
            {children}
            {toast && (
                <ToastItem key={toastKey} toast={toast} onDismiss={handleDismiss} />
            )}
        </ToastContext.Provider>
    );
};