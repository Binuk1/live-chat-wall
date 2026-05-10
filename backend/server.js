// backend/server.js
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const Redis = require('ioredis');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const authRoutes = require('./routes/auth.js');
const messageRoutes = require('./routes/messages.js');
const moderatorRoutes = require('./routes/moderator.js');
const adminRoutes = require('./routes/admin.js');
const { authenticateSocket } = require('./middleware/auth.js');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://live-chat-wall.vercel.app",
      /\.vercel\.app$/
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io available to routes
app.locals.io = io;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://live-chat-wall.vercel.app',
    /\.vercel\.app$/  // Allows all Vercel preview deployments
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Redis setup for Upstash
const REDIS_URL = process.env.REDIS_URL;

let redis;
let redisPublisher;
let redisSubscriber;

if (REDIS_URL) {
  try {
    redis = new Redis(REDIS_URL, {
      tls: {
        rejectUnauthorized: false // Required for Upstash
      },
      retryStrategy: (times) => {
        if (times > 5) {
          console.log('❌ Redis connection failed after 5 retries');
          return null;
        }
        console.log(`Redis retry attempt ${times}`);
        return Math.min(times * 100, 3000);
      }
    });
    
    redisPublisher = redis.duplicate();
    redisSubscriber = redis.duplicate();
    
    redis.on('connect', () => console.log('✅ Redis connected to Upstash!'));
    redis.on('error', (err) => console.log('⚠️ Redis error:', err.message));
    
    // Setup Redis Pub/Sub
    redisSubscriber.subscribe('chat');
    redisSubscriber.on('message', (channel, message) => {
      if (channel === 'chat') {
        try {
          const parsed = JSON.parse(message);
          // Broadcast to all connected sockets on this server
          io.emit(parsed.type, parsed.data);
        } catch (error) {
          console.error('Error parsing Redis message:', error);
        }
      }
    });
  } catch (error) {
    console.log('⚠️ Failed to initialize Redis:', error.message);
    // Create dummy Redis objects
    redis = {
      hset: () => Promise.resolve(),
      hdel: () => Promise.resolve(),
      setex: () => Promise.resolve(),
      del: () => Promise.resolve(),
      hgetall: () => Promise.resolve({}),
      duplicate: () => ({ publish: () => Promise.resolve() })
    };
    redisPublisher = { publish: () => Promise.resolve() };
    redisSubscriber = { subscribe: () => {}, on: () => {} };
  }
} else {
  console.log('⚠️ No REDIS_URL provided - running without Redis features');
  // Create dummy Redis objects that do nothing
  redis = {
    hset: () => Promise.resolve(),
    hdel: () => Promise.resolve(),
    setex: () => Promise.resolve(),
    del: () => Promise.resolve(),
    hgetall: () => Promise.resolve({}),
    duplicate: () => ({ publish: () => Promise.resolve() })
  };
  redisPublisher = { publish: () => Promise.resolve() };
  redisSubscriber = { subscribe: () => {}, on: () => {} };
}

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI;

const mongoClient = new MongoClient(MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
});

let db;
let messagesCollection;

// Make db available to routes
app.locals.getDb = () => db;

// Track online users in memory (fallback if Redis fails)
const onlineUsers = new Map(); // socketId -> { username, userId, isAuthenticated }

// API Routes setup (after DB connection)
const setupRoutes = () => {
  // Auth routes
  app.use('/api/auth', (req, res, next) => {
    req.app.locals.db = db;
    next();
  }, authRoutes);
  
  // Message routes
  app.use('/api/messages', (req, res, next) => {
    req.app.locals.db = db;
    req.app.locals.redisPublisher = redisPublisher;
    next();
  }, messageRoutes);
  
  // Moderator routes
  app.use('/api/moderator', (req, res, next) => {
    req.app.locals.db = db;
    req.app.locals.redisPublisher = redisPublisher;
    next();
  }, moderatorRoutes);
  
  // Admin routes
  app.use('/api/admin', (req, res, next) => {
    req.app.locals.db = db;
    req.app.locals.redisPublisher = redisPublisher;
    next();
  }, adminRoutes);
  
  // Online count endpoint
  app.get('/api/online-count', async (req, res) => {
    try {
      const count = connectedSockets.size;
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

async function connectDB() {
  try {
    await mongoClient.connect();
    console.log('✅ Connected to MongoDB Atlas!');
    db = mongoClient.db('chat_wall');
    messagesCollection = db.collection('messages');
    
    // Create indexes for faster queries
    await messagesCollection.createIndex({ timestamp: -1 });
    await messagesCollection.createIndex({ username: 1 });
    console.log('✅ Database indexes created');
    
    // Setup routes after DB is ready
    setupRoutes();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Track all connected sockets for total count
const connectedSockets = new Set();

// Socket.io Authentication Middleware
io.use(authenticateSocket);

// Socket.io Connection Handling
io.on('connection', async (socket) => {
  console.log('🟢 New client connected:', socket.id);
  
  // Check if user is banned
  if (socket.user) {
    try {
      const db = mongoClient.db('chat_wall');
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne(
        { _id: new ObjectId(socket.user.userId) },
        { projection: { bannedUntil: 1 } }
      );
      
      if (user?.bannedUntil && new Date(user.bannedUntil) > new Date()) {
        console.log(`🚫 Banned user attempted connection: ${socket.user.username}`);
        socket.emit('banned', { 
          error: 'Account banned',
          bannedUntil: user.bannedUntil 
        });
        socket.disconnect(true);
        return;
      }
    } catch (error) {
      console.error('Error checking ban status:', error);
    }
  }
  
  // Track all connections
  connectedSockets.add(socket.id);
  
  // Track authenticated users separately
  const isAuthenticated = !!socket.user;
  
  if (isAuthenticated) {
    const userData = {
      username: socket.user.username,
      userId: socket.user.userId,
      isAuthenticated: true,
      joinedAt: new Date(),
      socketId: socket.id
    };
    onlineUsers.set(socket.id, userData);
    console.log(`👤 Authenticated user connected: ${socket.user.username}`);
  } else {
    console.log('👀 Guest viewer connected (view-only)');
  }
  
  // Broadcast total online count (auth + viewers) to everyone immediately
  const totalCount = connectedSockets.size;
  io.emit('online_count', totalCount);
  
  // Handle typing indicator
  socket.on('typing', async (data) => {
    socket.broadcast.emit('user_typing', {
      username: data.username,
      isTyping: data.isTyping
    });
    
    // Store in Redis with 3-second expiry
    if (data.isTyping) {
      try {
        await redis.setex(`typing:${socket.id}`, 3, data.username);
      } catch (error) {
        // Silently fail Redis errors
      }
    } else {
      try {
        await redis.del(`typing:${socket.id}`);
      } catch (error) {
        // Silently fail Redis errors
      }
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('🔴 Client disconnected:', socket.id);
    
    // Get user data before removing
    const user = onlineUsers.get(socket.id);
    
    // Remove from all connection tracking
    connectedSockets.delete(socket.id);
    onlineUsers.delete(socket.id);
    
    // Broadcast updated total count to everyone
    const totalCount = connectedSockets.size;
    io.emit('online_count', totalCount);
    
    // Only do auth-specific cleanup if it was an authenticated user
    if (user) {
      try {
        await redis.del(`typing:${socket.id}`);
        await redisPublisher.publish('chat', JSON.stringify({
          type: 'online_count',
          data: totalCount
        }));
      } catch (error) {
        console.log('Redis error (non-critical):', error.message);
      }
    }
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Disconnect Redis
  if (redis) {
    await redis.quit();
    console.log('Redis disconnected');
  }
  
  // Close MongoDB connection
  if (mongoClient) {
    await mongoClient.close();
    console.log('MongoDB disconnected');
  }
  
  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
connectDB().then(() => {
  // Use 0.0.0.0 to accept connections from outside (required for Render)
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`🔌 Socket.io ready`);
    console.log(`🔐 Auth system enabled (HTTP-only cookies)`);
    if (REDIS_URL) {
      console.log(`📡 Redis configured (Upstash)`);
    } else {
      console.log(`⚠️  Running without Redis (some features limited)`);
    }
    console.log(`\n✅ Ready for connections!\n`);
  });
});