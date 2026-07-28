import React from 'react';

const Skeleton = ({ width = '100%', height = '20px', borderRadius = '6px', style = {} }) => {
    return (
        <>
            <div 
                style={{
                    width,
                    height,
                    borderRadius,
                    backgroundColor: '#e5e7eb',
                    animation: 'skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    ...style
                }}
            />
            <style>
                {`
                @keyframes skeleton-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .4; }
                }
                `}
            </style>
        </>
    );
};

// Pre-built skeleton layout specifically for Dashboard Metric Cards
export const MetricSkeleton = ({ count = 1 }) => (
    <>
        {Array.from({ length: count }).map((_, index) => (
            <div key={index} style={{
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.05)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Skeleton width="40%" height="16px" style={{ marginBottom: '16px' }} />
                <Skeleton width="60%" height="36px" style={{ marginBottom: '12px' }} />
                <Skeleton width="25%" height="14px" />
            </div>
        ))}
    </>
);

export default Skeleton;