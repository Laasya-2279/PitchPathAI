/**
 * Stadium API Routes
 * 
 * GET /api/stadium/info    — stadium knowledge base
 * GET /api/stadium/match   — live match data
 * GET /api/stadium/facilities — all facilities
 */

const express = require('express');
const router = express.Router();
const knowledgeBase = require('../services/knowledgeBase');
const liveMatchAPI = require('../services/liveMatchAPI');
const { getConnectionStatus } = require('../config/database');
const logger = require('../utils/logger');

/**
 * GET /api/stadium/info
 * Query: ?topic=history (optional — defaults to general)
 */
router.get('/info', async (req, res) => {
  try {
    const topic = req.query.topic || 'general';
    const result = await knowledgeBase.getStadiumInfo(topic);
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error('Stadium info error:', err);
    res.status(500).json({ error: 'Failed to fetch stadium info.' });
  }
});

/**
 * GET /api/stadium/match
 * Returns current live match state
 */
router.get('/match', async (req, res) => {
  try {
    const state = await liveMatchAPI.getCachedMatchData();
    if (!state) {
      return res.json({ success: false, error: 'Live data temporarily unavailable' });
    }
    res.json({ success: true, match: state });
  } catch (err) {
    logger.error('Match data error:', err);
    res.status(500).json({ error: 'Failed to fetch match data.' });
  }
});

/**
 * GET /api/stadium/facilities
 * Returns all facilities (from MongoDB or fallback)
 */
router.get('/facilities', async (req, res) => {
  try {
    if (getConnectionStatus().connected) {
      const Facility = require('../models/Facility');
      const facilities = await Facility.find({}).lean();
      return res.json({ success: true, facilities, source: 'mongodb' });
    }

    // Fallback to graph data
    const { nodes } = require('../data/stadiumGraph');
    const facilities = nodes
      .filter(n => ['washroom', 'food', 'medical', 'gate', 'vip'].includes(n.type))
      .map(n => ({ facility_id: n.id, type: n.type, name: n.name, position: n.position }));

    res.json({ success: true, facilities, source: 'fallback' });
  } catch (err) {
    logger.error('Facilities error:', err);
    res.status(500).json({ error: 'Failed to fetch facilities.' });
  }
});

/**
 * GET /api/stadium/db-status
 * Returns MongoDB connection status
 */
router.get('/db-status', (req, res) => {
  res.json({ success: true, ...getConnectionStatus() });
});

module.exports = router;
