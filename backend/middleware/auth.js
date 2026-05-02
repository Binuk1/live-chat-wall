const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id.toString(),
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Express middleware to authenticate requests
const authenticateToken = (req, res, next) => {
  // Check for token in cookies or Authorization header
  let token = req.cookies?.token;
  
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
  
  req.user = decoded;
  next();
};

// Socket.io middleware to authenticate socket connections
const authenticateSocket = (socket, next) => {
  try {
    // Extract token from cookie in handshake headers
    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) {
      // Allow anonymous connections
      socket.user = null;
      return next();
    }
    
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    const token = cookies.token;
    if (!token) {
      socket.user = null;
      return next();
    }
    
    const decoded = verifyToken(token);
    if (decoded) {
      socket.user = decoded;
    } else {
      socket.user = null;
    }
    
    next();
  } catch (error) {
    socket.user = null;
    next();
  }
};

// Set auth cookie with security options
const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
};

// Clear auth cookie
const clearAuthCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/'
  });
};

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  authenticateSocket,
  setAuthCookie,
  clearAuthCookie,
  JWT_SECRET
};
