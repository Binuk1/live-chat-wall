import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/auth.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.checkAuth();
        if (response.authenticated) {
          setUser(response.user);
        }
      } catch (error) {
        console.log('Auth check failed:', error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authApi.login(email, password);
    setUser(response.user);
    return response;
  }, []);

  const signup = useCallback(async (username, email, password) => {
    const response = await authApi.signup(username, email, password);
    setUser(response.user);
    return response;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
