// hooks/useMessages.js — Message State Management
// ⚠️ CRITICAL: ONLY this hook can modify messages state
// NO other file should import setMessages or mutate messages directly
// Violating this causes: UI desync bugs, duplicate messages, state chaos

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMessages, sendMessage as apiSendMessage, likeMessage as apiLikeMessage } from '../services/api.js';
import { getSocket } from '../services/socket.js';

/**
 * Hook for message state management
 * 
 * This is the SOLE OWNER of messages state.
 * - Fetches messages on mount
 * - Listens for socket events (new_message, message_liked)
 * - Provides methods: sendMessage, likeMessage
 * 
 * @returns {Object} { 
 *   messages, 
 *   loading, 
 *   error, 
 *   sendMessage, 
 *   likeMessage,
 *   refreshMessages 
 * }
 */
export const useMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const isSendingRef = useRef(false);

  /**
   * Fetch messages from API
   */
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await getMessages();
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setMessages(data || []);
    }
    
    setLoading(false);
  }, []);

  /**
   * Send a new message
   * @param {string} username - Sender username
   * @param {string} text - Message text
   */
  const sendMessage = useCallback(async (username, text) => {
    if (!text?.trim() || isSendingRef.current) return;
    
    isSendingRef.current = true;
    
    const { data, error: sendError } = await apiSendMessage({
      username: username || 'Anonymous',
      text: text.trim(),
    });
    
    if (sendError) {
      console.error('Failed to send message:', sendError);
      // Could set error state here if needed
    }
    
    // Note: The new message will arrive via socket 'new_message' event
    // and be added to state in the listener below
    
    setTimeout(() => {
      isSendingRef.current = false;
    }, 500);
  }, []);

  /**
   * Like a message
   * @param {string} messageId - Message ID to like
   */
  const likeMessage = useCallback(async (messageId) => {
    const { success, error: likeError } = await apiLikeMessage(messageId);
    
    if (!success) {
      console.error('Failed to like message:', likeError);
    }
    // The updated message will arrive via socket 'message_liked' event
  }, []);

  /**
   * Delete a message (moderator/admin only)
   * @param {string} messageId - Message ID to delete
   */
  const deleteMessage = useCallback(async (messageId) => {
    try {
      const api = (await import('../services/api.js')).default;
      await api.delete(`/moderator/messages/${messageId}`);
      // The deletion will be confirmed via socket 'message_deleted' event
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message. Are you a moderator?');
    }
  }, []);

  /**
   * Refresh messages manually
   */
  const refreshMessages = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Setup socket listeners for real-time updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    /**
     * Handler for new messages from socket
     */
    const handleNewMessage = (message) => {
      setMessages((prev) => {
        // Prevent duplicates
        const exists = prev.some((msg) => msg._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    /**
     * Handler for message likes from socket
     */
    const handleMessageLiked = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    };

    /**
     * Handler for message deletions from socket
     */
    const handleMessageDeleted = ({ id }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== id));
    };

    // Add listeners
    socket.on('new_message', handleNewMessage);
    socket.on('message_liked', handleMessageLiked);
    socket.on('message_deleted', handleMessageDeleted);

    // CRITICAL: Cleanup to prevent memory leaks and duplicate listeners
    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_liked', handleMessageLiked);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    likeMessage,
    deleteMessage,
    refreshMessages,
  };
};

export default useMessages;
