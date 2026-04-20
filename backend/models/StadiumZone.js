const mongoose = require('mongoose');

const stadiumZoneSchema = new mongoose.Schema({
  zone_id:          { type: String, required: true, unique: true },
  block_name:       { type: String, required: true },
  connected_blocks: [{ type: String }],
  level:            { type: String, enum: ['lower', 'upper'], default: 'lower' },
  type:             { type: String, enum: ['seating', 'food', 'washroom', 'gate', 'medical', 'vip'], required: true },
  capacity:         { type: Number, default: 0 },
  position:         { x: Number, y: Number },
}, { timestamps: true });
stadiumZoneSchema.index({ type: 1 });

module.exports = mongoose.model('StadiumZone', stadiumZoneSchema, 'stadium_zones');
