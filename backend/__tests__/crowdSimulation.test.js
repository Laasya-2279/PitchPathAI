const crowdSimulator = require('../services/crowdSimulator');
const { nodes } = require('../data/stadiumGraph');

// Mocking dependencies to avoid DB/Firebase calls in logic tests
jest.mock('../config/database', () => ({
  getConnectionStatus: jest.fn(() => ({ connected: false }))
}));
jest.mock('../config/firebase-admin', () => ({
  db: null
}));

describe('Crowd Simulation', () => {
  test('density values are always between 0 and 100 (normalized 0-1)', async () => {
    const data = await crowdSimulator.generate();
    data.zones.forEach(zone => {
      expect(zone.density).toBeGreaterThanOrEqual(0);
      expect(zone.density).toBeLessThanOrEqual(1.0);
    });
  });

  test('no density value is NaN', async () => {
    const data = await crowdSimulator.getSnapshot();
    data.zones.forEach(zone => {
      expect(isNaN(zone.density)).toBe(false);
    });
  });

  test('queue time is non-negative or null', async () => {
    const data = await crowdSimulator.generate();
    data.zones.forEach(zone => {
      if (zone.queueTime !== null) {
        expect(zone.queueTime).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test('match_day mode produces higher average density than normal mode', async () => {
    crowdSimulator.setMode('normal');
    const normal = await crowdSimulator.generate();
    
    crowdSimulator.setMode('match_day');
    const matchday = await crowdSimulator.generate();
    
    expect(matchday.summary.averageDensity).toBeGreaterThan(normal.summary.averageDensity);
  });

  test('each zone has required fields', async () => {
    const data = await crowdSimulator.getSnapshot();
    data.zones.forEach(zone => {
      expect(zone).toHaveProperty('density');
      expect(zone).toHaveProperty('queueTime');
      expect(zone).toHaveProperty('status');
      expect(zone).toHaveProperty('id');
    });
  });

  test('simulation contains all stadium zones', async () => {
    const expectedZoneIds = nodes.map(n => n.id);
    const data = await crowdSimulator.getSnapshot();
    const actualZoneIds = data.zones.map(z => z.id);
    
    expect(actualZoneIds).toEqual(expect.arrayContaining(expectedZoneIds));
  });
});
