# 💬 Live Chat Wall

A real-time group chat app where anyone can join, pick a name, and start talking. No accounts, no friction — just open it and you're in.

## How it works

The frontend is built with React and talks to an Express backend over both REST and WebSockets. Messages are stored permanently in MongoDB Atlas, so chat history survives restarts. Real-time delivery — new messages, likes, typing indicators, online counts — all flow through Socket.io. Redis (Upstash) sits on top as a pub/sub layer, so if you ever scale to multiple backend instances they stay in sync without duplicating events.

## Frontend architecture

The codebase is intentionally layered. A `services/` layer handles all backend communication — HTTP calls via axios and the Socket.io singleton live here and nowhere else. Custom hooks own all state: `useMessages` is the sole owner of the message array, `useOnlineUsers` tracks presence, `useTypingUsers` handles typing indicators. Components just render what they're given.

## Why these choices

**Socket.io over raw WebSockets** — Automatic reconnection, polling fallback, and room support out of the box.

**Redis for pub/sub, not just caching** — Typing indicators stored with a 3s TTL so they auto-expire. Online users tracked in a Redis hash. Cross-instance event broadcasting via Redis channels means the app is ready to scale horizontally without rewriting the real-time layer.

**MongoDB for messages** — Flexible schema makes it easy to extend messages with reactions, threads, or attachments later without migrations.

## Where it's going

User accounts and auth first, then private channels and DMs, media uploads, and eventually a follow/friend system. The real-time infrastructure is already production-grade for that; the work is building the social graph and identity layer on top.