// pages/Chat/Chat.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUsername } from '../../hooks/useUsername.js';
import { useMessages } from '../../hooks/useMessages.js';
import { useSocket } from '../../hooks/useSocket.js';
import { useOnlineUsers } from '../../hooks/useOnlineUsers.js';
import { useTypingUsers } from '../../hooks/useTypingUsers.js';
import NamePrompt from '../../components/NamePrompt/NamePrompt.jsx';
import MessageList from '../../components/MessageList/MessageList.jsx';
import MessageForm from '../../components/MessageForm/MessageForm.jsx';
import TypingIndicator from '../../components/TypingIndicator/TypingIndicator.jsx';
import OnlineBadge from '../../components/OnlineBadge/OnlineBadge.jsx';
import './Chat.css';

function Chat() {
  const { user, isAuthenticated, logout } = useAuth();
  const { username, showNamePrompt, setUsername, joinChat, changeName } = useUsername();
  const { messages, loading, error, sendMessage, likeMessage } = useMessages();
  const { emitTyping, emitUserJoined } = useSocket();
  const { onlineCount } = useOnlineUsers();
  const { typingUsers } = useTypingUsers();
  const navigate = useNavigate();

  // Use auth username if authenticated, otherwise use anonymous username
  const displayName = isAuthenticated ? user?.username : (username || 'Anonymous');
  const showPrompt = !isAuthenticated && showNamePrompt;

  useEffect(() => {
    // Emit user_joined for authenticated users on mount
    if (isAuthenticated && user?.username) {
      emitUserJoined(user.username);
    }
    // Emit for anonymous users after they enter name
    else if (!isAuthenticated && !showNamePrompt && username) {
      emitUserJoined(username);
    }
  }, [isAuthenticated, user, showNamePrompt, username, emitUserJoined]);

  const handleJoin = () => {
    const joinedName = joinChat();
    emitUserJoined(joinedName);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (showPrompt) {
    return (
      <NamePrompt
        username={username}
        setUsername={setUsername}
        onJoin={handleJoin}
      />
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="chat-header-left">
          <h1>💬 Live Chat</h1>
          <div className="user-info">
            <span>
              as <strong>{displayName}</strong>
              {isAuthenticated && <span className="auth-badge">✓</span>}
            </span>
            {!isAuthenticated && (
              <button onClick={changeName} className="change-name">Change</button>
            )}
          </div>
        </div>
        <div className="chat-header-right">
          {isAuthenticated ? (
            <button onClick={handleLogout} className="auth-button-logout">Logout</button>
          ) : (
            <button onClick={() => navigate('/login')} className="auth-button-login">Login</button>
          )}
          <OnlineBadge count={onlineCount} />
        </div>
      </div>

      <TypingIndicator typingUsers={typingUsers} />

      <MessageList
        messages={messages}
        currentUser={displayName}
        loading={loading}
        error={error}
        onLike={likeMessage}
      />

      <MessageForm
        onSend={sendMessage}
        username={displayName}
        onTyping={emitTyping}
      />
    </div>
  );
}

export default Chat;
