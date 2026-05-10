// hooks/useSocket.js — Socket Connection Hook
// CRITICAL: Handles socket connection and cleanup
// Prevents: memory leaks, multiple connections
import { useRef, useCallback } from 'react';
import { getSocket } from '../services/socket.js';

/**
 * Hook for socket.io connection and event handling
 * 
 * This hook:
 * - Gets the singleton socket instance (never creates duplicates)
 * - Returns socket instance and emit functions
 * 
 * ⚠️ IMPORTANT: This hook does NOT manage message state
 * Use useMessages.js for message state management
 * 
 * @returns {Object} { socket, emitTyping, connected }
 */
export const useSocket = () => {
  const socketRef = useRef(null);

  // Get singleton socket instance
  const socket = getSocket();
  socketRef.current = socket;

  /**
   * Emit typing indicator event
   * @param {string} username - User typing
   * @param {boolean} isTyping - Typing status
   */
  const emitTyping = useCallback((username, isTyping) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', { username, isTyping });
    }
  }, []);

  // Note: Socket listeners for messages are in useMessages hook
  // Online count listeners are in useOnlineUsers hook

  return {
    socket,
    emitTyping,
    connected: socket?.connected || false,
  };
};

export default useSocket;
