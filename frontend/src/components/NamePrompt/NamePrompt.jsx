// components/NamePrompt/NamePrompt.jsx
import './NamePrompt.css';

function NamePrompt({ username, setUsername, onJoin }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onJoin();
  };

  return (
    <div className="name-prompt">
      <div className="name-prompt-card">
        <h2>👋 Welcome!</h2>
        <p>Enter a name to join the chat</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
            autoFocus
          />
          <button type="submit">Join Chat</button>
        </form>
      </div>
    </div>
  );
}

export default NamePrompt;
