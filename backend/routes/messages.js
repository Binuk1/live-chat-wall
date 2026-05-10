// backend/routes/messages.js — Message REST API Routes
const express = require('express');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('../middleware/auth.js');
const { checkBanned } = require('../middleware/roles.js');

const router = express.Router();

/**
 * Get messages collection from app locals
 */
const getMessagesCollection = (req) => req.app.locals.db?.collection('messages');

/**
 * GET /api/messages — Fetch all messages
 */
router.get('/', async (req, res) => {
  try {
    const messagesCollection = getMessagesCollection(req);
    if (!messagesCollection) {
      return res.status(500).json({ error: 'Database not connected yet' });
    }
    
    const allMessages = await messagesCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    
    res.json(allMessages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/messages — Create new message
 * Requires authentication and checks ban status
 */
router.post('/', authenticateToken, checkBanned, async (req, res) => {
  try {
    const messagesCollection = getMessagesCollection(req);
    if (!messagesCollection) {
      return res.status(500).json({ error: 'Database not connected yet' });
    }
    
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    // Get user from database to ensure they exist and get their username
    const usersCollection = req.app.locals.db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const message = {
      username: user.username,
      avatar: user.avatar || null,
      text: text.trim(),
      timestamp: new Date(),
      likes: 0,
      createdAt: new Date(),
      isAuthenticated: true,
      userId: req.user.userId
    };
    
    const result = await messagesCollection.insertOne(message);
    const savedMessage = { ...message, _id: result.insertedId };
    
    // Emit to all connected clients via Socket.io
    req.app.locals.io.emit('new_message', savedMessage);
    
    // Publish to Redis for any other server instances
    try {
      await req.app.locals.redisPublisher.publish('chat', JSON.stringify({
        type: 'new_message',
        data: savedMessage
      }));
    } catch (error) {
      console.log('Redis publish error (non-critical):', error.message);
    }
    
    res.json(savedMessage);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/messages/:id/like — Like a message
 * Requires authentication and checks ban status
 */
router.post('/:id/like', authenticateToken, checkBanned, async (req, res) => {
  try {
    const messagesCollection = getMessagesCollection(req);
    if (!messagesCollection) {
      return res.status(500).json({ error: 'Database not connected yet' });
    }
    
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }
    
    const result = await messagesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $inc: { likes: 1 } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Get the updated message
    const updatedMessage = await messagesCollection.findOne({ _id: new ObjectId(id) });
    
    // Emit update to all clients
    req.app.locals.io.emit('message_liked', updatedMessage);
    
    // Publish to Redis
    try {
      await req.app.locals.redisPublisher.publish('chat', JSON.stringify({
        type: 'message_liked',
        data: updatedMessage
      }));
    } catch (error) {
      console.log('Redis publish error (non-critical):', error.message);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error liking message:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
