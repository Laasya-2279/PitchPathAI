/**
 * Predictive Decision Engine (v3)
 * 
 * Intelligent routing system that evaluates multiple destinations
 * of the same type and recommends the best option based on:
 * score = (distance * 0.4) + (crowd density * 0.4) + (queue time * 0.2)
 * 
 * Provides natural language explanations to ground AI Voice responses perfectly.
 */

const { nodes } = require('../data/stadiumGraph');
const routingEngine = require('./routingEngine');
const crowdSimulator = require('./crowdSimulator');
const logger = require('../utils/logger');

class DecisionEngine {
  /**
   * Evaluates all facilities of a given type and returns the optimal recommendation
   * @param {string} startId - User's current location
   * @param {string} facilityType - e.g., 'food', 'washroom'
   * @returns {Object} result = { best, comparisonText, options }
   */
  async recommendFacility(startId, facilityType) {
    try {
      const facilities = nodes.filter(n => n.type === facilityType);
      if (!facilities.length) {
        return { error: `No facilities of type ${facilityType} found.` };
      }

      const snapshot = await crowdSimulator.getSnapshot();
      const crowdData = snapshot.densityMap;
      const queueData = snapshot.queueMap || {};

      let options = [];

      // Evaluate all facilities of requested type
      for (const fb of facilities) {
        const route = routingEngine.findRoute(startId, fb.id, crowdData);
        if (route.error) continue;

        // Extract raw metrics
        const distanceRaw = route.distance;
        const densityRaw = crowdData[fb.id] || 0.1;
        const queueRaw = queueData[fb.id] || 0;

        // Normalize metrics for scoring (lower is better)
        // distance: assume max stadium distance is ~500 units for normalization mapping
        const normDistance = Math.min(distanceRaw / 100, 1.0); 
        const normDensity = densityRaw; // Already 0-1
        const normQueue = Math.min(queueRaw / 15, 1.0); // Assume 15 min > is 1.0 worst

        const score = (normDistance * 0.4) + (normDensity * 0.4) + (normQueue * 0.2);

        options.push({
          facility: fb,
          route,
          metrics: { distance: distanceRaw, density: densityRaw, queue: queueRaw },
          score
        });
      }

      if (!options.length) {
        return { error: `Could not calculate paths to any ${facilityType}.` };
      }

      // Sort by predictive score
      options.sort((a, b) => a.score - b.score);
      const bestOpt = options[0];

      let text = '';
      
      // Natural Language formatting
      if (options.length > 1) {
        const altOpt = options[1];
        
        const isCloser = altOpt.metrics.distance < bestOpt.metrics.distance;
        const isAltCrowded = altOpt.metrics.density > 0.6;
        
        if (isCloser && isAltCrowded) {
          text = `${altOpt.facility.name} is closer, but it's currently highly congested with a ${altOpt.metrics.queue} minute wait. `;
          text += `I recommend ${bestOpt.facility.name} instead. It's ${Math.round(bestOpt.metrics.distance - altOpt.metrics.distance)} units further, but much faster.`;
        } else {
          text = `The best option is ${bestOpt.facility.name}. It's about ${bestOpt.route.estimatedTime} minutes away and currently has low wait times.`;
        }
      } else {
        text = `The nearest ${facilityType} is ${bestOpt.facility.name}, about ${bestOpt.route.estimatedTime} minutes away.`;
      }

      return {
        best: bestOpt,
        comparisonText: text,
        options,
      };
    } catch (err) {
      logger.error('Decision recommendation failed', err);
      return { error: 'Failed to evaluate optimal facility recommendation.' };
    }
  }
}

module.exports = new DecisionEngine();
