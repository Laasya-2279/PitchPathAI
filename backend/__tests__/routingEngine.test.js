const routingEngine = require('../services/routingEngine');
const { nodes } = require('../data/stadiumGraph');

describe('Routing Engine - Core', () => {
  test('returns valid path array between two connected zones', () => {
    const result = routingEngine.findRoute('block_A', 'block_M');
    expect(result.error).toBeUndefined();
    expect(Array.isArray(result.path)).toBe(true);
    expect(result.path.length).toBeGreaterThan(0);
    expect(result.path[0]).toBe('block_A');
    expect(result.path[result.path.length - 1]).toBe('block_M');
  });

  test('source zone is always first element', () => {
    const result = routingEngine.findRoute('block_B', 'gate_1');
    expect(result.path[0]).toBe('block_B');
  });

  test('destination zone is always last element', () => {
    const result = routingEngine.findRoute('block_B', 'gate_1');
    expect(result.path[result.path.length - 1]).toBe('gate_1');
  });

  test('same source and destination returns single-element array', () => {
    const result = routingEngine.findRoute('block_A', 'block_A');
    expect(result.path).toEqual(['block_A']);
    expect(result.distance).toBe(0);
  });

  test('invalid source zone returns error', () => {
    const result = routingEngine.findRoute('INVALID_ZONE', 'block_M');
    expect(result.error).toBeDefined();
  });

  test('invalid destination returns error', () => {
    const result = routingEngine.findRoute('block_A', 'INVALID_ZONE');
    expect(result.error).toBeDefined();
  });

  test('null inputs do not throw', () => {
    expect(() => routingEngine.findRoute(null, null)).not.toThrow();
  });

  test('route contains only valid zone names', () => {
    const validZoneIds = nodes.map(n => n.id);
    const result = routingEngine.findRoute('block_A', 'block_R');
    result.path.forEach(zoneId => {
      expect(validZoneIds).toContain(zoneId);
    });
  });
});

describe('Routing Engine - Crowd Awareness', () => {
  test('crowd-weighted route avoids high-density zones', () => {
    const start = 'gate_1';
    const end = 'block_B';
    
    // Normal route (direct connection typically)
    const normalResult = routingEngine.findRoute(start, end, {});
    
    // Set direct destination or middle node to high density
    // Let's assume Block B is directly connected to Gate 1.
    // If we pack B, the "distance" or penalty should increase.
    const crowdedData = { 'block_B': 0.95 };
    const crowdedResult = routingEngine.findRoute(start, end, crowdedData);
    
    expect(crowdedResult.distance).toBeGreaterThan(normalResult.distance);
  });

  test('crowd-weighted route is still valid (has start and end)', () => {
    const result = routingEngine.findRoute('block_A', 'block_R', { 'block_B': 0.99 });
    expect(result.error).toBeUndefined();
    expect(result.path[0]).toBe('block_A');
    expect(result.path[result.path.length - 1]).toBe('block_R');
  });

  test('calculateWeight increases with higher crowd density', () => {
    const lowWeight = routingEngine.calculateWeight(10, 0.1);
    const highWeight = routingEngine.calculateWeight(10, 0.9);
    expect(highWeight).toBeGreaterThan(lowWeight);
  });
});
