import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';

const usePartnerOrgs = (enabled = true) => {
  const [partnerOrgs, setPartnerOrgs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const requestWithFallback = async (method, path, data = null) => {
    const primaryPath = `/partner-organizations${path}`;
    const fallbackPath = `/lgus${path}`;

    try {
      if (method === 'get') return await apiClient.get(primaryPath);
      if (method === 'post') return await apiClient.post(primaryPath, data);
      if (method === 'put') return await apiClient.put(primaryPath, data);
      if (method === 'delete') return await apiClient.delete(primaryPath);
    } catch (err) {
      if (err.response && (err.response.status === 404 || err.response.status === 405)) {
        if (method === 'get') return await apiClient.get(fallbackPath);
        if (method === 'post') return await apiClient.post(fallbackPath, data);
        if (method === 'put') return await apiClient.put(fallbackPath, data);
        if (method === 'delete') return await apiClient.delete(fallbackPath);
      }
      throw err;
    }
  };

  const fetchPartnerOrgs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await requestWithFallback('get', '');
      setPartnerOrgs(response.data || []);
      setError(null);
    } catch (err) {
      setError(err);
      showToast('Error fetching partner organization data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (enabled) {
      fetchPartnerOrgs();
    } else {
      setIsLoading(false);
    }
  }, [fetchPartnerOrgs, enabled]);
  
  const addPartnerOrg = async (orgData) => {
    try {
        await requestWithFallback('post', '', orgData);
        showToast('Partner organization created successfully', 'success');
        fetchPartnerOrgs();
        return true;
    } catch (err) {
        const errorMessage = err.response?.data?.message || 'Error creating partner organization';
        showToast(errorMessage, 'error');
        return false;
    }
  };

  const updatePartnerOrg = async (id, orgData) => {
    try {
        await requestWithFallback('put', `/${id}`, orgData);
        showToast('Partner organization updated successfully', 'success');
        fetchPartnerOrgs();
        return true;
    } catch (err) {
        const errorMessage = err.response?.data?.message || 'Error updating partner organization';
        showToast(errorMessage, 'error');
        return false;
    }
  };

  const deletePartnerOrg = async (id) => {
    try {
        await requestWithFallback('delete', `/${id}`);
        showToast('Partner organization deactivated successfully', 'success');
        fetchPartnerOrgs();
        return true;
    } catch (err) {
        const errorMessage = err.response?.data?.message || 'Error deactivating partner organization';
        showToast(errorMessage, 'error');
        return false;
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

  const filteredOrgs = partnerOrgs.filter(org => {
    const search = debouncedSearchTerm.toLowerCase();
    const matchesSearch = org.name?.toLowerCase().includes(search) || 
                          org.contactPerson?.toLowerCase().includes(search) || 
                          org.email?.toLowerCase().includes(search);
    const matchesStatus = statusFilter ? org.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const { 
    currentData: paginatedPartnerOrgs, 
    currentPage, 
    totalPages, 
    setPage 
  } = usePagination(filteredOrgs, 10);

  return { 
    partnerOrgs,
    lgus: partnerOrgs,
    isLoading, error, 
    paginatedPartnerOrgs,
    paginatedLgus: paginatedPartnerOrgs,
    addPartnerOrg, updatePartnerOrg, deletePartnerOrg,
    addLgu: addPartnerOrg, updateLgu: updatePartnerOrg, deleteLgu: deletePartnerOrg,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    handleClearFilters,
    currentPage, totalPages, setPage
  };
};

export default usePartnerOrgs;
export { usePartnerOrgs as useLgus };
