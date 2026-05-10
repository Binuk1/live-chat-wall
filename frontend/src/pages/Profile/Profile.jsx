// pages/Profile/Profile.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/auth.js';
import Badge from '../../components/Badge/Badge.jsx';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authApi.getMe();
        setUser(response.user);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="page profile-page">
        <div className="profile-loading">Loading profile...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="page profile-page">
        <div className="profile-error">{error || 'User not found'}</div>
      </div>
    );
  }

  const joinDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Unknown';

  const isBanned = user.bannedUntil && new Date(user.bannedUntil) > new Date();

  return (
    <div className="page profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.avatar || user.username.charAt(0).toUpperCase()}
          </div>
          <h1>{user.username}</h1>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <div className="profile-badges">
            <Badge type={user.role || 'user'} size="md" />
            {isBanned && (
              <span className="profile-badge banned">Banned until {new Date(user.bannedUntil).toLocaleDateString()}</span>
            )}
          </div>
          <Link to="/settings" className="profile-settings-link">
            Edit Settings
          </Link>
        </div>

        <div className="profile-details">
          <div className="profile-field">
            <label>Username</label>
            <span>{user.username}</span>
          </div>
          
          <div className="profile-field">
            <label>Email</label>
            <span>{user.email}</span>
          </div>
          
          <div className="profile-field">
            <label>Member Since</label>
            <span>{joinDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
