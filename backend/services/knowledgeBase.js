/**
 * Knowledge Base Service
 * 
 * Provides stadium knowledge for voice AI queries.
 * Tries MongoDB first, falls back to hardcoded data.
 */

const { getConnectionStatus } = require('../config/database');

// Hardcoded fallback knowledge (used when MongoDB unavailable)
const FALLBACK_KNOWLEDGE = {
  name: 'Narendra Modi Stadium',
  city: 'Ahmedabad, Gujarat, India',
  capacity: 132000,
  history: 'The Narendra Modi Stadium, formerly Motera Stadium, is the largest cricket stadium in the world with 132,000 seats. Rebuilt between 2017-2020, it was inaugurated in February 2021. It is owned by the Gujarat Cricket Association.',
  architect: 'Populous (the firm behind Wembley Stadium and Sydney Olympic Stadium)',
  opened: 'February 24, 2021',
  design: 'Circular bowl with 4 gates, 76 corporate boxes, 11 pitches, and a translucent PTFE roof. Features LED floodlights, a cricket academy, swimming pool, and a 55-room clubhouse.',
  entry_exit: '4 gates: North (metro), East (parking A), South (parking B), West (main road). Gates open 2h before match. RFID fast-entry available. No re-entry.',
  facilities: '6 washrooms, 4 food courts, 2 medical bays, 4 gates, VIP lounge, free WiFi, wheelchair routes.',
  past_events: [
    'ICC World Cup 2023 Final — Australia beat India (Nov 2023)',
    'ICC World Cup 2023 Semi-Final — India beat NZ (Nov 2023)',
    'IPL 2022 Final — Gujarat Titans won (May 2022)',
    'India vs England Day/Night Test — Inaugural match (Feb 2021)',
    'IPL 2024 — Gujarat Titans home games',
  ],
  fun_facts: [
    'Largest cricket stadium in the world (132,000 seats)',
    '11 pitches — more than any other cricket ground',
    'Built on 63 acres with parking for 3,000 cars',
    '4 dressing rooms for back-to-back matches',
    'Only 5 km from Ahmedabad city center, metro-connected',
  ],
};

class KnowledgeBase {
  /**
   * Get stadium information based on a query topic
   * @param {string} topic — what the user is asking about
   * @returns {Object} { response, data }
   */
  async getStadiumInfo(topic) {
    let data = FALLBACK_KNOWLEDGE;

    // Try MongoDB first
    if (getConnectionStatus().connected) {
      try {
        const StadiumInfo = require('../models/StadiumInfo');
        const doc = await StadiumInfo.findOne({ key: 'narendra_modi_stadium' }).lean();
        if (doc) {
          data = doc;
        }
      } catch (e) {
        // Fallback to hardcoded
      }
    }

    return this.generateResponse(topic, data);
  }

  /**
   * Generate a natural language response based on topic
   */
  generateResponse(topic, data) {
    const t = topic.toLowerCase();

    // History
    if (t.includes('history') || t.includes('about') || t.includes('tell me') || t.includes('when was') || t.includes('built')) {
      return {
        response: `${data.name} is the world's largest cricket stadium! ${data.history}`,
        data: { name: data.name, history: data.history },
        category: 'history',
      };
    }

    // Capacity / size
    if (t.includes('capacity') || t.includes('seats') || t.includes('how many') || t.includes('how big') || t.includes('size')) {
      return {
        response: `${data.name} has a seating capacity of ${(data.capacity || 132000).toLocaleString()} spectators, making it the largest cricket stadium in the world. It's built on 63 acres of land.`,
        data: { capacity: data.capacity },
        category: 'capacity',
      };
    }

    // Architecture / design
    if (t.includes('design') || t.includes('architect') || t.includes('structure') || t.includes('look')) {
      return {
        response: `The stadium was designed by ${data.architect || 'Populous'}. ${data.design_details || data.design}`,
        data: { architect: data.architect, design: data.design_details || data.design },
        category: 'design',
      };
    }

    // Past events
    if (t.includes('event') || t.includes('match') || t.includes('hosted') || t.includes('world cup') || t.includes('ipl') || t.includes('past')) {
      const events = data.past_events || [];
      const eventList = Array.isArray(events[0]) || typeof events[0] === 'string'
        ? events.slice(0, 4).join('. ')
        : events.slice(0, 4).map(e => `${e.event} (${e.date})`).join('. ');
      return {
        response: `${data.name} has hosted some incredible events: ${eventList}.`,
        data: { events: data.past_events },
        category: 'events',
      };
    }

    // Entry/exit
    if (t.includes('entry') || t.includes('exit') || t.includes('gate') || t.includes('enter') || t.includes('leave')) {
      return {
        response: data.entry_exit_info || data.entry_exit,
        data: { entry_exit: data.entry_exit_info || data.entry_exit },
        category: 'entry_exit',
      };
    }

    // Facilities
    if (t.includes('facilit') || t.includes('what does it have') || t.includes('amenities') || t.includes('services')) {
      return {
        response: data.facilities_overview || data.facilities,
        data: { facilities: data.facilities_overview || data.facilities },
        category: 'facilities',
      };
    }

    // Fun facts
    if (t.includes('fun fact') || t.includes('interesting') || t.includes('cool') || t.includes('trivia') || t.includes('did you know')) {
      const facts = data.fun_facts || FALLBACK_KNOWLEDGE.fun_facts;
      const randomFact = facts[Math.floor(Math.random() * facts.length)];
      return {
        response: `Here's a cool fact: ${randomFact}`,
        data: { fact: randomFact },
        category: 'fun_fact',
      };
    }

    // General / catchall
    return {
      response: `${data.name} in ${data.city || 'Ahmedabad'} is the world's largest cricket stadium with ${(data.capacity || 132000).toLocaleString()} seats. It was designed by ${data.architect || 'Populous'} and reopened in 2021. Would you like to know about its history, design, past events, or facilities?`,
      data,
      category: 'general',
    };
  }
}

module.exports = new KnowledgeBase();
