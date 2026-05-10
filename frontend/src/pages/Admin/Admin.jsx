// pages/Admin/Admin.jsx — Admin panel for user management and moderation
import { useState, useEffect } from 'react';
import { getStats, getAllUsers, changeUserRole, deleteUser, getAllMessages, deleteMessage } from '../../services/admin.js';
import { banUser, unbanUser } from '../../services/moderator.js';
import Badge from '../../components/Badge/Badge.jsx';
import './Admin.css';

function Admin() {
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, messagesData] = await Promise.all([
        getStats(),
        getAllUsers(),
        getAllMessages()
      ]);
      setStats(statsData);
      setUsers(usersData.users);
      setMessages(messagesData.messages);
    } catch (err) {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await changeUserRole(userId, newRole);
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, role: newRole } : u
      ));
    } catch (err) {
      alert('Failed to change role: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`Delete user ${username}? This cannot be undone.`)) return;
    
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await deleteUser(userId);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleBanUser = async (userId, duration) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await banUser(userId, duration);
      const bannedUntil = new Date(Date.now() + 
        (duration === '1h' ? 3600000 : duration === '24h' ? 86400000 : 604800000)
      );
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, bannedUntil } : u
      ));
    } catch (err) {
      alert('Failed to ban user: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleUnbanUser = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      await unbanUser(userId);
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, bannedUntil: null } : u
      ));
    } catch (err) {
      alert('Failed to unban user: ' + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    
    try {
      await deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m._id !== messageId));
    } catch (err) {
      alert('Failed to delete message: ' + err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMessages = messages.filter(m => 
    m.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page admin-page">
        <div className="admin-loading">Loading admin panel...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page admin-page">
        <div className="admin-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page admin-page">
      <h1>Admin Panel</h1>

      {/* Stats */}
      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-value">{stats?.totalUsers || 0}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats?.totalMessages || 0}</span>
          <span className="stat-label">Total Messages</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats?.onlineCount || 0}</span>
          <span className="stat-label">Online Now</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats?.bannedUsers || 0}</span>
          <span className="stat-label">Banned Users</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users ({filteredUsers.length})
        </button>
        <button 
          className={activeTab === 'messages' ? 'active' : ''}
          onClick={() => setActiveTab('messages')}
        >
          Messages ({filteredMessages.length})
        </button>
      </div>

      {/* Search */}
      <div className="admin-search">
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const isBanned = user.bannedUntil && new Date(user.bannedUntil) > new Date();
                return (
                  <tr key={user._id} className={isBanned ? 'banned' : ''}>
                    <td>
                      <div className="user-cell">
                        <strong>{user.username}</strong>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <Badge type={user.role || 'user'} size="sm" />
                    </td>
                    <td>
                      {user.createdAt 
                        ? new Date(user.createdAt).toLocaleDateString() 
                        : 'Unknown'}
                    </td>
                    <td>
                      {isBanned ? (
                        <span className="status-banned">
                          Banned until {new Date(user.bannedUntil).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="status-active">Active</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          disabled={actionLoading[user._id]}
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                        
                        {isBanned ? (
                          <button
                            onClick={() => handleUnbanUser(user._id)}
                            disabled={actionLoading[user._id]}
                            className="btn-unban"
                          >
                            Unban
                          </button>
                        ) : (
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleBanUser(user._id, e.target.value);
                              e.target.value = '';
                            }}
                            disabled={actionLoading[user._id]}
                            className="ban-select"
                          >
                            <option value="">Ban...</option>
                            <option value="1h">1 hour</option>
                            <option value="24h">24 hours</option>
                            <option value="7d">7 days</option>
                          </select>
                        )}
                        
                        <button
                          onClick={() => handleDeleteUser(user._id, user.username)}
                          disabled={actionLoading[user._id]}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="admin-messages">
          {filteredMessages.map(message => (
            <div key={message._id} className="admin-message-card">
              <div className="message-header">
                <strong>{message.username || 'Unknown'}</strong>
                <span className="message-time">
                  {message.createdAt 
                    ? new Date(message.createdAt).toLocaleString() 
                    : 'Unknown'}
                </span>
              </div>
              <p className="message-text">{message.text}</p>
              <div className="message-actions">
                <span className="message-likes">❤️ {message.likes || 0}</span>
                <button
                  onClick={() => handleDeleteMessage(message._id)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Admin;
