// components/MessageCard/MessageCard.jsx
import './MessageCard.css';

function MessageCard({ message, isOwn, onLike }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message-row ${isOwn ? 'own' : 'other'}`}>
      <div className="message-bubble">
        <div className="message-header">
          <span className="username">{message.username}</span>
          <span className="timestamp">{formatTime(message.timestamp)}</span>
        </div>
        <div className="message-text">{message.text}</div>
        <button onClick={() => onLike(message._id)} className="like-btn">
          ♥ {message.likes || 0}
        </button>
      </div>
    </div>
  );
}

export default MessageCard;
