const intentParser = require('../services/intentParser');

jest.mock('../services/decisionEngine', () => ({
  recommendFacility: jest.fn(() => Promise.resolve({
    best: { facility: { name: 'Food Plaza', id: 'food_1' }, route: { estimatedTime: 5 } },
    comparisonText: 'Recommended: Food Plaza',
    options: []
  }))
}));

jest.mock('../services/crowdSimulator', () => ({
  getSnapshot: jest.fn(() => Promise.resolve({
    zones: [{ id: 'gate_2', density: 0.5, name: 'Gate 2' }],
    summary: { averageDensity: 0.3, hotspotCount: 0, hotspots: [] }
  })),
  getZoneInfo: jest.fn((id) => Promise.resolve({
    id, name: 'Test Zone', density: 0.5, queueTime: 5
  })),
  getMode: jest.fn(() => 'normal')
}));

jest.mock('../services/knowledgeBase', () => ({
  getStadiumInfo: jest.fn((text) => {
    if (text.includes('invalid')) return Promise.reject(new Error('DB Error'));
    return Promise.resolve({ 
      response: 'Stadium info', 
      data: {}, 
      category: 'general' 
    });
  })
}));

jest.mock('../services/liveMatchAPI', () => ({
  getCachedMatchData: jest.fn(() => Promise.resolve({
    teams: { team1: 'Ind', team2: 'Aus' },
    score: { team1: { runs: 280, wickets: 3 }, team2: { runs: 150, wickets: 5 } },
    status: 'Live',
    batting_team: 'Ind',
    innings: 1
  }))
}));

describe('Intent Parser - Happy Path', () => {
  const cases = [
    ['hello', 'greeting', {}],
    ['help me', 'help', {}],
    ['take me to block m', 'navigate', { destination: 'block_M' }],
    ['navigate to gate 2', 'navigate', { destination: 'gate_2' }],
    ['how do i get to block a', 'navigate', { destination: 'block_A' }],
    ['nearest washroom', 'navigate', { action: 'find_nearest', facilityType: 'washroom' }],
    ['is gate 2 crowded', 'query', { zone: 'gate_2', queryType: 'crowd' }],
    ['should i go to food now', 'decision_query', { facilityType: 'food' }],
    ['what is the score', 'live_match_query', {}],
    ['whats the match status', 'live_match_query', {}],
    ['tell me about the stadium', 'stadium_info', {}],
    ['how many people are here', 'query', { queryType: 'crowd_general' }],
  ];

  test.each(cases)('"%s" → intent: %s', async (input, expectedIntent, expectedEntities) => {
    const result = await intentParser.parse(input);
    expect(result.intent).toBe(expectedIntent);
    
    Object.entries(expectedEntities).forEach(([key, val]) => {
      expect(result[key]).toBe(val);
    });
  });
});

describe('Intent Parser - Edge Cases & Coverage', () => {
  test('empty string returns unknown intent', async () => {
    const result = await intentParser.parse('');
    expect(result.intent).toBe('unknown');
  });

  test('null input returns unknown', async () => {
    const result = await intentParser.parse(null);
    expect(result.intent).toBe('unknown');
  });

  test('stadium query error handled', async () => {
    const result = await intentParser.parse('tell me about invalid stadium');
    expect(result.intent).toBe('unknown');
  });

  test('match query null state handled', async () => {
    const liveMatchAPI = require('../services/liveMatchAPI');
    liveMatchAPI.getCachedMatchData.mockResolvedValueOnce(null);
    const result = await intentParser.parse('what is the score');
    expect(result.response).toContain('unavailable');
  });

  test('mixed case and whitespace', async () => {
    const result = await intentParser.parse('  TAKE me TO Block A  ');
    expect(result.intent).toBe('navigate');
    expect(result.destination).toBe('block_A');
  });

  test('unrecognized input returns unknown with fallback response', async () => {
    const result = await intentParser.parse('xyz123nonsense');
    expect(result.intent).toBe('unknown');
    expect(result.response).toContain('catch that');
  });
});
