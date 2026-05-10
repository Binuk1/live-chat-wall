// backend/scripts/make-admin.js — Promote user to admin or moderator
// Usage: node scripts/make-admin.js <username> [role]
// Roles: admin, moderator (default: admin)

const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env');
  process.exit(1);
}

const username = process.argv[2];
const role = process.argv[3] || 'admin';

if (!username) {
  console.error('❌ Usage: node scripts/make-admin.js <username> [role]');
  console.error('   Example: node scripts/make-admin.js john_doe admin');
  console.error('   Example: node scripts/make-admin.js jane_doe moderator');
  process.exit(1);
}

if (!['admin', 'moderator'].includes(role)) {
  console.error('❌ Role must be "admin" or "moderator"');
  process.exit(1);
}

async function makeAdmin() {
  const client = new MongoClient(MONGODB_URI, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('chat_wall');
    const usersCollection = db.collection('users');

    // Find user
    const user = await usersCollection.findOne({ username });
    
    if (!user) {
      console.error(`❌ User "${username}" not found`);
      console.log('Available users:');
      const users = await usersCollection.find({}, { projection: { username: 1, role: 1 } }).toArray();
      users.forEach(u => console.log(`  - ${u.username} (${u.role || 'user'})`));
      process.exit(1);
    }

    // Update role
    const result = await usersCollection.updateOne(
      { username },
      { $set: { role } }
    );

    if (result.modifiedCount === 1) {
      console.log(`✅ User "${username}" promoted to ${role}!`);
      console.log('You will need to log out and log back in for the new role to take effect.');
    } else {
      console.log(`ℹ️ User "${username}" is already ${role}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

makeAdmin();
