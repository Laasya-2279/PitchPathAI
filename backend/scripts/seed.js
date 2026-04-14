/**
 * Database Seed Script
 * 
 * Populates MongoDB Atlas with stadium data, facilities, match info, and knowledge base.
 * Idempotent: uses upsert so it's safe to run multiple times.
 * 
 * Usage: node scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const StadiumZone = require('../models/StadiumZone');
const Facility = require('../models/Facility');
const StadiumInfo = require('../models/StadiumInfo');
const MatchData = require('../models/MatchData');
const { nodes, edges } = require('../data/stadiumGraph');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { dbName: 'pitchpath' });
    console.log('✅ Connected to MongoDB Atlas');

    // --- 1. Stadium Zones ---
    console.log('\n📍 Seeding stadium zones...');
    for (const node of nodes) {
      const connected = edges
        .filter(e => e.from === node.id || e.to === node.id)
        .map(e => e.from === node.id ? e.to : e.from);

      await StadiumZone.findOneAndUpdate(
        { zone_id: node.id },
        {
          zone_id: node.id,
          block_name: node.name,
          connected_blocks: [...new Set(connected)],
          level: node.tier || 'lower',
          type: node.type,
          capacity: node.capacity || 0,
          position: node.position,
        },
        { upsert: true, new: true }
      );
    }
    console.log(`   ✅ ${nodes.length} zones seeded`);

    // --- 2. Facilities ---
    console.log('\n🏪 Seeding facilities...');
    const facilityNodes = nodes.filter(n => ['washroom', 'food', 'medical', 'gate', 'vip'].includes(n.type));
    const descriptions = {
      washroom: 'Clean, well-maintained washroom facilities with accessibility options.',
      food: 'Wide variety of Indian and international cuisine. Payment via UPI and cards accepted.',
      medical: 'Fully equipped first-aid station with trained medical staff available during events.',
      gate: 'Main entry/exit point with security screening. RFID-enabled fast entry lanes available.',
      vip: 'Premium lounge with air conditioning, private viewing area, and complimentary refreshments.',
    };

    for (const fac of facilityNodes) {
      await Facility.findOneAndUpdate(
        { facility_id: fac.id },
        {
          facility_id: fac.id,
          type: fac.type,
          name: fac.name,
          location_block: fac.id,
          queue_time: 0,
          position: fac.position,
          description: descriptions[fac.type] || '',
          is_open: true,
        },
        { upsert: true, new: true }
      );
    }
    console.log(`   ✅ ${facilityNodes.length} facilities seeded`);

    // --- 3. Stadium Info (Knowledge Base) ---
    console.log('\n🏟️  Seeding stadium knowledge base...');
    await StadiumInfo.findOneAndUpdate(
      { key: 'narendra_modi_stadium' },
      {
        key: 'narendra_modi_stadium',
        name: 'Narendra Modi Stadium',
        city: 'Ahmedabad, Gujarat, India',
        history: `The Narendra Modi Stadium, formerly known as Motera Stadium, is the largest cricket stadium in the world with a seating capacity of 132,000 spectators. Originally built in 1982, the stadium was completely rebuilt between 2017 and 2020 at an estimated cost of ₹800 crore (approx. $100 million). The reconstructed stadium was inaugurated on February 24, 2021, during the India vs England Test series. It was renamed from Sardar Patel Stadium to Narendra Modi Stadium in February 2021. The stadium is owned by the Gujarat Cricket Association (GCA) and is the home ground of the Gujarat cricket team and Gujarat Titans (IPL).`,
        capacity: 132000,
        design_details: `The stadium features a circular bowl design with 4 entry gates (North, East, South, West) and 76 corporate boxes. It has 11 pitches in the center, including practice pitches. The roof is covered with a translucent PTFE (Teflon-like) fabric roof supported by a ring of steel cables, giving it a unique crown-like appearance. The stadium also houses a cricket academy, an Olympic-size swimming pool, a hockey field, tennis and badminton courts, and a clubhouse with 55 rooms. The LED floodlight system is among the most advanced in the world, providing uniform illumination for broadcast and spectator comfort.`,
        architect: 'Populous (formerly HOK Sport) — the same firm that designed Wembley Stadium and the Sydney Olympic Stadium.',
        opened: 'February 24, 2021 (reconstructed)',
        past_events: [
          { event: 'ICC Cricket World Cup 2023 — Final', date: 'November 19, 2023', description: 'Australia defeated India by 6 wickets to win the ODI World Cup. A crowd of 130,000+ watched the historic final.' },
          { event: 'ICC Cricket World Cup 2023 — Semi-Final', date: 'November 15, 2023', description: 'India defeated New Zealand by 70 runs in front of a packed house.' },
          { event: 'IPL 2022 Final', date: 'May 29, 2022', description: 'Gujarat Titans defeated Rajasthan Royals in their debut season to win the IPL title.' },
          { event: 'India vs England — Day/Night Test', date: 'February 24, 2021', description: 'The inaugural match at the rebuilt stadium. India won by 10 wickets in just 2 days with the pink ball.' },
          { event: "Namaste Trump Event", date: 'February 24, 2020', description: 'A political rally attended by over 100,000 people, welcoming US President Donald Trump.' },
          { event: 'IPL 2024 — Gujarat Titans Home Games', date: '2024 Season', description: 'Multiple IPL matches hosted as the home ground of Gujarat Titans.' },
        ],
        facilities_overview: `The stadium offers extensive facilities including: 6 washroom blocks distributed around the oval, 4 food courts serving Indian street food, beverages, and international cuisine, 2 medical bays with paramedic teams, 4 main entry gates with RFID scanning, a VIP lounge with premium seating and services, free WiFi throughout the venue, and dedicated accessibility routes for wheelchair users.`,
        entry_exit_info: `The stadium has 4 main gates: Gate 1 (North) near Metro station, Gate 2 (East) near parking zone A, Gate 3 (South) near parking zone B, and Gate 4 (West) near the main road. Gates open 2 hours before match start. RFID-enabled tickets allow fast entry through dedicated lanes. Bag checks and security screening at all gates. Re-entry is not permitted once exited.`,
        fun_facts: [
          'It is the largest cricket stadium in the world by seating capacity (132,000).',
          'The stadium can host both day and day/night matches with state-of-the-art LED floodlights.',
          'It has 11 playing pitches, more than any other cricket ground in the world.',
          'The stadium is built on 63 acres of land, making it one of the largest sports complexes globally.',
          'The parking area can accommodate over 3,000 cars and 10,000 two-wheelers.',
          'It has 4 dressing rooms, allowing back-to-back matches without delays.',
          'The stadium is located just 5 km from Ahmedabad city center and is well-connected by metro.',
        ],
      },
      { upsert: true, new: true }
    );
    console.log('   ✅ Stadium knowledge base seeded');

    // --- 4. Match Data ---
    console.log('\n🏏 Seeding live match data...');
    await MatchData.findOneAndUpdate(
      { match_id: 'current' },
      {
        match_id: 'current',
        teams: { team1: 'India', team2: 'Australia' },
        score: {
          team1: { runs: 287, wickets: 4, overs: '42.3' },
          team2: { runs: 0, wickets: 0, overs: '0.0' },
        },
        status: 'live',
        innings: 1,
        batting_team: 'India',
        bowling_team: 'Australia',
        current_batsmen: [
          { name: 'Virat Kohli', runs: 89, balls: 78 },
          { name: 'KL Rahul', runs: 42, balls: 51 },
        ],
        current_bowler: { name: 'Pat Cummins', overs: '8.3', runs: 52, wickets: 2 },
        recent_balls: ['1', '4', '0', '6', '2', 'W'],
        match_summary: 'India batting first after winning the toss. Kohli looking solid, approaching his century.',
        toss: 'India won the toss and elected to bat first',
        venue: 'Narendra Modi Stadium, Ahmedabad',
      },
      { upsert: true, new: true }
    );
    console.log('   ✅ Match data seeded');

    // --- Done ---
    console.log('\n🎉 All data seeded successfully!\n');
    
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
