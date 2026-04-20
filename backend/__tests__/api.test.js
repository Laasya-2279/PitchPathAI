const request = require('supertest');
const app = require('../server');

// Mock dependencies to avoid side effects during API tests
jest.mock('../config/database', () => ({
  connectDB: jest.fn(),
  getConnectionStatus: jest.fn(() => ({ connected: false, status: 'mocked' }))
}));
jest.mock('../services/crowdSimulator', () => ({
  getSnapshot: jest.fn(() => Promise.resolve({
    densityMap: {},
    summary: { averageDensity: 10, hotspots: [] }
  })),
  generate: jest.fn(),
  getMode: jest.fn(() => 'normal')
}));
jest.mock('../services/liveMatchAPI', () => ({
  getCachedMatchData: jest.fn(() => Promise.resolve({ score: '0-0' })),
  startPolling: jest.fn()
}));

describe('API Endpoints', () => {
  describe('GET /health', () => {
    test('returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    test('response includes timestamp', async () => {
      const res = await request(app).get('/health');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/health', () => {
    test('returns 200', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.service).toContain('PitchPath AI');
    });
  });

  describe('POST /api/route', () => {
    test('valid zones returns route array', async () => {
      const res = await request(app)
        .post('/api/route')
        .send({ from: 'gate_1', to: 'block_M' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.route.path)).toBe(true);
    });

    test('invalid zones returns 404', async () => {
      const res = await request(app)
        .post('/api/route')
        .send({ from: 'INVALID', to: 'ALSO_INVALID' });
      expect(res.status).toBe(404);
    });

    test('missing body returns 400', async () => {
      const res = await request(app)
        .post('/api/route')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/voice', () => {
    test('valid query returns response', async () => {
      const res = await request(app)
        .post('/api/voice')
        .send({ transcript: 'take me to block M' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('response');
      expect(res.body).toHaveProperty('intent');
    });

    test('response includes intent data', async () => {
      const res = await request(app)
        .post('/api/voice')
        .send({ transcript: 'nearest washroom' });
      expect(res.body.intent).toBe('navigate');
      expect(res.body.action).toBe('navigate'); // Translated from find_nearest internally
    });

    test('empty query returns 400', async () => {
      const res = await request(app)
        .post('/api/voice')
        .send({ transcript: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/stadium/match', () => {
    test('returns 200 and match data', async () => {
      const res = await request(app).get('/api/stadium/match');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('match');
    });
  });
});
