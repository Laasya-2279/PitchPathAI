/**
 * API Service (v2)
 * Handles all REST API calls to the PitchPath AI backend.
 * Extended with stadium, match, and simulation endpoints.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// ===== EXISTING ENDPOINTS =====

/** Calculate a route between two zones */
export async function getRoute(from, to) {
  return fetchAPI('/route', {
    method: 'POST',
    body: JSON.stringify({ from, to }),
  });
}

/** Process a voice transcript */
export async function processVoice(transcript, currentLocation = 'gate_1') {
  return fetchAPI('/voice', {
    method: 'POST',
    body: JSON.stringify({ transcript, currentLocation }),
  });
}

/** Get current crowd data snapshot */
export async function getCrowdData() {
  return fetchAPI('/crowd');
}

/** Get specific zone info */
export async function getZoneInfo(zoneId) {
  return fetchAPI(`/crowd/${zoneId}`);
}

/** Find nearest facility */
export async function findNearest(type, from = 'gate_1') {
  return fetchAPI(`/nearest?type=${type}&from=${from}`);
}

/** Health check */
export async function healthCheck() {
  return fetchAPI('/health');
}

// ===== NEW v2 ENDPOINTS =====

/** Get stadium knowledge base info */
export async function getStadiumInfo(topic = 'general') {
  return fetchAPI(`/stadium/info?topic=${encodeURIComponent(topic)}`);
}

/** Get live match data */
export async function getMatchData() {
  return fetchAPI('/stadium/match');
}

/** Get all facilities */
export async function getFacilities() {
  return fetchAPI('/stadium/facilities');
}

/** Get MongoDB connection status */
export async function getDBStatus() {
  return fetchAPI('/stadium/db-status');
}

/** List all test scenarios */
export async function getScenarios() {
  return fetchAPI('/simulate/scenarios');
}

/** Run a test scenario */
export async function runScenario(scenarioId) {
  return fetchAPI('/simulate/scenario', {
    method: 'POST',
    body: JSON.stringify({ scenarioId }),
  });
}

/** Set simulation mode */
export async function setSimMode(mode) {
  return fetchAPI('/simulate/mode', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });
}

/** Inject density at a zone */
export async function injectDensity(zoneId, density) {
  return fetchAPI('/simulate/inject', {
    method: 'POST',
    body: JSON.stringify({ zoneId, density }),
  });
}

/** Clear all density injections */
export async function clearInjections() {
  return fetchAPI('/simulate/clear', { method: 'POST' });
}

/** Get debug logs */
export async function getDebugLogs(count = 30) {
  return fetchAPI(`/simulate/logs?count=${count}`);
}

/** Get simulation status */
export async function getSimStatus() {
  return fetchAPI('/simulate/status');
}
