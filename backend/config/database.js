/**
 * Database Connection — MongoDB Atlas with Graceful Fallback
 * 
 * Connects to MongoDB Atlas via Mongoose. If connection fails,
 * the app continues running with in-memory data (no crash).
 */

const mongoose = require('mongoose');

let isConnected = false;
let connectionError = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('[MongoDB] No MONGODB_URI found in .env — running in fallback mode (in-memory data)');
    return false;
  }

  try {
    await mongoose.connect(uri, {
      dbName: 'pitchpath',
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    isConnected = true;
    console.log('[MongoDB] ✅ Connected to Atlas successfully');

    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] Connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected from Atlas');
      isConnected = false;
    });

    return true;
  } catch (err) {
    connectionError = err.message;
    console.warn(`[MongoDB] ⚠ Connection failed: ${err.message}`);
    console.warn('[MongoDB] Running in fallback mode (in-memory data)');
    return false;
  }
}

function getConnectionStatus() {
  return {
    connected: isConnected,
    error: connectionError,
    state: mongoose.connection.readyState, // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  };
}

module.exports = { connectDB, getConnectionStatus };
