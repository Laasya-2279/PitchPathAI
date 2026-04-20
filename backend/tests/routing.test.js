const routingEngine = require('../services/routingEngine');
const { nodes } = require('../data/stadiumGraph');

describe('Routing Engine (Dijkstra)', () => {
  test('should find the shortest simple path between Gate 1 and Block A', () => {
    const result = routingEngine.findRoute('gate_1', 'block_A');
    expect(result.error).toBeUndefined();
    expect(result.path).toContain('gate_1');
    expect(result.path).toContain('block_A');
  });

  test('should increase weights for crowded zones', () => {
    const start = 'gate_1';
    const end = 'block_B';
    
    // Normal route
    const normalResult = routingEngine.findRoute(start, end, {});
    
    // High crowd on a middle node (let's assume Block A is between them)
    // Actually Gate 1 connects directly to A, B, R.
    // Let's force a longer path by packing Block B
    const crowdedData = { 'block_B': 0.95 };
    const crowdedResult = routingEngine.findRoute(start, end, crowdedData);
    
    // The calculated distance/time should be higher due to the penalty
    expect(crowdedResult.distance).toBeGreaterThan(normalResult.distance);
  });

  test('should return error for unknown nodes', () => {
    const result = routingEngine.findRoute('invalid_id', 'block_A');
    expect(result.error).toBeDefined();
  });

  test('should find nearest washroom', () => {
    const result = routingEngine.findNearest('block_A', 'washroom');
    expect(result.error).toBeUndefined();
    expect(result.path[result.path.length - 1]).toContain('washroom');
  });
});
