import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    withCredentials: true
});

api.interceptors.request.use((config) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    // We no longer need to manually attach the token to the header 
    // because withCredentials automatically sends the secure HTTP-Only cookie!

    return config;
});

export default api;
