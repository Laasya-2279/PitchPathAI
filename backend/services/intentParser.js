/**
 * Voice Intent Parser (v2)
 * 
 * Extended with match_info and stadium_info intents.
 * Parses natural language voice transcripts into structured intents.
 * Supports navigation, queries, match data, stadium knowledge, and general conversation.
 */

const { findNodeByName, getNodesByType } = require('../data/stadiumGraph');
const crowdSimulator = require('./crowdSimulator');
const knowledgeBase = require('./knowledgeBase');
const liveMatchAPI = require('./liveMatchAPI');
const logger = require('../utils/logger');

class IntentParser {
  constructor() {
    // Navigation keywords
    this.navKeywords = [
      'take me to', 'go to', 'navigate to', 'find', 'where is',
      'how to get to', 'directions to', 'bring me to', 'lead me to',
      'show me the way to', 'i want to go to', 'get me to', 'how do i get to',
    ];

    // Facility keywords
    this.facilityMap = {
      washroom: ['washroom', 'bathroom', 'restroom', 'toilet', 'loo', 'wc'],
      food: ['food', 'eat', 'restaurant', 'snack', 'drink', 'beverage', 'food court', 'canteen', 'hungry'],
      medical: ['medical', 'doctor', 'first aid', 'hospital', 'nurse', 'medicine', 'emergency', 'hurt', 'injured'],
      gate: ['gate', 'exit', 'entrance', 'entry', 'way out', 'leave'],
      vip: ['vip', 'lounge', 'premium', 'executive'],
    };

    // Query keywords
    this.decisionKeywords = ['should i', 'best', 'recommend', 'fastest', 'quickest', 'which', 'better', 'optimal'];

    this.queryKeywords = {
      crowd: ['crowded', 'crowd', 'busy', 'packed', 'empty', 'space', 'how many people', 'density', 'congestion'],
      queue: ['queue', 'wait', 'line', 'how long', 'wait time', 'waiting'],
      status: ['open', 'closed', 'available', 'status'],
    };

    // Match keywords (NEW)
    this.matchKeywords = [
      'score', 'runs', 'batting', 'bowling', 'bowler', 'batsman', 'batter',
      'wicket', 'over', 'overs', 'match status', 'match update', 'who is batting',
      'who is bowling', 'current score', 'what is the score', 'match score',
      'whats the score', 'last ball', 'recent balls', 'toss', 'innings',
      'how many runs', 'who is winning', 'who won the toss',
    ];

    // Stadium knowledge keywords (NEW)
    this.stadiumKeywords = [
      'history', 'about the stadium', 'tell me about', 'when was', 'who built',
      'architect', 'design', 'capacity', 'how many seats', 'how big',
      'events', 'hosted', 'world cup', 'ipl', 'past matches', 'famous',
      'entry', 'exit info', 'facilities', 'amenities', 'fun fact',
      'interesting', 'trivia', 'did you know', 'structure', 'how old',
      'about this stadium', 'about this place', 'about motera', 'narendra modi',
    ];
  }

  /**
   * Parse a voice transcript into a structured intent.
   * Uses keyword matching and regex to identify stadium-related tasks.
   * @param {string} transcript - Raw voice transcript from STT
   * @param {string} currentLocation - User's current zone ID (defaults to 'gate_1')
   * @returns {Promise<Object>} Object containing intent, destination, and response
   */
  async parse(transcript, currentLocation = 'gate_1') {
    try {
      const text = transcript ? transcript.toLowerCase().trim() : '';

      if (!text) {
        return {
          intent: 'unknown',
          response: "I didn't hear anything. How can I help you navigate?",
          action: null
        };
      }

    // Check for greeting
    if (this.isGreeting(text)) {
      return {
        intent: 'greeting',
        response: "Hello! I'm PitchPath AI, your stadium navigation assistant. I can help you navigate, check crowd levels, get match updates, or tell you about the stadium. What would you like?",
        action: null,
      };
    }

    // Check for help
    if (this.isHelp(text)) {
      return {
        intent: 'help',
        response: "I can help with: 1) Navigation — 'Take me to Block M'. 2) Crowd info — 'Is Gate 2 crowded?' 3) Match updates — 'What's the score?' 4) Stadium facts — 'Tell me about this stadium'. Just ask!",
        action: null,
      };
    }

    // 1. Check for decision engine query (NEW - Specific)
    const decisionResult = this.parseDecisionQuery(text, currentLocation);
    if (decisionResult) return decisionResult;

    // 2. Check for crowd query (Specific)
    const crowdResult = await this.parseCrowdQuery(text);
    if (crowdResult) return crowdResult;

    // 3. Check for match queries (NEW - Specific)
    const matchResult = await this.parseMatchQuery(text);
    if (matchResult) return matchResult;

    // 4. Check for stadium knowledge queries (NEW)
    const stadiumResult = await this.parseStadiumQuery(text);
    if (stadiumResult) return stadiumResult;

    // 5. Check for nearest facility
    const facilityResult = this.parseNearestFacility(text, currentLocation);
    if (facilityResult) return facilityResult;

    // 6. Check for navigation intent
    const navResult = this.parseNavigation(text, currentLocation);
    if (navResult) return navResult;

      // Default fallback
      return {
        intent: 'unknown',
        response: "I didn't quite catch that. Try: 'Take me to Block M', 'What's the score?', 'Is Gate 2 crowded?', or 'Tell me about this stadium'.",
        action: null,
      };
    } catch (err) {
      logger.error('Intent parsing failed', err);
      return {
        intent: 'unknown',
        response: "I'm having trouble understanding right now. Please try again.",
        action: null
      };
    }
  }

  /**
   * Parse match-related queries using live match data.
   * @param {string} text - Processed transcript text
   * @returns {Promise<Object|null>} Match query result or null if no match found
   */
  async parseMatchQuery(text) {
    try {
      const hasMatchKeyword = this.matchKeywords.some(kw => text.includes(kw));
      if (!hasMatchKeyword) return null;

      const state = await liveMatchAPI.getCachedMatchData();
      if (!state) {
        return {
          intent: 'live_match_query',
          response: 'Live data temporarily unavailable.',
          data: null,
          action: null,
        };
      }

      const response = `The current score is ${state.score.team1.runs} for ${state.score.team1.wickets} by ${state.batting_team}.`;

      return {
        intent: 'live_match_query',
        source: 'External Live API Cache',
        response,
        data: {
          teams: state.teams,
          score: state.score,
          status: state.status,
          batting_team: state.batting_team,
          innings: state.innings,
        },
        action: null,
      };
    } catch (err) {
      logger.error('Match query parsing failed', err);
      return null;
    }
  }

  /**
   * Evaluates if a query should be handled by the predictive decision engine.
   * @param {string} text - Processed transcript text
   * @param {string} currentLocation - Starting zone ID
   * @returns {Object|null} Decision intent result or null
   */
  parseDecisionQuery(text, currentLocation) {
    const hasDecisionKeyword = this.decisionKeywords.some(kw => text.includes(kw));
    if (!hasDecisionKeyword) return null;

    let facilityType = null;
    for (const [type, keywords] of Object.entries(this.facilityMap)) {
      if (keywords.some(kw => text.includes(kw))) {
        facilityType = type;
        break;
      }
    }

    if (!facilityType) return null;

    return {
      intent: 'decision_query',
      source: 'Decision Engine + DB Multi-node',
      facilityType,
      from: currentLocation,
      response: `Analyzing all ${facilityType} options based on distance, crowds, and queue times...`,
      action: 'evaluate_decision',
    };
  }

  /**
   * Fetches stadium-related facts and history from the knowledge base.
   * @param {string} text - Processed transcript text
   * @returns {Promise<Object|null>} Stadium query result or null
   */
  async parseStadiumQuery(text) {
    try {
      const hasStadiumKeyword = this.stadiumKeywords.some(kw => text.includes(kw));
      if (!hasStadiumKeyword) return null;

    const result = await knowledgeBase.getStadiumInfo(text);

      return {
        intent: 'stadium_info',
        source: 'MongoDB Knowledge Base',
        response: result.response,
        data: result.data,
        category: result.category,
        action: null,
      };
    } catch (err) {
      logger.error('Stadium query parsing failed', err);
      return null;
    }
  }

  /**
   * Identifies navigation requests and extracts the destination zone.
   * @param {string} text - Processed transcript text
   * @param {string} currentLocation - Source zone ID
   * @returns {Object|null} Navigation intent result or null
   */
  parseNavigation(text, currentLocation) {
    // Check if any navigation keyword is present
    const hasNavKeyword = this.navKeywords.some(kw => text.includes(kw));
    if (!hasNavKeyword) return null;

    // Extract destination
    let destination = null;

    // Try to find a specific block/zone mentioned
    const blockMatch = text.match(/block\s*([a-r])/i);
    if (blockMatch) {
      destination = `block_${blockMatch[1].toUpperCase()}`;
    }

    // Try gate
    const gateMatch = text.match(/gate\s*(\d)/i);
    if (gateMatch) {
      destination = `gate_${gateMatch[1]}`;
    }

    // Try named facility
    if (!destination) {
      for (const [type, keywords] of Object.entries(this.facilityMap)) {
        if (keywords.some(kw => text.includes(kw))) {
          // Find the best matching facility
          const facilities = getNodesByType(type);
          if (facilities.length > 0) {
            destination = facilities[0].id;
          }
          break;
        }
      }
    }

    // Try generic name match
    if (!destination) {
      const node = findNodeByName(text.replace(/take me to|go to|navigate to|find|where is|how to get to|directions to/gi, '').trim());
      if (node) {
        destination = node.id;
      }
    }

    if (!destination) {
      return {
        intent: 'navigate',
        response: "I'd like to help you navigate, but I couldn't identify the destination. Could you be more specific? For example, 'Take me to Block M' or 'Navigate to Gate 2'.",
        action: null,
      };
    }

    const destNode = findNodeByName(destination.replace('block_', 'Block ').replace('gate_', 'Gate ').replace('_', ' '));

    return {
      intent: 'navigate',
      source: 'Routing Engine Base',
      destination,
      destinationName: destNode?.name || destination,
      from: currentLocation,
      response: `Sure! Let me calculate the best route to ${destNode?.name || destination}. Opening AR navigation now.`,
      action: 'navigate',
    };
  }

  /**
   * Handles queries about crowd density or queue times in specific zones.
   * @param {string} text - Processed transcript text
   * @returns {Promise<Object|null>} Crowd query result or null
   */
  async parseCrowdQuery(text) {
    try {
      const hasCrowdKeyword = this.queryKeywords.crowd.some(kw => text.includes(kw));
    const hasQueueKeyword = this.queryKeywords.queue.some(kw => text.includes(kw));

    if (!hasCrowdKeyword && !hasQueueKeyword) return null;

    // Find which zone they're asking about
    let targetZone = null;

    const blockMatch = text.match(/block\s*([a-r])/i);
    if (blockMatch) {
      targetZone = `block_${blockMatch[1].toUpperCase()}`;
    }

    const gateMatch = text.match(/gate\s*(\d)/i);
    if (gateMatch) {
      targetZone = `gate_${gateMatch[1]}`;
    }

    if (!targetZone) {
      // Try to find any zone mentioned
      const node = findNodeByName(text);
      if (node) targetZone = node.id;
    }

    if (targetZone) {
      const zoneInfo = await crowdSimulator.getZoneInfo(targetZone);
      if (zoneInfo) {
        const densityPct = Math.round(zoneInfo.density * 100);
        let statusMsg = '';

        if (zoneInfo.density < 0.3) statusMsg = "It's quite empty — good time to head there!";
        else if (zoneInfo.density < 0.5) statusMsg = "It has moderate crowds — should be comfortable.";
        else if (zoneInfo.density < 0.7) statusMsg = "It's getting busy — expect some congestion.";
        else statusMsg = "It's very crowded right now — I'd recommend an alternative if possible.";

        let response = `${zoneInfo.name} is currently at ${densityPct}% capacity. ${statusMsg}`;

        if (zoneInfo.queueTime) {
          response += ` Estimated wait time: about ${zoneInfo.queueTime} minutes.`;
        }

        return {
          intent: 'query',
          source: 'Live Simulation Engine DB',
          queryType: hasCrowdKeyword ? 'crowd' : 'queue',
          zone: targetZone,
          response,
          data: zoneInfo,
          action: null,
        };
      }
    }

    // General crowd status
    const snapshot = await crowdSimulator.getSnapshot();
    const { summary } = snapshot;

    let response = `Overall stadium crowd level is at ${Math.round(summary.averageDensity * 100)}% average capacity.`;
    if (summary.hotspots.length > 0) {
      response += ` Hotspots: ${summary.hotspots.map(h => h.name).join(', ')}.`;
    } else {
      response += ' No major hotspots right now.';
    }

    return {
      intent: 'query',
      source: 'Live Simulation Engine DB',
      queryType: 'crowd_general',
      response,
      data: summary,
      action: null,
    };
    } catch (err) {
      logger.error('Crowd query parsing failed', err);
      return null;
    }
  }

  /**
   * Resolves the nearest facility of a specified type from the current location.
   * @param {string} text - Processed transcript text
   * @param {string} currentLocation - Starting zone ID
   * @returns {Object|null} Nearest facility intent result or null
   */
  parseNearestFacility(text, currentLocation) {
    const nearKeywords = ['nearest', 'closest', 'nearby', 'close to me', 'near me', 'around here'];
    const hasNearKeyword = nearKeywords.some(kw => text.includes(kw));

    if (!hasNearKeyword) {
      return null;
    }

    // Determine facility type
    let facilityType = null;
    for (const [type, keywords] of Object.entries(this.facilityMap)) {
      if (keywords.some(kw => text.includes(kw))) {
        facilityType = type;
        break;
      }
    }

    if (!facilityType) {
      return {
        intent: 'query',
        response: "What kind of facility are you looking for? I can find washrooms, food courts, medical bays, or gates.",
        action: null,
      };
    }

    return {
      intent: 'navigate',
      destination: null,
      facilityType,
      from: currentLocation,
      response: `Finding the nearest ${facilityType} for you. Let me calculate the best route.`,
      action: 'find_nearest',
    };
  }

  /**
   * Check if text is a greeting
   */
  isGreeting(text) {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup'];
    return greetings.some(g => text.startsWith(g) || text === g);
  }

  /**
   * Check if text is asking for help
   */
  isHelp(text) {
    const helpWords = ['help', 'what can you do', 'commands', 'options', 'menu', 'what do you do'];
    return helpWords.some(h => text.includes(h));
  }
}

module.exports = new IntentParser();
