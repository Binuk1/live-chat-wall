// pages/Chat/Chat.jsx
import { useEffect } from 'react';
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
  const { username, showNamePrompt, setUsername, joinChat, changeName } = useUsername();
  const { messages, loading, error, sendMessage, likeMessage } = useMessages();
  const { emitTyping, emitUserJoined } = useSocket();
  const { onlineCount } = useOnlineUsers();
  const { typingUsers } = useTypingUsers();

  useEffect(() => {
    if (!showNamePrompt && username) {
      emitUserJoined(username);
    }
  }, [showNamePrompt, username, emitUserJoined]);

  const handleJoin = () => {
    const joinedName = joinChat();
    emitUserJoined(joinedName);
  };

  if (showNamePrompt) {
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
            <span>as <strong>{username || 'Anonymous'}</strong></span>
            <button onClick={changeName} className="change-name">Change</button>
          </div>
        </div>
        <OnlineBadge count={onlineCount} />
      </div>

      <TypingIndicator typingUsers={typingUsers} />

      <MessageList
        messages={messages}
        currentUser={username}
        loading={loading}
        error={error}
        onLike={likeMessage}
      />

      <MessageForm
        onSend={sendMessage}
        username={username}
        onTyping={emitTyping}
      />
    </div>
  );
}

export default Chat;
