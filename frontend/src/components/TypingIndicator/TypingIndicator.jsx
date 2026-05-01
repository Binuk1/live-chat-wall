// components/TypingIndicator/TypingIndicator.jsx
import './TypingIndicator.css';

function TypingIndicator({ typingUsers }) {
  if (typingUsers.length === 0) return null;

  return (
    <div className="typing-indicator">
      {typingUsers.length === 1
        ? `${typingUsers[0]} is typing...`
        : `${typingUsers.length} people are typing...`}
    </div>
  );
}

export default TypingIndicator;
