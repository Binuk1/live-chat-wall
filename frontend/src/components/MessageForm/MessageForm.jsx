// components/MessageForm/MessageForm.jsx
import { useState, useRef } from 'react';
import './MessageForm.css';

function MessageForm({ onSend, username, onTyping }) {
  const [inputText, setInputText] = useState('');
  const typingTimeoutRef = useRef(null);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputText(value);

    if (username) {
      onTyping?.(username, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        onTyping?.(username, false);
      }, 1000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    onSend(username, inputText.trim());
    setInputText('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    onTyping?.(username, false);
  };

  return (
    <form onSubmit={handleSubmit} className="message-form">
      <input
        type="text"
        placeholder="Type your message..."
        value={inputText}
        onChange={handleChange}
        maxLength={500}
        autoFocus
      />
      <button type="submit">Send 📤</button>
    </form>
  );
}

export default MessageForm;
