import { AlertTriangle } from 'lucide-react';

/**
 * ErrorState — shown when a data fetch fails.
 *
 * Props:
 *   message   - the error message to display
 *   onRetry   - optional retry callback; renders a "Try Again" button if provided
 */
const ErrorState = ({ message = 'Something went wrong. Please try again.', onRetry = null }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        gap: '12px',
        textAlign: 'center',
    }}>
        <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
        }}>
            <AlertTriangle size={28} strokeWidth={1.5} style={{ color: '#ef4444' }} />
        </div>

        <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 700,
            color: '#111827',
            fontFamily: "'Inter', sans-serif",
        }}>
            Failed to load data
        </h3>

        <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#6b7280',
            maxWidth: '360px',
            lineHeight: 1.5,
            fontFamily: "'Inter', sans-serif",
        }}>
            {message}
        </p>

        {onRetry && (
            <button
                onClick={onRetry}
                style={{
                    marginTop: '8px',
                    padding: '10px 20px',
                    background: 'white',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: "'Inter', sans-serif",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#059669'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151'; }}
            >
                Try Again
            </button>
        )}
    </div>
);

export default ErrorState;
