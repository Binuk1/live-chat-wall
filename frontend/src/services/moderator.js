// services/moderator.js — Moderator API functions
import api from './api.js';

/**
 * Delete a message
 * @param {string} messageId
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteMessage = async (messageId) => {
  const response = await api.delete(`/moderator/messages/${messageId}`);
  return response.data;
};

/**
 * Ban a user temporarily
 * @param {string} userId
 * @param {'1h'|'24h'|'7d'} duration
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const banUser = async (userId, duration) => {
  const response = await api.post('/moderator/ban', { userId, duration });
  return response.data;
};

/**
 * Unban a user
 * @param {string} userId
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const unbanUser = async (userId) => {
  const response = await api.post('/moderator/unban', { userId });
  return response.data;
};
