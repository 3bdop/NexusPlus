import { Navigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProtectedRoute = ({ children, requiredRole }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        role: null
    });

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('https://nexusplus-api.vercel.app/api/check-auth', {
                    withCredentials: true
                });
                setAuthState({
                    isAuthenticated: true,
                    role: response.data.role
                });
            } catch (error) {
                setAuthState({ isAuthenticated: false, role: null });
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);

    if (isLoading) return <></>;

    if (!authState.isAuthenticated) return <Navigate to="/" replace />;

    if (requiredRole && authState.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }
    return React.cloneElement(children, { role: authState.role });
};

export default ProtectedRoute;