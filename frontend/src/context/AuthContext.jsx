import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/auth.js';
import { disconnectSocket } from '../services/socket.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.checkAuth();
        console.log('[Auth] Check response:', response);
        if (response.authenticated) {
          setUser(response.user);
        } else {
          console.log('[Auth] Not authenticated');
        }
      } catch (error) {
        console.error('[Auth] Check failed:', error.message);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authApi.login(email, password);
    setUser(response.user);
    // Reconnect socket to pick up new auth cookie
    await disconnectSocket();
    return response;
  }, []);

  const signup = useCallback(async (username, email, password) => {
    const response = await authApi.signup(username, email, password);
    setUser(response.user);
    // Reconnect socket to pick up new auth cookie
    await disconnectSocket();
    return response;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    // Disconnect socket to clean up connection
    await disconnectSocket();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      // API returns { authenticated: true, user: {...} }
      setUser(response.user || response);
    } catch (error) {
      console.log('Failed to refresh user:', error.message);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    signup,
    logout,
    refreshUser
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
