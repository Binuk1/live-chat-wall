// backend/routes/admin.js — Admin-only endpoints
const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('../middleware/auth.js');
const { requireAdmin, checkBanned } = require('../middleware/roles.js');

const router = express.Router();

// All admin routes require auth and admin role
router.use(authenticateToken);
router.use(checkBanned);
router.use(requireAdmin);

/**
 * GET /api/admin/stats — Get system statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    const messagesCollection = db.collection('messages');
    
    const [totalUsers, totalMessages, bannedUsers] = await Promise.all([
      usersCollection.countDocuments(),
      messagesCollection.countDocuments(),
      usersCollection.countDocuments({ 
        bannedUntil: { $gt: new Date() } 
      })
    ]);
    
    // Get online count from socket connections
    const io = req.app.locals.io;
    const onlineCount = io ? io.engine.clientsCount : 0;
    
    res.json({
      totalUsers,
      totalMessages,
      onlineCount,
      bannedUsers
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/messages — Get all messages for moderation
 */
router.get('/messages', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const messagesCollection = db.collection('messages');
    const usersCollection = db.collection('users');
    
    // Get messages with user info
    const messages = await messagesCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    
    // Enrich with usernames
    const userIds = [...new Set(messages.map(m => m.userId).filter(Boolean))];
    const users = await usersCollection
      .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
      .project({ username: 1 })
      .toArray();
    
    const userMap = new Map(users.map(u => [u._id.toString(), u.username]));
    
    const enrichedMessages = messages.map(m => ({
      ...m,
      username: userMap.get(m.userId) || 'Unknown'
    }));
    
    res.json({ messages: enrichedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/messages/:id — Delete message as admin
 */
router.delete('/messages/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const messagesCollection = db.collection('messages');
    
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }
    
    const result = await messagesCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Notify all clients
    req.app.locals.io.emit('message_deleted', { id });
    
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/users — List all users
 */
router.get('/users', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    
    const users = await usersCollection
      .find({}, { 
        projection: { 
          password: 0 
        } 
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/admin/users/:id/role — Change user role
 * Body: { role: 'user' | 'moderator' | 'admin' }
 */
router.post('/users/:id/role', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    
    const { id } = req.params;
    const { role } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Prevent self-demotion from admin
    if (id === req.user.userId && role !== 'admin') {
      return res.status(403).json({ error: 'Cannot demote yourself' });
    }
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: `Role updated to ${role}` });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/admin/users/:id — Delete user account
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    const messagesCollection = db.collection('messages');
    
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Prevent self-deletion
    if (id === req.user.userId) {
      return res.status(403).json({ error: 'Cannot delete your own account' });
    }
    
    // Get user before deleting
    const user = await usersCollection.findOne(
      { _id: new ObjectId(id) },
      { projection: { username: 1 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user's messages
    await messagesCollection.deleteMany({ userId: id });
    
    // Delete user
    await usersCollection.deleteOne({ _id: new ObjectId(id) });
    
    res.json({ success: true, message: `User ${user.username} deleted` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
