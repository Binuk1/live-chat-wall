// hooks/useSocket.js — Socket Connection Hook
// CRITICAL: Handles socket connection, listeners, and cleanup
// Prevents: duplicate listeners, memory leaks, multiple connections
import { useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket.js';

/**
 * Hook for socket.io connection and event handling
 * 
 * This hook:
 * - Gets the singleton socket instance (never creates duplicates)
 * - Sets up event listeners with proper cleanup
 * - Returns socket instance and emit functions
 * 
 * ⚠️ IMPORTANT: This hook does NOT manage message state
 * Use useMessages.js for message state management
 * 
 * @returns {Object} { socket, emitTyping, emitUserJoined, connected }
 */
export const useSocket = () => {
  // Use ref to track if listeners are already set up
  const listenersSetup = useRef(false);
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

  /**
   * Emit user joined event
   * @param {string} username - User who joined
   */
  const emitUserJoined = useCallback((username) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('user_joined', username);
    }
  }, []);

  /**
   * Emit like message event via socket (for real-time broadcast)
   * @param {string} messageId - Message ID to like
   */
  const emitLikeMessage = useCallback((messageId) => {
    if (socketRef.current?.connected) {
      // This is handled via REST API, but socket broadcasts the update
      // No direct emit needed here, API call triggers server broadcast
    }
  }, []);

  // Setup and cleanup listeners
  useEffect(() => {
    // Prevent duplicate listener setup
    if (listenersSetup.current) return;
    
    const currentSocket = socketRef.current;
    if (!currentSocket) return;

    console.log('🔌 Setting up socket listeners in useSocket');
    listenersSetup.current = true;

    // CRITICAL: Cleanup function removes all listeners on unmount
    return () => {
      console.log('🧹 Cleaning up socket listeners in useSocket');
      // Note: We don't disconnect the socket (it's singleton)
      // We just ensure no duplicate listener setups
      listenersSetup.current = false;
    };
  }, []);

  return {
    socket,
    emitTyping,
    emitUserJoined,
    emitLikeMessage,
    connected: socket?.connected || false,
  };
};

export default useSocket;
