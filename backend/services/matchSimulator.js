/**
 * Match Simulator
 * 
 * Simulates a live cricket match with ball-by-ball progression.
 * Updates score, overs, wickets every 10 seconds.
 * Provides current match state for voice queries.
 */

const { getConnectionStatus } = require('../config/database');

class MatchSimulator {
  constructor() {
    this.match = {
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
      match_summary: 'India batting first. Kohli looking solid, approaching his century.',
      toss: 'India won the toss and elected to bat first',
      venue: 'Narendra Modi Stadium, Ahmedabad',
    };

    this.ballOutcomes = ['0', '1', '1', '2', '2', '4', '4', '6', '0', '1', '0', 'W', '0', '1', '3', '4'];
    this.indBatsmen = ['Rohit Sharma', 'Shubman Gill', 'Virat Kohli', 'KL Rahul', 'Shreyas Iyer', 'Ravindra Jadeja', 'Hardik Pandya'];
    this.ausBowlers = ['Pat Cummins', 'Mitchell Starc', 'Josh Hazlewood', 'Adam Zampa', 'Glenn Maxwell'];
  }

  /**
   * Simulate one ball delivery — called periodically
   */
  simulateBall() {
    if (this.match.status !== 'live') return;

    const batting = this.match.innings === 1 ? 'team1' : 'team2';
    const score = this.match.score[batting];

    // Random ball outcome
    const outcome = this.ballOutcomes[Math.floor(Math.random() * this.ballOutcomes.length)];

    // Update recent balls
    this.match.recent_balls.push(outcome);
    if (this.match.recent_balls.length > 12) this.match.recent_balls.shift();

    // Parse overs
    let [overs, balls] = score.overs.split('.').map(Number);

    if (outcome === 'W') {
      // Wicket
      score.wickets += 1;
      this.match.current_batsmen[0].runs += 0;
      this.match.current_batsmen[0].balls += 1;

      // Replace batsman
      if (score.wickets < 10) {
        const newBat = this.indBatsmen[Math.min(score.wickets + 1, this.indBatsmen.length - 1)];
        this.match.current_batsmen[0] = { name: newBat, runs: 0, balls: 0 };
      }
    } else {
      const runs = parseInt(outcome) || 0;
      score.runs += runs;
      this.match.current_batsmen[0].runs += runs;
      this.match.current_batsmen[0].balls += 1;

      // Rotate strike on odd runs
      if (runs % 2 === 1) {
        const temp = this.match.current_batsmen[0];
        this.match.current_batsmen[0] = this.match.current_batsmen[1];
        this.match.current_batsmen[1] = temp;
      }
    }

    // Advance overs
    balls += 1;
    if (balls >= 6) {
      overs += 1;
      balls = 0;
      // Change bowler at end of over
      this.match.current_bowler.name = this.ausBowlers[Math.floor(Math.random() * this.ausBowlers.length)];
    }
    score.overs = `${overs}.${balls}`;

    // Update bowler stats
    this.match.current_bowler.overs = `${Math.floor(overs / 2)}.${balls}`;
    if (outcome !== 'W') {
      this.match.current_bowler.runs += (parseInt(outcome) || 0);
    } else {
      this.match.current_bowler.wickets += 1;
    }

    // Check innings end (50 overs or all out)
    if (overs >= 50 || score.wickets >= 10) {
      if (this.match.innings === 1) {
        this.match.innings = 2;
        this.match.status = 'live';
        this.match.batting_team = 'Australia';
        this.match.bowling_team = 'India';
        this.match.score.team2 = { runs: 0, wickets: 0, overs: '0.0' };
        this.match.current_batsmen = [
          { name: 'David Warner', runs: 0, balls: 0 },
          { name: 'Travis Head', runs: 0, balls: 0 },
        ];
        this.match.current_bowler = { name: 'Jasprit Bumrah', overs: '0.0', runs: 0, wickets: 0 };
        this.match.match_summary = `India set a target of ${this.match.score.team1.runs + 1}. Australia starting their chase.`;
      } else {
        this.match.status = 'completed';
        const t1 = this.match.score.team1.runs;
        const t2 = this.match.score.team2.runs;
        this.match.match_summary = t1 > t2
          ? `India won by ${t1 - t2} runs! What a match!`
          : `Australia chased down ${t1} with ${10 - this.match.score.team2.wickets} wickets in hand!`;
      }
    }

    // Update summary text
    if (this.match.status === 'live') {
      const bat = this.match.current_batsmen[0];
      this.match.match_summary = `${this.match.batting_team} ${score.runs}/${score.wickets} (${score.overs} ov). ${bat.name} ${bat.runs}*(${bat.balls}). Last ball: ${outcome === 'W' ? 'WICKET!' : outcome + ' run(s)'}`;
    }

    // Persist to MongoDB if connected
    this.persistToMongo();

    return this.getState();
  }

  /**
   * Get current match state
   */
  getState() {
    return { ...this.match, last_updated: Date.now() };
  }

  /**
   * Get a natural language summary for voice responses
   */
  getVoiceResponse(query) {
    const q = query.toLowerCase();
    const s = this.match;
    const batting = s.innings === 1 ? s.score.team1 : s.score.team2;

    if (q.includes('score') || q.includes('runs')) {
      if (s.status === 'completed') {
        return `The match is over! ${s.match_summary}`;
      }
      return `${s.batting_team} are ${batting.runs} for ${batting.wickets} in ${batting.overs} overs. ${s.bowling_team} bowling.`;
    }

    if (q.includes('batting') || q.includes('who is batting') || q.includes('batsman') || q.includes('batter')) {
      const bats = s.current_batsmen;
      return `Currently batting: ${bats[0].name} on ${bats[0].runs} off ${bats[0].balls} balls, and ${bats[1].name} on ${bats[1].runs} off ${bats[1].balls} balls.`;
    }

    if (q.includes('bowling') || q.includes('who is bowling') || q.includes('bowler')) {
      const b = s.current_bowler;
      return `${b.name} is bowling. Figures: ${b.wickets} for ${b.runs} in ${b.overs} overs.`;
    }

    if (q.includes('status') || q.includes('match') || q.includes('update')) {
      return s.match_summary;
    }

    if (q.includes('toss')) {
      return s.toss;
    }

    if (q.includes('over') || q.includes('overs')) {
      return `${s.batting_team} are at ${batting.overs} overs. ${50 - Math.floor(parseFloat(batting.overs))} overs remaining.`;
    }

    if (q.includes('last ball') || q.includes('recent') || q.includes('last few')) {
      return `Recent deliveries: ${s.recent_balls.slice(-6).join(', ')}`;
    }

    // General
    return `${s.batting_team} vs ${s.bowling_team} at ${s.venue}. ${s.match_summary}`;
  }

  /**
   * Persist match state to MongoDB (fire-and-forget)
   */
  async persistToMongo() {
    if (!getConnectionStatus().connected) return;
    try {
      const MatchData = require('../models/MatchData');
      await MatchData.findOneAndUpdate(
        { match_id: 'current' },
        { ...this.match, last_updated: new Date() },
        { upsert: true }
      );
    } catch (e) {
      // Silent fail — match sim continues in memory
    }
  }
}

module.exports = new MatchSimulator();
