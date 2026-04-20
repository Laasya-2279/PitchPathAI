/**
 * Crowd API Routes
 * 
 * GET /api/crowd          - Get current crowd snapshot
 * GET /api/crowd/:zoneId  - Get specific zone info
 */

const express = require('express');
const router = express.Router();
const crowdSimulator = require('../services/crowdSimulator');
const logger = require('../utils/logger');

/**
 * GET /api/crowd
 * Returns full crowd data snapshot with all zones
 */
router.get('/', async (req, res) => {
  try {
    const snapshot = await crowdSimulator.getSnapshot();
    res.json({ success: true, ...snapshot });
  } catch (err) {
    logger.error('Crowd data error:', err);
    res.status(500).json({ error: 'Failed to get crowd data.' });
  }
});

/**
 * GET /api/crowd/:zoneId
 * Returns specific zone information
 */
router.get('/:zoneId', async (req, res) => {
  try {
    const zoneInfo = await crowdSimulator.getZoneInfo(req.params.zoneId);

    if (!zoneInfo) {
      return res.status(404).json({ error: `Zone "${req.params.zoneId}" not found.` });
    }

    res.json({ success: true, zone: zoneInfo });
  } catch (err) {
    logger.error('Zone info error:', err);
    res.status(500).json({ error: 'Failed to get zone info.' });
  }
});

module.exports = router;
