import { useState, useEffect } from 'react';
import api from '../../api/client';

export const useExchangeRates = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/exchange-rates', { params: { includeInactive: true } });
            setRates(res.data.rates || []);
        } catch (error) {
            console.error("Error fetching exchange rates:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    return { rates, loading, fetchRates };
};