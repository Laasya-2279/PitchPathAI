const mongoose = require('mongoose');

const matchDataSchema = new mongoose.Schema({
  match_id:     { type: String, required: true, unique: true, default: 'current' },
  teams:        { team1: String, team2: String },
  score:        { team1: { runs: Number, wickets: Number, overs: String }, team2: { runs: Number, wickets: Number, overs: String } },
  status:       { type: String, enum: ['upcoming', 'live', 'innings_break', 'completed'], default: 'live' },
  innings:      { type: Number, default: 1 },
  batting_team: { type: String },
  bowling_team: { type: String },
  current_batsmen:  [{ name: String, runs: Number, balls: Number }],
  current_bowler:   { name: String, overs: String, runs: Number, wickets: Number },
  recent_balls:     [{ type: String }],
  match_summary:    { type: String },
  toss:             { type: String },
  venue:            { type: String, default: 'Narendra Modi Stadium, Ahmedabad' },
  last_updated:     { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('MatchData', matchDataSchema);
