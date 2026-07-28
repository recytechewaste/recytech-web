import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import { useToast } from '../../context/ToastContext';

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const { showToast } = useToast();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/users'); 
            setUsers(response.data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
            showToast('Failed to fetch users.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const addUser = async (userData) => {
        try {
            await api.post('/users', userData);
            showToast('User created successfully.', 'success');
            await fetchUsers();
            return true;
        } catch (error) {
            showToast(error.response?.data?.message || "Creation failed", 'error');
            return false;
        }
    };

    const updateUser = async (userId, userData) => {
        try {
            await api.put(`/users/${userId}`, userData);
            showToast('User updated successfully.', 'success');
            await fetchUsers();
            return true;
        } catch (error) {
            showToast(error.response?.data?.message || "Update failed", 'error');
            return false;
        }
    };

    const deleteUser = async (userId) => {
        try {
            await api.delete(`/users/${userId}`);
            showToast('User deleted successfully.', 'success');
            await fetchUsers();
            return true;
        } catch (error) {
            showToast(error.response?.data?.message || "Deletion failed", 'error');
            return false;
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setRoleFilter('');
        setStatusFilter('');
    };

    const filteredUsers = users.filter(user => {
        const search = debouncedSearchTerm.toLowerCase();
        const matchesSearch = user.firstName?.toLowerCase().includes(search) || 
                              user.lastName?.toLowerCase().includes(search) || 
                              user.email?.toLowerCase().includes(search);
        const matchesRole = roleFilter ? user.role === roleFilter : true;
        const matchesStatus = statusFilter ? user.status === statusFilter : true;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const { currentData: paginatedUsers, currentPage, totalPages, setPage } = usePagination(filteredUsers, 10);


    return {
        loading, paginatedUsers,
        addUser, updateUser, deleteUser,
        searchTerm, setSearchTerm, roleFilter, setRoleFilter, statusFilter, setStatusFilter,
        handleClearFilters,
        currentPage, totalPages, setPage
    };
};
