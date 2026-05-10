const express = require('express');
const rateLimit = require('express-rate-limit');
const { ObjectId } = require('mongodb');
const { createUserDoc, verifyPassword } = require('../models/User.js');
const { generateToken, setAuthCookie, clearAuthCookie, authenticateToken } = require('../middleware/auth.js');

const router = express.Router();

// Rate limiter for auth routes - prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// POST /api/auth/signup - Register new user
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    
    // Check if email already exists
    const existingEmail = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Check if username already exists
    const existingUsername = await usersCollection.findOne({ username: username.trim() });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Create user document
    const userDoc = await createUserDoc({ username, email, password });
    
    // Insert into database
    await usersCollection.insertOne(userDoc);
    
    // Generate token and set cookie
    const token = generateToken(userDoc);
    setAuthCookie(res, token);
    
    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = userDoc;
    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message || 'Failed to create user' });
  }
});

// POST /api/auth/login - Authenticate user
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    
    // Find user by email
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token and set cookie
    const token = generateToken(user);
    setAuthCookie(res, token);
    
    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      message: 'Login successful',
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/auth/logout - Clear authentication
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logout successful' });
});

// GET /api/auth/me - Get current authenticated user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      clearAuthCookie(res);
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// GET /api/auth/check - Check if user is authenticated (no error if not)
router.get('/check', async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.json({ authenticated: false });
    }
    
    const { verifyToken } = require('../middleware/auth.js');
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.json({ authenticated: false });
    }
    
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return res.json({ authenticated: false });
    }
    
    res.json({ authenticated: true, user });
    
  } catch (error) {
    res.json({ authenticated: false });
  }
});

/**
 * PUT /api/auth/me — Update user profile
 */
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    
    const { bio, avatar } = req.body;
    const updates = {};
    
    if (bio !== undefined) {
      if (bio.length > 200) {
        return res.status(400).json({ error: 'Bio must be under 200 characters' });
      }
      updates.bio = bio.trim();
    }
    
    if (avatar !== undefined) {
      updates.avatar = avatar || null;
    }
    
    updates.updatedAt = new Date();
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: updates }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/auth/change-password — Change user password
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    
    // Get user
    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 1 } }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const { verifyPassword } = require('../models/User.js');
    const isValid = await verifyPassword(currentPassword, user.password);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const { hashPassword } = require('../models/User.js');
    const hashedPassword = await hashPassword(newPassword);
    
    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );
    
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/auth/me — Delete user account
 */
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const usersCollection = db.collection('users');
    const messagesCollection = db.collection('messages');
    
    const userId = req.user.userId;
    
    // Delete user's messages
    await messagesCollection.deleteMany({ userId });
    
    // Delete user
    const result = await usersCollection.deleteOne({
      _id: new ObjectId(userId)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Clear auth cookie
    const { clearAuthCookie } = require('../middleware/auth.js');
    clearAuthCookie(res);
    
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
