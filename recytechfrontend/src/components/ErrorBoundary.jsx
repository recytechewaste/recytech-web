import React from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '24px', backgroundColor: '#fef2f2', color: '#991b1b', borderRadius: '12px', border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '200px', marginTop: '16px' }}>
                    <AlertCircle size={40} style={{ marginBottom: '12px', color: '#ef4444' }} />
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Component Render Error</h3>
                    <p style={{ margin: 0, fontSize: '14px', color: '#b91c1c' }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;