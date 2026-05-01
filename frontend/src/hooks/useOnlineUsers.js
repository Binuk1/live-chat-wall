// hooks/useOnlineUsers.js — Online User Count State
// Separate from typing indicators for clarity
import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../services/socket.js';

/**
 * Hook for tracking online user count
 * 
 * @returns {Object} { onlineCount }
 */
export const useOnlineUsers = () => {
  const [onlineCount, setOnlineCount] = useState(0);
  const listenersSetup = useRef(false);

  useEffect(() => {
    // Prevent duplicate listener setup
    if (listenersSetup.current) return;
    
    const socket = getSocket();
    if (!socket) return;

    console.log('👥 Setting up online count socket listeners');
    listenersSetup.current = true;

    const handleOnlineCount = (count) => {
      setOnlineCount(count);
    };

    socket.on('online_count', handleOnlineCount);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up online count listeners');
      socket.off('online_count', handleOnlineCount);
      listenersSetup.current = false;
    };
  }, []);

  return { onlineCount };
};

export default useOnlineUsers;
