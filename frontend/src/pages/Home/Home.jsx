// pages/Home/Home.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Home.css';

function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="page home-page">
      <h1>Welcome to Live Chat 💬</h1>
      <p>Join the conversation in real-time!</p>
      
      {isAuthenticated ? (
        <div className="home-welcome">
          <p>Welcome back, <strong>{user?.username}</strong>!</p>
          <div className="home-actions">
            <Link to="/chat" className="btn-primary">Go to Chat</Link>
            <Link to="/profile" className="btn-secondary">Profile</Link>
          </div>
        </div>
      ) : (
        <div className="home-actions">
          <Link to="/chat" className="btn-primary">Join as Anonymous</Link>
          <Link to="/login" className="btn-secondary">Login</Link>
          <Link to="/signup" className="btn-secondary">Sign Up</Link>
        </div>
      )}
    </div>
  );
}

export default Home;
