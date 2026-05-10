// pages/NotFound/NotFound.jsx — Generic 404 page
import { Link } from 'react-router-dom';
import './NotFound.css';

function NotFound() {
  return (
    <div className="page not-found-page">
      <div className="not-found-content">
        <h1 className="not-found-code">404</h1>
        <p className="not-found-message">Page not found</p>
        <p className="not-found-hint">
          The page you are looking for might have been removed, had its name changed,
          or is temporarily unavailable.
        </p>
        <Link to="/" className="not-found-link">
          Go to homepage
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
