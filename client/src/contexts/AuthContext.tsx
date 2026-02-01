import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, login as apiLogin, register as apiRegister, logout as apiLogout } from '../services/api';

// ===================================================================
// Auth Context Type
// ===================================================================

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

// Create context with undefined default
// WHY: Force usage within Provider, throw error if used outside
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===================================================================
// Auth Provider Component
// ===================================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Initialize auth state from localStorage on mount
    // WHY: Persist login across page reloads
    useEffect(() => {
        const initAuth = () => {
            try {
                const storedToken = localStorage.getItem('token');
                const storedUser = localStorage.getItem('user');

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Error loading auth state:', error);
                // Clear invalid data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    /**
     * Login function
     * WHY: Wrap API call với state updates
     */
    const login = async (email: string, password: string) => {
        try {
            const response = await apiLogin({ email, password });

            setUser(response.data.user);
            setToken(response.data.token);
        } catch (error: any) {
            // Re-throw để Login component handle error message
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    };

    /**
     * Register function
     */
    const register = async (username: string, email: string, password: string) => {
        try {
            const response = await apiRegister({ username, email, password });

            setUser(response.data.user);
            setToken(response.data.token);
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    };

    /**
     * Logout function
     */
    const logout = () => {
        setUser(null);
        setToken(null);
        apiLogout();
    };

    // Context value
    const value: AuthContextType = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ===================================================================
// useAuth Hook
// ===================================================================

/**
 * Hook to use auth context
 * WHY: Cleaner syntax, auto error if used outside Provider
 * 
 * Usage:
 * const { user, login, logout, isAuthenticated } = useAuth();
 */
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
};
