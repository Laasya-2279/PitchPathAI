/**
 * PitchPath AI — Backend Server (v2)
 * 
 * Express + Socket.io server for smart stadium navigation.
 * - REST API for routing, voice, crowd, stadium, and simulation
 * - WebSocket for real-time crowd density broadcast
 * - Crowd simulator runs on 3-second interval
 * - Match simulator runs on 10-second interval
 * - MongoDB Atlas integration with graceful fallback
 */

require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const { connectDB, getConnectionStatus } = require('./config/database');
const crowdSimulator = require('./services/crowdSimulator');
const liveMatchAPI = require('./services/liveMatchAPI');
const routingRoutes = require('./routes/routing');
const crowdRoutes = require('./routes/crowd');
const stadiumRoutes = require('./routes/stadium');
const simulationRoutes = require('./routes/simulation');

// --- Configuration ---
const PORT = process.env.PORT || 3001;
const CROWD_UPDATE_INTERVAL = 3000; // 3 seconds
const MATCH_UPDATE_INTERVAL = 10000; // 10 seconds

// --- Express App ---
const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json());

// --- API Routes ---
app.use('/api', routingRoutes);
app.use('/api/crowd', crowdRoutes);
app.use('/api/stadium', stadiumRoutes);
app.use('/api/simulate', simulationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PitchPath AI Backend v2',
    uptime: process.uptime(),
    mongodb: getConnectionStatus(),
    mode: crowdSimulator.getMode(),
  });
});

// --- HTTP Server + Socket.io ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
  },
});

// --- Socket.io Connection Handler ---
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Send initial crowd data
  crowdSimulator.getSnapshot().then(snapshot => {
    socket.emit('crowd:update', snapshot);
  });

  // Send initial match data
  liveMatchAPI.getCachedMatchData().then(matchData => {
    socket.emit('match:update', matchData);
  });

  // Handle client requesting specific zone info
  socket.on('zone:query', async (zoneId) => {
    const zoneInfo = await crowdSimulator.getZoneInfo(zoneId);
    socket.emit('zone:info', zoneInfo);
  });

  // Handle route requests via socket
  socket.on('route:request', async ({ from, to }) => {
    const routingEngine = require('./services/routingEngine');
    const snapshot = await crowdSimulator.getSnapshot();
    const route = routingEngine.findRoute(from, to, snapshot.densityMap);
    socket.emit('route:result', route);
  });

  // Handle mode change via socket
  socket.on('simulate:mode', (mode) => {
    crowdSimulator.setMode(mode);
    io.emit('simulate:mode_changed', { mode: crowdSimulator.getMode() });
  });

  // Handle density injection via socket
  socket.on('simulate:inject', async ({ zoneId, density }) => {
    crowdSimulator.injectDensity(zoneId, density);
    const snapshot = await crowdSimulator.getSnapshot();
    io.emit('crowd:update', snapshot);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// --- Crowd Simulation Interval ---
// Changed to 5 seconds per requirements
const REAL_CROWD_INTERVAL = 5000;
setInterval(async () => {
  const snapshot = await crowdSimulator.generate();
  io.emit('crowd:update', snapshot);
}, REAL_CROWD_INTERVAL);

// --- Match API Polling ---
// Starts the external API fetcher that caches to MongoDB
liveMatchAPI.startPolling();

// Instead of simulating locally here, we'll blast updates from the cached DB
setInterval(async () => {
  const matchData = await liveMatchAPI.getCachedMatchData();
  io.emit('match:update', matchData);
}, MATCH_UPDATE_INTERVAL);

// --- Start Server ---
async function startServer() {
  // Try MongoDB connection (non-blocking)
  await connectDB();

  httpServer.listen(PORT, () => {
    const db = getConnectionStatus();
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║       🏟️  PitchPath AI Backend v2        ║');
    console.log(`  ║       Running on port ${PORT}              ║`);
    console.log(`  ║       MongoDB: ${db.connected ? '✅ Connected' : '⚠ Fallback'}            ║`);
    console.log('  ║       Crowd updates every 3s             ║');
    console.log('  ║       Match updates every 10s            ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');
    console.log(`  REST API:     http://localhost:${PORT}/api`);
    console.log(`  Socket.io:    http://localhost:${PORT}`);
    console.log(`  Health:       http://localhost:${PORT}/api/health`);
    console.log(`  Stadium Info: http://localhost:${PORT}/api/stadium/info`);
    console.log(`  Match Data:   http://localhost:${PORT}/api/stadium/match`);
    console.log(`  Simulation:   http://localhost:${PORT}/api/simulate/scenarios`);
    console.log('');
  });
}

startServer();
