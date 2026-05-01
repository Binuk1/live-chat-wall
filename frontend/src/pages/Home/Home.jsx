// pages/Home/Home.jsx
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="page home-page">
      <h1>Welcome to Live Chat 💬</h1>
      <p>Join the conversation in real-time!</p>
      <div className="home-actions">
        <Link to="/chat" className="btn-primary">Go to Chat</Link>
      </div>
    </div>
  );
}

export default Home;
