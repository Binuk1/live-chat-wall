// hooks/useUsername.js — Username State with localStorage
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'chat_username';

/**
 * Hook for managing username with localStorage persistence
 * 
 * @returns {Object} { username, setUsername, showNamePrompt, joinChat, changeName }
 */
export const useUsername = () => {
  const [username, setUsername] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUsername(stored);
      setShowNamePrompt(false);
    }
  }, []);

  /**
   * Join chat with current username
   */
  const joinChat = useCallback(() => {
    const finalName = username.trim() || 'Anonymous';
    setUsername(finalName);
    localStorage.setItem(STORAGE_KEY, finalName);
    setShowNamePrompt(false);
    return finalName;
  }, [username]);

  /**
   * Show name prompt to change username
   */
  const changeName = useCallback(() => {
    setShowNamePrompt(true);
  }, []);

  /**
   * Update username value (for input field)
   */
  const updateUsername = useCallback((value) => {
    setUsername(value);
  }, []);

  return {
    username,
    showNamePrompt,
    setUsername: updateUsername,
    joinChat,
    changeName,
  };
};

export default useUsername;
