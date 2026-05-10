// backend/middleware/roles.js — Role-based access control
const { ObjectId } = require('mongodb');

/**
 * Middleware factory: require specific role(s)
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userRole = req.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

/**
 * Require moderator or admin role
 */
const requireModerator = requireRole(['moderator', 'admin']);

/**
 * Require admin role only
 */
const requireAdmin = requireRole(['admin']);

/**
 * Check if user is banned
 */
const checkBanned = async (req, res, next) => {
  if (!req.user) {
    return next();
  }
  
  const db = req.app.locals.db;
  const usersCollection = db.collection('users');
  
  const user = await usersCollection.findOne(
    { _id: new ObjectId(req.user.userId) },
    { projection: { bannedUntil: 1, role: 1 } }
  );
  
  if (user?.bannedUntil && new Date(user.bannedUntil) > new Date()) {
    return res.status(403).json({ 
      error: 'Account banned',
      bannedUntil: user.bannedUntil
    });
  }
  
  // Attach role to req.user for downstream use
  req.user.role = user?.role || 'user';
  
  next();
};

module.exports = {
  requireRole,
  requireModerator,
  requireAdmin,
  checkBanned
};
