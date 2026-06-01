import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
    page, 
    pages, 
    total, 
    limit, 
    goToPage, 
    hasNextPage, 
    hasPrevPage 
}) => {
    // Don't render the pagination bar if there is no data to paginate
    if (!total || total === 0) return null;

    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '1rem 0', 
            borderTop: '1px solid #e5e7eb', 
            marginTop: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem'
        }}>
            {/* Results Indicator */}
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Showing <span style={{ fontWeight: 600, color: '#374151' }}>{startItem}</span> to <span style={{ fontWeight: 600, color: '#374151' }}>{endItem}</span> of <span style={{ fontWeight: 600, color: '#374151' }}>{total}</span> results
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button 
                    onClick={() => goToPage(page - 1)} 
                    disabled={!hasPrevPage}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '0.5rem 0.75rem', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '0.375rem', 
                        backgroundColor: !hasPrevPage ? '#f9fafb' : '#ffffff',
                        color: !hasPrevPage ? '#9ca3af' : '#374151',
                        cursor: !hasPrevPage ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <ChevronLeft size={16} style={{ marginRight: '0.25rem' }} /> Previous
                </button>
                
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', padding: '0 0.5rem' }}>
                    Page {page} of {pages || 1}
                </span>
                
                <button 
                    onClick={() => goToPage(page + 1)} 
                    disabled={!hasNextPage}
                    style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '0.5rem 0.75rem', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '0.375rem', 
                        backgroundColor: !hasNextPage ? '#f9fafb' : '#ffffff',
                        color: !hasNextPage ? '#9ca3af' : '#374151',
                        cursor: !hasNextPage ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Next <ChevronRight size={16} style={{ marginLeft: '0.25rem' }} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;