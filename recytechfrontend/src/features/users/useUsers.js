import { useState, useEffect } from 'react';
import api from '../../api/client';

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
            
            if (!userInfo || !userInfo.token) {
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
        const search = searchTerm.toLowerCase();
        const matchesSearch = user.firstName?.toLowerCase().includes(search) || 
                              user.lastName?.toLowerCase().includes(search) || 
                              user.email?.toLowerCase().includes(search);
        const matchesRole = roleFilter ? user.role === roleFilter : true;
        const matchesStatus = statusFilter ? user.status === statusFilter : true;
        return matchesSearch && matchesRole && matchesStatus;
    });

    return {
        users, loading, filteredUsers, fetchUsers,
        searchTerm, setSearchTerm, roleFilter, setRoleFilter, statusFilter, setStatusFilter
    };
};