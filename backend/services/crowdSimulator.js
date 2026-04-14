/**
 * Crowd Simulator (v2)
 * 
 * Generates realistic crowd density data for all stadium zones.
 * Uses sinusoidal patterns + random noise to simulate crowd flow.
 * Provides queue time estimates for facilities.
 * 
 * v2 additions:
 * - Mode toggle: 'normal' vs 'match_day'
 * - Manual density injection for scenario testing
 * - Debug logging support
 */

const { nodes } = require('../data/stadiumGraph');
const { getConnectionStatus } = require('../config/database');

class CrowdSimulator {
  constructor() {
    this.crowdData = {};
    this.queueData = {};
    this.tick = 0;
    this.basePatterns = {};
    this.mode = 'normal'; // 'normal' | 'match_day'
    this.injectedDensities = {}; // Manual overrides for testing
    this.logs = []; // Debug log buffer

    // Initialize base patterns for each zone
    nodes.forEach(node => {
      this.basePatterns[node.id] = {
        phase: Math.random() * Math.PI * 2,
        amplitude: 0.15 + Math.random() * 0.2,
        base: node.type === 'gate' ? 0.5 : 0.3,
        frequency: 0.5 + Math.random() * 0.5,
      };
    });

    // Run initial generation
    this.generate();
  }

  /**
   * Set simulation mode
   * @param {'normal'|'match_day'} mode
   */
  setMode(mode) {
    if (mode !== 'normal' && mode !== 'match_day') return;
    this.mode = mode;
    this.log(`Mode changed to: ${mode}`);

    // Adjust patterns for match day
    if (mode === 'match_day') {
      nodes.forEach(node => {
        const pattern = this.basePatterns[node.id];
        pattern.base = node.type === 'gate' ? 0.75 : 0.55;
        pattern.amplitude = 0.2 + Math.random() * 0.15;
      });
    } else {
      nodes.forEach(node => {
        const pattern = this.basePatterns[node.id];
        pattern.base = node.type === 'gate' ? 0.5 : 0.3;
        pattern.amplitude = 0.15 + Math.random() * 0.2;
      });
    }

    this.generate();
  }

  /**
   * Get current mode
   */
  getMode() {
    return this.mode;
  }

  /**
   * Inject density for a specific zone (scenario testing)
   * @param {string} zoneId
   * @param {number} density 0.0-1.0
   */
  injectDensity(zoneId, density) {
    this.injectedDensities[zoneId] = Math.max(0.05, Math.min(0.95, density));
    this.crowdData[zoneId] = this.injectedDensities[zoneId];
    this.log(`Injected density: ${zoneId} = ${(density * 100).toFixed(0)}%`);
  }

  /**
   * Clear all injected densities
   */
  clearInjections() {
    this.injectedDensities = {};
    this.log('Cleared all density injections');
  }

  /**
   * Generate new crowd data snapshot
   */
  generate() {
    this.tick++;
    const time = this.tick * 0.1;

    nodes.forEach(node => {
      // Skip if this zone has a manual injection
      if (this.injectedDensities[node.id] !== undefined) {
        this.crowdData[node.id] = this.injectedDensities[node.id];
        return;
      }

      const pattern = this.basePatterns[node.id];

      // Base density from sinusoidal pattern
      let density = pattern.base +
        pattern.amplitude * Math.sin(time * pattern.frequency + pattern.phase);

      // Add random noise
      density += (Math.random() - 0.5) * 0.1;

      // Match day surges
      if (this.mode === 'match_day') {
        // Random surges happen more in match day
        if (this.tick % 15 < 5 && Math.random() > 0.5) {
          density += 0.25;
        }
        // Gates get extra busy
        if (node.type === 'gate' && Math.random() > 0.4) {
          density += 0.15;
        }
      } else {
        // Normal mode surges
        if (this.tick % 30 < 5 && Math.random() > 0.7) {
          density += 0.2;
        }
      }

      // Clamp between 0.05 and 0.95
      density = Math.max(0.05, Math.min(0.95, density));
      this.crowdData[node.id] = Math.round(density * 100) / 100;
    });

    // Generate queue times for facilities
    this.generateQueueTimes();

    // Persist to MongoDB (fire-and-forget)
    this.persistToMongo();

    return this.getSnapshot();
  }

  /**
   * Generate queue time estimates for washrooms and food courts
   */
  generateQueueTimes() {
    nodes.forEach(node => {
      if (node.type === 'washroom' || node.type === 'food') {
        const density = this.crowdData[node.id] || 0.3;
        const baseQueue = node.type === 'washroom' ? 3 : 5;
        const modeMultiplier = this.mode === 'match_day' ? 1.5 : 1;
        const queueTime = Math.round((baseQueue + density * 12 + (Math.random() - 0.5) * 2) * modeMultiplier);
        this.queueData[node.id] = Math.max(1, queueTime);
      }
    });
  }

  /**
   * Get current crowd snapshot
   */
  getSnapshot() {
    return {
      timestamp: Date.now(),
      tick: this.tick,
      mode: this.mode,
      zones: nodes.map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
        position: node.position,
        density: this.crowdData[node.id] || 0,
        queueTime: this.queueData[node.id] || null,
        status: this.getDensityStatus(this.crowdData[node.id] || 0),
        injected: !!this.injectedDensities[node.id],
      })),
      densityMap: { ...this.crowdData },
      summary: this.getSummary(),
    };
  }

  /**
   * Get density status label
   */
  getDensityStatus(density) {
    if (density < 0.3) return 'low';
    if (density < 0.5) return 'moderate';
    if (density < 0.7) return 'high';
    return 'very_high';
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const densities = Object.values(this.crowdData);
    const avg = densities.reduce((a, b) => a + b, 0) / densities.length;
    const max = Math.max(...densities);
    const min = Math.min(...densities);

    const hotspots = nodes
      .filter(n => this.crowdData[n.id] > 0.7)
      .map(n => ({ id: n.id, name: n.name, density: this.crowdData[n.id] }));

    return {
      averageDensity: Math.round(avg * 100) / 100,
      maxDensity: max,
      minDensity: min,
      hotspotCount: hotspots.length,
      hotspots,
      totalCapacity: nodes.filter(n => n.type === 'seating').reduce((a, n) => a + (n.capacity || 0), 0),
      mode: this.mode,
    };
  }

  /**
   * Get info for a specific zone
   */
  getZoneInfo(zoneId) {
    const node = nodes.find(n => n.id === zoneId);
    if (!node) return null;

    return {
      ...node,
      density: this.crowdData[zoneId] || 0,
      queueTime: this.queueData[zoneId] || null,
      status: this.getDensityStatus(this.crowdData[zoneId] || 0),
    };
  }

  /**
   * Get recent debug logs
   */
  getLogs(count = 20) {
    return this.logs.slice(-count);
  }

  /**
   * Internal log helper
   */
  log(msg) {
    const entry = { timestamp: Date.now(), message: msg };
    this.logs.push(entry);
    if (this.logs.length > 100) this.logs.shift();
  }

  /**
   * Persist crowd data to MongoDB (fire-and-forget)
   */
  async persistToMongo() {
    if (!getConnectionStatus().connected) return;
    try {
      const CrowdData = require('../models/CrowdData');
      const ops = Object.entries(this.crowdData).map(([zone, density]) => ({
        updateOne: {
          filter: { zone },
          update: {
            zone,
            density_level: density,
            queue_time: this.queueData[zone] || null,
            status: this.getDensityStatus(density),
            last_updated: new Date(),
          },
          upsert: true,
        },
      }));
      await CrowdData.bulkWrite(ops);
    } catch (e) {
      // Silent fail — simulator continues in memory
    }
  }
}

module.exports = new CrowdSimulator();
