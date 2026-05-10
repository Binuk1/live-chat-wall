// pages/Banned/Banned.jsx — Banned user page
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './Banned.css';

function Banned() {
  const [searchParams] = useSearchParams();
  const [bannedUntil, setBannedUntil] = useState(null);

  useEffect(() => {
    const until = searchParams.get('until');
    if (until) {
      setBannedUntil(new Date(until));
    }
  }, [searchParams]);

  return (
    <div className="page banned-page">
      <div className="banned-content">
        <div className="banned-icon">🚫</div>
        <h1>Account Suspended</h1>
        <p className="banned-message">
          Your account has been temporarily suspended from Live Chat.
        </p>
        {bannedUntil && (
          <div className="banned-details">
            <p className="banned-until">
              <strong>Banned until:</strong><br />
              {bannedUntil.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="banned-countdown">
              You will be able to access the chat again after this time.
            </p>
          </div>
        )}
        <a href="/" className="banned-home-link">
          Return to Homepage
        </a>
      </div>
    </div>
  );
}

export default Banned;
