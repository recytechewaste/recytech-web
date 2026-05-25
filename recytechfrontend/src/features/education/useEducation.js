import { useState, useEffect } from 'react';
import api from '../../api/client';

export const useEducation = () => {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const fetchMaterials = async () => {
        setLoading(true);
        setFetchError(null);
        try {
            const res = await api.get('/education');
            setMaterials(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error fetching materials", error);
            setFetchError("Unable to connect to the server. Please ensure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const filteredMaterials = materials.filter(m => 
        m?.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (categoryFilter === '' || m?.category === categoryFilter)
    );

    return {
        materials, filteredMaterials, loading, fetchError, fetchMaterials,
        searchTerm, setSearchTerm, categoryFilter, setCategoryFilter
    };
};