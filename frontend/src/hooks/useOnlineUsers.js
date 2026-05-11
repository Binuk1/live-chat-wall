// hooks/useOnlineUsers.js — Online User Count State
// Separate from typing indicators for clarity
import { useState, useEffect } from 'react';
import { getSocket } from '../services/socket.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Hook for tracking online user count
 * 
 * @returns {Object} { onlineCount }
 */
export const useOnlineUsers = () => {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    // Fetch initial count via API (in case socket connects after we mount)
    const fetchInitialCount = async () => {
      try {
        const response = await fetch(`${API_URL}/api/online-count`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setOnlineCount(data.count);
        }
      } catch (error) {
        console.log('Failed to fetch initial count:', error.message);
      }
    };
    
    fetchInitialCount();

    const socket = getSocket();
    if (!socket) return;

    const handleOnlineCount = (count) => {
      setOnlineCount(count);
    };

    socket.on('online_count', handleOnlineCount);

    // Cleanup
    return () => {
      socket.off('online_count', handleOnlineCount);
    };
  }, []);

  return { onlineCount };
};

export default useOnlineUsers;
