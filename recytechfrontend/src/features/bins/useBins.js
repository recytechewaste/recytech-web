import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';

export const useBins = () => {
    const [bins, setBins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { showToast } = useToast();

    const fetchBins = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/bin-locations');
            setBins(response.data || []);
            setError(null);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to load bin data.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
            console.error('Error loading bin network data:', err);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchBins();
    }, [fetchBins]);

    const addBin = async (binData) => {
        try {
            await api.post('/bin-locations', binData);
            showToast('Bin created successfully', 'success');
            await fetchBins();
            return true;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to create bin.';
            showToast(errorMessage, 'error');
            console.error('Error creating bin:', err);
            return false;
        }
    };

    const updateBin = async (id, binData) => {
        try {
            await api.put(`/bin-locations/${id}`, binData);
            showToast('Bin updated successfully', 'success');
            await fetchBins();
            return true;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update bin.';
            showToast(errorMessage, 'error');
            console.error('Error updating bin:', err);
            return false;
        }
    };

    const deleteBin = async (id) => {
        try {
            await api.delete(`/bin-locations/${id}`);
            showToast('Bin deleted successfully', 'success');
            // Optimistically update UI or refetch
            setBins((prevBins) => prevBins.filter((bin) => bin._id !== id));
            return true;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to delete bin.';
            showToast(errorMessage, 'error');
            console.error('Error deleting bin:', err);
            return false;
        }
    };

    return {
        bins,
        loading,
        error,
        fetchBins,
        addBin,
        updateBin,
        deleteBin,
    };
};
