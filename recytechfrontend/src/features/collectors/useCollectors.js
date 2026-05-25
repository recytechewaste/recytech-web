import { useState, useEffect } from 'react';
import api from '../../api/client';

export const useCollectors = () => {
    const [collectors, setCollectors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState('');

    const fetchCollectors = async () => {
        try {
            const { data } = await api.get('/collectors');
            setCollectors(data);
        } catch (error) {
            console.error("Error fetching collectors", error);
        }
    };

    useEffect(() => {
        fetchCollectors();
    }, []);

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setVehicleTypeFilter('');
    };

    const filteredCollectors = collectors.filter(c => {
        const matchesSearch = c.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             c.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             c.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter ? c.status === statusFilter : true;
        const matchesVehicleType = vehicleTypeFilter ? c.vehicleType === vehicleTypeFilter : true;
        return matchesSearch && matchesStatus && matchesVehicleType;
    });

    return {
        collectors, filteredCollectors, fetchCollectors,
        searchTerm, setSearchTerm,
        statusFilter, setStatusFilter,
        vehicleTypeFilter, setVehicleTypeFilter,
        handleClearFilters
    };
};