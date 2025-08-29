// File: src/AuthProvider.jsx

import React, { useState, createContext, useEffect } from 'react';
import api from './api';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('accessToken'));
    
    // State for user's profile (username, balance)
    const [user, setUser] = useState({
        username: '',
        balance: null,
    });
    
    // Separate states for related financial data
    const [exposure, setExposure] = useState(0);
    const [transactions, setTransactions] = useState([]);

    // This single function now fetches ALL user-related data
    const fetchUserData = async () => {
        if (!localStorage.getItem('accessToken')) return;
        try {
            // Use Promise.all to fetch everything concurrently for better performance
            const [profileRes, exposureRes, historyRes] = await Promise.all([
                api.get('/user-profile/'),
                api.get('/user-exposure/'),
                api.get('/transaction-history/')
            ]);
            
            // Set the state for each piece of data
            setUser(profileRes.data);
            setExposure(exposureRes.data.exposure);
            setTransactions(historyRes.data);
            setIsLoggedIn(true);
        } catch (error) {
            console.error("Failed to fetch user data:", error);
            // If any request fails, log the user out and reset all data
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setIsLoggedIn(false);
            setUser({ username: '', balance: null });
            setExposure(0);
            setTransactions([]);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchUserData();
        }
    }, [isLoggedIn]);

    // Provide all data and the master refresh function to other components
    const contextValue = {
        isLoggedIn,
        setIsLoggedIn,
        user,
        exposure,
        transactions,
        fetchUserData
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;
export { AuthContext };
