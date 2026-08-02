import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '../styles/Pagination.module.css';

const Pagination = ({ currentPage, totalPages, onPageChange, totalCount }) => {
    if (totalPages <= 1) return null;

    return (
        <div className={styles.paginationContainer}>
            <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages || 1} {totalCount ? `(${totalCount} total)` : ''}
            </span>
            <div className={styles.controls}>
                <button 
                    onClick={() => onPageChange(currentPage - 1)} 
                    disabled={currentPage <= 1}
                    className={styles.arrowButton}
                >
                    <ChevronLeft size={16} style={{ marginRight: '0.25rem' }} /> Previous
                </button>
                
                <button 
                    onClick={() => onPageChange(currentPage + 1)} 
                    disabled={currentPage >= totalPages}
                    className={styles.arrowButton}
                >
                    Next <ChevronRight size={16} style={{ marginLeft: '0.25rem' }} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;