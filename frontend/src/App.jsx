// frontend/src/App.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [username, setUsername] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize Socket.io connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL);
    
    // Listen for real-time events
    socketRef.current.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    socketRef.current.on('message_liked', (updatedMessage) => {
      setMessages(prev => prev.map(msg => 
        msg._id === updatedMessage._id ? updatedMessage : msg
      ));
    });
    
    socketRef.current.on('online_count', (count) => {
      setOnlineCount(count);
    });
    
    socketRef.current.on('user_typing', ({ username, isTyping }) => {
      setTypingUsers(prev => {
        if (isTyping && !prev.includes(username)) {
          return [...prev, username];
        } else if (!isTyping) {
          return prev.filter(name => name !== username);
        }
        return prev;
      });
    });
    
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // Load messages on startup
  useEffect(() => {
    loadMessages();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    if (username && socketRef.current) {
      if (inputText.length > 0 && !isTyping) {
        setIsTyping(true);
        socketRef.current.emit('typing', { username, isTyping: true });
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
          setIsTyping(false);
          socketRef.current.emit('typing', { username, isTyping: false });
        }
      }, 1000);
    }
    
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [inputText, username, isTyping]);

  const loadMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages`);
      setMessages(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      await axios.post(`${API_URL}/messages`, {
        username: username || 'Anonymous',
        text: inputText
      });
      setInputText('');
      
      // Stop typing indicator
      if (socketRef.current) {
        socketRef.current.emit('typing', { username, isTyping: false });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const likeMessage = async (messageId) => {
    try {
      await axios.post(`${API_URL}/messages/${messageId}/like`);
    } catch (error) {
      console.error('Error liking message:', error);
    }
  };

  const joinChat = () => {
    if (socketRef.current) {
      socketRef.current.emit('user_joined', username || 'Anonymous');
    }
    setShowNamePrompt(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Name prompt modal
  if (showNamePrompt) {
    return (
      <div className="name-prompt">
        <div className="name-prompt-card">
          <h2>Welcome to the Live Chat Wall 💬</h2>
          <p>Choose a name to start chatting</p>
          <input
            type="text"
            placeholder="Enter your name (or leave blank for Anonymous)"
            maxLength={20}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && joinChat()}
            autoFocus
          />
          <button onClick={joinChat}>
            Join Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="chat-wall">
        <div className="header">
          <h1>💬 Live Chat Wall</h1>
          <div className="user-info">
            <span>👤 Chatting as: <strong>{username || 'Anonymous'}</strong></span>
            <button onClick={() => setShowNamePrompt(true)} className="change-name">
              Change
            </button>
            <span className="online-badge">🟢 {onlineCount} online</span>
          </div>
        </div>

        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.length === 1 
              ? `${typingUsers[0]} is typing...` 
              : `${typingUsers.length} people are typing...`}
          </div>
        )}

        <div className="messages-container">
          {loading ? (
            <div className="loading">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              💭 No messages yet. Be the first to say something!
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className="message-card">
                <div className="message-header">
                  <span className="username">👤 {msg.username}</span>
                  <span className="timestamp">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="message-text">{msg.text}</div>
                <div className="message-footer">
                  <button 
                    onClick={() => likeMessage(msg._id)}
                    className="like-btn"
                  >
                    ❤️ {msg.likes || 0}
                  </button>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="message-form">
          <input
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            maxLength={500}
            autoFocus
          />
          <button type="submit">Send 📤</button>
        </form>
      </div>
    </div>
  );
}

export default App;