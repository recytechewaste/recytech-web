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
    const [nameSort, setNameSort] = useState('');
    const [error, setError] = useState(null);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const { showToast } = useToast();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/users'); 
            setUsers(response.data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
            setError("Failed to fetch users");
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
        setNameSort('');
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

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        if (!nameSort) return 0;
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim().toLowerCase();
        if (nameSort === 'asc') return nameA.localeCompare(nameB);
        if (nameSort === 'desc') return nameB.localeCompare(nameA);
        return 0;
    });

    const { currentData: paginatedUsers, currentPage, totalPages, setPage } = usePagination(sortedUsers, 10);

    return {
        loading, paginatedUsers, error,
        addUser, updateUser, deleteUser,
        searchTerm, setSearchTerm, roleFilter, setRoleFilter, statusFilter, setStatusFilter,
        nameSort, setNameSort,
        handleClearFilters,
        currentPage, totalPages, setPage
    };
};
