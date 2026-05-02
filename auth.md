Authentication System for Live Chat App
Add JWT-based authentication with signup/login to secure the chat and persist user identity across sessions.

JWT with HTTP-only Cookies (Secure)
How it works:

Backend sets JWT in HTTP-only cookie on login
Cookie auto-sent with every request (no frontend code needed)
Socket.io uses cookie for connection auth
Pros:

Secure - cookie can't be read by JavaScript (XSS protection)
Automatic - no manual header management
Industry standard for production apps
Cons:

Requires credentials: 'include' on all fetch/axios calls
Socket.io needs cookie-parser middleware
Slightly more backend config
Recommended: Option B (HTTP-only Cookies)
For a production chat app, security matters. HTTP-only cookies prevent token theft even if XSS occurs.

Implementation Structure
Backend Structure
backend/
├── server.js                    # Entry point (updated)
├── config/
│   └── auth.js                  # JWT config, middleware
├── models/
│   └── User.js                  # Mongoose User schema
├── routes/
│   ├── auth.js                  # POST /auth/signup, /auth/login
│   └── messages.js              # (extract from server.js)
├── middleware/
│   └── auth.js                  # JWT verification middleware
└── utils/
    └── hash.js                  # bcrypt helpers
Frontend Structure
frontend/src/
├── pages/
│   ├── Auth/
│   │   ├── Auth.css
│   │   ├── Login.jsx            # Login form
│   │   └── Signup.jsx           # Signup form
│   └── Chat/
│       └── (existing chat)
├── components/
│   └── ProtectedRoute.jsx       # Route guard
├── hooks/
│   ├── useAuth.js               # Auth state & login/logout
│   └── useSocket.js             # (updated for auth)
├── services/
│   ├── api.js                   # (updated with credentials)
│   └── auth.js                  # Auth API calls
└── context/
    └── AuthContext.jsx          # Global auth state
Key Changes
1. Backend Dependencies
Add: bcrypt, jsonwebtoken, cookie-parser

2. Backend Middleware
javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
 
const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
3. User Model (MongoDB)
javascript
// models/User.js
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
4. Auth Routes
POST /api/auth/signup - Create user, set cookie
POST /api/auth/login - Verify, set cookie
POST /api/auth/logout - Clear cookie
GET /api/auth/me - Get current user from token
5. Frontend Flow
App loads → AuthContext checks /api/auth/me
If authenticated → show Chat
If not → redirect to /login
Login success → cookie set, redirect to /chat
Socket.io connects with auth cookie automatically
6. ProtectedRoute Component
jsx
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};
Migration Notes
Current "anonymous" chat will still work
Existing useUsername hook can be deprecated
Username will come from req.user.username (server-verified)