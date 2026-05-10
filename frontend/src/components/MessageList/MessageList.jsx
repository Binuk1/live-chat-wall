// components/MessageList/MessageList.jsx
import { useRef, useEffect } from 'react';
import MessageCard from '../MessageCard/MessageCard.jsx';
import './MessageList.css';

function MessageList({ messages, currentUser, loading, error, onLike, userRole, onDelete }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  if (loading) {
    return <div className="loading">Loading messages...</div>;
  }

  if (error) {
    return <div className="error">Error loading messages: {error}</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="empty-state">
        💭 No messages yet. Be the first to say something!
      </div>
    );
  }

  return (
    <div className="messages-container">
      {messages.map((msg) => (
        <MessageCard
          key={msg._id}
          message={msg}
          isOwn={msg.username === currentUser}
          onLike={onLike}
          userRole={userRole}
          onDelete={onDelete}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;
