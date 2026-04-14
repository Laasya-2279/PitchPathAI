/**
 * Routing API Routes
 * 
 * POST /api/route    - Calculate crowd-aware route between two zones
 * POST /api/voice    - Process voice transcript and return intent + route
 * GET  /api/nearest  - Find nearest facility of a given type
 */

const express = require('express');
const router = express.Router();
const routingEngine = require('../services/routingEngine');
const intentParser = require('../services/intentParser');
const crowdSimulator = require('../services/crowdSimulator');

/**
 * POST /api/route
 * Body: { from: string, to: string }
 * Returns: optimized route with steps, warnings, estimated time
 */
router.post('/route', (req, res) => {
  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res.status(400).json({ error: 'Both "from" and "to" fields are required.' });
    }

    const crowdData = crowdSimulator.getSnapshot().densityMap;
    const route = routingEngine.findRoute(from, to, crowdData);

    if (route.error) {
      return res.status(404).json({ error: route.error });
    }

    res.json({
      success: true,
      route,
      crowdSnapshot: crowdData,
    });
  } catch (err) {
    console.error('Route calculation error:', err);
    res.status(500).json({ error: 'Failed to calculate route.' });
  }
});

/**
 * POST /api/voice
 * Body: { transcript: string, currentLocation?: string }
 * Returns: parsed intent, generated response, and optional route
 */
router.post('/voice', async (req, res) => {
  try {
    const { transcript, currentLocation = 'gate_1' } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required.' });
    }

    const result = await intentParser.parse(transcript, currentLocation);

    // If navigation intent, calculate route
    if (result.action === 'navigate' && result.destination) {
      const crowdData = crowdSimulator.getSnapshot().densityMap;
      const route = routingEngine.findRoute(currentLocation, result.destination, crowdData);

      if (!route.error) {
        // Enhance response with route details
        const warnings = route.warnings.filter(w => w.density > 0.7);
        let enhancedResponse = result.response;

        if (warnings.length > 0) {
          enhancedResponse += ` Heads up: avoid ${warnings.map(w => w.zoneName).join(' and ')} — ${warnings.length > 1 ? "they're" : "it's"} crowded.`;
        }

        enhancedResponse += ` Estimated arrival: ${route.estimatedTime} minutes.`;

        result.response = enhancedResponse;
        result.route = route;
      }
    }

    if (result.action === 'find_nearest' && result.facilityType) {
      const crowdData = crowdSimulator.getSnapshot().densityMap;
      const nearest = routingEngine.findNearest(currentLocation, result.facilityType, crowdData);

      if (!nearest.error) {
        result.route = nearest;
        const destinationName = nearest.pathNames ? nearest.pathNames[nearest.pathNames.length - 1] : nearest.path[nearest.path.length - 1];
        result.destination = nearest.path[nearest.path.length - 1];
        result.response = `The nearest ${result.facilityType} is ${destinationName}, about ${nearest.estimatedTime} minutes away. Opening navigation now.`;
        result.action = 'navigate';
      }
    }

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('Voice processing error:', err);
    res.status(500).json({ error: 'Failed to process voice command.' });
  }
});

/**
 * GET /api/nearest
 * Query: type (washroom|food|medical|gate), from (current location)
 */
router.get('/nearest', (req, res) => {
  try {
    const { type, from = 'gate_1' } = req.query;

    if (!type) {
      return res.status(400).json({ error: 'Facility type is required.' });
    }

    const crowdData = crowdSimulator.getSnapshot().densityMap;
    const result = routingEngine.findNearest(from, type, crowdData);

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    res.json({ success: true, route: result });
  } catch (err) {
    console.error('Nearest facility error:', err);
    res.status(500).json({ error: 'Failed to find nearest facility.' });
  }
});

module.exports = router;
