const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

// User schema validation
const validateUser = (user) => {
  const errors = [];
  
  if (!user.username || user.username.trim().length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  if (!user.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('Valid email required');
  }
  if (!user.password || user.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(user.password)) {
    errors.push('Password must contain uppercase, lowercase, and number');
  }
  
  return errors;
};

// Hash password
const hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

// Verify password
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

// Create user document
const createUserDoc = async (userData) => {
  const errors = validateUser(userData);
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  const hashedPassword = await hashPassword(userData.password);
  
  return {
    _id: new ObjectId(),
    username: userData.username.trim(),
    email: userData.email.toLowerCase().trim(),
    password: hashedPassword,
    isAnonymous: false,
    role: 'user', // 'user', 'moderator', 'admin'
    bannedUntil: null,
    bannedBy: null,
    createdAt: new Date(),
    bio: '',
    avatar: null, // emoji or null for default
    updatedAt: new Date()
  };
};

module.exports = {
  validateUser,
  hashPassword,
  verifyPassword,
  createUserDoc
};
