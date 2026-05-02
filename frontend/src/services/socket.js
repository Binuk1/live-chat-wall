// services/socket.js — Socket.io Singleton
// CRITICAL: Socket created ONCE only, never recreated on re-renders
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Module-level variable persists across renders
let socket = null;

/**
 * Get or create the singleton socket instance
 * @returns {Socket} The socket.io client instance
 */
export const getSocket = () => {
  if (!socket) {
    console.log('🔌 Creating socket connection...');
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true // CRITICAL: sends cookies with socket connection
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });
  }
  return socket;
};

/**
 * Disconnect and destroy the socket instance
 * Call this only on app shutdown (e.g., logout)
 */
export const disconnectSocket = () => {
  if (socket) {
    console.log('🔌 Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};

/**
 * Check if socket is currently connected
 * @returns {boolean}
 */
export const isSocketConnected = () => {
  return socket?.connected || false;
};

// Export the getter as default for convenience
export default getSocket;
