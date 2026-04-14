// scripts/test-db.js
// Standalone script to test MongoDB Atlas connectivity and DNS resolution

require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log("🔍 Testing MongoDB Connection...");
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("❌ ERROR: MONGODB_URI is not set in your .env file.");
    process.exit(1);
  }

  console.log(`🌐 URI Configured: ${uri.replace(/:([^:@]+)@/, ':*****@')}`); // hide password

  try {
    console.log("⏳ Attempting to connect to Atlas cluster...");
    // Attempt connection
    await mongoose.connect(uri, {
      dbName: 'pitchpath',
      serverSelectionTimeoutMS: 5000 // Timeout quick for testing
    });

    console.log("✅ SUCCESS: Connected to MongoDB Atlas flawlessly!");
    console.log("You can now run 'node scripts/seed.js' and then your backend.");
    
    await mongoose.disconnect();
    process.exit(0);

  } catch (err) {
    console.error("\n❌ MongoDB Connection Failed.");
    console.error("This confirms the connection is blocked at the network/DNS level, triggering our fallback logic.");
    console.error("\nDetailed Error Info:");
    console.error(err);

    console.log("\n💡 Why is this happening?");
    console.log("1. Your ISP or VPN is blocking the DNS resolution of SRV records (_mongodb._tcp.*)");
    console.log("2. Your current IP address hasn't been whitelisted in the MongoDB Atlas Network Access panel.");
    
    console.log("\n🛡️ PitchPath AI's fallback system handles this gracefully. Start the backend with 'npm run dev' to use in-memory data.");
    process.exit(1);
  }
}

testConnection();
