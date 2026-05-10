// pages/Settings/Settings.jsx — User settings page
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../services/auth.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './Settings.css';

const AVATAR_OPTIONS = ['😀', '😎', '🤠', '👽', '🤖', '🎃', '🐱', '🐶', '🦊', '🐼', '🐨', '🦁'];

function Settings() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Force refresh user data when entering settings
  useEffect(() => {
    (async () => {
      await refreshUser();
    })();
  }, [location.pathname]);

  // Load bio/avatar from user data
  useEffect(() => {
    if (user) {
      setBio(user.bio || '');
      setAvatar(user.avatar || null);
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await authApi.updateProfile({ bio: bio.trim(), avatar });
      // Refresh user data so bio/avatar are updated in context
      await refreshUser();
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.username) {
      setError('Username confirmation does not match');
      return;
    }
    
    setLoading(true);
    
    try {
      await authApi.deleteAccount();
      await logout();
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <div className="page settings-page">
      <h1>Settings</h1>
      
      {message && <div className="settings-message success">{message}</div>}
      {error && <div className="settings-message error">{error}</div>}

      {/* Profile Settings */}
      <div className="settings-section">
        <h2>Profile</h2>
        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label>Avatar</label>
            <div className="avatar-picker">
              <button
                type="button"
                className={`avatar-option ${avatar === null ? 'selected' : ''}`}
                onClick={() => setAvatar(null)}
              >
                {user?.username?.charAt(0).toUpperCase()}
                <span className="avatar-label">Default</span>
              </button>
              {AVATAR_OPTIONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className={`avatar-option ${avatar === emoji ? 'selected' : ''}`}
                  onClick={() => setAvatar(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Tell us about yourself..."
            />
            <span className="char-count">{bio.length}/200</span>
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="settings-section">
        <h2>Change Password</h2>
        <form onSubmit={handleChangePassword}>
          {/* Hidden username for accessibility */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={user?.username || ''}
            readOnly
            style={{ position: 'absolute', left: '-9999px' }}
            aria-hidden="true"
          />
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Delete Account */}
      <div className="settings-section danger">
        <h2>Delete Account</h2>
        <p className="danger-text">
          This will permanently delete your account and all your messages. This action cannot be undone.
        </p>
        <button
          className="btn-danger"
          onClick={() => setShowDeleteModal(true)}
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete Account?</h3>
            <p>
              This will permanently delete your account and all your messages.
              Type <strong>{user?.username}</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={`Type ${user?.username} to confirm`}
              autoFocus
            />
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm('');
                  setError('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirm !== user?.username}
              >
                {loading ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
