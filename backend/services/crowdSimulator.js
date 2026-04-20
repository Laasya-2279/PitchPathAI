/**
 * Crowd Simulator (v3)
 * 
 * Generates realistic crowd density data for all stadium zones.
 * NOW STORED STRICTLY IN MONGODB.
 * The internal variables only exist as a graceful fallback.
 */

const { nodes } = require('../data/stadiumGraph');
const { getConnectionStatus } = require('../config/database');

class CrowdSimulator {
  constructor() {
    this.fallbackCrowdData = {};
    this.fallbackQueueData = {};
    this.tick = 0;
    this.basePatterns = {};
    this.mode = 'normal'; // 'normal' | 'match_day'
    this.injectedDensities = {}; // Manual overrides for testing
    this.logs = []; // Debug log buffer

    // Initialize base patterns
    nodes.forEach(node => {
      this.basePatterns[node.id] = {
        phase: Math.random() * Math.PI * 2,
        amplitude: 0.15 + Math.random() * 0.2,
        base: node.type === 'gate' ? 0.5 : 0.3,
        frequency: 0.5 + Math.random() * 0.5,
      };
      this.fallbackCrowdData[node.id] = 0.1;
      this.fallbackQueueData[node.id] = 0;
    });
  }

  setMode(mode) {
    if (mode !== 'normal' && mode !== 'match_day') return;
    this.mode = mode;
    this.log(`Mode changed to: ${mode}`);

    // Adjust patterns for match day
    nodes.forEach(node => {
      const pattern = this.basePatterns[node.id];
      if (mode === 'match_day') {
        pattern.base = node.type === 'gate' ? 0.75 : 0.55;
        pattern.amplitude = 0.2 + Math.random() * 0.15;
      } else {
        pattern.base = node.type === 'gate' ? 0.5 : 0.3;
        pattern.amplitude = 0.15 + Math.random() * 0.2;
      }
    });

    this.generate(); // Trigger an immediate generation
  }

  getMode() { return this.mode; }

  injectDensity(zoneId, density) {
    this.injectedDensities[zoneId] = Math.max(0.05, Math.min(0.95, density));
    this.log(`Injected density: ${zoneId} = ${(density * 100).toFixed(0)}%`);
  }

  clearInjections() {
    this.injectedDensities = {};
    this.log('Cleared all density injections');
  }

  /**
   * Generates new state and directly performs bulk upsert to MongoDB
   */
  async generate() {
    this.tick++;
    const time = this.tick * 0.1;
    const updates = {};
    const queueUpdates = {};

    nodes.forEach(node => {
      if (this.injectedDensities[node.id] !== undefined) {
        updates[node.id] = this.injectedDensities[node.id];
      } else {
        const pattern = this.basePatterns[node.id];
        let density = pattern.base + pattern.amplitude * Math.sin(time * pattern.frequency + pattern.phase);
        density += (Math.random() - 0.5) * 0.1;

        if (this.mode === 'match_day') {
          if (this.tick % 15 < 5 && Math.random() > 0.5) density += 0.25;
          if (node.type === 'gate' && Math.random() > 0.4) density += 0.15;
        } else {
          if (this.tick % 30 < 5 && Math.random() > 0.7) density += 0.2;
        }
        updates[node.id] = Math.max(0.05, Math.min(0.95, Math.round(density * 100) / 100));
      }

      // Queues
      if (node.type === 'washroom' || node.type === 'food') {
        const baseQueue = node.type === 'washroom' ? 3 : 5;
        const modeMultiplier = this.mode === 'match_day' ? 1.5 : 1;
        queueUpdates[node.id] = Math.max(1, Math.round((baseQueue + updates[node.id] * 12 + (Math.random() - 0.5) * 2) * modeMultiplier));
      }
    });

    if (getConnectionStatus().connected) {
      try {
        const CrowdData = require('../models/CrowdData');
        const ops = Object.entries(updates).map(([zone, density]) => ({
          updateOne: {
            filter: { zone },
            update: {
              $set: {
                zone,
                density_level: density,
                queue_time: queueUpdates[zone] || null,
                status: this.getDensityStatus(density),
                last_updated: new Date(),
              }
            },
            upsert: true,
          },
        }));
        await CrowdData.bulkWrite(ops);
      } catch (err) {
        console.error('Failed to write to DB', err);
      }
    } else {
      // Fallback local memory
      this.fallbackCrowdData = updates;
      this.fallbackQueueData = queueUpdates;
    }

    return await this.getSnapshot();
  }

  /**
   * Reads STRICTLY from MongoDB, unless disconnected.
   */
  async getSnapshot() {
    let crowdDataMap = {};
    let queueDataMap = {};

    if (getConnectionStatus().connected) {
      try {
        const CrowdData = require('../models/CrowdData');
        const records = await CrowdData.find({}).lean();
        records.forEach(r => {
          crowdDataMap[r.zone] = r.density_level;
          queueDataMap[r.zone] = r.queue_time;
        });
      } catch (e) {
        crowdDataMap = this.fallbackCrowdData;
        queueDataMap = this.fallbackQueueData;
      }
    } else {
      crowdDataMap = this.fallbackCrowdData;
      queueDataMap = this.fallbackQueueData;
    }

    // Default missing zones
    nodes.forEach(n => {
      if (crowdDataMap[n.id] === undefined) crowdDataMap[n.id] = 0.1;
    });

    const densities = Object.values(crowdDataMap);
    const avg = densities.length ? densities.reduce((a, b) => a + b, 0) / densities.length : 0;
    const max = densities.length ? Math.max(...densities) : 0;
    const min = densities.length ? Math.min(...densities) : 0;
    const hotspots = nodes.filter(n => crowdDataMap[n.id] > 0.7).map(n => ({ id: n.id, name: n.name, density: crowdDataMap[n.id] }));

    return {
      timestamp: Date.now(),
      tick: this.tick,
      mode: this.mode,
      zones: nodes.map(node => ({
        id: node.id,
        name: node.name,
        type: node.type,
        position: node.position,
        density: crowdDataMap[node.id] || 0,
        queueTime: queueDataMap[node.id] || null,
        status: this.getDensityStatus(crowdDataMap[node.id] || 0),
        injected: !!this.injectedDensities[node.id],
      })),
      densityMap: crowdDataMap,
      queueMap: queueDataMap,
      summary: {
        averageDensity: Math.round(avg * 100) / 100,
        maxDensity: max,
        minDensity: min,
        hotspotCount: hotspots.length,
        hotspots,
        mode: this.mode,
      },
    };
  }

  async getZoneInfo(zoneId) {
    const node = nodes.find(n => n.id === zoneId);
    if (!node) return null;

    let density = 0.1;
    let queueTime = null;

    if (getConnectionStatus().connected) {
      try {
        const CrowdData = require('../models/CrowdData');
        const record = await CrowdData.findOne({ zone: zoneId }).lean();
        if (record) {
          density = record.density_level;
          queueTime = record.queue_time;
        }
      } catch (e) {}
    } else {
      density = this.fallbackCrowdData[zoneId] || 0.1;
      queueTime = this.fallbackQueueData[zoneId] || null;
    }

    return {
      ...node,
      density,
      queueTime,
      status: this.getDensityStatus(density),
    };
  }

  getDensityStatus(density) {
    if (density < 0.3) return 'low';
    if (density < 0.5) return 'moderate';
    if (density < 0.7) return 'high';
    return 'very_high';
  }

  getLogs(count = 20) { return this.logs.slice(-count); }

  log(msg) {
    this.logs.push({ timestamp: Date.now(), message: msg });
    if (this.logs.length > 100) this.logs.shift();
  }
}

module.exports = new CrowdSimulator();
