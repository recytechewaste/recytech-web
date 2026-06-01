import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const { page, limit, pages, total, goToPage, updatePaginationInfo, hasNextPage, hasPrevPage } = usePagination(1, 10);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
            
            if (!userInfo || !userInfo._id) {
                setLoading(false);
                return; 
            }

            const response = await api.get('/users'); 
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user => {
        const search = debouncedSearchTerm.toLowerCase();
        const matchesSearch = user.firstName?.toLowerCase().includes(search) || 
                              user.lastName?.toLowerCase().includes(search) || 
                              user.email?.toLowerCase().includes(search);
        const matchesRole = roleFilter ? user.role === roleFilter : true;
        const matchesStatus = statusFilter ? user.status === statusFilter : true;
        return matchesSearch && matchesRole && matchesStatus;
    });

    useEffect(() => {
        updatePaginationInfo({
            total: filteredUsers.length,
            pages: Math.ceil(filteredUsers.length / limit) || 1
        });
    }, [filteredUsers.length, limit, updatePaginationInfo]);

    const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit);

    return {
        users, loading, filteredUsers, paginatedUsers, fetchUsers,
        searchTerm, setSearchTerm, roleFilter, setRoleFilter, statusFilter, setStatusFilter,
        page, limit, pages, total, goToPage, hasNextPage, hasPrevPage
    };
};