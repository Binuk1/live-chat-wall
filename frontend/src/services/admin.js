// services/admin.js — Admin API functions
import api from './api.js';

/**
 * Get system statistics
 * @returns {Promise<{users: number, messages: number, online: number, banned: number}>}
 */
export const getStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

/**
 * Get all users for admin management
 * @returns {Promise<{users: Array}>}
 */
export const getAllUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

/**
 * Change user role
 * @param {string} userId
 * @param {'user'|'moderator'|'admin'} role
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const changeUserRole = async (userId, role) => {
  const response = await api.post(`/admin/users/${userId}/role`, { role });
  return response.data;
};

/**
 * Delete user account
 * @param {string} userId
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

/**
 * Get all messages for moderation
 * @returns {Promise<{messages: Array}>}
 */
export const getAllMessages = async () => {
  const response = await api.get('/admin/messages');
  return response.data;
};

/**
 * Delete a message as admin
 * @param {string} messageId
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteMessage = async (messageId) => {
  const response = await api.delete(`/admin/messages/${messageId}`);
  return response.data;
};
