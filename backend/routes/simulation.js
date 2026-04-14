/**
 * Simulation API Routes
 * 
 * POST /api/simulate/scenario — run a test scenario
 * POST /api/simulate/mode     — toggle simulation mode
 * GET  /api/simulate/scenarios — list available scenarios
 * POST /api/simulate/inject   — inject density at a zone
 * POST /api/simulate/clear    — clear injected densities
 * GET  /api/simulate/logs     — get debug logs
 * POST /api/simulate/demo     — control demo mode
 */

const express = require('express');
const router = express.Router();
const scenarioEngine = require('../services/scenarioEngine');
const crowdSimulator = require('../services/crowdSimulator');
const matchSimulator = require('../services/matchSimulator');

/**
 * GET /api/simulate/scenarios
 * List all available test scenarios
 */
router.get('/scenarios', (req, res) => {
  res.json({ success: true, scenarios: scenarioEngine.listScenarios() });
});

/**
 * POST /api/simulate/scenario
 * Body: { scenarioId: string }
 * Run a test scenario and return results
 */
router.post('/scenario', async (req, res) => {
  try {
    const { scenarioId } = req.body;
    if (!scenarioId) {
      return res.status(400).json({ error: 'scenarioId is required.' });
    }

    const result = await scenarioEngine.runScenario(scenarioId);
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Scenario error:', err);
    res.status(500).json({ error: 'Failed to run scenario.' });
  }
});

/**
 * POST /api/simulate/mode
 * Body: { mode: 'normal' | 'match_day' }
 * Toggle the crowd simulation mode
 */
router.post('/mode', (req, res) => {
  const { mode } = req.body;
  if (!mode || !['normal', 'match_day'].includes(mode)) {
    return res.status(400).json({ error: 'Mode must be "normal" or "match_day".' });
  }

  crowdSimulator.setMode(mode);
  res.json({
    success: true,
    mode: crowdSimulator.getMode(),
    message: `Simulation mode set to: ${mode}`,
  });
});

/**
 * POST /api/simulate/inject
 * Body: { zoneId: string, density: number }
 * Inject a specific density for testing
 */
router.post('/inject', (req, res) => {
  const { zoneId, density } = req.body;
  if (!zoneId || density === undefined) {
    return res.status(400).json({ error: 'zoneId and density are required.' });
  }

  crowdSimulator.injectDensity(zoneId, density);
  res.json({
    success: true,
    message: `Injected ${(density * 100).toFixed(0)}% density at ${zoneId}`,
  });
});

/**
 * POST /api/simulate/clear
 * Clear all injected densities
 */
router.post('/clear', (req, res) => {
  crowdSimulator.clearInjections();
  res.json({ success: true, message: 'All density injections cleared.' });
});

/**
 * GET /api/simulate/logs
 * Get recent debug logs
 */
router.get('/logs', (req, res) => {
  const count = parseInt(req.query.count) || 30;
  res.json({
    success: true,
    logs: crowdSimulator.getLogs(count),
    mode: crowdSimulator.getMode(),
  });
});

/**
 * GET /api/simulate/status
 * Get current simulation status
 */
router.get('/status', (req, res) => {
  const snapshot = crowdSimulator.getSnapshot();
  const matchState = matchSimulator.getState();

  res.json({
    success: true,
    mode: crowdSimulator.getMode(),
    tick: snapshot.tick,
    averageDensity: snapshot.summary.averageDensity,
    hotspots: snapshot.summary.hotspotCount,
    matchStatus: matchState.status,
    matchScore: `${matchState.batting_team} ${
      matchState.innings === 1 ? matchState.score.team1.runs : matchState.score.team2.runs
    }/${matchState.innings === 1 ? matchState.score.team1.wickets : matchState.score.team2.wickets}`,
  });
});

module.exports = router;
