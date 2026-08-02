import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';

const useLgus = () => {
  const [lgus, setLgus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchLgus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/lgus');
      setLgus(response.data || []);
      setError(null);
    } catch (err) {
      setError(err);
      showToast('Error fetching LGU data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLgus();
  }, [fetchLgus]);
  
  const addLgu = async (lguData) => {
    try {
        await apiClient.post('/lgus', lguData);
        showToast('LGU created successfully', 'success');
        fetchLgus();
        return true;
    } catch (err) {
        const errorMessage = err.response?.data?.message || 'Error creating LGU';
        showToast(errorMessage, 'error');
        return false;
    }
  };

  const updateLgu = async (id, lguData) => {
    try {
        await apiClient.put(`/lgus/${id}`, lguData);
        showToast('LGU updated successfully', 'success');
        fetchLgus();
        return true;
    } catch (err) {
        const errorMessage = err.response?.data?.message || 'Error updating LGU';
        showToast(errorMessage, 'error');
        return false;
    }
  };

  const deleteLgu = async (id) => {
    try {
        await apiClient.delete(`/lgus/${id}`);
        showToast('LGU deleted successfully', 'success');
        fetchLgus();
        return true;
    } catch (err) {
        const errorMessage = err.response?.data?.message || 'Error deleting LGU';
        showToast(errorMessage, 'error');
        return false;
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

  const filteredLgus = lgus.filter(lgu => {
    const search = debouncedSearchTerm.toLowerCase();
    const matchesSearch = lgu.name?.toLowerCase().includes(search) || 
                          lgu.contactPerson?.toLowerCase().includes(search) || 
                          lgu.email?.toLowerCase().includes(search);
    const matchesStatus = statusFilter ? lgu.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const { 
    currentData: paginatedLgus, 
    currentPage, 
    totalPages, 
    setPage 
  } = usePagination(filteredLgus, 10);

  return { 
    lgus,
    isLoading, error, 
    paginatedLgus,
    addLgu, updateLgu, deleteLgu, 
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    handleClearFilters,
    currentPage, totalPages, setPage
  };
};

export default useLgus;
