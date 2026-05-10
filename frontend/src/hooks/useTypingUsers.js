// hooks/useTypingUsers.js — Typing Indicators State
// Separate from online count for clarity
import { useState, useEffect } from 'react';
import { getSocket } from '../services/socket.js';

/**
 * Hook for tracking who is currently typing
 * 
 * @returns {Object} { typingUsers }
 */
export const useTypingUsers = () => {
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    console.log('⌨️ Setting up typing indicator socket listeners');

    const handleUserTyping = ({ username, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping && !prev.includes(username)) {
          return [...prev, username];
        } else if (!isTyping) {
          return prev.filter((name) => name !== username);
        }
        return prev;
      });
    };

    socket.on('user_typing', handleUserTyping);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up typing indicator listeners');
      socket.off('user_typing', handleUserTyping);
    };
  }, []);

  return { typingUsers };
};

export default useTypingUsers;
