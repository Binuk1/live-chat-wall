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
const { authenticateSocket } = require('./middleware/auth.js');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

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

// API Routes (Auth)
app.use('/api/auth', (req, res, next) => {
  req.app.locals.db = db;
  next();
}, authRoutes);

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
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// API Routes (REST endpoints)
app.get('/api/messages', async (req, res) => {
  try {
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

app.post('/api/messages', async (req, res) => {
  try {
    if (!messagesCollection) {
      return res.status(500).json({ error: 'Database not connected yet' });
    }
    
    const { username, text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    const message = {
      username: username || 'Anonymous',
      text: text.trim(),
      timestamp: new Date(),
      likes: 0,
      createdAt: new Date()
    };
    
    const result = await messagesCollection.insertOne(message);
    const savedMessage = { ...message, _id: result.insertedId };
    
    // Emit to all connected clients via Socket.io
    io.emit('new_message', savedMessage);
    
    // Publish to Redis for any other server instances
    try {
      await redisPublisher.publish('chat', JSON.stringify({
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

app.post('/api/messages/:id/like', async (req, res) => {
  try {
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
    io.emit('message_liked', updatedMessage);
    
    try {
      await redisPublisher.publish('chat', JSON.stringify({
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

// Get online users count
app.get('/api/online-count', async (req, res) => {
  try {
    const count = onlineUsers.size;
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io Authentication Middleware
io.use(authenticateSocket);

// Socket.io Connection Handling
io.on('connection', (socket) => {
  console.log('🟢 New client connected:', socket.id);
  
  // Determine username from auth or use anonymous
  const isAuthenticated = !!socket.user;
  const username = socket.user?.username || null;
  
  // Add user to online users immediately on connection
  const userData = {
    username: username,
    userId: socket.user?.userId || null,
    isAuthenticated: isAuthenticated,
    joinedAt: new Date(),
    socketId: socket.id
  };
  onlineUsers.set(socket.id, userData);
  
  console.log(`👤 User connected: ${username || 'Anonymous'} (${isAuthenticated ? 'authenticated' : 'guest'})`);
  
  // Broadcast updated online count to everyone immediately
  const userCount = onlineUsers.size;
  io.emit('online_count', userCount);
  
  // Handle user joining (username entry for anonymous users)
  socket.on('user_joined', async (providedUsername) => {
    const user = onlineUsers.get(socket.id);
    
    // If already authenticated, use that username
    // Otherwise use provided username
    const finalUsername = user?.isAuthenticated 
      ? user.username 
      : (providedUsername || 'Anonymous');
    
    if (user && !user.isAuthenticated) {
      user.username = finalUsername;
    }
    
    // Store in Redis if available
    try {
      await redis.hset('online_users', socket.id, finalUsername);
    } catch (error) {
      console.log('Redis hset error (non-critical):', error.message);
    }
    
    // Publish count update via Redis for multi-server setups
    try {
      await redisPublisher.publish('chat', JSON.stringify({
        type: 'online_count',
        data: userCount
      }));
    } catch (error) {
      console.log('Redis publish error (non-critical):', error.message);
    }
    
    // Send current online users to the new user
    const users = Array.from(onlineUsers.values()).map(u => u.username || 'Anonymous');
    socket.emit('online_users', users);
    
    // Broadcast user joined message
    io.emit('user_joined_message', { username: finalUsername, count: userCount });
  });
  
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
    const user = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    
    try {
      await redis.hdel('online_users', socket.id);
      await redis.del(`typing:${socket.id}`);
    } catch (error) {
      // Silently fail Redis errors
    }
    
    const userCount = onlineUsers.size;
    io.emit('online_count', userCount);
    
    try {
      await redisPublisher.publish('chat', JSON.stringify({
        type: 'online_count',
        data: userCount
      }));
    } catch (error) {
      console.log('Redis publish error (non-critical):', error.message);
    }
    
    if (user?.username) {
      io.emit('user_left_message', { username: user.username, count: userCount });
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