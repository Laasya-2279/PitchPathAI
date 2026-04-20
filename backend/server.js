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
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { connectDB, getConnectionStatus } = require('./config/database');
const logger = require('./utils/logger');
const crowdSimulator = require('./services/crowdSimulator');
const liveMatchAPI = require('./services/liveMatchAPI');
const routingRoutes = require('./routes/routing');
const crowdRoutes = require('./routes/crowd');
const stadiumRoutes = require('./routes/stadium');
const simulationRoutes = require('./routes/simulation');
const voiceRoutes = require('./routes/voice');

// --- Configuration ---
const PORT = process.env.PORT || 3001;
const CROWD_UPDATE_INTERVAL = 3000; // 3 seconds
const MATCH_UPDATE_INTERVAL = 10000; // 10 seconds

// --- Express App ---
const app = express();
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
// --- Security Hardening ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://www.googletagmanager.com", "https://*.firebaseio.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://maps.gstatic.com", "https://*.google.com", "https://*.googleapis.com"],
      connectSrc: ["'self'", "wss:", "https://*.firebaseio.com", "https://*.googleapis.com", "https://*.google-analytics.com"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});

const voiceLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: 'Voice query limit reached. Wait a moment.' }
});

app.use(globalLimiter);
app.use('/api/voice/tts', voiceLimiter);
app.use('/api/voice/stt', voiceLimiter);

app.use(express.json());

// --- API Routes ---
app.use('/api', routingRoutes);
app.use('/api/crowd', crowdRoutes);
app.use('/api/stadium', stadiumRoutes);
app.use('/api/simulate', simulationRoutes);
app.use('/api/voice', voiceRoutes);

app.disable('x-powered-by');

// Global Health check for Render
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

// API Health check
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
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// --- Socket.io Connection Handler ---
io.on('connection', (socket) => {
  logger.info(`[Socket.io] Client connected: ${socket.id}`);

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
    logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// --- Crowd Simulation Interval ---
if (process.env.NODE_ENV !== 'test') {
  const REAL_CROWD_INTERVAL = 5000;
  setInterval(async () => {
    const snapshot = await crowdSimulator.generate();
    io.emit('crowd:update', snapshot);
  }, REAL_CROWD_INTERVAL);

  // --- Match API Polling ---
  liveMatchAPI.startPolling();

  setInterval(async () => {
    const matchData = await liveMatchAPI.getCachedMatchData();
    io.emit('match:update', matchData);
  }, MATCH_UPDATE_INTERVAL);
}

/**
 * Initializes and starts the PitchPath AI backend server.
 * Connects to MongoDB and starts listening for HTTP/Socket.io traffic.
 * @returns {Promise<void>}
 */
async function startServer() {
  try {
    // Try MongoDB connection (non-blocking)
    await connectDB();

    httpServer.listen(PORT, () => {
      const db = getConnectionStatus();
      logger.info('Stadium Server Boot Event', {
        port: PORT,
        mongodb: db.connected ? 'Connected' : 'Fallback Mode',
        intervals: { crowd: '5s', match: '10s' }
      });
    });
  } catch (err) {
    logger.error('Failed to start PitchPath AI server', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
