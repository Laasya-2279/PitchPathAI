/**
 * Routing Engine
 * 
 * Implements Dijkstra's shortest path algorithm with crowd-aware weighting.
 * Edge weight = distance * (1 + crowdDensity^2)
 * This penalizes crowded routes exponentially while still finding shortest paths.
 */

const { nodes, edges, getNode } = require('../data/stadiumGraph');

class RoutingEngine {
  constructor() {
    // Build adjacency list from edges (bidirectional)
    this.adjacency = {};
    nodes.forEach(node => {
      this.adjacency[node.id] = [];
    });

    edges.forEach(edge => {
      this.adjacency[edge.from].push({ to: edge.to, distance: edge.distance });
      this.adjacency[edge.to].push({ to: edge.from, distance: edge.distance });
    });
  }

  /**
   * Calculate crowd-aware weight for an edge
   * @param {number} distance - Base distance
   * @param {number} density - Crowd density at destination (0.0 - 1.0)
   * @returns {number} Weighted distance
   */
  calculateWeight(distance, density = 0) {
    // Quadratic penalty for crowd density
    // density 0.0 → weight = distance * 1.0
    // density 0.5 → weight = distance * 1.25
    // density 0.8 → weight = distance * 1.64
    // density 1.0 → weight = distance * 2.0
    return distance * (1 + Math.pow(density, 2));
  }

  /**
   * Find shortest crowd-aware path using Dijkstra's algorithm
   * @param {string} startId - Source node ID
   * @param {string} endId - Destination node ID
   * @param {Object} crowdData - Map of nodeId → density (0.0–1.0)
   * @returns {Object} { path, distance, estimatedTime, steps, warnings }
   */
  findRoute(startId, endId, crowdData = {}) {
    if (!this.adjacency[startId]) {
      return { error: `Unknown location: ${startId}` };
    }
    if (!this.adjacency[endId]) {
      return { error: `Unknown destination: ${endId}` };
    }
    if (startId === endId) {
      return {
        path: [startId],
        pathNames: [getNode(startId)?.name || startId],
        distance: 0,
        estimatedTime: 0,
        steps: [{ instruction: 'You are already here!', zone: startId }],
        warnings: [],
      };
    }

    // Dijkstra's algorithm
    const dist = {};
    const prev = {};
    const visited = new Set();
    const queue = [];

    nodes.forEach(node => {
      dist[node.id] = Infinity;
      prev[node.id] = null;
    });

    dist[startId] = 0;
    queue.push({ id: startId, dist: 0 });

    while (queue.length > 0) {
      // Get node with minimum distance (simple priority queue)
      queue.sort((a, b) => a.dist - b.dist);
      const current = queue.shift();

      if (visited.has(current.id)) continue;
      visited.add(current.id);

      if (current.id === endId) break;

      const neighbors = this.adjacency[current.id] || [];
      for (const neighbor of neighbors) {
        if (visited.has(neighbor.to)) continue;

        const density = crowdData[neighbor.to] || 0;
        const weight = this.calculateWeight(neighbor.distance, density);
        const newDist = dist[current.id] + weight;

        if (newDist < dist[neighbor.to]) {
          dist[neighbor.to] = newDist;
          prev[neighbor.to] = current.id;
          queue.push({ id: neighbor.to, dist: newDist });
        }
      }
    }

    // Reconstruct path
    if (dist[endId] === Infinity) {
      return { error: 'No route found between these locations.' };
    }

    const path = [];
    let current = endId;
    while (current !== null) {
      path.unshift(current);
      current = prev[current];
    }

    // Generate human-readable steps and warnings
    const steps = this.generateSteps(path, crowdData);
    const warnings = this.generateWarnings(path, crowdData);

    // Estimated walking time: ~1.5 min per unit distance
    const estimatedTime = Math.ceil(dist[endId] * 1.5);

    return {
      path,
      pathNames: path.map(id => getNode(id)?.name || id),
      distance: Math.round(dist[endId] * 10) / 10,
      estimatedTime,
      steps,
      warnings,
    };
  }

  /**
   * Generate step-by-step navigation instructions
   */
  generateSteps(path, crowdData) {
    const steps = [];
    const directions = ['ahead', 'to the right', 'to the left', 'ahead'];

    for (let i = 0; i < path.length; i++) {
      const node = getNode(path[i]);
      if (!node) continue;

      if (i === 0) {
        steps.push({
          instruction: `Start at ${node.name}`,
          zone: node.id,
          direction: 'start',
        });
      } else if (i === path.length - 1) {
        steps.push({
          instruction: `Arrive at ${node.name}`,
          zone: node.id,
          direction: 'arrive',
        });
      } else {
        const dirIndex = i % directions.length;
        const density = crowdData[node.id] || 0;
        let instruction = `Continue through ${node.name}`;

        if (density > 0.7) {
          instruction += ' (crowded — move carefully)';
        }

        steps.push({
          instruction,
          zone: node.id,
          direction: directions[dirIndex],
          density,
        });
      }
    }

    return steps;
  }

  /**
   * Generate warnings about crowded zones on the route
   */
  generateWarnings(path, crowdData) {
    const warnings = [];

    path.forEach(nodeId => {
      const density = crowdData[nodeId] || 0;
      const node = getNode(nodeId);

      if (density > 0.8) {
        warnings.push({
          zone: nodeId,
          zoneName: node?.name || nodeId,
          density,
          message: `${node?.name} is very crowded (${Math.round(density * 100)}% capacity). Consider alternate route.`,
        });
      } else if (density > 0.6) {
        warnings.push({
          zone: nodeId,
          zoneName: node?.name || nodeId,
          density,
          message: `${node?.name} has moderate crowd (${Math.round(density * 100)}% capacity).`,
        });
      }
    });

    return warnings;
  }

  /**
   * Find nearest facility of a given type from a starting point
   */
  findNearest(startId, facilityType, crowdData = {}) {
    const facilities = nodes.filter(n => n.type === facilityType);
    let best = null;
    let bestDist = Infinity;

    for (const facility of facilities) {
      const result = this.findRoute(startId, facility.id, crowdData);
      if (!result.error && result.distance < bestDist) {
        bestDist = result.distance;
        best = result;
      }
    }

    return best || { error: `No ${facilityType} found nearby.` };
  }
}

module.exports = new RoutingEngine();
