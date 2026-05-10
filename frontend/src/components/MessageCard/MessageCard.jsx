// components/MessageCard/MessageCard.jsx
import './MessageCard.css';

function MessageCard({ message, isOwn, onLike, userRole, onDelete }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const canDelete = userRole === 'moderator' || userRole === 'admin';

  // Get avatar display (emoji or first letter)
  const avatarDisplay = message.avatar || message.username?.charAt(0).toUpperCase();

  return (
    <div className={`message-row ${isOwn ? 'own' : 'other'}`}>
      <div className="message-bubble">
        <div className="message-header">
          <span className="message-avatar">{avatarDisplay}</span>
          <span className="username">
            {message.username}
            {message.isAuthenticated && (
              <span className="auth-badge" title="Verified User">✓</span>
            )}
          </span>
          <span className="timestamp">{formatTime(message.timestamp)}</span>
        </div>
        <div className="message-text">{message.text}</div>
        <div className="message-actions">
          <button onClick={() => onLike(message._id)} className="like-btn">
            ♥ {message.likes || 0}
          </button>
          {canDelete && (
            <button onClick={() => onDelete(message._id)} className="delete-btn" title="Delete message">
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageCard;
