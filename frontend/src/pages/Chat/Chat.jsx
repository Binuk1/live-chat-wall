// pages/Chat/Chat.jsx
import { useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMessages } from '../../hooks/useMessages.js';
import { useSocket } from '../../hooks/useSocket.js';
import { useOnlineUsers } from '../../hooks/useOnlineUsers.js';
import { useTypingUsers } from '../../hooks/useTypingUsers.js';
import MessageList from '../../components/MessageList/MessageList.jsx';
import MessageForm from '../../components/MessageForm/MessageForm.jsx';
import TypingIndicator from '../../components/TypingIndicator/TypingIndicator.jsx';
import OnlineBadge from '../../components/OnlineBadge/OnlineBadge.jsx';
import './Chat.css';

function Chat() {
  const { user, isAuthenticated, logout } = useAuth();
  const { messages, loading, error, sendMessage, likeMessage, deleteMessage } = useMessages();
  const { emitTyping } = useSocket();
  const { onlineCount } = useOnlineUsers();
  const { typingUsers } = useTypingUsers();
  const navigate = useNavigate();
  
  // Ref for scrolling messages area
  const messagesAreaRef = useRef(null);

  // Scroll to bottom when messages load or change
  useEffect(() => {
    if (messagesAreaRef.current && !loading) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const displayName = isAuthenticated ? user?.username : null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleViewProfile = (username) => {
    navigate(`/profile/${username}`);
  };

  return (
    <div className="chat-page">
      <div className="chat-box">
        {/* Sticky Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            {isAuthenticated ? (
              <span className="chat-status">
                you are chatting as <strong>{displayName}</strong>
                <span className="auth-badge">✓</span>
              </span>
            ) : (
              <span className="chat-status">Live Chat</span>
            )}
          </div>
          <div className="chat-header-right">
            {isAuthenticated && (
              <button onClick={handleLogout} className="auth-button-logout">Logout</button>
            )}
            <OnlineBadge count={onlineCount} />
          </div>
        </div>

        {/* Scrollable Messages Area */}
        <div className="chat-messages-area" ref={messagesAreaRef}>
          <TypingIndicator typingUsers={typingUsers} />
          <MessageList
            messages={messages}
            currentUser={displayName}
            loading={loading}
            error={error}
            onLike={likeMessage}
            userRole={user?.role}
            onDelete={deleteMessage}
            onViewProfile={handleViewProfile}
          />
        </div>

        {/* Sticky Message Form or Login Prompt */}
        <div className="chat-form-wrapper">
          {isAuthenticated ? (
            <MessageForm
              onSend={sendMessage}
              username={displayName}
              onTyping={emitTyping}
            />
          ) : (
            <div className="chat-login-prompt">
              <p>Want to join the conversation?</p>
              <Link to="/login" className="prompt-link">Login</Link>
              <span className="prompt-or">or</span>
              <Link to="/signup" className="prompt-link">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
