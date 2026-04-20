const mongoose = require('mongoose');

const stadiumInfoSchema = new mongoose.Schema({
  key:                { type: String, required: true, unique: true },
  name:               { type: String, default: 'Narendra Modi Stadium' },
  city:               { type: String, default: 'Ahmedabad' },
  history:            { type: String },
  capacity:           { type: Number, default: 132000 },
  design_details:     { type: String },
  architect:          { type: String },
  opened:             { type: String },
  past_events:        [{ event: String, date: String, description: String }],
  facilities_overview: { type: String },
  entry_exit_info:    { type: String },
  fun_facts:          [{ type: String }],
}, { timestamps: true });
stadiumInfoSchema.index({ category: 1 });

module.exports = mongoose.model('StadiumInfo', stadiumInfoSchema, 'stadium_info');
