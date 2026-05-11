// pages/Profile/Profile.jsx
import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authApi } from '../../services/auth.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Badge from '../../components/Badge/Badge.jsx';
import './Profile.css';

function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isOwnProfile = !username || (currentUser && currentUser.username === username);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        if (isOwnProfile) {
          // Viewing own profile - requires auth
          response = await authApi.getMe();
        } else {
          // Viewing other user's profile - public
          response = await authApi.getUserByUsername(username);
        }
        
        setUser(response.user);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username, isOwnProfile]);

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
          {isOwnProfile && (
            <Link to="/settings" className="profile-settings-link">
              Edit Settings
            </Link>
          )}
          {!isOwnProfile && (
            <span className="profile-viewing">Viewing {user.username}'s Profile</span>
          )}
        </div>

        <div className="profile-details">
          <div className="profile-field">
            <label>Username</label>
            <span>{user.username}</span>
          </div>
          
          {isOwnProfile && (
            <div className="profile-field">
              <label>Email</label>
              <span>{user.email}</span>
            </div>
          )}
          
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
