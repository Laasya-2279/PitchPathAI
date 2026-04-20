const decisionEngine = require('../services/decisionEngine');
const crowdSimulator = require('../services/crowdSimulator');

jest.mock('../config/database', () => ({
  getConnectionStatus: jest.fn(() => ({ connected: false }))
}));

describe('Decision Engine', () => {
  test('returns a recommendation object for facilities', async () => {
    const result = await decisionEngine.recommendFacility('gate_1', 'washroom');
    expect(result).toHaveProperty('best');
    expect(result).toHaveProperty('comparisonText');
    expect(result).toHaveProperty('options');
  });

  test('recommends valid facility from stadium graph', async () => {
    const result = await decisionEngine.recommendFacility('gate_1', 'food');
    expect(result.best.facility.type).toBe('food');
    expect(result.best.route).toBeDefined();
  });

  test('handles invalid facility type gracefully', async () => {
    const result = await decisionEngine.recommendFacility('gate_1', 'invalid_type');
    expect(result.error).toBeDefined();
  });

  test('handles invalid starting location gracefully', async () => {
    const result = await decisionEngine.recommendFacility('INVALID_LOCATION', 'washroom');
    expect(result.error).toBeDefined();
  });

  test('returns natural language reason string', async () => {
    const result = await decisionEngine.recommendFacility('gate_1', 'washroom');
    expect(typeof result.comparisonText).toBe('string');
    expect(result.comparisonText.length).toBeGreaterThan(10);
  });

  test('calculates and sorts options by score', async () => {
    const result = await decisionEngine.recommendFacility('block_A', 'food');
    if (result.options.length > 1) {
      expect(result.options[0].score).toBeLessThanOrEqual(result.options[1].score);
    }
    
    result.options.forEach(opt => {
      expect(isFinite(opt.score)).toBe(true);
      expect(opt.score).toBeGreaterThanOrEqual(0);
      expect(opt.score).toBeLessThanOrEqual(1.0);
    });
  });
});
