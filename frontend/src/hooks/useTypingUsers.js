// hooks/useTypingUsers.js — Typing Indicators State
// Separate from online count for clarity
import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../services/socket.js';

/**
 * Hook for tracking who is currently typing
 * 
 * @returns {Object} { typingUsers }
 */
export const useTypingUsers = () => {
  const [typingUsers, setTypingUsers] = useState([]);
  const listenersSetup = useRef(false);

  useEffect(() => {
    // Prevent duplicate listener setup
    if (listenersSetup.current) return;
    
    const socket = getSocket();
    if (!socket) return;

    console.log('⌨️ Setting up typing indicator socket listeners');
    listenersSetup.current = true;

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
      listenersSetup.current = false;
    };
  }, []);

  return { typingUsers };
};

export default useTypingUsers;
