import api from './api.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const authApi = {
  // Register new user
  signup: async (username, email, password) => {
    const response = await api.post(`${API_URL}/api/auth/signup`, {
      username,
      email,
      password
    });
    return response.data;
  },

  // Login existing user
  login: async (email, password) => {
    const response = await api.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await api.post(`${API_URL}/api/auth/logout`);
    return response.data;
  },

  // Get current user (requires auth)
  getMe: async () => {
    const response = await api.get(`${API_URL}/api/auth/me`);
    return response.data;
  },

  // Check if authenticated (no error if not)
  checkAuth: async () => {
    try {
      const response = await api.get(`${API_URL}/api/auth/check`);
      return response.data;
    } catch {
      return { authenticated: false };
    }
  }
};
