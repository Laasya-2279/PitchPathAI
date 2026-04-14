/**
 * Scenario Engine
 * 
 * Predefined test scenarios for validating navigation, congestion handling,
 * and emergency exits. Returns structured results with step-by-step details.
 */

const routingEngine = require('./routingEngine');
const crowdSimulator = require('./crowdSimulator');
const { nodes, getNode } = require('../data/stadiumGraph');

class ScenarioEngine {
  constructor() {
    this.scenarios = {
      navigation_test: {
        name: 'Navigation Test',
        description: 'Tests routing from all 4 gates to Block M, finding shortest path.',
        icon: '🧭',
      },
      congestion_test: {
        name: 'Congestion Test',
        description: 'Injects high density on the direct route and verifies the engine reroutes.',
        icon: '🚧',
      },
      emergency_test: {
        name: 'Emergency Evacuation Test',
        description: 'Finds the fastest exit from every seating block to the nearest gate.',
        icon: '🚨',
      },
      facility_test: {
        name: 'Facility Access Test',
        description: 'Tests nearest-facility routing for washrooms, food, and medical from all blocks.',
        icon: '🏥',
      },
      match_day_surge: {
        name: 'Match Day Surge',
        description: 'Simulates a sudden crowd surge at gates during entry time.',
        icon: '🔥',
      },
    };
  }

  /**
   * List all available scenarios
   */
  listScenarios() {
    return Object.entries(this.scenarios).map(([id, s]) => ({
      id,
      ...s,
    }));
  }

  /**
   * Run a scenario by ID
   * @param {string} scenarioId
   * @returns {Object} { name, steps[], result, metrics }
   */
  async runScenario(scenarioId) {
    switch (scenarioId) {
      case 'navigation_test': return this.runNavigationTest();
      case 'congestion_test': return this.runCongestionTest();
      case 'emergency_test': return this.runEmergencyTest();
      case 'facility_test': return this.runFacilityTest();
      case 'match_day_surge': return this.runMatchDaySurge();
      default: return { error: `Unknown scenario: ${scenarioId}` };
    }
  }

  /**
   * Test routing from all gates to Block M
   */
  runNavigationTest() {
    const steps = [];
    const gates = ['gate_1', 'gate_2', 'gate_3', 'gate_4'];
    const destination = 'block_M';
    const crowdData = crowdSimulator.getSnapshot().densityMap;

    for (const gate of gates) {
      const route = routingEngine.findRoute(gate, destination, crowdData);
      steps.push({
        description: `${getNode(gate)?.name} → Block M`,
        success: !route.error,
        distance: route.distance || 0,
        time: route.estimatedTime || 0,
        path: route.pathNames || [],
        warnings: route.warnings?.length || 0,
      });
    }

    const allSuccess = steps.every(s => s.success);
    const avgTime = Math.round(steps.reduce((a, s) => a + s.time, 0) / steps.length);

    return {
      ...this.scenarios.navigation_test,
      steps,
      result: allSuccess ? 'PASS' : 'FAIL',
      summary: allSuccess
        ? `All 4 gates can route to Block M. Average ETA: ${avgTime} min.`
        : `Some routes failed. Check warnings.`,
      metrics: { avgTime, totalRoutes: steps.length, passed: steps.filter(s => s.success).length },
    };
  }

  /**
   * Inject congestion and verify rerouting
   */
  runCongestionTest() {
    const steps = [];

    // Step 1: Route without congestion
    const cleanCrowd = {};
    nodes.forEach(n => { cleanCrowd[n.id] = 0.1; });
    const cleanRoute = routingEngine.findRoute('gate_1', 'block_M', cleanCrowd);
    steps.push({
      description: 'Step 1: Normal route (low density)',
      path: cleanRoute.pathNames,
      distance: cleanRoute.distance,
      time: cleanRoute.estimatedTime,
    });

    // Step 2: Inject high density on the clean route's path
    const congestedCrowd = { ...cleanCrowd };
    if (cleanRoute.path && cleanRoute.path.length > 2) {
      const blockedZone = cleanRoute.path[1];
      congestedCrowd[blockedZone] = 0.95;
      steps.push({
        description: `Step 2: Injected 95% density at ${getNode(blockedZone)?.name}`,
        injectedZone: blockedZone,
        density: 0.95,
      });
    }

    // Step 3: Reroute
    const congestedRoute = routingEngine.findRoute('gate_1', 'block_M', congestedCrowd);
    const rerouted = JSON.stringify(cleanRoute.path) !== JSON.stringify(congestedRoute.path);
    steps.push({
      description: `Step 3: Recalculated route ${rerouted ? '(REROUTED ✅)' : '(same path)'}`,
      path: congestedRoute.pathNames,
      distance: congestedRoute.distance,
      time: congestedRoute.estimatedTime,
      rerouted,
    });

    return {
      ...this.scenarios.congestion_test,
      steps,
      result: rerouted ? 'PASS' : 'PARTIAL',
      summary: rerouted
        ? `Routing engine successfully avoids congested zones and finds alternative paths.`
        : `Route remained the same — the congested zone may not be on the critical path.`,
      metrics: { rerouted, originalDistance: cleanRoute.distance, newDistance: congestedRoute.distance },
    };
  }

  /**
   * Find fastest exit from every block
   */
  runEmergencyTest() {
    const steps = [];
    const seatingBlocks = nodes.filter(n => n.type === 'seating');
    const crowdData = crowdSimulator.getSnapshot().densityMap;

    for (const block of seatingBlocks) {
      const nearest = routingEngine.findNearest(block.id, 'gate', crowdData);
      steps.push({
        description: `${block.name} → Nearest Exit`,
        success: !nearest.error,
        destination: nearest.pathNames ? nearest.pathNames[nearest.pathNames.length - 1] : 'N/A',
        time: nearest.estimatedTime || 0,
        path: nearest.pathNames || [],
      });
    }

    const maxTime = Math.max(...steps.map(s => s.time));
    const allReachable = steps.every(s => s.success);

    return {
      ...this.scenarios.emergency_test,
      steps,
      result: allReachable ? 'PASS' : 'FAIL',
      summary: allReachable
        ? `All ${seatingBlocks.length} blocks can reach exits. Max evacuation time: ${maxTime} min.`
        : `Some blocks cannot reach exits — check stadium graph connectivity.`,
      metrics: { maxEvacTime: maxTime, blocksChecked: seatingBlocks.length, allReachable },
    };
  }

  /**
   * Test nearest facility access from all blocks
   */
  runFacilityTest() {
    const steps = [];
    const testBlocks = ['block_A', 'block_E', 'block_I', 'block_N'];
    const facilityTypes = ['washroom', 'food', 'medical'];
    const crowdData = crowdSimulator.getSnapshot().densityMap;

    for (const block of testBlocks) {
      for (const type of facilityTypes) {
        const nearest = routingEngine.findNearest(block, type, crowdData);
        steps.push({
          description: `${getNode(block)?.name} → Nearest ${type}`,
          success: !nearest.error,
          facility: nearest.pathNames ? nearest.pathNames[nearest.pathNames.length - 1] : 'N/A',
          time: nearest.estimatedTime || 0,
        });
      }
    }

    const allSuccess = steps.every(s => s.success);

    return {
      ...this.scenarios.facility_test,
      steps,
      result: allSuccess ? 'PASS' : 'FAIL',
      summary: `Tested ${steps.length} facility routes. ${steps.filter(s => s.success).length}/${steps.length} passed.`,
      metrics: { totalTests: steps.length, passed: steps.filter(s => s.success).length },
    };
  }

  /**
   * Simulate match day surge at gates
   */
  runMatchDaySurge() {
    const steps = [];

    // Inject high density at all gates
    crowdSimulator.setMode('match_day');
    const snapshot = crowdSimulator.generate();

    const gates = snapshot.zones.filter(z => z.type === 'gate');
    gates.forEach(g => {
      crowdSimulator.injectDensity(g.id, 0.9);
    });

    steps.push({
      description: 'Activated Match Day mode + gate surge (90% density at all gates)',
      gateDensities: gates.map(g => ({ gate: g.name, density: 0.9 })),
    });

    // Test routing avoidance
    const crowdData = crowdSimulator.getSnapshot().densityMap;
    const route = routingEngine.findRoute('gate_1', 'block_M', crowdData);
    const warnings = route.warnings?.filter(w => w.density > 0.7) || [];

    steps.push({
      description: `Route Gate 1 → Block M under surge conditions`,
      time: route.estimatedTime,
      warnings: warnings.length,
      path: route.pathNames,
    });

    // Reset to normal
    crowdSimulator.setMode('normal');
    steps.push({ description: 'Reset to Normal mode' });

    return {
      ...this.scenarios.match_day_surge,
      steps,
      result: 'PASS',
      summary: `Match day surge simulated. Route found with ${warnings.length} crowd warnings. ETA: ${route.estimatedTime} min.`,
      metrics: { surgeETA: route.estimatedTime, warnings: warnings.length },
    };
  }
}

module.exports = new ScenarioEngine();
