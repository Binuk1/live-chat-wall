const { MongoClient } = require('mongodb');
require('dotenv').config();

// Hardcode your credentials here temporarily for testing
const USERNAME = 'binukcodm_db_user';   
const PASSWORD = 'hJazInSfTSOREHcq';  // Replace with your actual password
const CLUSTER = 'cluster0.p1wf4l8.mongodb.net';  // Replace with your cluster

// Option 1: Use .env
const uri1 = process.env.MONGODB_URI;

// Option 2: Build manually (try this if .env is wrong)
const uri2 = `mongodb+srv://${USERNAME}:${PASSWORD}@${CLUSTER}/?retryWrites=true&w=majority`;

async function test(uri, name) {
  console.log(`\n🔍 Testing ${name}...`);
  const masked = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
  console.log(`URI: ${masked}`);
  
  const client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
  });
  
  try {
    await client.connect();
    console.log(`✅ ${name} - SUCCESS!`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} - FAILED: ${error.message}`);
    return false;
  } finally {
    await client.close();
  }
}

async function main() {
  console.log('=== MongoDB Authentication Test ===\n');
  
  // Test with .env
  if (process.env.MONGODB_URI) {
    await test(process.env.MONGODB_URI, '.env connection string');
  } else {
    console.log('⚠️ No MONGODB_URI found in .env');
  }
  
  // Test with manual entry
  if (USERNAME !== 'YOUR_USERNAME') {
    await test(uri2, 'Manually entered credentials');
  }
  
  console.log('\n💡 Tip: If manual test works, your .env has wrong credentials');
  console.log('💡 Tip: If both fail, check if username/password are correct in Atlas');
}

main();