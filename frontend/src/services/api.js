// services/api.js — API Service Layer
// All HTTP requests centralized here
import axios from 'axios';

// Remove trailing slash if present to prevent double slashes
const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = RAW_API_URL.replace(/\/$/, '');

// Axios instance with credentials enabled (for HTTP-only cookies)
const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // CRITICAL: sends cookies with every request
  headers: {
    'Content-Type': 'application/json'
  }
});

// Handle ban errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.error === 'Account banned') {
      const bannedUntil = encodeURIComponent(error.response.data.bannedUntil);
      window.location.href = `/banned?until=${bannedUntil}`;
    }
    return Promise.reject(error);
  }
);

/**
 * Wrapper for API responses
 * Always returns { data, error } to prevent uncaught throws
 */

/**
 * Fetch all messages
 * @returns {Promise<{data: Array|null, error: string|null}>}
 */
export const getMessages = async () => {
  try {
    const response = await api.get('/messages');
    return { data: response.data, error: null };
  } catch (err) {
    console.error('API Error - getMessages:', err.message);
    return { data: null, error: err.message };
  }
};

/**
 * Send a new message
 * @param {Object} messageData - { username, text }
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export const sendMessage = async (messageData) => {
  try {
    const response = await api.post('/messages', messageData);
    return { data: response.data, error: null };
  } catch (err) {
    console.error('API Error - sendMessage:', err.message);
    return { data: null, error: err.message };
  }
};

/**
 * Like a message
 * @param {string} messageId - The message ID to like
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const likeMessage = async (messageId) => {
  try {
    await api.post(`/messages/${messageId}/like`);
    return { success: true, error: null };
  } catch (err) {
    console.error('API Error - likeMessage:', err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Get online user count (REST fallback)
 * @returns {Promise<{count: number|null, error: string|null}>}
 */
export const getOnlineCount = async () => {
  try {
    const response = await api.get('/online-count');
    return { count: response.data.count, error: null };
  } catch (err) {
    console.error('API Error - getOnlineCount:', err.message);
    return { count: null, error: err.message };
  }
};

export default api;
