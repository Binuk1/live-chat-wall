// backend/routes/moderator.js — Moderator endpoints
const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('../middleware/auth.js');
const { requireModerator, checkBanned } = require('../middleware/roles.js');

const router = express.Router();

// All moderator routes require auth and moderator role
router.use(authenticateToken);
router.use(checkBanned);
router.use(requireModerator);

/**
 * DELETE /api/moderator/messages/:id — Delete any message
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
    
    // Publish to Redis
    try {
      await req.app.locals.redisPublisher.publish('chat', JSON.stringify({
        type: 'message_deleted',
        data: { id }
      }));
    } catch (error) {
      console.log('Redis publish error (non-critical):', error.message);
    }
    
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/moderator/ban — Ban a user temporarily
 * Body: { userId, duration: '1h' | '24h' | '7d' }
 */
router.post('/ban', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    
    const { userId, duration } = req.body;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    if (!['1h', '24h', '7d'].includes(duration)) {
      return res.status(400).json({ error: 'Invalid duration. Use 1h, 24h, or 7d' });
    }
    
    // Cannot ban admins or other moderators
    const targetUser = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { role: 1, username: 1 } }
    );
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (targetUser.role === 'admin' || targetUser.role === 'moderator') {
      return res.status(403).json({ error: 'Cannot ban moderators or admins' });
    }
    
    // Calculate ban expiration
    const hours = { '1h': 1, '24h': 24, '7d': 168 }[duration];
    const bannedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          bannedUntil,
          bannedBy: req.user.userId
        }
      }
    );
    
    // Disconnect banned user's sockets
    req.app.locals.io.emit('user_banned', { userId, bannedUntil });
    
    res.json({ 
      success: true, 
      message: `User ${targetUser.username} banned until ${bannedUntil.toISOString()}` 
    });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/moderator/unban — Unban a user
 */
router.post('/unban', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    
    const { userId } = req.body;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { bannedUntil: null, bannedBy: null } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User unbanned' });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
